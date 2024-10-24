import moment from "moment";
import { Subject } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { Router, RouterLink } from "@angular/router";

import { fuseAnimations } from "@fuse/animations";
import { FuseAlertComponent, FuseAlertType } from "@fuse/components/alert";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";

import { TranslocoModule } from "@ngneat/transloco";

import { DemoService } from "app/modules/demo/demo.service";
import { environment } from "environments/environment";

import { PasswordlessService } from "../passwordless.service";
import { AppRegistration, Project, ProjectFlow } from "../project";
import { CountriesService } from "app/modules/demo/countries.service";

declare let dataLayer: any; // Declare the dataLayer for pushing events to GTM.

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	selector: "auth-sign-up-create-form",
	standalone: true,
	styleUrls: ["../sign-in/sign-in.scss"],
	templateUrl: "./sign-up-create-form.component.html",
	imports: [
		CommonModule,
		FlexLayoutModule,
		FuseAlertComponent,
		MatButtonModule,
		MatCheckboxModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatProgressSpinnerModule,
		MatSelectModule,
		NgIf,
		ReactiveFormsModule,
		RouterLink,
		TranslocoModule,
	],
})
export class AuthSignUpCreateFormComponent implements OnDestroy, OnChanges {
	@ViewChild("signUpNgForm") signUpNgForm: NgForm;

    @Input("location") location: any;
    @Input("project") project: Project;
    @Input("projectFlow") projectFlow: ProjectFlow;

	private _unsubscribeAll: Subject<any> = new Subject<any>();

	alert: { type: FuseAlertType; message: string } = {
		type: "success",
		message: "",
	};

	appRegistration: AppRegistration;
	countries: Array<any>;
	demoData: any;
	fields: any;
	hasLogin: Boolean = false;
	language: string;
	loginProjectFlow: ProjectFlow;
	onboardingSignUpForm: any;
	roles: Array<any>;
	showAlert: boolean = false;
	signUpForm: UntypedFormGroup;
	token: string;

	/**
	 * Constructor
	 */
	constructor(
		private _countries: CountriesService,
		private _demoService: DemoService,
		private _formBuilder: UntypedFormBuilder,
		private _passwordlessService: PasswordlessService,
		private _router: Router,
		private _splashScreenService: FuseSplashScreenService,
	) {
		this.countries = this._countries.countryCodes;
        this.fields = {};

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

		this.demoData = this._demoService.getDemoData();
		this._demoService.cleanVariables();
	}

	ngOnDestroy(): void {
		localStorage.setItem("signUpData", JSON.stringify({}));

		this._unsubscribeAll.next(null);
	}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.project.currentValue) {
            const data = changes.project.currentValue;

			for (let index = 0; index < data.projectFlows.length; index++) {
				const projectFlow = data.projectFlows[index];
	
				if (projectFlow.status !== "active") continue;
				if (projectFlow.type === "login") this.hasLogin = true;
			}
    
            if (this.projectFlow.systemForm) {
                this._assignRoles(this.projectFlow.systemForm);
            }
    
            this.onboardingSignUpForm = this.projectFlow.onboardingSettings.signUpForm;

            try {
                this.initForm();
            } catch (exception) {
                console.error({ exception });
            }
        }
    }

	private _assignRoles(systemForm: ProjectFlow["systemForm"]): void {
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

	private _generateRandomPhoneNumber = () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");

	private _reEnableForm(): void {
		setTimeout(() => {
			this.showAlert = false;
			this.alert = null;

			this.signUpForm.enable();
			this.signUpNgForm.resetForm();
		}, 5000);
	}

	initForm(): void {
		const r1 = environment.production ? 0 : Math.floor(Math.random() * this._demoService.sampleLastNames.length - 1) || 0;
		const r2 = environment.production ? 0 : Math.floor(Math.random() * this._demoService.sampleFirstNames.length - 1) || 0;

		const randomNumber = Math.floor(Math.random() * 1234567);

		const demoData = {
			fullName: environment.production ? "" : `${this._demoService.sampleFirstNames[r2]} ${this._demoService.sampleLastNames[r1]}`,
			firstName: environment.production ? "" : this._demoService.sampleFirstNames[r2],
			lastName: environment.production ? "" : this._demoService.sampleLastNames[r1],
			email: environment.production ? "" : `${this._demoService.sampleFirstNames[r2].toLowerCase()}_${randomNumber}@verifik.co`,
			phone: environment.production ? "" : this._generateRandomPhoneNumber(),
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

	isFormDisabled(): boolean {
		return Boolean(this.signUpForm?.invalid || (this.signUpForm?.value.agreements !== undefined && !this.signUpForm?.value.agreements));
	}

	removeSpacesFromEmail() {
		const emailFormControl = this.signUpForm?.get("email");

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

	signUp(): void {
		if (!this.project || this.signUpForm.invalid) return null;

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
					this.appRegistration = v?.data?.appRegistration;
					this.appRegistration.token = v?.data?.token;
				},
				error: (exception) => {
					this.alert = {
						type: "error",
						message:
							exception.error?.message === "phone, email, projectFlow must be unique"
								? "errors.phone_or_email_is_not_unique"
								: `errors.${exception.error?.message}`,
					};

					this.showAlert = true;
					this._splashScreenService.hide();
					this._reEnableForm();
				},
				complete: () => {
					if (this.showAlert) this._reEnableForm();

                    this._router.navigate(
                        ['/sign-up', this.project._id],
                        {
                            queryParams: { token: this.appRegistration.token, step: 'verify' },
                            queryParamsHandling: 'merge',
                        }
                    );
				},
			});
	}
}