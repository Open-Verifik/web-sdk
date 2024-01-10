import { CommonModule, NgIf } from "@angular/common";
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
import { TranslocoModule } from "@ngneat/transloco";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatSelectModule } from "@angular/material/select";

@Component({
	selector: "auth-sign-up",
	templateUrl: "./sign-up.component.html",
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
export class AuthSignUpComponent implements OnInit, OnDestroy {
	@ViewChild("signUpNgForm") signUpNgForm: NgForm;

	alert: { type: FuseAlertType; message: string } = {
		type: "success",
		message: "",
	};
	signUpForm: UntypedFormGroup;
	showAlert: boolean = false;
	countries: Array<any>;
	roles: Array<any>;
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	project: Project;
	projectFlow: ProjectFlow;
	loginProjectFlow: ProjectFlow;
	showFaceLivenessRecommendation: Boolean;
	isVerifikProject: Boolean;
	demoData: any;
	sendingOTP: Boolean;
	OnboardingSignUpForm: any;
	fields: any;

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

		this.project = null;

		this.roles = [
			{
				label: "signup.roles.founder",
				code: "founder",
			},
			{
				label: "signup.roles.high_management",
				code: "highManagement",
			},
			{
				label: "signup.roles.manager",
				code: "manager",
			},
			{
				label: "signup.roles.developer",
				code: "developer",
			},
			{
				label: "signup.roles.compliance",
				code: "compliance",
			},
			{
				label: "signup.roles.marketing",
				code: "marketing",
			},
			{
				label: "signup.roles.ciso",
				code: "ciso",
			},
		];

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
			this.isVerifikProject = Boolean(params.id === environment.verifikProject);

			this.requestProject(params.id);
		});
	}

	requestProject(projectId: string): void {
		this._passwordlessService.requestProject(projectId, "onboarding").subscribe({
			next: (v) => {
				this._onProjectNext(v.data);
			},
			error: (e) => {
				console.info({ errorHERE: e });
				if (e.error.code === "InternalServer") {
					alert("something went wrong, try  again");
				}

				this._splashScreenService.hide();
			},
			complete: () => {
				this._onProjectComplete();
			},
		});
	}

	_onProjectNext(data: any): void {
		this.project = new ProjectModel({ ...data, type: "onboarding" });

		this.projectFlow = this.project.currentProjectFlow;

		this.OnboardingSignUpForm = this.projectFlow.onboardingSettings.signUpForm;

		for (let index = 0; index < data.projectFlows.length; index++) {
			const projectFlow = data.projectFlows[index];

			if (projectFlow.type === "login") this.loginProjectFlow = new ProjectFlowModel(projectFlow);
		}
	}

	_onProjectComplete(): void {
		this._splashScreenService.hide();

		try {
			this.initForm();
		} catch (exception) {
			console.error({ exception });
		}

		this._changeDetectorRef.markForCheck();
	}

	generateRandomPhoneNumber = () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");

	initForm(): void {
		const randomIndex = Math.floor(Math.random() * this._demoService.sampleLastNames.length);

		const randomNumber = Math.floor(Math.random() * 1234567);

		const demoData = {
			fullName: environment.production
				? ""
				: `${this._demoService.sampleFirstNames[randomIndex]} ${this._demoService.sampleLastNames[randomIndex]}`,
			firstName: environment.production ? "" : this._demoService.sampleFirstNames[randomIndex],
			lastName: environment.production ? "" : this._demoService.sampleLastNames[randomIndex],
			email: environment.production ? "" : `${this._demoService.sampleFirstNames[randomIndex].toLowerCase()}_${randomNumber}@verifik.co`,
			phone: environment.production ? "" : this.generateRandomPhoneNumber(),
			countryCode: environment.production ? "" : "+1",
			company: environment.production ? "" : `company ${randomNumber}`,
			role: environment.production ? "" : this.roles[3].code,
			agreements: !Boolean(environment.production),
		};

		this.fields = {};

		if (this.OnboardingSignUpForm.fullName && !this.OnboardingSignUpForm.firstName) {
			this.fields["fullName"] = [demoData.fullName, Validators.required];
		}

		if (this.OnboardingSignUpForm.firstName) {
			this.fields["firstName"] = [demoData.firstName, Validators.required];

			this.fields["lastName"] = [demoData.lastName, Validators.required];
		}

		if (this.OnboardingSignUpForm.email) {
			this.fields["email"] = [demoData.email, Validators.required];

			if (environment.production) {
				this.fields["email"].push(Validators.email);
			}
		}

		if (this.OnboardingSignUpForm.phone) {
			this.fields["countryCode"] = [demoData.countryCode, Validators.required];

			this.fields["phone"] = [demoData.phone, Validators.required];

			if (environment.production) {
				this.fields["phone"].push(Validators.min(8), Validators.max(10));
			}
		}

		if (this.OnboardingSignUpForm.showTermsAndConditions || this.OnboardingSignUpForm.showPrivacyNotice) {
			this.fields["agreements"] = ["", Validators.requiredTrue];
		}

		if (Array.isArray(this.OnboardingSignUpForm.extraFields)) {
			for (const field of this.OnboardingSignUpForm.extraFields) {
				this.fields[field] = [demoData[field] || "", Validators.required];
			}
		}

		// Create the form
		this.signUpForm = this._formBuilder.group(this.fields);
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Public methods
	// -----------------------------------------------------------------------------------------------------

	/**
	 * Sign up
	 */
	signUp(): void {
		if (this.signUpForm.invalid) {
			return;
		}

		// Disable the form
		this.signUpForm.disable();

		// Hide the alert
		this.showAlert = false;

		localStorage.setItem("signUpData", JSON.stringify(this.signUpForm.value));

		let appRegistration = null;

		this._passwordlessService
			.createAppRegistration({
				project: this.project._id,
				projectFlow: this.projectFlow._id,
				...this.signUpForm.value,
			})
			.subscribe({
				next: (v) => {
					appRegistration = v?.data?.appRegistration;

					appRegistration.token = v?.data?.token;
				},
				error: (e) => {
					console.info({ errorHERE: e });

					this.alert = {
						type: "error",
						message: "Something went wrong, please try again.",
					};

					this.showAlert = true;

					this._splashScreenService.hide();
				},
				complete: () => {
					this.signUpForm.enable();

					this.signUpNgForm.resetForm();

					if (!this.showAlert) this._router.navigateByUrl(`/confirmation-required/${appRegistration._id}?token=${appRegistration.token}`);
				},
			});
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
	}
}
