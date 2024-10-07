import { CommonModule, NgIf, isPlatformBrowser } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation, PLATFORM_ID, Inject } from "@angular/core";
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

import { CountriesService } from "app/modules/demo/countries.service";
import { DemoService } from "app/modules/demo/demo.service";
import { PasswordlessService } from "../passwordless.service";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "../project";
import { Subject } from "rxjs";
import { environment } from "environments/environment";
import { TranslocoModule } from "@ngneat/transloco";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatSelectModule } from "@angular/material/select";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import moment from "moment";

declare var dataLayer: any; // Declare the dataLayer for pushing events to GTM.

@Component({
	selector: "auth-sign-up",
	templateUrl: "./sign-up.component.html",
	styleUrls: ["../sign-in/sign-in.scss", "sign-up.component.scss"],
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
		LanguagesComponent,
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
	onboardingSignUpForm: any;
	fields: any;
	language: string;
	flagCodes = {
		en: "us",
		es: "es",
		br: "br",
		fr: "fr",
		it: "it",
		ru: "ru",
		kr: "kr",
		in: "in",
		cn: "cn",
		ph: "ph",
	};
	deviceDetails: any;
	location: any;
	locationError: any;
	currentPage: number;
	totalPages: number;
	pages: Array<number>;

	/**
	 * Constructor
	 */
	constructor(
		private _formBuilder: UntypedFormBuilder,
		private _router: Router,
		private _countries: CountriesService,
		private _splashScreenService: FuseSplashScreenService,
		private _activatedRoute: ActivatedRoute,
		private _demoService: DemoService,
		private _passwordlessService: PasswordlessService,
		private _changeDetectorRef: ChangeDetectorRef,
		@Inject(PLATFORM_ID) private platformId: Object
	) {
		this.setLanguage();

		this.countries = this._countries.countryCodes;
		this.currentPage = 1;
		this.location = null;
		this.locationError = null;
		this.pages = [1, 2, 3];
		this.project = null;
		this.totalPages = 3;

		this.roles = [
			{
				label: "signup.roles.founder",
				code: "founder",
			},
			{
				label: "signup.roles.high_management",
				code: "high_management",
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

		this.demoData = this._demoService.getDemoData();

		this._demoService.cleanVariables();

		this.deviceDetails = this._demoService.getDeviceDetails();

		localStorage.removeItem("accessToken");

		this.sendingOTP = false;

		this.showFaceLivenessRecommendation = false;
	}

	setLanguage() {
		if (!isPlatformBrowser(this.platformId)) {
			this.language = "en";
		}

		// Get the browser's language setting
		const browserLang = navigator.language.split("-")[0]; // Get the primary language subtag
		// Check if the browser's language is one of the specified options, otherwise default to 'en'
		this.language = this.flagCodes[browserLang] ? browserLang : "en";

		localStorage.setItem("currentLanguage", this.language);
	}

	/**
	 * On init
	 */
	ngOnInit(): void {
		this._activatedRoute.params.subscribe((params) => {
			this.isVerifikProject = Boolean(params.id === environment.verifikProject || params.id === environment.sandboxProject);

			this.requestProject(params.id);
		});

		this._demoService.geoLocation$.subscribe({
			next: async (response) => {
				if (response.errorMessage) {
					this.locationError = response;

					return;
				}

				if (!response || this.location) return;

				this.location = await this._demoService.extractLocationFromLatLng(response.lat, response.lng);

				this.location.os = this.deviceDetails?.platform;

				this.location.type = "browser";

				this.location.countryCode = this._countries.findCountryCode(this.location.country);
			},
			error: (exception) => {
				console.log({ exception });
			},
			complete: () => {},
		});
	}

	showLocationError(): boolean {
		return Boolean(this.locationError && !this.showCountriNotAllowed());
	}

	showNoProjectError(): boolean {
		return Boolean(!this.projectFlow?._id || !this.project?._id);
	}

	showMainContainer(): boolean {
		return Boolean(
			!this.locationError && this.projectFlow?._id && this.project?._id && this.project?.allowedCountries.includes(this.location?.country)
		);
	}

	showCountriNotAllowed(): boolean {
		return Boolean(!this.locationError && !this.project?.allowedCountries.includes(this.location?.country));
	}

	enabledIt(): void {
		window.location.reload();
	}

	removeSpacesFromEmail() {
		const emailFormControl = this.signUpForm.get("email");

		if (emailFormControl.value) {
			let cleanedEmail = emailFormControl.value.replace(/\s/g, "");

			if (cleanedEmail.includes("@") && cleanedEmail.indexOf("@") !== cleanedEmail.lastIndexOf("@")) {
				cleanedEmail = cleanedEmail.replace(/@/g, "");
			}
			emailFormControl.patchValue(cleanedEmail);
		}
	}

	removeSpacesFromPhone() {
		const phoneFormControl = this.signUpForm.get("phone");

		if (phoneFormControl.value) {
			const cleanedPhone = phoneFormControl.value.replace(/\s/g, "").replace(/\D/g, "");
			phoneFormControl.patchValue(cleanedPhone);
		}
	}

	requestProject(projectId: string): void {
		this._passwordlessService.requestProject(projectId, "onboarding").subscribe({
			next: (v) => {
				this._onProjectNext(v.data);
			},
			error: (e) => {
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

		if (this.projectFlow.systemForm) {
			this._assignRoles(this.projectFlow.systemForm);
		}

		this.onboardingSignUpForm = this.projectFlow.onboardingSettings.signUpForm;

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
		const r1 = environment.production ? 0 : Math.floor(Math.random() * this._demoService.sampleLastNames.length - 1) || 0;

		const r2 = environment.production ? 0 : Math.floor(Math.random() * this._demoService.sampleFirstNames.length - 1) || 0;

		const randomNumber = Math.floor(Math.random() * 1234567);

		const demoData = {
			fullName: environment.production ? "" : `${this._demoService.sampleFirstNames[r2]} ${this._demoService.sampleLastNames[r1]}`,
			firstName: environment.production ? "" : this._demoService.sampleFirstNames[r2],
			lastName: environment.production ? "" : this._demoService.sampleLastNames[r1],
			email: environment.production ? "" : `${this._demoService.sampleFirstNames[r2].toLowerCase()}_${randomNumber}@verifik.co`,

			phone: environment.production ? "" : this.generateRandomPhoneNumber(),
			countryCode: environment.production ? "+1" : "+1",
			company: environment.production ? "" : `company ${randomNumber}`,
			role: environment.production ? this.roles[1].code : this.roles[3].code,
			agreements: !Boolean(environment.production),
		};

		this.fields = {};

		if (this.onboardingSignUpForm && this.onboardingSignUpForm?.fullName && !this.onboardingSignUpForm?.firstName) {
			this.fields["fullName"] = [
				demoData.fullName,
				[Validators.required, Validators.maxLength(50), Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]+$")],
			];
		}

		if (this.onboardingSignUpForm && this.onboardingSignUpForm?.firstName) {
			this.fields["firstName"] = [
				demoData.firstName,
				[Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]+$")],
			];

			this.fields["lastName"] = [
				demoData.lastName,
				[Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]+$")],
			];
		}

		if (this.onboardingSignUpForm && this.onboardingSignUpForm?.email) {
			this.fields["email"] = [demoData.email, [Validators.email, Validators.required]];
		}

		if (this.onboardingSignUpForm && this.onboardingSignUpForm?.phone) {
			this.fields["countryCode"] = [this.location?.countryCode || demoData.countryCode, Validators.required];

			this.fields["phone"] = [demoData.phone, [Validators.required]];
		}

		if (this.onboardingSignUpForm && (this.onboardingSignUpForm?.showTermsAndConditions || this.onboardingSignUpForm?.showPrivacyNotice)) {
			this.fields["agreements"] = ["", Validators.requiredTrue];
		}

		if (this.onboardingSignUpForm && Array.isArray(this.onboardingSignUpForm?.extraFields)) {
			for (const field of this.onboardingSignUpForm?.extraFields) {
				this.fields[field] = [demoData[field] || "", Validators.required];
			}
		}

		// Create the form
		this.signUpForm = this._formBuilder.group(this.fields);
	}

	_assignRoles(systemForm): void {
		let roleField = null;

		for (let index = 0; index < systemForm.formFields.length; index++) {
			const formField = systemForm.formFields[index];

			if (formField.label === "role") {
				roleField = formField;

				break;
			}
		}

		if (!roleField) return;

		this.roles.length = 0;

		for (let index = 0; index < roleField.options.length; index++) {
			const option = roleField.options[index];

			this.roles.push({
				label: `signup.roles.${option}`,
				code: option,
			});
		}
	}

	// -----------------------------------------------------------------------------------------------------
	// @ Public methods
	// -----------------------------------------------------------------------------------------------------

	/**
	 * Sign up
	 */
	signUp(): void {
		if (this.signUpForm.invalid) return null;

		// Push the event to the dataLayer
		dataLayer.push({
			event: "clickEvent",
			clickId: `form_${this.project._id}`,
			eventId: moment().format("HH:mm:ss"), // You can use this to identify different clicks if necessary.
		});

		// Disable the for
		this.signUpForm.disable();

		// Hide the alert
		this.showAlert = false;

		localStorage.setItem("signUpData", JSON.stringify(this.signUpForm.value));

		let appRegistration = null;

		this._passwordlessService
			.createAppRegistration({
				project: this.project._id,
				projectFlow: this.projectFlow._id,
				language: this.language,
				location: this.location,
				...this.signUpForm.value,
			})
			.subscribe({
				next: (v) => {
					appRegistration = v?.data?.appRegistration;

					appRegistration.token = v?.data?.token;
				},
				error: (exception) => {
					this.alert = {
						type: "error",
						message:
							exception.error.message === "phone, email, projectFlow must be unique"
								? "errors.phone_or_email_is_not_unique"
								: `errors.${exception.error.message}`,
					};

					this.showAlert = true;

					this._splashScreenService.hide();

					this._reEnableForm();
				},
				complete: () => {
					if (!this.showAlert) this._router.navigateByUrl(`/confirmation-required/${appRegistration._id}?token=${appRegistration.token}`);

					this._reEnableForm();
				},
			});
	}

	_reEnableForm(): void {
		setTimeout(() => {
			this.showAlert = false;

			this.alert = null;

			this.signUpForm.enable();

			this.signUpNgForm.resetForm();
		}, 5000); // hide after 5 seconds
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
	}

	isFormDisabled(): boolean {
		return Boolean(this.signUpForm.invalid || (this.signUpForm.value.agreements !== undefined && !this.signUpForm.value.agreements));
	}
}
