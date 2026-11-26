import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "environments/environment";
import { firstValueFrom } from "rxjs";

interface ShortLinkRedeemResponse {
	success?: boolean;
	message?: string;
	data?: {
		kind?: string;
		targetRoute?: string;
		queryParams?: Record<string, string>;
		token?: string;
	};
}

const SHORT_CODE_PATTERN = /^[0-9A-Za-z]{16}$/;
const DEFAULT_ERROR_MESSAGE = "This verification link is invalid or has expired.";

@Component({
	selector: "app-kyb-short-entry",
	standalone: true,
	imports: [CommonModule, MatProgressSpinnerModule],
	template: `
		<div class="flex min-h-screen w-full items-center justify-center bg-white p-6 text-center">
			<div *ngIf="!errorMessage" class="flex flex-col items-center gap-4">
				<mat-spinner [diameter]="40"></mat-spinner>
				<p class="text-sm text-slate-600">Opening your verification session...</p>
			</div>
			<div *ngIf="errorMessage" class="max-w-md rounded-xl border border-red-200 bg-red-50 p-6">
				<h2 class="mb-2 text-base font-semibold text-red-800">Verification link unavailable</h2>
				<p class="text-sm text-red-700">{{ errorMessage }}</p>
			</div>
		</div>
	`,
})
export class KybShortEntryComponent implements OnInit {
	errorMessage: string | null = null;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _http: HttpClient
	) {}

	private _getApiBase(): string {
		const raw = (environment.apiUrl || "").replace(/\/+$/, "");
		if (
			typeof window !== "undefined" &&
			window.location.protocol === "https:" &&
			/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)
		) {
			return "";
		}
		return raw;
	}

	async ngOnInit(): Promise<void> {
		const code = (this._route.snapshot.paramMap.get("code") || "").trim();
		if (!SHORT_CODE_PATTERN.test(code)) {
			this.errorMessage = DEFAULT_ERROR_MESSAGE;
			return;
		}

		try {
			const apiBase = this._getApiBase();
			const res = await firstValueFrom(
				this._http.post<ShortLinkRedeemResponse>(
					`${apiBase}/v2/business-registrations/short-link/redeem`,
					{ code }
				)
			);

			if (!res?.success || !res?.data?.targetRoute || !res?.data?.token) {
				this.errorMessage = res?.message || DEFAULT_ERROR_MESSAGE;
				return;
			}

			const query = this._route.snapshot.queryParamMap;
			const optionalQueryParams: Record<string, string> = {};
			const locale = query.get("locale")?.trim();
			if (locale) optionalQueryParams["locale"] = locale;
			const style = query.get("style")?.trim();
			if (style) optionalQueryParams["style"] = style;

			const mergedQueryParams: Record<string, string> = {
				...(res.data.queryParams || {}),
				...optionalQueryParams,
			};
			delete mergedQueryParams["token"];

			await this._router.navigate([res.data.targetRoute], {
				queryParams: mergedQueryParams,
				state: {
					kybRedeemedToken: res.data.token,
					kybExplicitSession: true,
				},
				replaceUrl: true,
			});
		} catch (err: any) {
			this.errorMessage = err?.error?.message || DEFAULT_ERROR_MESSAGE;
		}
	}
}
