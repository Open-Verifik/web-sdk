import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { Subject, combineLatest, firstValueFrom, takeUntil } from "rxjs";

import { CountryCodeOption, CountryService } from "app/core/services/country.service";
import { ImageScan } from "../project";
import { VerifySelfieComponent } from "../verify/verify-selfie.component";
import {
	DEFAULT_VERIFY_LOGO_METRICS,
	VERIFY_STYLES,
	VerifyLogoMetrics,
	VerifyStyleId,
	resolveLogoMetrics,
} from "../verify/verify-style";
import { SmartLinkRuntimeService } from "./smart-link-runtime.service";
import { SmartLinkPublicConfig } from "./smart-link.types";
import {
	SmartLinkLanguageOption,
	ensureSmartLinkFontsLoaded,
	extractApiErrorCode,
	getAvailableSmartLinkLanguages,
	mapSmartLinkInlineErrorKey,
	mapSmartLinkTerminalErrorKeys,
	normalizeSupportedSmartLinkLang,
	resolveSmartLinkTheme,
} from "./smart-link-ui.helper";

@Component({
	selector: "smart-link-resolver",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule, VerifySelfieComponent],
	templateUrl: "./smart-link-resolver.component.html",
	styleUrls: ["./smart-link-resolver.component.scss"],
})
export class SmartLinkResolverComponent implements OnInit, OnDestroy {
	config: SmartLinkPublicConfig | null = null;
	styleId: VerifyStyleId = "a";
	styleVars: Record<string, string> = { ...VERIFY_STYLES.a.variables };
	isDarkSurface = false;
	bannerImage = "";
	bannerBgColor = "#f1f5f9";
	logoMetrics: VerifyLogoMetrics = { ...DEFAULT_VERIFY_LOGO_METRICS };

	loading = true;
	submitting = false;
	errorCode: string | null = null;
	step: "identifier" | "faceVerify" | "faceError" | "routing" | "error" = "routing";
	identifierChannel: "email" | "phone" = "email";
	identifier = "";
	countryCode = "+1";
	identifierTouched = false;
	submitAttempted = false;

	matchedNameHint: string | null = null;
	selfiePhase: "idle" | "liveness" | "compare" | "finishing" = "idle";
	showSelfieCapture = false;
	verifyingFace = false;

	languages: SmartLinkLanguageOption[] = [];
	activeLang = "en";

	readonly dialCodes: CountryCodeOption[];
	private readonly _sortedDialCodes: string[];
	private _destroy$ = new Subject<void>();
	private _styleOverride: string | null = null;
	private _userSelectedCountryCode = false;
	private _userSelectedLanguage = false;

	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
		private _cdr: ChangeDetectorRef,
		private _smartLink: SmartLinkRuntimeService,
		private _countries: CountryService,
		private _transloco: TranslocoService
	) {
		this.dialCodes = this._dedupeDialCodes(this._countries.countryCodes);
		this._sortedDialCodes = this.dialCodes
			.map((d) => d.code)
			.sort((a, b) => b.length - a.length);
		this.languages = getAvailableSmartLinkLanguages(this._transloco);
		this.activeLang = this._transloco.getActiveLang() || "en";
	}

	ngOnInit(): void {
		ensureSmartLinkFontsLoaded();
		this._transloco.langChanges$.pipe(takeUntil(this._destroy$)).subscribe((lang) => {
			this.activeLang = lang;
			this._cdr.markForCheck();
		});
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

	get hasBanner(): boolean {
		return this.bannerImage.length > 0;
	}

	get identifierInputId(): string {
		return this.identifierChannel === "phone" ? "sl-phone-input" : "sl-email-input";
	}

	get clientValidationError(): string | null {
		const clean = this.identifier.trim();
		if (!clean) return "identifier_required";
		if (this.identifierChannel === "email") {
			return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? null : "invalid_email_format";
		}
		const normalized = this._extractDialCode(clean, false);
		const digits = (normalized ? normalized.national : clean).replace(/\D/g, "");
		return digits.length >= 6 && digits.length <= 15 ? null : "invalid_phone_format";
	}

	get activeInlineErrorCode(): string | null {
		if (this.step !== "identifier") return this.errorCode;
		if (this.errorCode) return this.errorCode;
		if (this.identifierTouched || this.submitAttempted) {
			return this.clientValidationError;
		}
		return null;
	}

	get showIdentifierError(): boolean {
		return this.step === "identifier" && Boolean(this.activeInlineErrorCode);
	}

	get inlineErrorKey(): string {
		return mapSmartLinkInlineErrorKey(this.activeInlineErrorCode);
	}

	get faceErrorKey(): string {
		return mapSmartLinkInlineErrorKey(this.errorCode || "face_verify_failed");
	}

	get errorTitleKey(): string {
		return mapSmartLinkTerminalErrorKeys(this.errorCode).titleKey;
	}

	get errorBodyKey(): string {
		return mapSmartLinkTerminalErrorKeys(this.errorCode).bodyKey;
	}

	get canChangeIdentifierFromFace(): boolean {
		return !this.config?.hasPrefilledIdentifier;
	}

	onLogoLoad(event: Event): void {
		const img = event.target as HTMLImageElement | null;
		if (!img) return;
		this.logoMetrics = resolveLogoMetrics(img.naturalWidth, img.naturalHeight);
		this._cdr.markForCheck();
	}

	onLanguageChange(langId: string): void {
		const normalized = normalizeSupportedSmartLinkLang(langId, this._transloco);
		if (!normalized) return;
		this._userSelectedLanguage = true;
		this.activeLang = normalized;
		this._transloco.setActiveLang(normalized);
		this._cdr.markForCheck();
	}

	setIdentifierChannel(channel: "email" | "phone"): void {
		if (this.identifierChannel === channel) return;
		this.identifierChannel = channel;
		this.identifier = "";
		this.errorCode = null;
		this.identifierTouched = false;
		this.submitAttempted = false;
		this._cdr.markForCheck();
	}

	onCountryCodeChange(code: string): void {
		if (!code) return;
		this.countryCode = code;
		this._userSelectedCountryCode = true;
		this.errorCode = null;
		this._cdr.markForCheck();
	}

	onIdentifierChange(value: string, inputEl?: HTMLInputElement): void {
		this.errorCode = null;
		if (this.identifierChannel === "phone") {
			const trimmed = String(value || "").trimStart();
			if (trimmed.startsWith("+")) {
				const extracted = this._extractDialCode(trimmed, true);
				if (extracted) {
					this.countryCode = extracted.code;
					this._userSelectedCountryCode = true;
					this.identifier = extracted.national;
					if (inputEl && inputEl.value !== extracted.national) {
						inputEl.value = extracted.national;
					}
					this._cdr.markForCheck();
					return;
				}
			}
		}
		this.identifier = value;
		this._cdr.markForCheck();
	}

	onIdentifierBlur(): void {
		this.identifierTouched = true;
		this._cdr.markForCheck();
	}

	async proceedLookup(): Promise<void> {
		if (!this.config || this.submitting) return;
		this.submitAttempted = true;

		if (this.identifierChannel === "phone" && this.identifier.trim().startsWith("+")) {
			const extracted = this._extractDialCode(this.identifier.trim(), false);
			if (extracted) {
				this.countryCode = extracted.code;
				this._userSelectedCountryCode = true;
				this.identifier = extracted.national;
			}
		}

		const validationErr = this.clientValidationError;
		if (validationErr) {
			this.errorCode = validationErr;
			this._cdr.markForCheck();
			return;
		}

		const cleanId = this.identifier.trim();
		const activeCountryCode = this.identifierChannel === "phone" ? this.countryCode : "";

		this.submitting = true;
		this.errorCode = null;
		this.step = "routing";
		this._cdr.markForCheck();

		try {
			const res = await firstValueFrom(
				this._smartLink.lookupTarget(this.config.shortCode, cleanId, activeCountryCode)
			);

			this._smartLink.saveActiveSession({
				shortCode: this.config.shortCode,
				completionMode: this.config.completionMode,
				verifyStyle: this.styleId,
				projectName: this.config.project?.name,
				createdAtMs: Date.now(),
			});

			if (res.inlineFaceVerify) {
				this.matchedNameHint = (res.matchedNameHint || "").trim() || null;
				this.selfiePhase = "idle";
				this.verifyingFace = false;
				this.showSelfieCapture = true;
				this.submitting = false;
				this.step = "faceVerify";
				this._cdr.markForCheck();
				return;
			}

			if (!res.targetRoute) {
				this.submitting = false;
				this.errorCode = "smart_link_lookup_failed";
				this.step = "identifier";
				this._cdr.markForCheck();
				return;
			}

			const queryParams: Record<string, string> = {
				smartLink: this.config.shortCode,
			};
			const prefill = this.config.prefill || {};
			if (res.directSelfie) {
				queryParams["identifier"] = cleanId;
				queryParams["direct"] = "selfie";
				if (activeCountryCode) queryParams["countryCode"] = activeCountryCode;
			} else {
				if (prefill.email) queryParams["email"] = prefill.email;
				if (prefill.phone) queryParams["phone"] = prefill.phone;
				if (prefill.countryCode) queryParams["countryCode"] = prefill.countryCode;
				if (prefill.fullName) queryParams["fullName"] = prefill.fullName;
				if (!queryParams["email"] && (this.identifierChannel === "email" || cleanId.includes("@"))) {
					queryParams["email"] = cleanId;
				} else if (!queryParams["phone"] && this.identifierChannel === "phone") {
					queryParams["phone"] = cleanId;
					if (activeCountryCode) queryParams["countryCode"] = activeCountryCode;
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
		} catch (err: unknown) {
			this.submitting = false;
			const code = extractApiErrorCode(err, "smart_link_lookup_failed");
			if (
				code === "smart_link_session_expired" ||
				code === "smart_link_session_revoked" ||
				code === "smart_link_session_exhausted" ||
				code === "smart_link_paused"
			) {
				this._setError(code);
			} else {
				this.errorCode = code;
				this.step = "identifier";
				this._cdr.markForCheck();
			}
		}
	}

	async onSelfieCaptured(scan: ImageScan): Promise<void> {
		if (!this.config || this.verifyingFace) return;
		const faceBase64 = (scan.face || scan.base64Image || "").trim();
		if (!faceBase64) {
			this.errorCode = "no_face_detected";
			this.showSelfieCapture = false;
			this.step = "faceError";
			this._cdr.markForCheck();
			return;
		}

		this.verifyingFace = true;
		this.errorCode = null;
		this.selfiePhase = "liveness";
		this._cdr.markForCheck();

		try {
			const result = await firstValueFrom(this._smartLink.verifyFace(this.config.shortCode, faceBase64));
			this.selfiePhase = "finishing";
			this._cdr.markForCheck();
			await this._smartLink.completeHandoffFromResult(
				this.config.shortCode,
				result,
				this.config.completionMode
			);
		} catch (err: unknown) {
			this.verifyingFace = false;
			this.selfiePhase = "idle";
			this.showSelfieCapture = false;
			const code = extractApiErrorCode(err, "face_verify_failed");
			if (
				code === "smart_link_session_expired" ||
				code === "smart_link_session_revoked" ||
				code === "smart_link_session_exhausted" ||
				code === "smart_link_paused"
			) {
				this._setError(code);
				return;
			}
			this.errorCode = code;
			this.step = "faceError";
			this._cdr.markForCheck();
		}
	}

	onSelfiePermissionDenied(): void {
		this.verifyingFace = false;
		this.selfiePhase = "idle";
		this.showSelfieCapture = false;
		this.errorCode = "camera_permission_denied";
		this.step = "faceError";
		this._cdr.markForCheck();
	}

	retryFaceVerify(): void {
		this.errorCode = null;
		this.verifyingFace = false;
		this.selfiePhase = "idle";
		this.step = "faceVerify";
		this.showSelfieCapture = false;
		this._cdr.detectChanges();
		this.showSelfieCapture = true;
		this._cdr.markForCheck();
	}

	backToIdentifier(): void {
		this.showSelfieCapture = false;
		this.verifyingFace = false;
		this.selfiePhase = "idle";
		this.errorCode = null;
		this.step = "identifier";
		this._cdr.markForCheck();
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
			this._applyTheme(cfg);
			this._applyDefaultLanguage(cfg.project?.defaultLanguage);

			if (cfg.alreadyCompleted) {
				if (cfg.receipt) {
					this._smartLink.cacheReceipt(cfg.shortCode, cfg.receipt);
				}
				await this._router.navigate(["/l", cfg.shortCode, "receipt"], { replaceUrl: true });
				return;
			}

			const allowed = this.allowedIdentifiers;
			this.identifierChannel = allowed.includes("email") ? "email" : "phone";

			const prefill = cfg.prefill || {};
			if (prefill.countryCode && !this._userSelectedCountryCode) {
				const rawCode = prefill.countryCode.trim();
				this.countryCode = rawCode.startsWith("+") ? rawCode : `+${rawCode.replace(/^\+/, "")}`;
			}

			if (prefill.email) {
				this.identifierChannel = "email";
				this.identifier = prefill.email;
			} else if (prefill.phone) {
				this.identifierChannel = "phone";
				const trimmedPhone = prefill.phone.trim();
				if (trimmedPhone.startsWith("+")) {
					const extracted = this._extractDialCode(trimmedPhone, false);
					if (extracted) {
						if (!prefill.countryCode && !this._userSelectedCountryCode) {
							this.countryCode = extracted.code;
						}
						this.identifier = extracted.national;
					} else {
						this.identifier = trimmedPhone;
					}
				} else {
					this.identifier = trimmedPhone;
				}
			}

			this.loading = false;

			if (this.identifier.trim()) {
				await this.proceedLookup();
				return;
			}

			this.step = "identifier";
			this._cdr.markForCheck();
		} catch (err: unknown) {
			console.error("[SmartLinkResolver] resolve failed", err);
			const code = extractApiErrorCode(err, "smart_link_not_found");
			this._setError(code);
		}
	}

	private _setError(code: string): void {
		this.loading = false;
		this.submitting = false;
		this.verifyingFace = false;
		this.showSelfieCapture = false;
		this.errorCode = code;
		this.step = "error";
		this._cdr.markForCheck();
	}

	private _applyTheme(cfg: SmartLinkPublicConfig): void {
		const theme = resolveSmartLinkTheme(this._styleOverride, cfg.verifyStyle || "a", cfg.project?.branding);
		this.styleId = theme.styleId;
		this.styleVars = theme.styleVars;
		this.isDarkSurface = theme.isDarkSurface;
		this.bannerImage = theme.bannerImage;
		this.bannerBgColor = theme.bannerBgColor;
	}

	private _applyDefaultLanguage(lang: string | undefined): void {
		if (this._userSelectedLanguage || !lang) return;
		const normalized = normalizeSupportedSmartLinkLang(lang, this._transloco);
		if (normalized && normalized !== this.activeLang) {
			this.activeLang = normalized;
			this._transloco.setActiveLang(normalized);
		}
	}

	private _dedupeDialCodes(list: CountryCodeOption[]): CountryCodeOption[] {
		const seen = new Set<string>();
		const out: CountryCodeOption[] = [];
		for (const item of list) {
			if (!seen.has(item.code)) {
				seen.add(item.code);
				out.push(item);
			}
		}
		return out;
	}

	private _extractDialCode(
		raw: string,
		requireTrailingBody: boolean
	): { code: string; national: string } | null {
		const trimmed = raw.trim();
		if (!trimmed.startsWith("+")) return null;
		const afterPlus = trimmed.slice(1);
		const match = afterPlus.match(/^(\d+)(.*)$/);
		if (!match) return null;

		const leadingDigits = match[1];
		const restRaw = match[2] || "";

		for (const dial of this._sortedDialCodes) {
			const dialDigits = dial.slice(1);
			if (!leadingDigits.startsWith(dialDigits)) continue;
			const remainingDigits = leadingDigits.slice(dialDigits.length);
			if (requireTrailingBody && remainingDigits.length === 0 && !/^[\s\-\(\)]/.test(restRaw)) {
				continue;
			}
			const national = `${remainingDigits}${restRaw}`.replace(/^[\s\-]+/, "").trim();
			return { code: dial, national };
		}
		return null;
	}
}
