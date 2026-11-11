import { CommonModule } from "@angular/common";
import {
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule } from "@ngneat/transloco";
import { Subject, combineLatest, takeUntil } from "rxjs";

import { VerifyBusinessSessionService } from "./verify-business-session.service";
import { BusinessCompanyFormComponent } from "./components/business-company-form.component";
import { BusinessDocumentsUploadComponent } from "./components/business-documents-upload.component";
import { BusinessRepresentativesComponent } from "./components/business-representatives.component";
import { BusinessRepKycModalComponent } from "./components/business-rep-kyc-modal.component";
import { BusinessReviewSubmitComponent } from "./components/business-review-submit.component";
import { STEP_SEGMENTS, StepSegment, stepIndex } from "./verify-business-flow";
import {
	DEFAULT_VERIFY_LOGO_METRICS,
	parseVerifyStyle,
	resolveLogoMetrics,
	resolveVerifyStyle,
	VERIFY_FONT_HREF,
	VERIFY_STYLE_COLOR_DEFAULTS,
	VerifyLogoMetrics,
	VerifyStyleColorDefaults,
	VerifyStyleId,
} from "../verify/verify-style";

@Component({
	selector: "verify-business-shell",
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		TranslocoModule,
		BusinessCompanyFormComponent,
		BusinessDocumentsUploadComponent,
		BusinessRepresentativesComponent,
		BusinessRepKycModalComponent,
		BusinessReviewSubmitComponent,
	],
	templateUrl: "./verify-business-shell.component.html",
	styleUrls: ["./verify-business-shell.component.scss"],
	providers: [VerifyBusinessSessionService],
})
export class VerifyBusinessShellComponent implements OnInit, OnDestroy {
	styleId: VerifyStyleId = "a";
	logoMetrics: VerifyLogoMetrics = { ...DEFAULT_VERIFY_LOGO_METRICS };
	segments: StepSegment[] = STEP_SEGMENTS;

	private _destroy$ = new Subject<void>();
	private _preview: string | null = null;
	private _compactMql?: MediaQueryList;
	private _onCompactChange = (event: MediaQueryListEvent): void => {
		this.session.compact = event.matches;
		this._cdr.detectChanges();
	};

	constructor(
		public session: VerifyBusinessSessionService,
		private _cdr: ChangeDetectorRef,
		private _route: ActivatedRoute,
		private _router: Router
	) {}

	ngOnInit(): void {
		this._loadStyleFonts();
		this._compactMql = window.matchMedia("(max-width: 639px)");
		this.session.compact = this._compactMql.matches;
		this._compactMql.addEventListener?.("change", this._onCompactChange);

		this.session.changed.pipe(takeUntil(this._destroy$)).subscribe(() => {
			this._applyStyle();
			this._cdr.detectChanges();
		});

		combineLatest([this._route.paramMap, this._route.queryParamMap])
			.pipe(takeUntil(this._destroy$))
			.subscribe(([params, query]) => {
				const projectId = params.get("projectId") || "";
				this._preview = query.get("style");
				this.session.previewStyle = parseVerifyStyle(this._preview);
				this._applyStyle();
				this.session.open(projectId, query.get("token") || undefined);
			});
	}

	ngOnDestroy(): void {
		this._compactMql?.removeEventListener?.("change", this._onCompactChange);
		this._destroy$.next();
		this._destroy$.complete();
	}

	get progressAt(): number {
		return stepIndex(this.session.screen);
	}

	get bannerImage(): string {
		const raw = this.session.rawBranding || {};
		const img = typeof raw.image === "string" ? raw.image.trim() : "";
		return img;
	}

	get hasBanner(): boolean {
		return this.bannerImage.length > 0;
	}

	get bannerBgColor(): string {
		const b = this.session.project?.branding as any;
		return b?.imageBackgroundColor || b?.rightBackgroundColor || "#f9fafb";
	}

	private _resolveCustomColor(field: keyof VerifyStyleColorDefaults): string | null {
		if (this.session.previewStyle) return null;
		const raw = this.session.rawBranding || {};
		// Ignore legacy v2 projects that haven't saved v3 branding yet (empty backgroundColor)
		if (!raw.backgroundColor || !String(raw.backgroundColor).trim()) return null;
		const val = typeof raw[field] === "string" ? raw[field].trim() : "";
		if (!val) return null;
		const presetDefault = VERIFY_STYLE_COLOR_DEFAULTS[this.styleId]?.[field];
		if (presetDefault && val.toLowerCase() === presetDefault.toLowerCase()) {
			return null;
		}
		return val;
	}

	get customCtaColor(): string | null {
		return this._resolveCustomColor("buttonColor");
	}

	get customCtaTextColor(): string | null {
		return this._resolveCustomColor("buttonTextColor");
	}

	get customTitleColor(): string | null {
		return this._resolveCustomColor("titleColor");
	}

	get customBodyColor(): string | null {
		return this._resolveCustomColor("textColor");
	}

	get customPageColor(): string | null {
		return this._resolveCustomColor("backgroundColor");
	}

	get projectName(): string {
		const name = this.session.project?.name;
		return typeof name === "string" && name.trim() ? name.trim() : "Verifik KYB";
	}

	onLogoLoad(event: Event): void {
		const img = event.target as HTMLImageElement | null;
		if (!img) return;
		this.logoMetrics = resolveLogoMetrics(img.naturalWidth, img.naturalHeight);
		this._cdr.detectChanges();
	}

	private _applyStyle(): void {
		const flow = this.session.projectFlow;
		this.styleId = resolveVerifyStyle(this._preview, flow?.verifyStyle, flow?.enrollmentClient || "v2");
		this.session.styleId = this.styleId;
	}

	private _loadStyleFonts(): void {
		if (document.getElementById("verify-style-fonts")) return;

		const preconnect = document.createElement("link");
		preconnect.rel = "preconnect";
		preconnect.href = "https://fonts.googleapis.com";
		document.head.appendChild(preconnect);

		const files = document.createElement("link");
		files.rel = "preconnect";
		files.href = "https://fonts.gstatic.com";
		files.crossOrigin = "anonymous";
		document.head.appendChild(files);

		const sheet = document.createElement("link");
		sheet.id = "verify-style-fonts";
		sheet.rel = "stylesheet";
		sheet.href = VERIFY_FONT_HREF;
		document.head.appendChild(sheet);
	}
}
