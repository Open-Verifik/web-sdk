import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoService } from "@ngneat/transloco";
import { VerifikEmbedBridgeService, VerifikEmbedMode } from "app/core/embed/verifik-embed-bridge.service";
import { environment } from "environments/environment";
import { firstValueFrom } from "rxjs";

interface PublicSessionBootstrapResponse {
	data?: {
		session_id: string;
		status: string;
		flow_type: string;
		flow_version: number;
		project_id: string | null;
		project_flow_id: string | null;
		target_route: string;
		prefill?: Record<string, any>;
		locale?: string | null;
		theme?: Record<string, any> | null;
		allowed_origins?: string[];
		vendor_data?: string | null;
	};
}

@Component({
	selector: "app-session-entry",
	standalone: true,
	imports: [CommonModule, MatProgressSpinnerModule],
	template: `
		<div class="flex min-h-screen w-full items-center justify-center bg-white p-6 text-center">
			<div *ngIf="!errorMessage" class="flex flex-col items-center gap-4">
				<mat-spinner [diameter]="40"></mat-spinner>
				<p class="text-sm text-slate-600">Initializing verification session...</p>
			</div>
			<div *ngIf="errorMessage" class="max-w-md rounded-xl border border-red-200 bg-red-50 p-6">
				<h2 class="mb-2 text-base font-semibold text-red-800">Session unavailable</h2>
				<p class="text-sm text-red-700">{{ errorMessage }}</p>
			</div>
		</div>
	`,
})
export class SessionEntryComponent implements OnInit {
	errorMessage: string | null = null;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _http: HttpClient,
		private _transloco: TranslocoService,
		private _embedBridge: VerifikEmbedBridgeService
	) {}

	async ngOnInit(): Promise<void> {
		const sessionToken = this._route.snapshot.paramMap.get("sessionToken") || "";
		const query = this._route.snapshot.queryParamMap;
		const modeParam = (query.get("embed") || query.get("mode") || "").trim().toLowerCase();
		const parentOrigin = query.get("parentOrigin");

		if (!sessionToken) {
			this.errorMessage = "Missing session token.";
			return;
		}

		try {
			const apiBase = (environment.apiUrl || "").replace(/\/+$/, "");
			const res = await firstValueFrom(
				this._http.get<PublicSessionBootstrapResponse>(`${apiBase}/v3/sessions/public/${encodeURIComponent(sessionToken)}`)
			);
			const session = res?.data;

			if (!session?.target_route) {
				throw new Error("Invalid session configuration.");
			}

			const isEmbedded =
				modeParam === "modal" ||
				modeParam === "inline" ||
				modeParam === "webview" ||
				modeParam === "1" ||
				modeParam === "true" ||
				this._embedBridge.isEmbedded;

			const mode: VerifikEmbedMode =
				modeParam === "inline"
					? "inline"
					: modeParam === "webview"
						? "webview"
						: isEmbedded
							? "modal"
							: "redirect";

			this._embedBridge.setContext({
				embedded: isEmbedded,
				mode,
				sessionToken,
				sessionId: session.session_id,
				parentOrigin: parentOrigin || session.allowed_origins?.[0] || null,
				vendorData: session.vendor_data || null,
				locale: session.locale || query.get("locale") || null,
			});

			const locale = session.locale || query.get("locale");
			if (locale) {
				this._transloco.setActiveLang(locale);
			}

			this._embedBridge.emit("verifik:ready", {
				sessionId: session.session_id,
				flowType: session.flow_type,
				projectId: session.project_id,
				projectFlowId: session.project_flow_id,
			});

			const forwardParams: Record<string, string> = {};
			if (isEmbedded) forwardParams["embed"] = mode;
			if (parentOrigin) forwardParams["parentOrigin"] = parentOrigin;
			if (locale) forwardParams["locale"] = locale;
			const style = query.get("style");
			if (style) forwardParams["style"] = style;

			await this._router.navigate([session.target_route], {
				queryParams: forwardParams,
				replaceUrl: true,
			});
		} catch (err: any) {
			const msg = err?.error?.message || err?.message || "This verification link is invalid or has expired.";
			this.errorMessage = msg;
			this._embedBridge.emit("verifik:error", {
				code: err?.error?.code || "SESSION_BOOTSTRAP_FAILED",
				message: msg,
			});
		}
	}
}
