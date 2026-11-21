import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { Subject, firstValueFrom, takeUntil } from "rxjs";

import {
	DEFAULT_VERIFY_LOGO_METRICS,
	VERIFY_STYLES,
	VerifyLogoMetrics,
	VerifyStyleId,
	resolveLogoMetrics,
} from "../verify/verify-style";
import { SmartLinkRuntimeService } from "./smart-link-runtime.service";
import { SmartLinkReceiptPayload } from "./smart-link.types";
import {
	SmartLinkLanguageOption,
	ensureSmartLinkFontsLoaded,
	getAvailableSmartLinkLanguages,
	normalizeSupportedSmartLinkLang,
	resolveSmartLinkTheme,
} from "./smart-link-ui.helper";

@Component({
	selector: "smart-link-receipt",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule],
	templateUrl: "./smart-link-receipt.component.html",
	styleUrls: ["./smart-link-receipt.component.scss"],
})
export class SmartLinkReceiptComponent implements OnInit, OnDestroy {
	receipt: SmartLinkReceiptPayload | null = null;
	styleId: VerifyStyleId = "a";
	styleVars: Record<string, string> = { ...VERIFY_STYLES.a.variables };
	isDarkSurface = false;
	bannerImage = "";
	bannerBgColor = "#f1f5f9";
	logoMetrics: VerifyLogoMetrics = { ...DEFAULT_VERIFY_LOGO_METRICS };

	loading = true;
	copied = false;
	error = false;
	languages: SmartLinkLanguageOption[] = [];
	activeLang = "en";

	private _destroy$ = new Subject<void>();
	private _styleOverride: string | null = null;
	private _userSelectedLanguage = false;

	constructor(
		private _route: ActivatedRoute,
		private _cdr: ChangeDetectorRef,
		private _smartLink: SmartLinkRuntimeService,
		private _transloco: TranslocoService
	) {
		this.languages = getAvailableSmartLinkLanguages(this._transloco);
		this.activeLang = this._transloco.getActiveLang() || "en";
	}

	ngOnInit(): void {
		ensureSmartLinkFontsLoaded();
		this._transloco.langChanges$.pipe(takeUntil(this._destroy$)).subscribe((lang) => {
			this.activeLang = lang;
			this._cdr.markForCheck();
		});
		this._styleOverride = this._route.snapshot.queryParamMap.get("style");
		this._route.paramMap.pipe(takeUntil(this._destroy$)).subscribe((params) => {
			const shortCode = (params.get("slugOrToken") || "").trim();
			if (!shortCode) {
				this.loading = false;
				this.error = true;
				this._cdr.markForCheck();
				return;
			}
			void this._loadReceipt(shortCode);
		});
	}

	ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	get hasBanner(): boolean {
		return this.bannerImage.length > 0;
	}

	get canCloseWindow(): boolean {
		return typeof window !== "undefined" && Boolean(window.opener);
	}

	get verificationMethodBadgeKey(): string {
		if (!this.receipt) return "smartLink.receipt.badgeFaceLiveness";
		if (this.receipt.outcomeType === "human_id") return "smartLink.receipt.badgeHumanId";
		if (this.receipt.outcomeType === "kyb") return "smartLink.receipt.badgeBusiness";
		if (this.receipt.requireDocument || (this.receipt.outcomeType === "kyc" && this.receipt.requireDocument !== false)) {
			return "smartLink.receipt.badgeDocAndFace";
		}
		return "smartLink.receipt.badgeFaceLiveness";
	}

	get isDocAndFaceBadge(): boolean {
		return this.verificationMethodBadgeKey === "smartLink.receipt.badgeDocAndFace";
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

	copyConfirmationCode(): void {
		const code = this.receipt?.confirmationCode;
		if (!code || typeof navigator === "undefined" || !navigator.clipboard) return;
		void navigator.clipboard
			.writeText(code)
			.then(() => {
				this.copied = true;
				this._cdr.markForCheck();
				setTimeout(() => {
					this.copied = false;
					this._cdr.markForCheck();
				}, 2500);
			})
			.catch(() => undefined);
	}

	printReceipt(): void {
		if (typeof window !== "undefined") {
			window.print();
		}
	}

	closeWindow(): void {
		if (typeof window === "undefined") return;
		try {
			window.close();
		} catch {
			// ignore if browser blocks programmatic close
		}
	}

	private async _loadReceipt(shortCode: string): Promise<void> {
		const tokenFromQuery = (this._route.snapshot.queryParamMap.get("t") || "").trim();
		if (tokenFromQuery) {
			this._smartLink.saveAccessToken(shortCode, tokenFromQuery);
		}

		const cached = this._smartLink.getCachedReceipt(shortCode);
		if (cached) {
			this._applyReceipt(cached);
			return;
		}

		try {
			const fetched = await firstValueFrom(this._smartLink.getReceipt(shortCode, tokenFromQuery || undefined));
			this._applyReceipt(fetched);
		} catch {
			this.loading = false;
			this.error = true;
			this._cdr.markForCheck();
		}
	}

	private _applyReceipt(payload: SmartLinkReceiptPayload): void {
		this.receipt = payload;
		this.loading = false;
		this.error = false;
		const theme = resolveSmartLinkTheme(this._styleOverride, payload.verifyStyle || "a", payload.project?.branding);
		this.styleId = theme.styleId;
		this.styleVars = theme.styleVars;
		this.isDarkSurface = theme.isDarkSurface;
		this.bannerImage = theme.bannerImage;
		this.bannerBgColor = theme.bannerBgColor;
		this._applyDefaultLanguage(payload.project?.defaultLanguage);
		this._cdr.markForCheck();
	}

	private _applyDefaultLanguage(lang: string | undefined): void {
		if (this._userSelectedLanguage || !lang) return;
		const normalized = normalizeSupportedSmartLinkLang(lang, this._transloco);
		if (normalized && normalized !== this.activeLang) {
			this.activeLang = normalized;
			this._transloco.setActiveLang(normalized);
		}
	}
}
