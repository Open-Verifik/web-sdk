import { CommonModule } from "@angular/common";
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslocoModule } from "@ngneat/transloco";
import QRCode from "qrcode";
import { Subject, combineLatest, takeUntil } from "rxjs";

import { CountryService } from "app/core/services/country.service";
import { isUsableAppRegistrationSessionToken } from "app/core/services/app-registration-session.storage";
import { ImageScan } from "app/modules/auth/project";
import { SmartLivenessComponent } from "app/modules/auth/smart-enroll/smart-liveness/smart-liveness.component";
import { VerifyCameraComponent } from "./verify-camera.component";
import { VerifyHumanIdComponent } from "./verify-human-id.component";
import { VerifySelfieComponent } from "./verify-selfie.component";
import { VerifySelectComponent, VerifySelectOption } from "./verify-select.component";
import { VerifySessionService } from "./verify-session.service";
import { hasContactBlock, progressIndex, progressSegments } from "./verify-flow";
import { flowOrderFromQuery } from "app/core/classes/project-flow.class";
import {
	DEFAULT_VERIFY_LOGO_METRICS,
	parseVerifyStyle,
	resolveLogoMetrics,
	resolveVerifyStyle,
	VERIFY_FONT_HREF,
	VerifyLogoMetrics,
	VerifyStyleId,
} from "./verify-style";

@Component({
	selector: "verify-shell",
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		TranslocoModule,
		VerifyCameraComponent,
		VerifySelfieComponent,
		VerifyHumanIdComponent,
		VerifySelectComponent,
		SmartLivenessComponent,
	],
	templateUrl: "./verify-shell.component.html",
	styleUrls: ["./verify-shell.component.scss"],
	providers: [VerifySessionService],
})
export class VerifyShellComponent implements OnInit, AfterViewChecked, OnDestroy {
	@ViewChild("qr") qr?: ElementRef<HTMLCanvasElement>;
	@ViewChild("file") file?: ElementRef<HTMLInputElement>;
	@ViewChild(VerifyCameraComponent) camera?: VerifyCameraComponent;

	boxes = [0, 1, 2, 3, 4, 5];
	isDraggingFile = false;
	styleId: VerifyStyleId = "a";
	logoMetrics: VerifyLogoMetrics = { ...DEFAULT_VERIFY_LOGO_METRICS };

	private _destroy$ = new Subject<void>();
	private _preview: string | null = null;
	private _qrUrl = "";
	private _qrCanvasEl: HTMLCanvasElement | null = null;
	private _compactMql?: MediaQueryList;
	private _onCompactChange = (event: MediaQueryListEvent): void => {
		this.session.compact = event.matches;
		this._cdr.detectChanges();
	};

	constructor(
		public session: VerifySessionService,
		private _cdr: ChangeDetectorRef,
		private _countries: CountryService,
		private _route: ActivatedRoute,
		private _router: Router,
	) {}

	ngOnInit(): void {
		this._loadStyleFonts();
		this._compactMql = window.matchMedia("(max-width: 639px)");
		this.session.compact = this._compactMql.matches;
		this._compactMql.addEventListener?.("change", this._onCompactChange);
		this.session.changed.pipe(takeUntil(this._destroy$)).subscribe(() => {
			if (this.session.projectFlow?.target === "business" && !this.session.isRepresentativeKyc) {
				this._router.navigate(["/verify-business", this.session.projectId], {
					queryParamsHandling: "preserve",
					replaceUrl: true,
				});
				return;
			}
			this._applyStyle();
			this._cdr.detectChanges();
		});
		combineLatest([this._route.paramMap, this._route.queryParamMap])
			.pipe(takeUntil(this._destroy$))
			.subscribe(([params, query]) => {
				const projectId = params.get("projectId") || "";
				this._preview = query.get("style");
				this.session.previewStyle = parseVerifyStyle(this._preview);
				this.session.orderOverride = flowOrderFromQuery(query.get("order")) || null;
				const rawToken = query.get("token") || undefined;
				const repParam = query.get("rep");
				const handoffParam = query.get("handoff");
				const isRepToken = Boolean(rawToken && !isUsableAppRegistrationSessionToken(rawToken));
				this.session.isRepresentativeKyc = Boolean(
					isRepToken || repParam === "1" || repParam === "true" || this.session.projectFlow?.target === "business",
				);
				if (handoffParam === "1" || handoffParam === "true") {
					this.session.markMobileHandoff(projectId);
				}
				this._applyStyle();
				this.session.open(projectId, rawToken);
			});
	}

	ngAfterViewChecked(): void {
		if (this.session.screen !== "handoff" || !this.qr?.nativeElement) return;
		if (this._qrUrl === this.session.sessionUrl && this._qrCanvasEl === this.qr.nativeElement) return;

		this._qrUrl = this.session.sessionUrl;
		this._qrCanvasEl = this.qr.nativeElement;
		void QRCode.toCanvas(this.qr.nativeElement, this.session.sessionUrl, { margin: 1, width: 220 });
	}

	ngOnDestroy(): void {
		this._compactMql?.removeEventListener?.("change", this._onCompactChange);
		this._destroy$.next();
		this._destroy$.complete();
	}

	get segments(): string[] {
		if (!this.session.settings) return [];
		if (this.session.isRepresentativeKyc) {
			const repSegments: string[] = [];
			if (this.session.settings.document !== "skip") repSegments.push("document");
			if (this.session.settings.liveness !== "skip") repSegments.push("selfie");
			repSegments.push("done");
			return repSegments;
		}
		return progressSegments(hasContactBlock(this.session.settings), this.session.settings.document !== "skip");
	}

	get progressAt(): number {
		if (!this.session.settings) return 0;
		if (this.session.isRepresentativeKyc) {
			const segs = this.segments;
			if (this.session.screen === "submitted" || this.session.screen === "humanId") return segs.length - 1;
			if (this.session.screen === "selfieIntro" || this.session.screen === "selfie" || this.session.screen === "retry") {
				return Math.max(0, segs.indexOf("selfie"));
			}
			return 0;
		}
		return progressIndex(this.session.screen, hasContactBlock(this.session.settings), this.session.settings.document !== "skip");
	}

	get languageLabel(): string {
		return this.session.languages.find((lang) => lang.id === this.session.activeLang)?.label || this.session.activeLang;
	}

	get bannerImage(): string {
		const b = this.session.project?.branding as any;
		const img = b?.image || b?.rightImage;
		return typeof img === "string" ? img.trim() : "";
	}

	get hasBanner(): boolean {
		return this.bannerImage.length > 0;
	}

	get bannerBgColor(): string {
		const b = this.session.project?.branding as any;
		return b?.imageBackgroundColor || b?.rightBackgroundColor || "#f9fafb";
	}

	get projectName(): string {
		const name = this.session.project?.name;
		return typeof name === "string" && name.trim() ? name.trim() : "Verifik";
	}

	onLogoLoad(event: Event): void {
		const img = event.target as HTMLImageElement | null;
		if (!img) return;
		this.logoMetrics = resolveLogoMetrics(img.naturalWidth, img.naturalHeight);
		this._cdr.detectChanges();
	}

	get dialCodes(): Array<{ code: string; name: string }> {
		return this._countries.countryCodes;
	}

	get countryOptions(): VerifySelectOption[] {
		return this.session.countries.map((country) => ({ label: country.country, value: country.country }));
	}

	categoryOptions(translate: (key: string) => string): VerifySelectOption[] {
		return this.session.categories.map((category) => ({ label: translate(this.categoryLabel(category)), value: category }));
	}

	get templateOptions(): VerifySelectOption[] {
		return this.session.templates.map((template) => ({ label: template.name || template.documentCategory, value: template }));
	}

	categoryLabel(category: string): string {
		if (category === "passport") return "verify.passport";
		if (category === "license") return "verify.license";

		return "verify.nationalId";
	}

	hasAdditionalField(field: string): boolean {
		return Boolean(this.session.settings?.additionalFields?.includes(field));
	}

	onDateOfBirthChange(value: string): void {
		this.session.draft.dateOfBirth = value;
		if (!value || !this.hasAdditionalField("age")) return;
		const dob = new Date(value);
		if (Number.isNaN(dob.getTime())) return;
		const today = new Date();
		let age = today.getFullYear() - dob.getFullYear();
		const m = today.getMonth() - dob.getMonth();
		const d = today.getDate() - dob.getDate();
		if (m < 0 || (m === 0 && d < 0)) age--;
		if (age >= 0 && age <= 120) {
			this.session.draft.age = String(age);
		}
	}

	canContinue(): boolean {
		const draft = this.session.draft;

		if (this.session.screen === "signup") {
			const settings = this.session.settings;
			const named =
				settings?.firstName || settings?.lastName
					? Boolean(draft.firstName.trim() && draft.lastName.trim())
					: settings?.fullName
						? Boolean(draft.fullName.trim())
						: true;
			const emailOk = !settings?.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim());
			const phoneOk = !settings?.phone || (draft.phone.replace(/\D/g, "").length >= 6 && Boolean(draft.phoneGateway));
			const agreed = !(settings?.showTerms || settings?.showPrivacy) || draft.agreements;
			const genderOk = !this.hasAdditionalField("gender") || Boolean(draft.gender.trim());
			const dobOk = !this.hasAdditionalField("dateOfBirth") || Boolean(draft.dateOfBirth.trim());
			const ageNum = Number(draft.age);
			const ageOk = !this.hasAdditionalField("age") || (Boolean(String(draft.age).trim()) && ageNum >= 18 && ageNum <= 120);
			const addressOk = !this.hasAdditionalField("address") || Boolean(draft.addressLine1.trim() && draft.city.trim() && draft.state.trim());
			const postalOk = !this.hasAdditionalField("postalCode") || /^[A-Za-z0-9\s\-]{3,12}$/.test(draft.postalCode.trim());
			const countryOk = !this.hasAdditionalField("country") || Boolean(draft.country.trim());

			return named && emailOk && phoneOk && agreed && genderOk && dobOk && ageOk && addressOk && postalOk && countryOk;
		}

		if (this.session.screen === "emailCode" || this.session.screen === "phoneCode") return draft.otp.replace(/\D/g, "").length === 6;

		return true;
	}

	otpAt(index: number): string {
		return this.session.draft.otp[index] || "";
	}

	onOtp(event: Event, index: number): void {
		this.session.clearOtpMessages();
		const input = event.target as HTMLInputElement;
		const cleaned = input.value.replace(/\D/g, "");
		if (cleaned.length > 1) {
			this.session.draft.otp = cleaned.slice(0, 6);
			input.value = this.session.draft.otp[index] || "";
			return;
		}
		const digit = cleaned.slice(-1);
		const chars = this.session.draft.otp.padEnd(6, " ").split("");

		chars[index] = digit || " ";
		this.session.draft.otp = chars.join("").replace(/\s/g, "").slice(0, 6);
		input.value = digit;

		const next = input.nextElementSibling as HTMLInputElement | null;

		if (digit && next) next.focus();
	}

	onOtpKeydown(event: KeyboardEvent, index: number): void {
		if (event.key !== "Backspace") return;
		const input = event.target as HTMLInputElement;
		if (!input.value && index > 0) {
			const prev = input.previousElementSibling as HTMLInputElement | null;
			if (prev) {
				event.preventDefault();
				const chars = this.session.draft.otp.padEnd(6, " ").split("");
				chars[index - 1] = " ";
				this.session.draft.otp = chars.join("").replace(/\s/g, "").slice(0, 6);
				prev.value = "";
				prev.focus();
			}
		}
	}

	onOtpPaste(event: ClipboardEvent): void {
		const text = event.clipboardData?.getData("text")?.replace(/\D/g, "").slice(0, 6) || "";

		if (!text) return;

		event.preventDefault();
		this.session.clearOtpMessages();
		this.session.draft.otp = text;
	}

	shutter(): void {
		this.camera?.shutter();
	}

	private _applyStyle(): void {
		const flow = this.session.projectFlow;

		this.styleId = resolveVerifyStyle(this._preview, flow?.verifyStyle, flow?.enrollmentClient);
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

	pickFile(): void {
		this.file?.nativeElement.click();
	}

	onDragOver(event: DragEvent): void {
		event.preventDefault();
		event.stopPropagation();
		if (!this.isDraggingFile) this.isDraggingFile = true;
	}

	onDragLeave(event: DragEvent): void {
		event.preventDefault();
		event.stopPropagation();
		this.isDraggingFile = false;
	}

	onFileDrop(event: DragEvent): void {
		event.preventDefault();
		event.stopPropagation();
		this.isDraggingFile = false;
		const file = event.dataTransfer?.files?.[0];
		if (file) this._readSelectedFile(file);
	}

	onFile(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		this._readSelectedFile(file, () => {
			input.value = "";
		});
	}

	private _readSelectedFile(file: File, afterRead?: () => void): void {
		const reader = new FileReader();

		reader.onload = () => {
			const raw = String(reader.result || "");

			this.session.useFile({
				base64Image: raw.replace(/^data:.*;base64,/, ""),
				front: this.session.captureSide === "front",
				inputMethod: "FILE_UPLOAD",
				rawImage: raw,
				source: "document",
			} as ImageScan);
			afterRead?.();
		};
		reader.readAsDataURL(file);
	}
}
