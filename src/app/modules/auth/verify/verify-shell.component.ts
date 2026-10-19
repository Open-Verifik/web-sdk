import { CommonModule } from "@angular/common";
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TranslocoModule } from "@ngneat/transloco";
import QRCode from "qrcode";
import { Subject, combineLatest, takeUntil } from "rxjs";

import { CountryService } from "app/core/services/country.service";
import { ImageScan } from "app/modules/auth/project";
import { SmartLivenessComponent } from "app/modules/auth/smart-enroll/smart-liveness/smart-liveness.component";
import { VerifyCameraComponent } from "./verify-camera.component";
import { VerifySessionService } from "./verify-session.service";
import { hasContactBlock, progressIndex, progressSegments } from "./verify-flow";
import { parseVerifyStyle, resolveVerifyStyle, VERIFY_FONT_HREF, VerifyStyleId } from "./verify-style";

@Component({
	selector: "verify-shell",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule, VerifyCameraComponent, SmartLivenessComponent],
	templateUrl: "./verify-shell.component.html",
	styleUrls: ["./verify-shell.component.scss"],
	providers: [VerifySessionService],
})
export class VerifyShellComponent implements OnInit, AfterViewChecked, OnDestroy {
	@ViewChild("qr") qr?: ElementRef<HTMLCanvasElement>;
	@ViewChild("file") file?: ElementRef<HTMLInputElement>;
	@ViewChild(VerifyCameraComponent) camera?: VerifyCameraComponent;

	boxes = [0, 1, 2, 3, 4, 5];
	styleId: VerifyStyleId = "a";

	private _destroy$ = new Subject<void>();
	private _preview: string | null = null;
	private _qrUrl = "";

	constructor(
		public session: VerifySessionService,
		private _cdr: ChangeDetectorRef,
		private _countries: CountryService,
		private _route: ActivatedRoute
	) {}

	ngOnInit(): void {
		this._loadStyleFonts();
		this.session.compact = window.matchMedia("(max-width: 720px)").matches;
		this.session.changed.pipe(takeUntil(this._destroy$)).subscribe(() => {
			this._applyStyle();
			this._cdr.markForCheck();
		});
		combineLatest([this._route.paramMap, this._route.queryParamMap])
			.pipe(takeUntil(this._destroy$))
			.subscribe(([params, query]) => {
				this._preview = query.get("style");
				this.session.previewStyle = parseVerifyStyle(this._preview);
				this._applyStyle();
				this.session.open(params.get("projectId") || "", query.get("token") || undefined);
			});
	}

	ngAfterViewChecked(): void {
		if (this.session.screen !== "handoff" || !this.qr?.nativeElement) return;
		if (this._qrUrl === this.session.sessionUrl) return;

		this._qrUrl = this.session.sessionUrl;
		void QRCode.toCanvas(this.qr.nativeElement, this.session.sessionUrl, { margin: 1, width: 220 });
	}

	ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	get segments(): string[] {
		return this.session.settings ? progressSegments(hasContactBlock(this.session.settings)) : [];
	}

	get progressAt(): number {
		return this.session.settings ? progressIndex(this.session.screen, hasContactBlock(this.session.settings)) : 0;
	}

	get languageLabel(): string {
		return this.session.languages.find((lang) => lang.id === this.session.activeLang)?.label || this.session.activeLang;
	}

	get dialCodes(): Array<{ code: string; name: string }> {
		return this._countries.countryCodes;
	}

	categoryLabel(category: string): string {
		if (category === "passport") return "verify.passport";
		if (category === "license") return "verify.license";

		return "verify.nationalId";
	}

	canContinue(): boolean {
		const draft = this.session.draft;

		if (this.session.screen === "name") {
			if (this.session.settings?.firstName || this.session.settings?.lastName) return Boolean(draft.firstName.trim() && draft.lastName.trim());

			return Boolean(draft.fullName.trim());
		}

		if (this.session.screen === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim());
		if (this.session.screen === "phone") return draft.phone.replace(/\D/g, "").length >= 6 && Boolean(draft.phoneGateway);
		if (this.session.screen === "agreements") return draft.agreements;
		if (this.session.screen === "emailCode" || this.session.screen === "phoneCode") return draft.otp.replace(/\D/g, "").length === 6;

		return true;
	}

	otpAt(index: number): string {
		return this.session.draft.otp[index] || "";
	}

	onOtp(event: Event, index: number): void {
		const input = event.target as HTMLInputElement;
		const digit = input.value.replace(/\D/g, "").slice(-1);
		const chars = this.session.draft.otp.padEnd(6, " ").split("");

		chars[index] = digit || " ";
		this.session.draft.otp = chars.join("").replace(/\s/g, "").slice(0, 6);
		input.value = digit;

		const next = input.nextElementSibling as HTMLInputElement | null;

		if (digit && next) next.focus();
	}

	onOtpPaste(event: ClipboardEvent): void {
		const text = event.clipboardData?.getData("text")?.replace(/\D/g, "").slice(0, 6) || "";

		if (!text) return;

		event.preventDefault();
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

	onFile(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

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
			input.value = "";
		};
		reader.readAsDataURL(file);
	}
}
