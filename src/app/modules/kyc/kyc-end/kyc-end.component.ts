import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule } from "@ngneat/transloco";
import { KYCService } from "app/modules/auth/kyc.service";
import { Project, ProjectFlow } from "app/modules/auth/project";
import { environment } from "environments/environment";

@Component({
	selector: "kyc-end",
	templateUrl: "./kyc-end.component.html",
	styleUrls: ["./kyc-end.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, CommonModule, MatDialogModule, TranslocoModule, MatButtonModule, MatProgressBarModule, MatProgressSpinnerModule],
})
export class KycEndComponent implements OnInit, OnDestroy {
	appRegistration: any;
	project: Project;
	navigation: any;
	appLoginToken: string;
	showError: Boolean;
	errorContent: any;
	projectFlow: ProjectFlow;
	loading: boolean;
	face: any;
	finalStatus: string;

	constructor(private _KYCService: KYCService, private _splashScreenService: FuseSplashScreenService) {
		this.showError = false;

		this.errorContent = {
			message: "",
		};

		this._initAppRegistrationData();
	}

	/**
	 * On init
	 */
	ngOnInit(): void {
		this._requestIdentityImages();
	}

	_initAppRegistrationData(): void {
		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		this.navigation = this._KYCService.getNavigation();

		const compareFaceVerification = this.appRegistration.compareFaceVerification;

		const livenessScore = this.appRegistration.biometricValidation.livenessScore || 0;

		if (compareFaceVerification && compareFaceVerification.result.score < this.projectFlow.onboardingSettings.document.compareMinScore) {
			this.appRegistration.status = "FAILED";
		}

		if (livenessScore && livenessScore < this.projectFlow.onboardingSettings.liveness.livenessMinScore) {
			this.appRegistration.status = "FAILED";
		}

		console.log({
			appregistration: this.appRegistration,
			projectFlow: this.projectFlow,
			livenessScore,
			status: this.appRegistration.status,
		});
	}

	_requestIdentityImages(): void {
		if (this.appRegistration.face?._id) {
			this.face = this.appRegistration.face;

			if (!this.face.base64.includes("data:image")) {
				this.face["base64"] = `data:image/jpeg;base64,${this.face.base64}`;
			}

			return;
		}

		this._KYCService.getIdentityImages({}).subscribe({
			next: (response) => {
				this._extractFaces(response.data);
			},
			error: (exception) => {},
			complete: () => {},
		});
	}

	_extractFaces(arrayOfImages): void {
		for (let index = 0; index < arrayOfImages.length; index++) {
			const identityImage = arrayOfImages[index];

			if (identityImage.category === "face" && this.appRegistration.face === identityImage._id) {
				this.face = identityImage;

				this.face["base64"] = `data:image/jpeg;base64,${identityImage.base64}`;
			}
		}
	}

	ngOnDestroy(): void {}

	completeAndRedirect(): void {
		if (this.loading) return;

		this.loading = true;

		let _response = {
			token: null,
		};

		this._splashScreenService.show();

		alert(`send this status -== ${this.appRegistration.status}`);

		this._KYCService.syncAppRegistration("end", this.appRegistration.status).subscribe({
			next: (response) => {
				_response = response.data;
			},
			error: (exception) => {
				console.error({ exception });

				this._splashScreenService.hide();
			},
			complete: () => {
				this._splashScreenService.hide();

				this.loading = false;
				// redirect now
				const redirectUrl = Boolean(environment.verifikProject === this.project._id)
					? `${environment.appUrl}/sign-in`
					: this.projectFlow.redirectUrl;

				window.location.href = `${redirectUrl}?type=onboarding&token=${_response.token}`;
			},
		});
	}
}
