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
		this.enrollSettings = this._smartEnrollService.enrollSettings;
		this.enrollStore = this._smartEnrollService.store;
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

		this._resync();
	}

	/**
	 * On init
	 */
	ngOnInit(): void {
		this._requestIdentityImages();
	}

	private _extractFaces(arrayOfImages: Face[]): void {
		for (let index = 0; index < arrayOfImages.length; index++) {
			const identityImage = arrayOfImages[index];

			if (identityImage.category !== "face") continue;

			this.face = identityImage;
			this.face["base64"] = `data:image/jpeg;base64,${identityImage.base64}`;

			const stringArr = this.face["base64"].split("data:image/jpeg;base64,");

			if (stringArr.length === 3) {
				this.face["base64"] = this.face["base64"].replace("data:image/jpeg;base64,", "");
			}
		}
	}

	private _requestIdentityImages(): void {
		if (this.appRegistration.face?._id) {
			this.face = this.appRegistration.face;

			if (!this.face.base64.includes("data:image")) {
				this.face["base64"] = `data:image/jpeg;base64,${this.face.base64}`;
			}

			const stringArr = this.face["base64"].split("data:image/jpeg;base64,");

			if (stringArr.length === 3) {
				this.face["base64"] = this.face["base64"].replace("data:image/jpeg;base64,", "");
			}

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

		if (compareFaceVerification) {
			if (compareFaceVerification.result.score < this.enrollStore.biometric.compareMinScore) {
				this.comparisonFailed = true;
				this.appRegistration.status = "FAILED";
				this.errorResult = true;
			} else {
				this.comparisonFailed = false;
			}
		} else if (livenessScore) {
			if (livenessScore < this.enrollStore.biometric.livenessMinScore) {
				this.livenessFailed = false;
				this.appRegistration.status = "FAILED";
				this.errorResult = true;
			} else {
				this.livenessFailed = false;
			}
		} else {
			this.appRegistration.status = "COMPLETED";
			this.errorResult = false;
			this.comparisonFailed = false;
			this.livenessFailed = false;
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

	exitApplication(): void {
		window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
	}

	loginToPlatform(): void {
		if (this.fetchingToken || !this.redirectUrl) return;

		window.location.href = `${this.redirectUrl}`;
	}

	tryAgain(step: 'document' | 'biometric'): void {
		this._smartEnrollService.skipToStep(step);
	}
}
