import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import QRCode from "qrcode";
import { Subject } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { DemoService } from "app/modules/demo/demo.service";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration, BiometricValidation, ImageScan } from "../../project";
import { EnrollSettings, SmartEnrollService } from "../smart-enroll.service";
import { SmartErrorDisplayComponent } from "../smart-error-display/smart-error-display.component";
import { SmartLivenessComponent } from "../smart-liveness/smart-liveness.component";
import { SmartLivenessDemoComponent } from "../smart-liveness/smart-liveness-demo.component";
import { ApiErrorService } from "app/core/services/api-error.service";
import { environment } from "environments/environment";
import { NeuralFaceComponent } from "./neural-face/neural-face.component";

const DEV_FACE_FILE_MAX_BYTES = 6 * 1024 * 1024;

/**
 * Recoverable capture problems. The user fixes these by recapturing, so they never consume
 * an attempt and are shown with corrective guidance rather than a rejection.
 * Mirrors QUALITY_REASONS in Repositories/OpenCV/modules/liveness-failure.util.js.
 */
const LIVENESS_QUALITY_REASONS = new Set([
	"face_close_to_border",
	"face_not_centered",
	"face_occluded",
	"face_rotation_too_large",
	"face_too_close",
	"face_too_far",
	"multiple_faces_detected",
	"no_face_detected",
	"poor_lighting",
]);

/** Provider error codes to canonical reasons, for API builds that predate `failureReason`. */
const PROVIDER_REASON_CODES: Record<string, string> = {
	ERR_LIVENESS_FACE_CLOSE_TO_BORDER: "face_close_to_border",
	ERR_LIVENESS_FACE_TOO_SMALL: "face_too_far",
	ERR_MULTIPLE_FACES_DETECTED: "multiple_faces_detected",
	ERR_NO_FACE_DETECTED: "no_face_detected",
};

type LivenessFailureKind = "quality" | "score" | "unknown";

interface LivenessFailure {
	kind: LivenessFailureKind;
	reason: string;
	score: number | null;
}

/** Top inset for `smart-liveness` when the fixed dev toolbar is shown (keep in sync with bar height). */
const DEV_BIOMETRICS_HOST_PADDING_TOP_PX = 132;

/** English-only copy for the dev-only upload strip (not in locale files; production hides this UI). */
const DEV_BIOMETRICS_COPY = {
	chooseFile: "Choose face image",
	fileHint: "JPEG or PNG, max 6 MB. Same API payload as camera capture.",
	title: "Developer mode (local only)",
	uploadImage: "Upload image (dev)",
	useCamera: "Use camera",
	warning:
		"For local testing only. Uploading a still image skips live capture and may not reflect real liveness behavior. Do not use for production or security decisions.",
} as const;

@Component({
	animations: fuseAnimations,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		SmartLivenessComponent,
		SmartLivenessDemoComponent,
		SmartErrorDisplayComponent,
		TranslocoModule,
		NeuralFaceComponent,
	],
	selector: "smart-biometrics",
	standalone: true,
	styleUrls: ["../smart-enroll.component.scss"],
	templateUrl: "./smart-biometrics.component.html",
})
export class SmartBiometricsComponent implements OnDestroy {
	@ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("qrCodeCanvas") qrCodeCanvas: ElementRef<HTMLCanvasElement>;

	/** Non-production only: from `environment.allowDevFaceFileUpload`. */
	readonly allowDevFaceFileUpload: boolean = environment.allowDevFaceFileUpload === true;

	loadingQRCode: boolean = false;

	/**
	 * Capture pitfalls shown before the camera opens, worded for end users rather than as the
	 * pixel thresholds the engine actually enforces. Each one corresponds to a quality reason in
	 * `LIVENESS_QUALITY_REASONS` that would otherwise only surface after a wasted attempt.
	 */
	readonly captureAvoidKeys: string[] = [
		"avoid_sunglasses",
		"avoid_head_cover",
		"avoid_other_people",
		"avoid_dim_light",
		"avoid_tilted_head",
		"avoid_too_far",
	];

	appRegistration: AppRegistration;
	cameraQualityLow: boolean = false;
	confirmedInstructions: boolean = false;
	demoData: any;
	demoModeChoice: "own" | "demo" | "" = "";
	enrollSettings: EnrollSettings;
	errorContent: { message: string; livenessScore?: number; livenessMinScore?: number };
	errorResult: boolean;
	faceIdCard: string;
	project: Project;
	projectFlow: ProjectFlow;
	retrySubject: Subject<void> = new Subject<void>();
	showMobileQRModal: boolean = false;
	successfulUploadSubject: Subject<void> = new Subject<void>();
	useDemoData: boolean = false;
	/** Dev-only input mode when `allowDevFaceFileUpload` is true. */
	devBiometricInputMode: "camera" | "upload" = "camera";

	readonly devBiometricsCopy = DEV_BIOMETRICS_COPY;

	readonly devBiometricsHostPaddingTopPx = DEV_BIOMETRICS_HOST_PADDING_TOP_PX;

	constructor(
		private _apiErrorService: ApiErrorService,
		private _demoService: DemoService,
		private _KYCService: KYCService,
		private _passwordlessService: PasswordlessService,
		private _smartEnrollService: SmartEnrollService,
		private _translocoService: TranslocoService
	) {
		this.enrollSettings = this._smartEnrollService.enrollSettings;

		this.appRegistration = this._KYCService.appRegistration;
		this.project = this._passwordlessService.currentProject;
		this.projectFlow = this._passwordlessService.currentProjectFlow;

		this.errorResult = this._smartEnrollService.store.biometric.remaining === 0;
		this.errorContent = { message: "" };

		this.demoModeChoice = this._demoService.demoModeChoice;
		this.useDemoData = this.demoModeChoice === "demo";
		this.demoData = this._demoService.getDemoData();
	}

	ngOnDestroy() {
		this.successfulUploadSubject.complete();
		this.retrySubject.complete();
	}

	private _createBiometricValidation(body: any) {
		this._smartEnrollService.setSkippedBiometric(false);

		this._KYCService.createBiometricValidation(body).subscribe({
			next: (response) => {
				this.appRegistration.biometricValidation = response.data.biometricValidation as BiometricValidation;
				this.appRegistration.person = response.data.person;
				this.appRegistration.face = null;

				this._smartEnrollService.setLivenessScore(response.data.biometricValidation.livenessScore);

				if (this.appRegistration.documentValidation && this.appRegistration.biometricValidation) {
					this._KYCService.compareFaces().subscribe({
						next: (response) => {
							this.appRegistration.compareFaceVerification = response.data.compareFaceVerification;

							this._smartEnrollService.setCompareScore(response.data.compareFaceVerification.result.score);
						},
						error: (error) => this._handleCompareError(error),
						complete: () => {
							this._syncAppRegistration("end", "ONGOING");
							this.successfulUploadSubject.next();
							this._smartEnrollService.goToNextStep();
						},
					});

					return;
				}

				this._syncAppRegistration("end", "ONGOING");
				this._smartEnrollService.goToNextStep();
				this.successfulUploadSubject.next();
			},
			error: (error) => this._handleError(error),
		});
	}

	/**
	 * Classifies a liveness failure, preferring the API's explicit verdict and falling back to
	 * parsing the message for API builds that predate `failureKind` / `failureReason`.
	 */
	private _resolveFailure(err: Record<string, unknown> | null | undefined, rawMessage: string): LivenessFailure {
		const reasonFromApi = typeof err?.failureReason === "string" ? err.failureReason : null;
		const kindFromApi = typeof err?.failureKind === "string" ? (err.failureKind as LivenessFailureKind) : null;
		const scoreFromApi = err?.livenessScore != null ? Number(err.livenessScore) : null;

		if (kindFromApi && reasonFromApi) {
			return { kind: kindFromApi, reason: reasonFromApi, score: scoreFromApi };
		}

		const message = rawMessage.replace(/^\d{3}:/, "").trim();
		const [head, ...rest] = message.split("@");
		const detail = rest.join("@").trim();

		if (detail) {
			const providerReason = PROVIDER_REASON_CODES[detail];

			if (providerReason) return { kind: "quality", reason: providerReason, score: null };

			const parsedScore = Number(detail);

			if (Number.isFinite(parsedScore)) {
				return { kind: "score", reason: "liveness_failed", score: scoreFromApi ?? parsedScore };
			}

			if (String(head).includes("liveness_quality")) {
				return { kind: "quality", reason: "liveness_failed", score: null };
			}

			return { kind: "unknown", reason: "liveness_failed", score: null };
		}

		const reason = this._mapErrorToTranslationKey(message);

		return {
			kind: LIVENESS_QUALITY_REASONS.has(reason) ? "quality" : "unknown",
			reason,
			score: null,
		};
	}

	/**
	 * Syncs the attempt counter. The API is authoritative because it excludes recoverable
	 * capture-quality rejects; the local decrement is only a fallback for older builds.
	 */
	private _applyAttemptState(err: Record<string, unknown> | null | undefined, consumesAttempt: boolean): void {
		const remainingFromApi = err?.remainingAttempts;
		const limit = this._smartEnrollService.store.biometric.limit;

		if (remainingFromApi != null && typeof limit === "number") {
			this._smartEnrollService.setAttempts("biometric", Number(remainingFromApi), limit);
			return;
		}

		if (consumesAttempt) this._smartEnrollService.subtractAttempt("biometric");
	}

	/**
	 * Face compare runs after liveness has already been accepted and stored, so a compare
	 * failure must not consume a liveness attempt or surface as a liveness rejection.
	 * The result step and the backend completeness check decide the verdict from there.
	 */
	private _handleCompareError(exception: any): void {
		if (exception?.error?.code === "PaymentRequired") {
			this._smartEnrollService.insufficientCreditsTrigger();
			return;
		}

		this._apiErrorService.normalize(exception);

		this._syncAppRegistration("end", "ONGOING");
		this.successfulUploadSubject.next();
		this._smartEnrollService.goToNextStep();
	}

	private _handleError(exception: any): void {
		if (exception?.error?.code === "PaymentRequired") {
			this._smartEnrollService.insufficientCreditsTrigger();
			return;
		}

		const err = exception?.error as Record<string, unknown> | null | undefined;
		const rawMessage = (typeof err?.message === "string" ? err.message : "") || "";

		// The biometric signature is already stored, so this is not a failed attempt.
		if (rawMessage.replace(/^\d{3}:/, "").trim() === "person_already_set" && this.appRegistration.biometricValidation) {
			this._smartEnrollService.goToNextStep();
			return;
		}

		const failure = this._resolveFailure(err, rawMessage);

		this._applyAttemptState(err, failure.kind !== "quality");

		this.errorResult = true;

		if (failure.kind !== "score") {
			if (failure.kind === "unknown") this._apiErrorService.normalize(exception);

			this.errorContent = { message: failure.reason };
			return;
		}

		const score = failure.score ?? 0;

		this._smartEnrollService.setLivenessScore(score);

		const configuredMinScore = this._smartEnrollService.store.biometric.livenessMinScore;
		const minScoreFromApi = err?.minimumScore != null ? Number(err.minimumScore) : null;
		const livenessMinScore = configuredMinScore ?? minScoreFromApi;

		this.errorContent = {
			message: failure.reason,
			livenessScore: score,
			livenessMinScore: livenessMinScore != null ? Number(livenessMinScore) : null,
		};
	}

	private _mapErrorToTranslationKey(errorMessage: string): string {
		// Map readable error messages to snake_case translation keys
		const errorMappings: Record<string, string> = {
			"The face is not in the center": "face_not_centered",
			"face_not_in_center": "face_not_centered",
			"The face rotation angle is too large": "face_rotation_too_large",
			"face_rotation_angle_too_large": "face_rotation_too_large",
			"The face is occluded": "face_occluded",
			"face_is_occluded": "face_occluded",
			"No face detected": "no_face_detected",
			"Multiple faces detected": "multiple_faces_detected",
			"Face too far": "face_too_far",
			"Face too close": "face_too_close",
			"Face is close to the border": "face_close_to_border",
			"Poor lighting": "poor_lighting",
			"Face not visible": "face_not_visible",
			...PROVIDER_REASON_CODES,
		};

		// Check if we have a direct mapping
		if (errorMappings[errorMessage]) {
			return errorMappings[errorMessage];
		}

		// If already a valid snake_case key, use it
		if (/^[a-z]+(?:_[a-z]+)*$/.test(errorMessage)) {
			return errorMessage;
		}

		// Default fallback
		return "liveness_failed";
	}

	private _syncAppRegistration(step: string, status?: string, action?: string) {
		this._KYCService.syncAppRegistration(step, status).subscribe({
			next: () => {},
			error: () => {},
			complete: () => {},
		});
	}

	onImageScan(imageScan: ImageScan) {
		const body: any = {
			image: imageScan.face,
			os: this.demoData.OS,
			force: !!this.appRegistration.biometricValidation,
		};

		this._createBiometricValidation(body);
	}

	/**
	 * Dev-only: reads a selected image file and submits the same payload shape as live capture.
	 */
	onDevFaceFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}

		if (!file.type.startsWith("image/")) {
			console.warn("[dev face upload] File must be an image.");
			input.value = "";
			return;
		}

		if (file.size > DEV_FACE_FILE_MAX_BYTES) {
			console.warn("[dev face upload] File too large (max 6 MB).");
			input.value = "";
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = String(reader.result ?? "");
			const commaIdx = dataUrl.indexOf(",");
			const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;

			this.onImageScan({
				base64Image: base64,
				face: base64,
				force: !!this.appRegistration.biometricValidation,
				front: true,
				inputMethod: "FILE_UPLOAD",
				rawImage: dataUrl,
				source: "face",
			});
			input.value = "";
		};
		reader.onerror = () => {
			console.warn("[dev face upload] Failed to read file.");
			input.value = "";
		};
		reader.readAsDataURL(file);
	}

	retry() {
		this.errorResult = false;
		this.errorContent = { message: "" };

		this.retrySubject.next();
	}

	skipStep() {
		if (this.projectFlow.onboardingSettings.steps.liveness === "mandatory") return;

		this._smartEnrollService.setSkippedBiometric(true);
		this._smartEnrollService.skipToStep("result");
	}

	confirmInstructions() {
		this.confirmedInstructions = true;
	}

	goBack() {
		this._smartEnrollService.goToPreviousStep();
	}

	/**
	 * Called when camera quality is detected as low.
	 */
	onCameraQualityLow(): void {
		this.cameraQualityLow = true;
	}

	/**
	 * Opens the mobile QR modal for switching to mobile.
	 */
	openMobileQRModal(): void {
		this.showMobileQRModal = true;
		this.loadingQRCode = true;

		setTimeout(() => {
			if (this.qrCodeCanvas) {
				this._generateQRCode(this.qrCodeCanvas.nativeElement, window.location.href);
			}
		}, 100);
	}

	/**
	 * Closes the mobile QR modal.
	 */
	closeMobileQRModal(): void {
		this.showMobileQRModal = false;
	}

	/**
	 * Generates a QR code on the given canvas.
	 */
	private async _generateQRCode(canvas: HTMLCanvasElement, text: string): Promise<void> {
		try {
			await QRCode.toCanvas(canvas, text, {
				errorCorrectionLevel: "L",
				width: 200,
				margin: 2,
			});
			this.loadingQRCode = false;
		} catch (e) {
			console.error("Failed to generate QR code:", e);
			this.loadingQRCode = false;
		}
	}
}
