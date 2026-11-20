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
import { SmartLinkMode, SmartLinkPublicConfig } from "./smart-link.types";

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
	step: "mode" | "identifier" | "routing" | "error" = "mode";
	selectedMode: SmartLinkMode | null = null;
	identifier = "";

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
					mode: query.get("mode"),
					email: query.get("email"),
					phone: query.get("phone"),
					countryCode: query.get("countryCode"),
					taxId: query.get("taxId"),
					fullName: query.get("fullName"),
				});
			});
	}

	ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	get availableModes(): SmartLinkMode[] {
		return this.config?.supportedModes?.length ? this.config.supportedModes : ["personal", "business"];
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

	selectMode(mode: SmartLinkMode): void {
		this.selectedMode = mode;
		this.errorCode = null;
		this._syncIdentifierFromPrefill(mode);

		if (mode === "humanId" || (this.config && !this.config.autoDetectExisting) || this.identifier.trim()) {
			void this.proceedLookup();
			return;
		}

		this.step = "identifier";
		this._cdr.markForCheck();
	}

	backToModes(): void {
		if (!this.config || this.config.lockedMode || this.availableModes.length <= 1) return;
		this.step = "mode";
		this.selectedMode = null;
		this.errorCode = null;
		this._cdr.markForCheck();
	}

	async proceedLookup(): Promise<void> {
		if (!this.config || !this.selectedMode || this.submitting) return;
		this.submitting = true;
		this.step = "routing";
		this._cdr.markForCheck();

		try {
			const res = await firstValueFrom(
				this._smartLink.lookupTarget(this.config.shortCode, this.selectedMode, this.identifier)
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
			if (prefill.email) queryParams["email"] = prefill.email;
			if (prefill.phone) queryParams["phone"] = prefill.phone;
			if (prefill.countryCode) queryParams["countryCode"] = prefill.countryCode;
			if (prefill.taxId) queryParams["taxId"] = prefill.taxId;
			if (prefill.fullName) queryParams["fullName"] = prefill.fullName;
			if (!queryParams["email"] && this.identifier.includes("@")) {
				queryParams["email"] = this.identifier.trim();
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

	modeIconPath(mode: SmartLinkMode): string {
		switch (mode) {
			case "personal":
				return "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z";
			case "business":
				return "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21";
			case "humanId":
				return "M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33";
			case "access":
				return "M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z";
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

			const locked = cfg.lockedMode || (cfg.supportedModes?.length === 1 ? cfg.supportedModes[0] : null);
			if (locked) {
				this.selectedMode = locked;
				this._syncIdentifierFromPrefill(locked);
				this.loading = false;
				if (locked === "humanId" || !cfg.autoDetectExisting || this.identifier.trim()) {
					await this.proceedLookup();
					return;
				}
				this.step = "identifier";
				this._cdr.markForCheck();
				return;
			}

			this.loading = false;
			this.step = "mode";
			this._cdr.markForCheck();
		} catch (err: any) {
			const code = err?.error?.message || "smart_link_not_found";
			this._setError(code);
		}
	}

	private _syncIdentifierFromPrefill(mode: SmartLinkMode): void {
		const pre = this.config?.prefill;
		if (!pre) return;
		if (mode === "business") {
			this.identifier = pre.taxId || pre.email || "";
		} else {
			this.identifier = pre.email || pre.phone || "";
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
		this.styleId = resolveVerifyStyle(this._styleOverride, cfg.verifyStyle, "v2");
		const baseVars = { ...VERIFY_STYLES[this.styleId].variables };
		const branding = cfg.project?.branding || {};

		if (branding.buttonColor) {
			baseVars["--style-cta"] = branding.buttonColor;
			baseVars["--accent"] = branding.buttonColor;
		}
		if (branding.buttonTextColor) {
			baseVars["--style-cta-text"] = branding.buttonTextColor;
			baseVars["--accent-text"] = branding.buttonTextColor;
		}
		if (branding.titleColor) {
			baseVars["--title"] = branding.titleColor;
			baseVars["--style-ink"] = branding.titleColor;
		}
		if (branding.textColor) {
			baseVars["--body"] = branding.textColor;
			baseVars["--style-body"] = branding.textColor;
		}
		if (branding.backgroundColor) {
			baseVars["--style-page"] = branding.backgroundColor;
			baseVars["--style-page-mobile"] = branding.backgroundColor;
		}
		this.styleVars = baseVars;
	}

	private _loadStyleFonts(): void {
		if (typeof document === "undefined" || document.getElementById("verify-style-fonts")) return;
		const sheet = document.createElement("link");
		sheet.id = "verify-style-fonts";
		sheet.rel = "stylesheet";
		sheet.href = VERIFY_FONT_HREF;
		document.head.appendChild(sheet);
	}
}
