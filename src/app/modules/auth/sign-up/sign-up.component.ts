import { NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { FuseAlertComponent, FuseAlertType } from "@fuse/components/alert";
import { FuseSplashScreenService } from "@fuse/services/splash-screen/splash-screen.service";
import { AuthService } from "app/core/auth/auth.service";
import { CountriesService } from "app/modules/demo/countries.service";
import { DemoService } from "app/modules/demo/demo.service";
import { PasswordlessService } from "../passwordless.service";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "../project";
import { Subject } from "rxjs";
import { environment } from "environments/environment";

@Component({
	selector: "auth-sign-up",
	templateUrl: "./sign-up.component.html",
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
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
	],
})
export class AuthSignUpComponent implements OnInit, OnDestroy {
	@ViewChild("signUpNgForm") signUpNgForm: NgForm;

	alert: { type: FuseAlertType; message: string } = {
		type: "success",
		message: "",
	};
	signUpForm: UntypedFormGroup;
	showAlert: boolean = false;
	countries: Array<any>;
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	project: Project;
	projectFlow: ProjectFlow;
	loginProjectFlow: ProjectFlow;
	showFaceLivenessRecommendation: Boolean;
	isVerifikProject: Boolean;
	demoData: any;
	sendingOTP: Boolean;

	/**
	 * Constructor
	 */
	constructor(
		private _authService: AuthService,
		private _formBuilder: UntypedFormBuilder,
		private _router: Router,
		private _countries: CountriesService,
		private _splashScreenService: FuseSplashScreenService,
		private _activatedRoute: ActivatedRoute,
		private _demoService: DemoService,
		private _passwordlessService: PasswordlessService,
		private _changeDetectorRef: ChangeDetectorRef
	) {
		this.countries = this._countries.countryCodes;

		this._splashScreenService.show();

		this._demoService.cleanVariables();

		localStorage.removeItem("accessToken");

		this.demoData = this._demoService.getDemoData();

		this.sendingOTP = false;

		this.showFaceLivenessRecommendation = false;
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Lifecycle hooks
	// -----------------------------------------------------------------------------------------------------

	/**
	 * On init
	 */
	ngOnInit(): void {
		this._activatedRoute.params.subscribe((params) => {
			this.requestProject(params.id);

			this.isVerifikProject = Boolean(params.id === environment.verifikProject);
		});
	}

	requestProject(projectId: string): void {
		this._passwordlessService.requestProject(projectId, "onboarding").subscribe({
			next: (v) => {
				this.project = new ProjectModel({ ...v.data, type: "onboarding" });

				this.projectFlow = this.project.currentProjectFlow;

				for (let index = 0; index < v.data.projectFlows.length; index++) {
					const projectFlow = v.data.projectFlows[index];

					if (projectFlow.type === "login") this.loginProjectFlow = new ProjectFlowModel(projectFlow);
				}

				console.log({ project: this.project, flow: this.projectFlow });
			},
			error: (e) => {
				console.info({ errorHERE: e });
				if (e.error.code === "InternalServer") {
					alert("something went wrong, try  again");
				}

				this._splashScreenService.hide();
			},
			complete: () => {
				this.initForm();

				this._changeDetectorRef.markForCheck();

				this._splashScreenService.hide();
			},
		});
	}

	initForm(): void {
		// Create the form
		this.signUpForm = this._formBuilder.group({
			name: ["", Validators.required],
			email: ["", [Validators.required, Validators.email]],
			password: ["", Validators.required],
			company: [""],
			agreements: ["", Validators.requiredTrue],
		});
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Public methods
	// -----------------------------------------------------------------------------------------------------

	/**
	 * Sign up
	 */
	signUp(): void {
		// Do nothing if the form is invalid
		if (this.signUpForm.invalid) {
			return;
		}

		// Disable the form
		this.signUpForm.disable();

		// Hide the alert
		this.showAlert = false;

		// Sign up
		this._authService.signUp(this.signUpForm.value).subscribe(
			(response) => {
				// Navigate to the confirmation required page
				this._router.navigateByUrl("/confirmation-required");
			},
			(response) => {
				// Re-enable the form
				this.signUpForm.enable();

				// Reset the form
				this.signUpNgForm.resetForm();

				// Set the alert
				this.alert = {
					type: "error",
					message: "Something went wrong, please try again.",
				};

				// Show the alert
				this.showAlert = true;
			}
		);
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
	}
}
