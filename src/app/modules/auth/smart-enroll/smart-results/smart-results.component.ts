import { CommonModule, NgIf } from "@angular/common";
import { Component, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";

import { EnrollSettings, EnrollStore, SmartEnrollService } from "../smart-enroll.service";
import { KYCService } from "../../kyc.service";
import { AppRegistration, Face, Project, ProjectFlow } from "../../project";
import { environment } from "environments/environment";

import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";

@Component({
	selector: "smart-results",
	templateUrl: "./smart-results.component.html",
	styleUrls: ["../smart-enroll.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		NgIf,
		SmartStepperComponent,
		TranslocoModule,
	],
})
export class SmartResultsComponent {
	appRegistration: AppRegistration;
	enrollSettings: EnrollSettings;
	enrollStore: EnrollStore;
	errorContent: { message: string };
	errorResult: boolean = false;
	face: Face;
	comparisonFailed: boolean;
	livenessFailed: boolean;
	fetchingToken: boolean;
	livenessScore: number;
	comparisonScore: number;
	redirectUrl: string;
	project: Project;
	projectFlow: ProjectFlow;

    constructor(
		private _smartEnrollService: SmartEnrollService,
		private _KYCService: KYCService,
	) {
		this.appRegistration = this._KYCService.appRegistration;
		this.enrollSettings = this._smartEnrollService.enrollSettings;
		this.enrollStore = this._smartEnrollService.store;
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;

		this.errorResult = false;

		this._resync();
	}

	/**
	 * On init
	 */
	ngOnInit(): void {
		this._requestIdentityImages();
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

	private _requestIdentityImages(): void {
		if (this.appRegistration.face?._id) {
			this._setFace(this.appRegistration.face);

			return;
		}

		this._KYCService.getIdentityImages({}).subscribe({
			next: (response) => {
				this._extractFaces(response.data);
			},
			error: () => {},
			complete: () => {},
		});
	}

	private _resync() {
		this.fetchingToken = true;

		const compareFaceVerification = this.appRegistration.compareFaceVerification;
		const livenessScore = this.appRegistration.biometricValidation?.livenessScore;

		this.livenessScore = (livenessScore || 0) * 100;
		this.comparisonScore = (compareFaceVerification?.result?.score || 0) * 100;

		let _response = {
			token: null,
		};

		this.livenessFailed = false;
		this.comparisonFailed = false;

		if (compareFaceVerification && compareFaceVerification.result.score < this.enrollStore.biometric.compareMinScore) {
			this.comparisonFailed = true;
			this.appRegistration.status = "FAILED";
			this.errorResult = true;
		}

		if (livenessScore && livenessScore < this.enrollStore.biometric.livenessMinScore) {
			this.livenessFailed = true;
			this.appRegistration.status = "FAILED";
			this.errorResult = true;
		}

		this._KYCService.syncAppRegistration("end", this.appRegistration.status).subscribe({
			next: (response) => {
				_response = response.data;
			},
			error: (exception) => {
				console.error({ exception });
				this.fetchingToken = false;
				this.errorResult = true;
			},
			complete: () => {
				let redirectUrl = this.projectFlow.redirectUrl;

				if (environment.verifikProject === this.project._id) {
					redirectUrl = `${environment.appUrl}/sign-in`;
				} else if (environment.sandboxProject === this.project._id) {
					redirectUrl = `${environment.sandboxUrl}/sign-in`;
				}

				this.redirectUrl = `${redirectUrl}?type=onboarding&token=${_response.token}`;
				this.fetchingToken = false;
			},
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
	}

	exitApplication(): void {
		window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
	}

	loginToPlatform(): void {
		if (this.fetchingToken || !this.redirectUrl) return;

		window.location.href = `${this.redirectUrl}`;
	}

	tryAgain(step: 'document' | 'biometric'): void {
		if (step === 'document' && this.projectFlow.onboardingSettings.document.scanDocumentAllowed && this.projectFlow.onboardingSettings.document.uploadDocumentAllowed) {
			this._smartEnrollService.setDocumentMethod('');
		}

		if (step === 'document') this.appRegistration.documentValidation = null;
		if (step === 'biometric') this.appRegistration.biometricValidation = null;

		this._smartEnrollService.skipToStep(step);
	}
}
