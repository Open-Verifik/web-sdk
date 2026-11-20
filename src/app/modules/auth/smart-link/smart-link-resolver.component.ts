import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule } from "@ngneat/transloco";
import { Subject, combineLatest, firstValueFrom, takeUntil } from "rxjs";

import {
	DEFAULT_VERIFY_LOGO_METRICS,
	VERIFY_FONT_HREF,
	VERIFY_STYLES,
	VerifyLogoMetrics,
	VerifyStyleId,
	resolveLogoMetrics,
	resolveVerifyStyle,
} from "../verify/verify-style";
import { SmartLinkRuntimeService } from "./smart-link-runtime.service";
import { SmartLinkPublicConfig } from "./smart-link.types";

@Component({
	selector: "smart-link-resolver",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule],
	templateUrl: "./smart-link-resolver.component.html",
	styleUrls: ["./smart-link-resolver.component.scss"],
})
export class SmartLinkResolverComponent implements OnInit, OnDestroy {
	config: SmartLinkPublicConfig | null = null;
	styleId: VerifyStyleId = "a";
	styleVars: Record<string, string> = { ...VERIFY_STYLES.a.variables };
	logoMetrics: VerifyLogoMetrics = { ...DEFAULT_VERIFY_LOGO_METRICS };

	loading = true;
	submitting = false;
	errorCode: string | null = null;
	step: "identifier" | "routing" | "error" = "routing";
	identifierChannel: "email" | "phone" = "email";
	identifier = "";
	countryCode = "+1";

	private _destroy$ = new Subject<void>();
	private _styleOverride: string | null = null;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _cdr: ChangeDetectorRef,
		private _smartLink: SmartLinkRuntimeService
	) {}

	ngOnInit(): void {
		this._loadStyleFonts();
		combineLatest([this._route.paramMap, this._route.queryParamMap])
			.pipe(takeUntil(this._destroy$))
			.subscribe(([params, query]) => {
				const slugOrToken = (params.get("slugOrToken") || "").trim();
				this._styleOverride = query.get("style");
				if (!slugOrToken) {
					this._setError("smart_link_not_found");
					return;
				}
				void this._resolveLink(slugOrToken, {
					t: query.get("t"),
					email: query.get("email"),
					phone: query.get("phone"),
					countryCode: query.get("countryCode"),
					requireDocument: query.get("requireDocument"),
					fullName: query.get("fullName"),
				});
			});
	}

	ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	get allowedIdentifiers(): ("email" | "phone")[] {
		const raw = this.config?.allowedIdentifiers;
		return raw && raw.length ? raw : ["email", "phone"];
	}

	get canSwitchIdentifier(): boolean {
		return this.allowedIdentifiers.includes("email") && this.allowedIdentifiers.includes("phone");
	}

	get errorTitleKey(): string {
		switch (this.errorCode) {
			case "smart_link_session_expired":
				return "smartLink.error.expiredTitle";
			case "smart_link_session_revoked":
			case "smart_link_session_exhausted":
				return "smartLink.error.revokedTitle";
			case "smart_link_paused":
				return "smartLink.error.pausedTitle";
			case "invalid_smart_link_token":
			case "signed_session_required":
				return "smartLink.error.tokenTitle";
			default:
				return "smartLink.error.notFoundTitle";
		}
	}

	get errorBodyKey(): string {
		switch (this.errorCode) {
			case "smart_link_session_expired":
				return "smartLink.error.expiredBody";
			case "smart_link_session_revoked":
			case "smart_link_session_exhausted":
				return "smartLink.error.revokedBody";
			case "smart_link_paused":
				return "smartLink.error.pausedBody";
			case "invalid_smart_link_token":
			case "signed_session_required":
				return "smartLink.error.tokenBody";
			default:
				return "smartLink.error.notFoundBody";
		}
	}

	onLogoLoad(event: Event): void {
		const img = event.target as HTMLImageElement | null;
		if (!img) return;
		this.logoMetrics = resolveLogoMetrics(img.naturalWidth, img.naturalHeight);
		this._cdr.markForCheck();
	}

	setIdentifierChannel(channel: "email" | "phone"): void {
		this.identifierChannel = channel;
		this.identifier = "";
		this.errorCode = null;
		this._cdr.markForCheck();
	}

	async proceedLookup(): Promise<void> {
		if (!this.config || this.submitting) return;
		const cleanId = this.identifier.trim();
		if (!cleanId) {
			this.errorCode = "identifier_required";
			this._cdr.markForCheck();
			return;
		}

		this.submitting = true;
		this.errorCode = null;
		this.step = "routing";
		this._cdr.markForCheck();

		try {
			const res = await firstValueFrom(
				this._smartLink.lookupTarget(
					this.config.shortCode,
					cleanId,
					this.identifierChannel === "phone" ? this.countryCode : ""
				)
			);

			this._smartLink.saveActiveSession({
				shortCode: this.config.shortCode,
				completionMode: this.config.completionMode,
				verifyStyle: this.styleId,
				projectName: this.config.project?.name,
				createdAtMs: Date.now(),
			});

			const queryParams: Record<string, string> = {
				smartLink: this.config.shortCode,
			};
			const prefill = this.config.prefill || {};
			if (res.directSelfie) {
				queryParams["identifier"] = cleanId;
				queryParams["direct"] = "selfie";
			} else {
				if (prefill.email) queryParams["email"] = prefill.email;
				if (prefill.phone) queryParams["phone"] = prefill.phone;
				if (prefill.countryCode) queryParams["countryCode"] = prefill.countryCode;
				if (prefill.fullName) queryParams["fullName"] = prefill.fullName;
				if (!queryParams["email"] && cleanId.includes("@")) {
					queryParams["email"] = cleanId;
				} else if (!queryParams["phone"] && !cleanId.includes("@")) {
					queryParams["phone"] = cleanId;
					if (this.countryCode) queryParams["countryCode"] = this.countryCode;
				}
				if (res.requireDocument || this.config.requireDocument) {
					queryParams["requireDocument"] = "1";
				}
			}

			if (this._styleOverride) {
				queryParams["style"] = this._styleOverride;
			}

			await this._router.navigate([res.targetRoute], {
				queryParams,
				replaceUrl: true,
			});
		} catch (err: any) {
			this.submitting = false;
			const msg = err?.error?.message || "smart_link_lookup_failed";
			if (msg === "smart_link_session_expired" || msg === "smart_link_session_revoked" || msg === "smart_link_paused") {
				this._setError(msg);
			} else {
				this.errorCode = msg;
				this.step = "identifier";
				this._cdr.markForCheck();
			}
		}
	}

	private async _resolveLink(
		slugOrToken: string,
		query: Record<string, string | null | undefined>
	): Promise<void> {
		this.loading = true;
		this.errorCode = null;
		this._cdr.markForCheck();

		try {
			const cfg = await firstValueFrom(this._smartLink.resolvePublic(slugOrToken, query));
			this.config = cfg;
			this._applyStyle(cfg);

			const allowed = this.allowedIdentifiers;
			this.identifierChannel = allowed.includes("email") ? "email" : "phone";

			const prefill = cfg.prefill || {};
			if (prefill.email) {
				this.identifierChannel = "email";
				this.identifier = prefill.email;
			} else if (prefill.phone) {
				this.identifierChannel = "phone";
				this.identifier = prefill.phone;
				if (prefill.countryCode) this.countryCode = prefill.countryCode;
			}

			this.loading = false;

			// If the human/AI agent already set email or phone when generating the link, skip straight to verification
			if (this.identifier.trim()) {
				await this.proceedLookup();
				return;
			}

			this.step = "identifier";
			this._cdr.markForCheck();
		} catch (err: any) {
			const code = err?.error?.message || "smart_link_not_found";
			this._setError(code);
		}
	}

	private _setError(code: string): void {
		this.loading = false;
		this.submitting = false;
		this.errorCode = code;
		this.step = "error";
		this._cdr.markForCheck();
	}

	private _applyStyle(cfg: SmartLinkPublicConfig): void {
		this.styleId = resolveVerifyStyle(this._styleOverride, cfg.verifyStyle || "a", "v2");
		const base = { ...VERIFY_STYLES[this.styleId].variables };
		const b = cfg.project?.branding || {};
		if (b.buttonColor) base["--style-cta"] = b.buttonColor;
		if (b.buttonTextColor) base["--style-cta-text"] = b.buttonTextColor;
		if (b.titleColor) base["--style-ink"] = b.titleColor;
		if (b.textColor) base["--style-body"] = b.textColor;
		if (b.backgroundColor) {
			base["--style-page"] = b.backgroundColor;
			base["--style-page-mobile"] = b.backgroundColor;
		}
		this.styleVars = base;
	}

	private _loadStyleFonts(): void {
		if (typeof document === "undefined" || document.getElementById("verify-style-fonts")) return;
		const link = document.createElement("link");
		link.id = "verify-style-fonts";
		link.rel = "stylesheet";
		link.href = VERIFY_FONT_HREF;
		document.head.appendChild(link);
	}
}
