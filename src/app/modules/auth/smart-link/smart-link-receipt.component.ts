import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { TranslocoModule } from "@ngneat/transloco";
import { Subject, firstValueFrom, takeUntil } from "rxjs";

import { VERIFY_FONT_HREF, VERIFY_STYLES, VerifyStyleId, parseVerifyStyle } from "../verify/verify-style";
import { SmartLinkRuntimeService } from "./smart-link-runtime.service";
import { SmartLinkReceiptPayload } from "./smart-link.types";

@Component({
	selector: "smart-link-receipt",
	standalone: true,
	imports: [CommonModule, TranslocoModule],
	templateUrl: "./smart-link-receipt.component.html",
	styleUrls: ["./smart-link-receipt.component.scss"],
})
export class SmartLinkReceiptComponent implements OnInit, OnDestroy {
	receipt: SmartLinkReceiptPayload | null = null;
	styleId: VerifyStyleId = "a";
	styleVars: Record<string, string> = { ...VERIFY_STYLES.a.variables };
	loading = true;
	copied = false;
	error = false;

	private _destroy$ = new Subject<void>();

	constructor(
		private _route: ActivatedRoute,
		private _cdr: ChangeDetectorRef,
		private _smartLink: SmartLinkRuntimeService
	) {}

	ngOnInit(): void {
		this._loadStyleFonts();
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

	copyConfirmationCode(): void {
		const code = this.receipt?.confirmationCode;
		if (!code || typeof navigator === "undefined" || !navigator.clipboard) return;
		void navigator.clipboard.writeText(code).then(() => {
			this.copied = true;
			this._cdr.markForCheck();
			setTimeout(() => {
				this.copied = false;
				this._cdr.markForCheck();
			}, 2500);
		});
	}

	printReceipt(): void {
		if (typeof window !== "undefined") {
			window.print();
		}
	}

	private async _loadReceipt(shortCode: string): Promise<void> {
		const cached = this._smartLink.getCachedReceipt(shortCode);
		if (cached) {
			this._applyReceipt(cached);
			return;
		}

		try {
			const fetched = await firstValueFrom(this._smartLink.getReceipt(shortCode));
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
		this.styleId = parseVerifyStyle(payload.verifyStyle) || "a";
		const vars = { ...VERIFY_STYLES[this.styleId].variables };
		const branding = payload.project?.branding || {};
		if (branding.buttonColor) {
			vars["--style-cta"] = branding.buttonColor;
			vars["--accent"] = branding.buttonColor;
		}
		if (branding.buttonTextColor) {
			vars["--style-cta-text"] = branding.buttonTextColor;
		}
		if (branding.titleColor) {
			vars["--style-ink"] = branding.titleColor;
		}
		if (branding.textColor) {
			vars["--style-body"] = branding.textColor;
		}
		if (branding.backgroundColor) {
			vars["--style-page"] = branding.backgroundColor;
		}
		this.styleVars = vars;
		this._cdr.markForCheck();
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
