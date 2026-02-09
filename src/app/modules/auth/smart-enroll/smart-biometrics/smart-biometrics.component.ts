import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
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
import { NeuralFaceComponent } from "./neural-face/neural-face.component";

@Component({
	animations: fuseAnimations,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
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

	appRegistration: AppRegistration;
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
	successfulUploadSubject: Subject<void> = new Subject<void>();
	useDemoData: boolean = false;

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
						error: (error) => this._handleError(error),
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

	private _handleError(exception: any): void {
		if (exception?.error?.code === "PaymentRequired") {
			this._smartEnrollService.insufficientCreditsTrigger();
			return;
		}

		this._smartEnrollService.subtractAttempt("biometric");

		const rawMessage = exception?.error?.message || "";
		const err = exception?.error as Record<string, unknown> | null | undefined;

		// Handle liveness_failed with score: show error screen (do not go to result step)
		const str = rawMessage.split("@");
		const isLivenessFailedWithScore = str.length > 1 && String(str[0]).includes("liveness_failed");

		if (isLivenessFailedWithScore) {
			const parsedScore = parseFloat(str[1]) || 0;
			this._smartEnrollService.setLivenessScore(parsedScore);

			const remainingFromApi = err?.remainingAttempts;
			if (remainingFromApi != null && typeof this._smartEnrollService.store.biometric.limit === "number") {
				this._smartEnrollService.setAttempts("biometric", Number(remainingFromApi), this._smartEnrollService.store.biometric.limit);
			}

			this.errorResult = true;
			const livenessMinScore = this._smartEnrollService.store.biometric.livenessMinScore ?? (err?.minimumScore != null ? Number(err.minimumScore) : null);
			const livenessScoreFromApi = err?.livenessScore;
			const livenessScore = livenessScoreFromApi != null ? Number(livenessScoreFromApi) : parsedScore;
			this.errorContent = {
				message: "liveness_failed",
				livenessScore: Number.isFinite(livenessScore) ? livenessScore : parsedScore,
				livenessMinScore: livenessMinScore != null ? Number(livenessMinScore) : null,
			};
			return;
		}

		// Extract error code from "400:message" or "409:message" format
		const colonMatch = rawMessage.match(/^\d{3}:(.+)$/);
		const errorCode = colonMatch ? colonMatch[1].trim() : rawMessage;

		// Handle person_already_set - allow proceed if biometricValidation exists
		if (errorCode === "person_already_set" && this.appRegistration.biometricValidation) {
			this._smartEnrollService.goToNextStep();
			return;
		}

		this._apiErrorService.normalize(exception);

		// Map common error messages to translation keys
		const messageCode = this._mapErrorToTranslationKey(errorCode);
		this.errorResult = true;
		this.errorContent = { message: messageCode };
	}

	private _mapErrorToTranslationKey(errorMessage: string): string {
		// Map readable error messages to snake_case translation keys
		const errorMappings: Record<string, string> = {
			"The face is not in the center": "face_not_centered",
			"face_not_in_center": "face_not_centered",
			"The face rotation angle is too large": "face_rotation_too_large",
			"face_rotation_angle_too_large": "face_rotation_too_large",
			"No face detected": "no_face_detected",
			"Multiple faces detected": "multiple_faces_detected",
			"Face too far": "face_too_far",
			"Face too close": "face_too_close",
			"Poor lighting": "poor_lighting",
			"Face not visible": "face_not_visible",
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
}
