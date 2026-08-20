import { CommonModule, isPlatformBrowser, NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, SimpleChanges, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { FuseSplashScreenService } from "@fuse/services/splash-screen/splash-screen.service";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { combineLatest, map, Subject, takeUntil } from "rxjs";

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { CountryService } from "app/core/services/country.service";
import { DemoService } from "app/modules/demo/demo.service";
import { environment } from "environments/environment";
import { ProjectFlow } from "../../../core/classes/project-flow.class";
import { Project } from "../../../core/classes/project.class";
import { AppService } from "../../../core/services/app.service";
import {
	clearAccessTokenIfAppRegistrationSession,
	clearSignUpAppRegistrationToken,
	readSignUpAppRegistrationToken,
	saveSignUpAppRegistrationToken,
	isUsableAppRegistrationSessionToken,
} from "../../../core/services/app-registration-session.storage";
import { ProjectStorageService } from "../../../core/services/project-storage.service";
import { KYCService } from "../kyc.service";
import { PasswordlessService } from "../passwordless.service";
import { AppRegistration } from "../project";
import { SmartEnrollComponent } from "../smart-enroll/smart-enroll.component";
import { EnrollStep, SmartEnrollService } from "../smart-enroll/smart-enroll.service";
import { SignUpCreateFormComponent } from "./sign-up-create-form/sign-up-create-form.component";
import { SignUpVerificationComponent } from "./sign-up-verification/sign-up-verification.component";
import { VerifikMediaDisplayComponent } from "../../../shared/components/verifik-media-display";

/**
 * Steps the sign-up sync may still overwrite. `"1"` is what the backend writes on creation and
 * `""` covers a record that reports no step at all.
 */
const SIGN_UP_FORM_SYNCABLE_STEPS = ["", "1", "instructions", "signUpForm"];

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	selector: "sign-up",
	standalone: true,
	styleUrls: ["../sign-in/sign-in.component.scss", "sign-up.component.scss"],
	templateUrl: "./sign-up.component.html",
	imports: [
		CommonModule,
		FlexLayoutModule,
		LanguagesComponent,
		MatButtonModule,
		MatIconModule,
		NgIf,
		RouterModule,
		SignUpCreateFormComponent,
		SignUpVerificationComponent,
		SmartEnrollComponent,
		TranslocoModule,
		VerifikMediaDisplayComponent,
	],
})
export class AuthSignUpComponent implements OnInit, OnDestroy {
	private unsubscriber$: Subject<void> = new Subject<void>();

	appRegistration: AppRegistration;
	appUrl: string = environment.appUrl;
	currentStep: string = "create";
	currentStepIndex: number = 0;
	deviceDetails: any;
	enrollStep: EnrollStep;
	isVerifikProject: boolean = false;
	language: string;
	location: any;
	locationError: any;
	project: Project;
	projectFlow: ProjectFlow;
	sendingOTP: Boolean;
	showKYCApp: boolean = false;
	showFlowNotPublished: boolean = false;
	showUpgradeRequired: boolean = false;
	steps: Array<string> = ["create"];
	token: string;

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

	constructor(
		private _activatedRoute: ActivatedRoute,
		private _appService: AppService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countryService: CountryService,
		private _demoService: DemoService,
		private _KYCService: KYCService,
		private _passwordlessService: PasswordlessService,
		private _projectStorageService: ProjectStorageService,
		private _router: Router,
		private _smartEnrollService: SmartEnrollService,
		private _splashScreenService: FuseSplashScreenService,
		private _translocoService: TranslocoService,
		@Inject(PLATFORM_ID) private platformId: Object
	) {
		this._splashScreenService.show();
		this._passwordlessService.flow = "onboarding";

		this._setLanguage();

		this.deviceDetails = this._appService.getDeviceDetails();
		this.location = null;
		this.locationError = null;
		this.project = null;
		this.projectFlow = null;
		this.sendingOTP = false;
	}

	ngOnInit(): void {
		this._splashScreenService.show();

		this._initializeSubscriptions();
		this._ensureLanguageSync();
	}

	ngOnDestroy(): void {
		this.unsubscriber$.next();
		this.unsubscriber$.complete();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["isVerifikProject"]) {
			this.isVerifikProject = changes["isVerifikProject"].currentValue;
		}
	}

	private _initializeSubscriptions(): void {
		this._smartEnrollService.insufficientCredits$.pipe(takeUntil(this.unsubscriber$)).subscribe({
			next: () => {
				this.showKYCApp = false;
				this.showUpgradeRequired = true;
			},
		});

		combineLatest([this._activatedRoute.params, this._activatedRoute.queryParams])
			.pipe(takeUntil(this.unsubscriber$))
			.pipe(map((results) => ({ id: results[0].id, token: results[1].token })))
			.subscribe((results) => {
				const projectId = results?.id;
				const rawQueryToken = results?.token;
				const queryToken =
					typeof rawQueryToken === "string" ? rawQueryToken : Array.isArray(rawQueryToken) ? rawQueryToken[0] : undefined;

				let effectiveToken: string | null = null;

				if (queryToken?.trim()) {
					if (isUsableAppRegistrationSessionToken(queryToken)) {
						effectiveToken = queryToken.trim();
						saveSignUpAppRegistrationToken(projectId, effectiveToken);
					} else {
						clearSignUpAppRegistrationToken(projectId);
						clearAccessTokenIfAppRegistrationSession();
					}
				}

				if (!effectiveToken) {
					const stored = readSignUpAppRegistrationToken(projectId);

					if (stored) {
						effectiveToken = stored;

						void this._router.navigate(["/sign-up", projectId], {
							queryParams: { token: stored },
							queryParamsHandling: "merge",
							replaceUrl: true,
						});
					}
				}

				if (!effectiveToken) {
					clearSignUpAppRegistrationToken(projectId);
					clearAccessTokenIfAppRegistrationSession();
					this.token = null;
					this._smartEnrollService.unsetLocalStorage();
				} else {
					this._setToken(effectiveToken);
				}

				if (this.project?._id === projectId && this.projectFlow) {
					this._requestAppRegistration();
					return;
				}

				this._requestProject(projectId);
			});

		this._demoService.geoLocation$.pipe(takeUntil(this.unsubscriber$)).subscribe({
			next: async (response) => {
				if (!response) return;

				if (response.errorMessage) return;

				this.locationError = null;

				if (this.location) return;

				this.location = await this._demoService.extractLocationFromLatLng(response.lat, response.lng);
				this.location.os = this.deviceDetails?.platform;
				this.location.type = "browser";
				this.location.countryCode = this._countryService.findCountryCodeByName(this.location.country);
			},
			error(err) {
				this.locationError = err;
			},
		});
	}

	private _checkVerification(): void {
		const emailStatus = this.appRegistration?.emailValidation?.status;
		const phoneStatus = this.appRegistration?.phoneValidation?.status;

		const onboardingSettings = this.projectFlow?.onboardingSettings;
		const signUpForm = onboardingSettings?.signUpForm;
		const { email, emailGateway, phone, phoneGateway } = signUpForm || {};

		const emailVerificationEnabled = email && emailGateway !== "none";
		const phoneVerificationEnabled = phone && phoneGateway !== "none";

		if (emailVerificationEnabled && emailStatus !== "validated") {
			this._setStep("verify_email");
		} else if (phoneVerificationEnabled && phoneStatus !== "validated") {
			this._setStep("verify_phone");
		} else {
			this._recordSignUpFormStep();

			this._setStep("complete");
		}
	}

	/**
	 * Records that the sign-up step finished when no OTP was required.
	 *
	 * With a gateway set, `sign-up-verification` syncs `signUpForm` after the code is accepted.
	 * With both gateways off nothing did, so every record in a collect-only flow stayed on the
	 * creation-time `currentStep` and the funnel read as if nobody had started.
	 */
	private _recordSignUpFormStep(): void {
		if (!this.appRegistration) return;

		// Never rewind a record that already moved on: a returning enrollee resuming at document
		// or liveness would otherwise have `currentStep` pushed back on every reload.
		if (!SIGN_UP_FORM_SYNCABLE_STEPS.includes(`${this.appRegistration.currentStep ?? ""}`)) return;

		if (!["STARTED", "ONGOING"].includes(this.appRegistration.status)) return;

		// Failing to record the step must not keep the enrollee out of the KYC app, so the error is
		// swallowed; `syncAppRegistration` already advances the in-memory record.
		this._KYCService.syncAppRegistration("signUpForm", "ONGOING").subscribe({ error: () => {} });
	}

	private _requestAppRegistration(): void {
		if (!this.token) return this._smartEnrollService.unsetLocalStorage();

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

					this._smartEnrollService.setDocumentMethodFromInputMethod(this.appRegistration?.documentValidation?.inputMethod);
					this._smartEnrollService.setLivenessScore(this.appRegistration?.biometricValidation?.livenessScore || 0);
					this._smartEnrollService.setCompareScore(this.appRegistration?.compareFaceVerification?.result?.score || 0);

					this._checkVerification();
				},
				error: () => {
					clearSignUpAppRegistrationToken(this.project._id);
					clearAccessTokenIfAppRegistrationSession();
					this._smartEnrollService.unsetLocalStorage();
					this.token = null;
					this._router.navigate(["/sign-up", this.project._id], { replaceUrl: true });
					this._splashScreenService.hide();
				},
				complete: () => {
					this._splashScreenService.hide();
				},
			});
	}

	private _requestProject(projectId: string): void {
		this._passwordlessService.requestProject(projectId, "onboarding").subscribe({
			next: (response) => {
				this.project = new Project({ ...response.data, type: "onboarding" });

				this.isVerifikProject = this._passwordlessService.isVerifikProject;

				this._projectStorageService.setProject(this.project);

				this.projectFlow = this.project.getOnboardingProjectFlow();

				if (this.projectFlow) this._projectStorageService.setProjectFlow(this.projectFlow);

				this._applyDefaultLanguageFromProject();

				this._appService.applyDynamicTheming(this.project);

				if (this.projectFlow && this.projectFlow.status !== "active") {
					this.showFlowNotPublished = true;
					this.showUpgradeRequired = false;

					return;
				}

				if (!response.planCode) {
					this.showUpgradeRequired = true;
				} else {
					this._setSteps();
				}
			},
			error: () => {
				window.location.href = "/sign-up";

				this._splashScreenService.hide();
			},
			complete: () => {
				this._changeDetectorRef.markForCheck();

				if (this.showFlowNotPublished || this.showUpgradeRequired) {
					this._splashScreenService.hide();

					return;
				}

				if (this.token) {
					this._requestAppRegistration();
				} else {
					this._splashScreenService.hide();
					this._setStep("create");
				}
			},
		});
	}

	private _setLanguage() {
		if (!isPlatformBrowser(this.platformId)) {
			this.language = "en";

			return;
		}

		const savedLanguage = localStorage.getItem("currentLanguage");

		if (savedLanguage && this.flagCodes[savedLanguage]) {
			this.language = savedLanguage;

			this._translocoService.setActiveLang(savedLanguage);
			return;
		}

		let browserLang = navigator.language;

		if (browserLang.includes("-")) browserLang = browserLang.split("-")[0];

		// Tentative until project loads — may be replaced by project.defaultLanguage.
		this.language = this.flagCodes[browserLang] ? browserLang : "en";

		this._translocoService.setActiveLang(this.language);
	}

	private _applyDefaultLanguageFromProject(): void {
		if (!isPlatformBrowser(this.platformId)) return;

		const savedLanguage = localStorage.getItem("currentLanguage");
		if (savedLanguage && this.flagCodes[savedLanguage]) return;

		const projectLang = this.project?.defaultLanguage;
		if (projectLang && this.flagCodes[projectLang]) {
			this.language = projectLang;
		}

		localStorage.setItem("currentLanguage", this.language);
		this._translocoService.setActiveLang(this.language);
		this._changeDetectorRef.markForCheck();
	}

	onLanguageChange(lang: string): void {
		if (!this.flagCodes[lang]) return;

		localStorage.setItem("currentLanguage", lang);

		this.language = lang;
		this._translocoService.setActiveLang(lang);
		this._changeDetectorRef.markForCheck();
	}

	private _ensureLanguageSync(): void {
		const savedLanguage = localStorage.getItem("currentLanguage");

		if (!savedLanguage || !this.flagCodes[savedLanguage] || savedLanguage === this.language) return;

		this.language = savedLanguage;
		this._translocoService.setActiveLang(savedLanguage);
		this._changeDetectorRef.markForCheck();
	}

	private _setStep(step: string): void {
		if (step === "complete") {
			this.showKYCApp = true;
			this.currentStep = "";
			this.currentStepIndex = 0;

			return;
		}

		this.currentStep = step;

		const index = this.steps.indexOf(this.currentStep);

		if (index > -1) this.currentStepIndex = index;
	}

	private _setSteps(): void {
		if (!this.projectFlow) return;

		this.steps = ["create"];

		const onboardingSettings = this.projectFlow.onboardingSettings;
		const signUpForm = onboardingSettings?.signUpForm;
		const { email, emailGateway, phone, phoneGateway } = signUpForm || {};

		if (email && emailGateway !== "none") this.steps.push("verify_email");
		if (phone && phoneGateway !== "none") this.steps.push("verify_phone");

		this.currentStepIndex = this.steps.indexOf(this.currentStep);
	}

	private _setToken(token?: string): void {
		if (!token) {
			this.token = null;
			clearAccessTokenIfAppRegistrationSession();

			return;
		}

		this.token = token;

		localStorage.setItem("accessToken", token);
	}

	countryNotAllowedAccept(): void {
		const redirectUrl = this.projectFlow?.integrations?.redirectUrl;

		if (redirectUrl) {
			window.location.href = redirectUrl;
		} else {
			window.history.back();
		}
	}

	enabledLocation(): void {
		window.location.reload();
	}

	onStepChange(step: string): void {
		this._setStep(step);
	}

	showCountryNotAllowed(): boolean {
		return false;
	}

	showLocationError(): boolean {
		return false;
	}

	showMainContainer(): boolean {
		return Boolean(
			!this.showUpgradeRequired &&
				!this.showFlowNotPublished &&
				this.projectFlow?._id &&
				this.projectFlow?.status === "active" &&
				this.project?._id
		);
	}

	showNoProjectError(): boolean {
		return Boolean(!this.showFlowNotPublished && (!this.projectFlow?._id || !this.project?._id || !this.projectFlow));
	}
}
