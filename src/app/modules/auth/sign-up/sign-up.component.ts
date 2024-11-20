import { TranslocoModule } from "@ngneat/transloco";
import { combineLatest, map, Subject } from "rxjs";

import { CommonModule, NgIf, isPlatformBrowser } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, Router } from "@angular/router";

import { fuseAnimations } from "@fuse/animations";
import { FuseSplashScreenService } from "@fuse/services/splash-screen/splash-screen.service";

import { AppRegistration, Project, ProjectFlow, ProjectModel } from "../project";

import { environment } from "environments/environment";

import { CountriesService } from "app/modules/demo/countries.service";
import { DemoService } from "app/modules/demo/demo.service";
import { KYCService } from "../kyc.service";
import { PasswordlessService } from "../passwordless.service";
import { EnrollDocumentMethod, EnrollStep, SmartEnrollService } from "../smart-enroll/smart-enroll.service";

import { SmartEnrollComponent } from "../smart-enroll/smart-enroll.component";
import { AuthSignUpCreateFormComponent } from "./sign-up-create-form/sign-up-create-form.component";
import { AuthSignUpVerificationCompleteComponent } from "./sign-up-verification-complete/sign-up-verification-complete.component";
import { AuthSignUpVerificationComponent } from "./sign-up-verification/sign-up-verification.component";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";

@Component({
	selector: "auth-sign-up",
	templateUrl: "./sign-up.component.html",
	styleUrls: ["../sign-in/sign-in.scss", "sign-up.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		AuthSignUpCreateFormComponent,
		AuthSignUpVerificationCompleteComponent,
		AuthSignUpVerificationComponent,
		CommonModule,
		FlexLayoutModule,
		LanguagesComponent,
		MatButtonModule,
		NgIf,
		SmartEnrollComponent,
		TranslocoModule,
	],
})
export class AuthSignUpComponent implements OnInit, OnDestroy {
	private _unsubscribeAll: Subject<any> = new Subject<any>();

	appRegistration: AppRegistration;
	currentStep: string = "create";
	currentStepIndex: number = 0;
	deviceDetails: any;
	isVerifikProject: Boolean;
	language: string;
	location: any;
	locationError: any;
	project: Project;
	projectFlow: ProjectFlow;
	enrollStep: EnrollStep;
	sendingOTP: Boolean;
	showKYCApp: boolean = false;
	steps: Array<string> = ["create"];
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
		private _smartEnrollService: SmartEnrollService,
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
		this._splashScreenService.show();

		combineLatest([this._activatedRoute.params, this._activatedRoute.queryParams])
			.pipe(map(results => ({id: results[0].id, token: results[1].token})))
			.subscribe(results => {
				this._setToken(results?.token);

				if (this.projectFlow) {
					this._requestAppRegistration();
				} else {
					this.isVerifikProject = Boolean(results.id === environment.verifikProject || results.id === environment.sandboxProject);
					this._requestProject(results.id);
				}
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
		});
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
		this._setToken();
	}

	private _checkVerification(): void {
		const emailStatus = this.appRegistration?.emailValidation?.status;
		const phoneStatus = this.appRegistration?.phoneValidation?.status;

		const {
			onboardingSettings: {
				signUpForm: { email, emailGateway, phone, phoneGateway },
			},
		} = this.projectFlow;

		const emailVerificationEnabled = email && emailGateway !== "none";
		const phoneVerificationEnabled = phone && phoneGateway !== "none";

		if (emailVerificationEnabled && emailStatus !== 'validated') {
			this._setStep('verify_email');
		} else if (phoneVerificationEnabled && phoneStatus !== 'validated') {
			this._setStep('verify_phone');
		} else {
			this.verificationComplete = true;
		}
	}

	private _requestAppRegistration(): void {
		if (!this.token) return;

		this._KYCService
			.getAppRegistration({
				populates: [
					"biometricValidation",
					"compareFaceVerification",
					"documentFace",
					"documentValidation",
					"emailValidation",
					"face",
					"informationValidation",
					"person",
					"phoneValidation",
					"project",
					"projectFlow",
				],
			})
			.subscribe({
				next: (response) => {
					this.appRegistration = response.data;

					this._smartEnrollService.setLivenessScore(this.appRegistration?.biometricValidation?.livenessScore || 0);
					this._smartEnrollService.setCompareScore(this.appRegistration?.compareFaceVerification?.result?.score || 0);

					this._checkVerification();
				},
				error: () => {
					this._router.navigate(["/sign-up", this.project._id], { replaceUrl: true });
					this._splashScreenService.hide();
				},
				complete: () => {
					this._splashScreenService.hide();
				}
			});
	}

	private _requestProject(projectId: string): void {
		this._passwordlessService.requestProject(projectId, "onboarding").subscribe({
			next: (v) => {
				this.project = new ProjectModel({ ...v.data, type: "onboarding" });
				this.projectFlow = this.project.currentProjectFlow;

				this._setSteps();
			},
			error: (e) => {
				if (e.error.code === "InternalServer") {
					alert("something went wrong, try  again");
				}

				this._splashScreenService.hide();
			},
			complete: () => {
				this._changeDetectorRef.markForCheck();

				if (this.token) {
					this._requestAppRegistration();
				} else {
					this._splashScreenService.hide();
					this._setStep('create');
				}
			},
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
		if (step === "complete") {
			this.verificationComplete = true;
			this.currentStep = "";
			this.currentStepIndex = 0;

			return;
		}

		this.currentStep = step;

		const index = this.steps.indexOf(this.currentStep);

		if (index > -1) {
			this.currentStepIndex = index;
		}
	}

	private _setSteps(): void {
		if (!this.projectFlow) return;

		this.steps = ["create"];

		const { email, emailGateway, phone, phoneGateway } = this.projectFlow.onboardingSettings.signUpForm;

		if (email && emailGateway !== "none") this.steps.push("verify_email");
		if (phone && phoneGateway !== "none") this.steps.push("verify_phone");

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

	onServiceChange(enrollStep: EnrollStep): void {
		let method = "scan" as EnrollDocumentMethod;

		if (enrollStep === "document") {
			if (
				this.projectFlow.onboardingSettings.document.uploadDocumentAllowed &&
				this.projectFlow.onboardingSettings.document.scanDocumentAllowed
			) {
				method = "";
			} else if (this.projectFlow.onboardingSettings.document.uploadDocumentAllowed) {
				method = "upload";
			} else if (this.projectFlow.onboardingSettings.document.scanDocumentAllowed) {
				method = "scan";
			}
		}

		setTimeout(() => {
			this.showKYCApp = true;
			this._smartEnrollService.setCurrentStep(enrollStep);
			this._smartEnrollService.setDocumentMethod(method);
		});
	}

	onStepChange(step: string): void {
		this._setStep(step);
	}

	showCountryNotAllowed(): boolean {
		return Boolean(!this.locationError && !this.project?.allowedCountries.includes(this._countries.findCountry(this.location.country)));
	}

	showLocationError(): boolean {
		return Boolean(this.locationError && !this.showCountryNotAllowed());
	}

	showMainContainer(): boolean {
		return Boolean(
			!this.locationError &&
				this.projectFlow?._id &&
				this.project?._id &&
				this.project?.allowedCountries.includes(this._countries.findCountry(this.location.country))
		);
	}

	showNoProjectError(): boolean {
		return Boolean(!this.projectFlow?._id || !this.project?._id);
	}
}
