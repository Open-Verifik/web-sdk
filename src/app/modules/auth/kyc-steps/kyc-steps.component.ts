import { NgIf } from "@angular/common";
import { Component, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { FuseAlertComponent, FuseAlertType } from "@fuse/components/alert";

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { KYCService } from "../kyc.service";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "../project";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { DemoFooterComponent } from "app/modules/demo/demo-footer/demo-footer.component";
import { KycInstructionsComponent } from "./kyc-instructions/kyc-instructions.component";
import { KycLivenessComponent } from "app/modules/kyc/kyc-liveness/kyc-liveness.component";
import { KycEndComponent } from "app/modules/kyc/kyc-end/kyc-end.component";

@Component({
	selector: "auth-forgot-password",
	templateUrl: "./kyc-steps.component.html",
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		NgIf,
		FuseAlertComponent,
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		RouterLink,
		LanguagesComponent,
		FlexLayoutModule,
		DemoFooterComponent,
		KycInstructionsComponent,
		KycLivenessComponent,
		KycEndComponent,
	],
	styleUrls: ["./kyc-steps.component.scss"],
})
export class KYCStepsComponent implements OnInit {
	alert: { type: FuseAlertType; message: string } = {
		type: "success",
		message: "",
	};
	kycData: any;
	showAlert: boolean = false;
	appRegistration: any;
	project: Project;
	projectFlow: ProjectFlow;
	errorContent: any;
	requirementsLoaded: boolean;
	navigation: any;

	/**
	 * Constructor
	 */
	constructor(
		private _router: Router,
		private _KYCService: KYCService,
		private _splashScreenService: FuseSplashScreenService,
		private activatedRoute: ActivatedRoute
	) {
		this._splashScreenService.show();

		localStorage.removeItem("accessToken");
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Lifecycle hooks
	// -----------------------------------------------------------------------------------------------------

	/**
	 * On init
	 */
	ngOnInit(): void {
		this.activatedRoute.queryParams.subscribe((params) => {
			const token = params["token"];

			if (!token) return;

			localStorage.setItem("accessToken", token);
			// Use the token as needed

			this._requestAppRegistration();
		});
	}

	_requestAppRegistration(): void {
		this._KYCService
			.getAppRegistration({
				populates: ["project", "projectFlow", "emailValidation", "phoneValidation", "biometricValidation", "person"],
			})
			.subscribe({
				next: (response) => {
					this.appRegistration = response.data;

					this.project = new ProjectModel(this.appRegistration.project);

					this.projectFlow = new ProjectFlowModel(this.appRegistration.projectFlow);
				},
				error: (exception) => {
					this.errorContent = exception.error;

					this._splashScreenService.hide();
				},
				complete: () => {
					this._splashScreenService.hide();

					this.navigation = this._KYCService.initNavigation();

					this.requirementsLoaded = true;
				},
			});
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Public methods
	// -----------------------------------------------------------------------------------------------------

	backToStepOne(): void {}
}
