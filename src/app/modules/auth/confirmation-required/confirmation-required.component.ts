import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { KYCService } from "../kyc.service";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { environment } from "environments/environment";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "../project";
import { CommonModule, NgIf } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslocoModule } from "@ngneat/transloco";
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { FuseAlertComponent } from "@fuse/components/alert";
@Component({
	selector: "auth-confirmation-required",
	templateUrl: "./confirmation-required.component.html",
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		FlexLayoutModule,
		RouterLink,
		NgIf,
		FuseAlertComponent,
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatIconModule,
		MatCheckboxModule,
		MatProgressSpinnerModule,
		TranslocoModule,
		CommonModule,
		MatSelectModule,
	],
})
export class AuthConfirmationRequiredComponent implements OnInit, OnDestroy {
	@ViewChild("otpNgForm") otpNgForm: NgForm;
	isVerifikProject: Boolean;
	onboardingSettings: any;
	appRegistration: any;
	project: any;
	projectFlow: any;
	phoneGateway: string;
	emailGateway: string;
	emailValidation: any;
	phoneValidation: any;
	otpForm: UntypedFormGroup;

	/**
	 * Constructor
	 */
	constructor(
		private _KYCService: KYCService,
		private _splashScreenService: FuseSplashScreenService,
		private _activatedRoute: ActivatedRoute,
		private _changeDetectorRef: ChangeDetectorRef,
		private _router: Router,
		private _formBuilder: UntypedFormBuilder
	) {
		this._splashScreenService.show();

		localStorage.removeItem("accessToken");
	}

	ngOnInit(): void {
		this._initForm();

		this._activatedRoute.params.subscribe((params) => {
			this.isVerifikProject = Boolean(params.id === environment.verifikProject);

			const token = this._router.url.split("?token=")[1];

			this._requestAppRegistration(params.id, token);
		});
	}

	_requestAppRegistration(id: string, token: string): void {
		localStorage.setItem("accessToken", token);

		this._KYCService
			.getAppRegistration(id, {
				populates: ["project", "projectFlow"],
			})
			.subscribe({
				next: (response) => {
					console.log({ response });

					this.appRegistration = response.data;

					this.project = new ProjectModel(this.appRegistration.project);

					this.projectFlow = new ProjectFlowModel(this.appRegistration.projectFlow);

					console.log({ appRegistration: this.appRegistration, project: this.project, flow: this.projectFlow });
				},
				error: () => {},
				complete: () => {
					this._splashScreenService.hide();
				},
			});
	}

	_initForm(): void {
		this.otpForm = this._formBuilder.group({ otp: ["", [Validators.required, Validators.min(5), Validators.max(6)]] });
	}

	ngOnDestroy(): void {}
}
