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
	ngOnInit(): void {}

	_initAppRegistrationData(): void {
		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		this.navigation = this._KYCService.getNavigation();
	}

	ngOnDestroy(): void {}

	completeAndRedirect(): void {
		if (this.loading) return;

		this.loading = true;

		this._splashScreenService.show();

		let _response = {
			token: null,
		};

		// sync
		this._KYCService.syncAppRegistration("liveness").subscribe({
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
