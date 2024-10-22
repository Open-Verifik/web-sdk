import { TranslocoModule } from "@ngneat/transloco";
import { Subject } from "rxjs";

import { CommonModule, NgIf, isPlatformBrowser } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
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

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { CountriesService } from "app/modules/demo/countries.service";
import { DemoService } from "app/modules/demo/demo.service";
import { environment } from "environments/environment";

import { PasswordlessService } from "../passwordless.service";
import { AppRegistration, Project, ProjectFlow, ProjectModel } from "../project";
import { AuthSignUpCreateFormComponent } from "../sign-up-create-form/sign-up-create-form.component";
import { AuthSignUpVerificationComponent } from "../sign-up-verification/sign-up-verification.component";
import { KYCService } from "../kyc.service";
import { AuthSignUpVerificationCompleteComponent } from "../sign-up-verification-complete/sign-up-verification-complete.component";
import { SmartEnrollAppComponent } from "../smart-enroll-app/smart-enroll-app.component";

@Component({
	selector: "auth-sign-up",
	templateUrl: "./sign-up.component.html",
	styleUrls: ["../sign-in/sign-in.scss", "sign-up.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		AuthSignUpCreateFormComponent,
		AuthSignUpVerificationComponent,
		AuthSignUpVerificationCompleteComponent,
		SmartEnrollAppComponent,
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		FuseAlertComponent,
		LanguagesComponent,
		MatButtonModule,
		MatCheckboxModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatProgressSpinnerModule,
		NgIf,
		ReactiveFormsModule,
		RouterLink,
		TranslocoModule,
	],
})
export class AuthSignUpComponent implements OnInit, OnDestroy {
	private _unsubscribeAll: Subject<any> = new Subject<any>();

	alert: { type: FuseAlertType; message: string } = {
		type: "success",
		message: "",
	};

	appRegistration: AppRegistration;
	currentStep: string = 'create';
	currentStepIndex: number = 0;
	deviceDetails: any;
	isVerifikProject: Boolean;
	language: string;
	location: any;
	locationError: any;
	project: Project;
	projectFlow: ProjectFlow;
	sendingOTP: Boolean;
	showKYCApp: boolean = false;
	steps: Array<string> = ['create'];
	token: string;
	verificationComplete: boolean = false;

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

	/**
	 * Constructor
	 */
	constructor(
		private _activatedRoute: ActivatedRoute,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countries: CountriesService,
		private _demoService: DemoService,
		private _KYCService: KYCService,
		private _passwordlessService: PasswordlessService,
		private _router: Router,
		private _splashScreenService: FuseSplashScreenService,
		@Inject(PLATFORM_ID) private platformId: Object
	) {
		this._setToken();
		this._setLanguage();
		this._splashScreenService.show();

		this.deviceDetails = this._demoService.getDeviceDetails();
		this.location = null;
		this.locationError = null;
		this.project = null;
		this.projectFlow = null;

		this.sendingOTP = false;
	}

	/**
	 * On init
	 */
	ngOnInit(): void {
		this._activatedRoute.params.subscribe((params) => {
			this.isVerifikProject = Boolean(params.id === environment.verifikProject || params.id === environment.sandboxProject);

			this._requestProject(params.id);
		});

		this._activatedRoute.queryParams.subscribe((params) => {
			this._setToken(params?.token);

			if (!params?.token) return this._setStep('create');

			this._requestAppRegistration();
			this._setStep('');
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

				this._splashScreenService.hide();
			},
			complete: () => {
				this._splashScreenService.hide();
			},
		});
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
		this._setToken();
	}

	private _checkVerification(): void {
		if (
			!this.appRegistration?.emailValidation?.status ||
			!this.appRegistration?.phoneValidation?.status ||
			!this.projectFlow
		) {
			this.verificationComplete = false;

			return;
		}

		const {
			emailValidation: { status: emailStatus },
			phoneValidation: { status: phoneStatus },
		} = this.appRegistration;

		const {
			onboardingSettings: {
				signUpForm: { email, emailGateway, phone, phoneGateway }
			}
		} = this.projectFlow;

		const emailValidated = email && emailGateway !== 'none' && emailStatus === 'validated';
		const phoneValidated = phone && phoneGateway !== 'none' && phoneStatus === 'validated';

		if (emailValidated && phoneValidated) this.verificationComplete = true;
	}

	private _onProjectNext(data: any): void {
		this.project = new ProjectModel({ ...data, type: "onboarding" });
		this.projectFlow = this.project.currentProjectFlow;

		this._setSteps();

		this._splashScreenService.hide();
	}

	private _onProjectComplete(): void {
		this._splashScreenService.hide();
		this._changeDetectorRef.markForCheck();

		if (this.token) this._requestAppRegistration();
	}

	private _requestAppRegistration(): void {
		if (!this.token) return;

		this._KYCService
			.getAppRegistration({
				populates: ["project", "projectFlow", "emailValidation", "phoneValidation", "informationValidation"],
			})
			.subscribe({
				next: (response) => {
					this.appRegistration = response.data;
					this._checkVerification();
				},
				error: () => {
                    this._router.navigate(
                        ['/sign-up', this.project._id],
                        { replaceUrl: true }
                    );
				},
			});
	}

	private _requestProject(projectId: string): void {
		this._passwordlessService.requestProject(projectId, "onboarding").subscribe({
			next: (v) => this._onProjectNext(v.data),
			error: (e) => {
				if (e.error.code === "InternalServer") {
					alert("something went wrong, try  again");
				}

				this._splashScreenService.hide();
			},
			complete: () => this._onProjectComplete(),
		});
	}

	private _setLanguage() {
		if (!isPlatformBrowser(this.platformId)) {
			this.language = "en";
		}

		// Get the browser's language setting
		const browserLang = navigator.language.split("-")[0]; // Get the primary language subtag
		// Check if the browser's language is one of the specified options, otherwise default to 'en'
		this.language = this.flagCodes[browserLang] ? browserLang : "en";

		localStorage.setItem("currentLanguage", this.language);
	}

	private _setStep(step: string): void {
		this.currentStep = step;

		const index = this.steps.indexOf(this.currentStep);

		if (index > -1) {
			this.currentStepIndex = index;
		}
	}

	private _setSteps(): void {
		if (!this.projectFlow) return;

		this.steps = ['create'];

		const { email, emailGateway, phone, phoneGateway } = this.projectFlow.onboardingSettings.signUpForm;

		if (email && emailGateway !== 'none') this.steps.push('verify_email')
		if (phone && phoneGateway !== 'none') this.steps.push('verify_phone');

		this.currentStepIndex = this.steps.indexOf(this.currentStep);
	}

	private _setToken(token?: string): void {
		if (!token) return this._unsetToken();

		this.token = token;
		localStorage.setItem("accessToken", token);
	}

	private _unsetToken(): void {
		this.token = null;
		localStorage.removeItem("accessToken");
	}

	enabledLocation(): void {
		window.location.reload();
	}

	onStepChange(step: string): void {
		this._setStep(step);
	}

	onKYCStepChange(show: boolean): void {
		this.showKYCApp = show;
	}

	showCountryNotAllowed(): boolean {
		return Boolean(!this.locationError && !this.project?.allowedCountries.includes(this.location?.country));
	}

	showLocationError(): boolean {
		return Boolean(this.locationError && !this.showCountryNotAllowed());
	}

	showMainContainer(): boolean {
		return Boolean(
			!this.locationError && this.projectFlow?._id && this.project?._id && this.project?.allowedCountries.includes(this.location?.country)
		);
	}

	showNoProjectError(): boolean {
		return Boolean(!this.projectFlow?._id || !this.project?._id);
	}
}
