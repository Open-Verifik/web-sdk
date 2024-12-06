import { CommonModule, NgIf } from "@angular/common";
import { Component, OnInit, ViewEncapsulation } from "@angular/core";
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
export class SmartResultsComponent implements OnInit {
	appRegistration: AppRegistration;
	biometricSkipped: boolean = false;
	comparisonFailed: boolean;
	comparisonScore: number;
	enrollSettings: EnrollSettings;
	enrollStore: EnrollStore;
	errorContent: { message: string };
	errorResult: boolean = false;
	face: Face;
	fetchingToken: boolean;
	identityLoading: boolean = false;
	livenessFailed: boolean;
	livenessScore: number;
	project: Project;
	projectFlow: ProjectFlow;
	redirectUrl: string;
    documentSkipped: boolean = false;

	constructor(private _smartEnrollService: SmartEnrollService, private _KYCService: KYCService) {
		this.appRegistration = this._KYCService.appRegistration;
		this.enrollSettings = this._smartEnrollService.enrollSettings;
		this.enrollStore = this._smartEnrollService.store;
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;
		this.errorResult = false;
	}

	/**
	 * On init
	 */
	ngOnInit(): void {
        this.biometricSkipped = this._smartEnrollService.wasSkippedBiometric();
        this.documentSkipped = this._smartEnrollService.wasSkippedDocument();

		this._checkScoreStatus();
		this._requestIdentityImages();
	}

	private _checkScoreStatus() {
		const compareFaceVerification = this.appRegistration.compareFaceVerification;

		const compareScore = this.enrollStore.biometric.compareScore || compareFaceVerification?.result?.score || 0;
		const livenessScore = this.enrollStore.biometric.livenessScore || this.appRegistration.biometricValidation?.livenessScore || 0;

		this.comparisonScore = (compareScore || 0) * 100;
		this.livenessScore = (livenessScore || 0) * 100;

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

		if (!this.errorResult) this.appRegistration.status = "COMPLETED";
	}

	private _endAndRedirect() {
		this.fetchingToken = true;

		let _response = { token: null };

		this._KYCService.syncAppRegistration("end", this.appRegistration.status).subscribe({
			next: (response) => {
				_response = response.data;
			},
			error: (exception) => {
				console.error({ exception });
				this.errorResult = true;
				this.fetchingToken = false;
			},
			complete: () => {
				let redirectUrl = this.projectFlow.redirectUrl;

				if (environment.verifikProject === this.project._id) {
					redirectUrl = `${environment.appUrl}/sign-in`;
				} else if (environment.sandboxProject === this.project._id) {
					redirectUrl = `${environment.sandboxUrl}/sign-in`;
				}

				window.location.href = `${redirectUrl}?type=onboarding&token=${_response.token}`;
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

			if (!this.appRegistration.biometricValidation) continue;

			this._setFace(identityImage);
		}

		if (!this.face) this._setFace(fallbackFace);
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

	tryAgain(step: "document" | "biometric"): void {
		if (step === 'document') this._smartEnrollService.setDocumentMethod('');
		this._smartEnrollService.skipToStep(step);
	}
}
