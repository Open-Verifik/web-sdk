import { CommonModule, NgIf } from "@angular/common";
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import QRCode from "qrcode";

import { AuthService } from "app/core/auth/auth.service";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { VerifikMediaDisplayComponent } from "app/shared/components/verifik-media-display";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration, Face } from "../../project";
import { EnrollSettings, EnrollStore, SmartEnrollService } from "../smart-enroll.service";

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatDividerModule,
		NgIf,
		TranslocoModule,
		VerifikMediaDisplayComponent,
		LanguagesComponent,
	],
	selector: "smart-results",
	standalone: true,
	styleUrls: ["../smart-enroll.component.scss"],
	templateUrl: "./smart-results.component.html",
})
export class SmartResultsComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild("qrCodeCanvas", { static: false }) public qrCodeCanvas: ElementRef<HTMLCanvasElement>;

	appRegistration: AppRegistration;
	biometricSkipped: boolean = false;
	comparisonFailed: boolean;
	comparisonScore: number;
	documentSkipped: boolean = false;
	enrollSettings: EnrollSettings;
	enrollStore: EnrollStore;
	errorContent: { message: string };
	errorResult: boolean = false;
	face: Face;
	fetchingToken: boolean;
	identityLoading: boolean = false;
	livenessFailed: boolean;
	livenessScore: number;
	isVerifikProject: boolean = false;
	loadingQRCode: boolean = false;
	loadingAppRegistrationZKP: boolean = false;
	project: Project;
	projectFlow: ProjectFlow;
	showQrCode: boolean = false;
	showZKPQRCode: boolean = false;
	private zkpRotationInterval: any;
	private isHoveringAvatar: boolean = false;

	constructor(
		private _smartEnrollService: SmartEnrollService,
		private _KYCService: KYCService,
		private _authService: AuthService,
		private _passwordlessService: PasswordlessService,
		private _translocoService: TranslocoService
	) {
		this.appRegistration = this._KYCService.appRegistration;
		this.enrollSettings = this._smartEnrollService.enrollSettings;
		this.enrollStore = this._smartEnrollService.store;
		this.project = this._passwordlessService.currentProject;
		this.projectFlow = this._passwordlessService.currentProjectFlow;
		this.isVerifikProject = this._passwordlessService.isVerifikProject;

		this.errorResult = false;
	}

	ngOnInit(): void {
		this.biometricSkipped = this._smartEnrollService.wasSkippedBiometric();
		this.documentSkipped = this._smartEnrollService.wasSkippedDocument();

		this._checkScoreStatus();
		this._requestIdentityImages();

		// Start rotation if ZKP already exists (e.g., on page reload)
		if (this.appRegistration?.zelfKey?.zelfQR) {
			// Use setTimeout to ensure component is fully initialized
			setTimeout(() => {
				this._startZKPQRCodeRotation();
			}, 100);
		}
	}

	ngAfterViewInit(): void {
		// QR code is generated on-demand when user clicks to show it
	}

	ngOnDestroy(): void {
		this._stopZKPQRCodeRotation();
	}

	private _checkScoreStatus() {
		const compareFaceVerification = this.appRegistration.compareFaceVerification;

		const compareScore = this.enrollStore.biometric.compareScore || compareFaceVerification?.result?.score || 0;
		const livenessScore = this.enrollStore.biometric.livenessScore || this.appRegistration.biometricValidation?.livenessScore || 0;

		this.comparisonScore = Math.floor((compareScore || 0) * 100);
		this.livenessScore = Math.floor((livenessScore || 0) * 100);

		this.comparisonFailed = false;
		this.errorResult = false;
		this.livenessFailed = false;

		if (!this.documentSkipped && compareFaceVerification && compareScore < this.enrollStore.biometric.compareMinScore) {
			this.appRegistration.status = "FAILED";
			this.errorResult = true;
			this.comparisonFailed = true;
		}

		if (!this.biometricSkipped && livenessScore < this.enrollStore.biometric.livenessMinScore) {
			this.appRegistration.status = "FAILED";
			this.errorResult = true;
			this.livenessFailed = true;
		}

		if (!this.errorResult) {
			this.appRegistration.status = "COMPLETED";

			if (this.zeroKnowledgeProofEnabled && !this.comparisonFailed && !this.livenessFailed) {
				this._createAppRegistrationZKP();
			}
		}
	}

	private _endAndRedirect() {
		this.fetchingToken = true;

		let _response = { token: null };

		this._KYCService.syncAppRegistration("end", this.appRegistration.status).subscribe({
			next: (response) => {
				_response = response.data;
			},
			error: (exception) => {
				this.errorResult = true;
				this.fetchingToken = false;
			},
			complete: () => {
				this._authService.handleRedirect(this.projectFlow, this.project._id, _response.token, "onboarding", this.project.demoMode);
				this.fetchingToken = false;
			},
		});
	}

	private _extractFaces(arrayOfImages: Face[]): void {
		let fallbackFace: Face;

		for (let index = 0; index < arrayOfImages.length; index++) {
			const identityImage = arrayOfImages[index];

			if (identityImage.category !== "face") {
				fallbackFace = identityImage;

				continue;
			}

			this._setFace(identityImage);
		}

		if (!this.face) this._setFace(fallbackFace);
	}

	private async _generateQRCode(canvas: HTMLCanvasElement, text: string) {
		try {
			await QRCode.toCanvas(canvas, text, { errorCorrectionLevel: "L" });

			this.loadingQRCode = false;
		} catch (e) {}
	}

	private _prepareQrCode(): void {
		if (!this.qrCodeCanvas?.nativeElement) return;

		const canvas = this.qrCodeCanvas.nativeElement;

		this._generateQRCode(canvas, window.location.href);
	}

	private _requestIdentityImages(): void {
		if (this.documentSkipped && this.biometricSkipped) {
			this.identityLoading = false;
			this.face = null;

			return;
		}

		this.identityLoading = true;

		this._KYCService.getIdentityImages({}).subscribe({
			next: (response) => {
				this._extractFaces(response.data);
				this._tryCreateZKPAfterFaceLoaded();
			},
			error: () => {},
			complete: () => {},
		});
	}

	private _setFace(identityImage: Face) {
		this.face = identityImage;

		if (!this.face.base64.includes("data:image")) {
			this.face["base64"] = `data:image/jpeg;base64,${identityImage.base64}`;
		}

		const stringArr = this.face["base64"].split("data:image/jpeg;base64,");

		if (stringArr.length === 3) {
			this.face["base64"] = this.face["base64"].replace("data:image/jpeg;base64,", "");
		}

		this.identityLoading = false;
	}

	private _tryCreateZKPAfterFaceLoaded(): void {
		// Only create ZKP if:
		// 1. Face is available
		// 2. ZKP is enabled
		// 3. Validations passed (no errors)
		// 4. ZKP doesn't already exist
		if (
			this.face?.base64 &&
			this.zeroKnowledgeProofEnabled &&
			!this.comparisonFailed &&
			!this.livenessFailed &&
			!this.errorResult &&
			!this.appRegistration.zelfKey
		) {
			this._createAppRegistrationZKP();
		}
	}

	get zeroKnowledgeProofEnabled(): boolean {
		if (!this.projectFlow) {
			return false;
		}

		// For v3, check the liveness property directly
		if (this.projectFlow.version >= 3) {
			const liveness = this.projectFlow.liveness as any;
			const isEnabled = liveness?.kycType === "zero_knowledge";
			return isEnabled;
		}

		// For v2, check onboardingSettings
		const onboardingSettings = this.projectFlow.onboardingSettings as any;
		const isEnabled = onboardingSettings?.livenessSettings?.kycType === "zero_knowledge";
		return isEnabled;
	}

	private _createAppRegistrationZKP(): void {
		// Only create if not already created and face is available
		if (this.loadingAppRegistrationZKP) {
			return;
		}

		if (this.appRegistration.zelfKey) {
			return;
		}

		if (!this.face?.base64) {
			return;
		}

		this.loadingAppRegistrationZKP = true;

		// Get face base64 (remove data URL prefix if present)
		const faceBase64 = this.face.base64.replace(/^data:image\/\w+;base64,/, "");

		this._KYCService.createAppRegistrationZkProof(faceBase64).subscribe({
			next: (response: any) => {
				if (response?.data?.zelfKey) {
					// Update appRegistration with zelfKey from response
					// The backend saves it to the database, so we update our local copy
					this.appRegistration.zelfKey = response.data.zelfKey;

					// Also update the appRegistration in KYCService so it persists
					this._KYCService.appRegistration.zelfKey = response.data.zelfKey;

					// Restart rotation if QR code is now available
					this._startZKPQRCodeRotation();
				}
			},
			error: (error) => {
				console.error("[ZKP] Error creating appRegistration ZKP:", error);
			},
			complete: () => {
				this.loadingAppRegistrationZKP = false;
			},
		});
	}

	private _startZKPQRCodeRotation(): void {
		// Only start rotation if ZKP is enabled and QR code is available
		if (!this.zeroKnowledgeProofEnabled) {
			return;
		}

		if (!this.appRegistration?.zelfKey?.zelfQR) {
			return;
		}

		// Clear any existing interval
		this._stopZKPQRCodeRotation();

		// Start rotation every 5 seconds
		this.zkpRotationInterval = setInterval(() => {
			if (!this.isHoveringAvatar) {
				this.showZKPQRCode = !this.showZKPQRCode;
			}
		}, 5000);
	}

	private _stopZKPQRCodeRotation(): void {
		if (this.zkpRotationInterval) {
			clearInterval(this.zkpRotationInterval);
			this.zkpRotationInterval = null;
		}
	}

	onAvatarHover(isHovering: boolean): void {
		this.isHoveringAvatar = isHovering;
		// Pause rotation while hovering
		if (isHovering) {
			this._stopZKPQRCodeRotation();
		} else {
			this._startZKPQRCodeRotation();
		}
	}

	onAvatarClick(): void {
		if (this.zeroKnowledgeProofEnabled && this.appRegistration?.zelfKey?.zelfQR) {
			this.showZKPQRCode = !this.showZKPQRCode;
			// Reset rotation timer
			this._stopZKPQRCodeRotation();
			this._startZKPQRCodeRotation();
		}
	}

	get zkpQRCodeUrl(): string | null {
		const hasZelfKey = !!this.appRegistration?.zelfKey;
		const hasZelfQR = !!this.appRegistration?.zelfKey?.zelfQR;

		if (!this.appRegistration?.zelfKey?.zelfQR) {
			return null;
		}

		// zelfQR might be a base64 string or a URL
		const qr = this.appRegistration.zelfKey.zelfQR;
		let result: string;

		if (qr.startsWith("data:") || qr.startsWith("http")) {
			result = qr;
		} else {
			// If it's just base64, add the data URL prefix
			result = `data:image/png;base64,${qr}`;
		}

		return result;
	}

	private _syncAppRegistration(step: string, status?: string, action?: string) {
		let _response: any = null;

		this._KYCService.syncAppRegistration(step, status).subscribe({
			next: (response) => {
				_response = response.data;
			},
			error: () => {},
			complete: () => {
				if (status !== "COMPLETED_WITHOUT_KYC" && action !== "redirect") return;

				this._authService.handleRedirect(this.projectFlow, this.project._id, _response.token, "onboarding");
			},
		});
	}

	exitApplication(): void {
		window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
	}

	isLoginToPlatformDisabled() {
		return this.fetchingToken || this.appRegistration.status === "FAILED" || this.comparisonFailed || this.livenessFailed;
	}

	loginToPlatform(): void {
		if (this.fetchingToken) return;

		this._endAndRedirect();
	}

	logout(): void {
		localStorage.clear();

		window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
	}

	onLanguageChange(lang: string): void {
		localStorage.setItem("currentLanguage", lang);
		this._translocoService.setActiveLang(lang);
	}

	toggleQrCode(): void {
		this.showQrCode = !this.showQrCode;

		if (this.showQrCode) {
			this.loadingQRCode = true;
			// Wait for view to update before generating QR code
			setTimeout(() => {
				if (this.qrCodeCanvas?.nativeElement) {
					this._prepareQrCode();
				} else {
					this.loadingQRCode = false;
				}
			}, 100);
		}
	}

	tryAgain(step: "document" | "biometric"): void {
		if (step === "document") {
			this._syncAppRegistration("document", "ONGOING");

			this._smartEnrollService.skipToStep(step);
			this._smartEnrollService.setDocumentMethod("");

			return;
		}

		this._syncAppRegistration("liveness", "ONGOING");

		this._smartEnrollService.skipToStep(step);
	}
}
