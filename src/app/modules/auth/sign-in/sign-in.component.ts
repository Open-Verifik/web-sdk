import { CommonModule, NgIf, isPlatformBrowser } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormGroup, FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatTabsModule } from "@angular/material/tabs";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { FuseAlertComponent, FuseAlertType } from "@fuse/components/alert";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { Subject, takeUntil } from "rxjs";

import { AuthService } from "app/core/auth/auth.service";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { AppService } from "app/core/services/app.service";
import { CountryService } from "app/core/services/country.service";
import { ProjectStorageService } from "app/core/services/project-storage.service";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { CountriesService } from "app/modules/demo/countries.service";
import { DemoService } from "app/modules/demo/demo.service";
import { environment } from "environments/environment";
import { OneTimePasswordInputComponent } from "../../../core/components/one-time-password-input/one-time-password-input.component";
import { BiometricsLoginIosComponent } from "../biometrics-login-ios/biometrics-login-ios.component";
import { BiometricsLoginComponent } from "../biometrics-login/biometrics-login.component";
import { PasswordlessService } from "../passwordless.service";
import { VerifikMediaDisplayComponent } from "app/shared/components/verifik-media-display";

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	selector: "auth-sign-in",
	standalone: true,
	styleUrls: ["./sign-in.component.scss"],
	templateUrl: "./sign-in.component.html",
	imports: [
		BiometricsLoginComponent,
		BiometricsLoginIosComponent,
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
		MatSelectModule,
		MatTabsModule,
		NgIf,
		OneTimePasswordInputComponent,
		ReactiveFormsModule,
		RouterLink,
		TranslocoModule,
		VerifikMediaDisplayComponent,
	],
})
export class AuthSignInComponent implements OnInit, OnDestroy {
	private unsubscriber$: Subject<void> = new Subject<void>();

	activeSendOtp: boolean;
	appLoginToken: string;
	biometricsReady: boolean;
	countries: Array<any>;
	demoData: any;
	deviceDetails: any;
	emailSent: boolean;
	emailValidation: any;
	groupFields: any;
	isVerifikProject: Boolean;
	kycProjectFlow: ProjectFlow;
	language: string;
	loading: Boolean;
	location: any;
	phoneValidation: any;
	project: Project;
	projectFlow: ProjectFlow;
	secondFactorData: any;
	secondFactorForm: any;
	selectedCountryCode: string;
	sendingOTP: Boolean;
	showAlert: boolean = false;
	showBiometrics: boolean;
	showFaceLivenessRecommendation: Boolean;
	signInForm: FormGroup;
	smsSent: boolean;
	typeLogin: string;

	alert: { type: FuseAlertType; message: string } = {
		type: "success",
		message: "",
	};

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
		@Inject(PLATFORM_ID) private platformId: Object,
		private _activatedRoute: ActivatedRoute,
		private _appService: AppService,
		private _authService: AuthService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countries: CountriesService,
		private _countryService: CountryService,
		private _demoService: DemoService,
		private _formBuilder: UntypedFormBuilder,
		private _passwordlessService: PasswordlessService,
		private _projectStorageService: ProjectStorageService,
		private _splashScreenService: FuseSplashScreenService,
		private _translocoService: TranslocoService
	) {
		this.setLanguage();

		this._passwordlessService.flow = "login";

		this.countries = this._countries.countryCodes;
		this.emailValidation = null;
		this.phoneValidation = null;
		this.showBiometrics = false;

		this._splashScreenService.show();

		this.demoData = this._demoService.getDemoData();

		this._demoService.cleanVariables();

		localStorage.removeItem("accessToken");

		this.deviceDetails = this._appService.getDeviceDetails();

		this.sendingOTP = false;
		this.smsSent = false;
		this.showFaceLivenessRecommendation = false;
	}

	ngOnInit(): void {
		this._activatedRoute.params.subscribe((params) => {
			this.requestProject(params.id);
		});

		this._ensureLanguageSync();

		this._demoService.geoLocation$.subscribe({
			next: async (response) => {
				if (!response) return;

				this.location = await this._demoService.extractLocationFromLatLng(response.lat, response.lng);

				this.location.countryCode = this._countries.findCountryCode(this.location.country);
				this.location.os = this.deviceDetails?.platform;
				this.location.type = "browser";

				localStorage.setItem("loginLocation", JSON.stringify(this.location));
			},
			error: () => {},
			complete: () => {},
		});
	}

	onCountryCodeChange(value: string) {
		if (!value || !this.typeLogin) return;

		this.phoneValidation = null;
		this.smsSent = false;

		this.stopTimer();

		this.sendingOTP = false;

		this._updatePhoneValidators(value);
	}

	ngOnDestroy(): void {
		this.unsubscriber$.next();

		this.unsubscriber$.complete();
	}

	setLanguage() {
		if (!isPlatformBrowser(this.platformId)) this.language = "en";

		const savedLanguage = localStorage.getItem("currentLanguage");

		if (savedLanguage && this.flagCodes[savedLanguage]) {
			this.language = savedLanguage;

			this._translocoService.setActiveLang(savedLanguage);

			return;
		}

		let browserLang = navigator.language;

		if (browserLang.includes("-")) browserLang = browserLang.split("-")[0];

		this.language = this.flagCodes[browserLang] ? browserLang : "en";

		localStorage.setItem("currentLanguage", this.language);

		this._translocoService.setActiveLang(this.language);
	}

	/**
	 * Handle language change from LanguagesComponent
	 */
	onLanguageChange(lang: string): void {
		if (!this.flagCodes[lang]) return;

		this.language = lang;

		localStorage.setItem("currentLanguage", lang);

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

	requestProject(projectId?: string): void {
		if (!projectId) projectId = environment.verifikProject;

		this._passwordlessService.requestProject(projectId, "login").subscribe({
			next: (v) => {
				this.project = new Project({ ...v.data, type: "login" });

				this.isVerifikProject = this._passwordlessService.isVerifikProject;

				this._projectStorageService.setProject(this.project);

				this.projectFlow = this.project.getLoginProjectFlow();

				if (this.projectFlow) this._projectStorageService.setProjectFlow(this.projectFlow);

				this._appService.applyDynamicTheming(this.project);

				for (let index = 0; index < v.data.projectFlows.length; index++) {
					const projectFlow = v.data.projectFlows[index];

					if (projectFlow.type === "onboarding") this.kycProjectFlow = new ProjectFlow(projectFlow);
				}
			},
			error: (e) => {
				console.info({ errorHERE: e });

				if (e.error.code === "InternalServer") alert("something went wrong, try  again");

				this._splashScreenService.hide();
			},
			complete: () => {
				if (!this.projectFlow) return;

				this.initForm();

				this._changeDetectorRef.markForCheck();
				this._splashScreenService.hide();
			},
		});
	}

	initForm(): void {
		this.typeLogin = this.projectFlow.loginSettings.email ? "email" : "phone";

		this.buttonSendOtp();
		this.setFieldRequiredInForm();
		this._init2FAForm();

		this._activatedRoute.queryParams.pipe(takeUntil(this.unsubscriber$)).subscribe((queryParams) => {
			const type = queryParams.type;

			if (type === "liveness") {
				this.showBiometricsLogin();

				return;
			}

			const email = queryParams.email;
			const emailOTP = queryParams.otp;

			if (!email || !emailOTP) return;

			this._signInWithEmail({
				email,
				emailOTP,
			});
		});
	}

	private _init2FAForm(): void {
		this.secondFactorForm = this._formBuilder.group({
			authenticatorOTP: ["", [Validators.required, Validators.minLength(6)]],
		});
	}

	private _initFormListeners(): void {
		this.signInForm
			.get("emailOTP")
			.valueChanges.pipe(takeUntil(this.unsubscriber$))
			.subscribe((value) => {
				if (!value || value.length !== 6 || this.typeLogin !== "email") return;

				setTimeout(() => this.signIn());
			});

		this.signInForm
			.get("phoneOTP")
			.valueChanges.pipe(takeUntil(this.unsubscriber$))
			.subscribe((value) => {
				if (!value || value.length !== 6 || this.typeLogin !== "phone") return;

				setTimeout(() => this.signIn());
			});
	}

	buttonSendOtp() {
		this.activeSendOtp =
			this.typeLogin === "email"
				? this.projectFlow.loginSettings.email && !this.emailSent
				: this.projectFlow.loginSettings.phone && !this.smsSent;
	}

	setFieldRequiredInForm() {
		this.selectedCountryCode = localStorage.getItem("defaultCountryCode") || this.location?.countryCode || "+1";

		this.groupFields = {
			email: [localStorage.getItem("defaultEmail") || ""],
			emailOTP: [null],
			countryCode: [this.selectedCountryCode],
			phone: [localStorage.getItem("defaultPhone") || ""],
			phoneOTP: [null],
		};

		switch (this.typeLogin) {
			case "email":
				this.groupFields["email"][1] = [Validators.required, Validators.email, Validators.minLength(6), Validators.maxLength(60)];
				this.groupFields["emailOTP"][1] = [Validators.minLength(6), Validators.maxLength(6)];

				break;
			case "phone":
				this.groupFields["countryCode"][1] = [Validators.required];
				this._setPhoneValidators(this.selectedCountryCode);
				this.groupFields["phoneOTP"][1] = [Validators.minLength(6), Validators.maxLength(6)];

				break;
		}

		this.signInForm = this._formBuilder.group(this.groupFields);

		this._initFormListeners();
	}

	private _setPhoneValidators(countryCode: string): void {
		const phoneLength = this._countryService.getPhoneLengthForCountryCode(countryCode);

		this.groupFields["phone"][1] = [
			Validators.required,
			Validators.minLength(phoneLength[0]),
			Validators.maxLength(phoneLength[1]),
			Validators.pattern(/^\d+$/),
		];
	}

	private _updatePhoneValidators(countryCode: string): void {
		if (!this.signInForm || this.typeLogin !== "phone") return;

		const phoneLength = this._countryService.getPhoneLengthForCountryCode(countryCode);
		const phoneControl = this.signInForm.get("phone");

		if (!phoneControl) return;

		phoneControl.setValidators([
			Validators.required,
			Validators.minLength(phoneLength[0]),
			Validators.maxLength(phoneLength[1]),
			Validators.pattern(/^\d+$/),
		]);

		phoneControl.updateValueAndValidity();
	}

	selectLogin(event) {
		this.groupFields = {};
		this.typeLogin = event.index ? "phone" : "email";

		this.setFieldRequiredInForm();
		this.buttonSendOtp();

		this._changeDetectorRef.markForCheck();
	}

	canSendOTP(): Boolean {
		if (this.sendingOTP || !this.activeSendOtp) {
			return false;
		}

		if (this.typeLogin === "email") {
			const email = this.signInForm.get("email")?.value;

			return Boolean(email && email.length >= 6 && email.length <= 60 && this.isValidEmail(email));
		}

		if (this.typeLogin === "phone") {
			const countryCode = this.signInForm.get("countryCode")?.value;
			const phone = this.signInForm.get("phone")?.value;

			if (!countryCode || !phone) return false;

			const phoneLength = this._countryService.getPhoneLengthForCountryCode(countryCode);
			const phoneNumberLength = phone.length;

			return Boolean(phoneNumberLength >= phoneLength[0] && phoneNumberLength <= phoneLength[1]);
		}

		return false;
	}

	private isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	canUseBiometrics(): boolean {
		const isFormValid =
			this.typeLogin === "email"
				? Boolean(this.signInForm.value.email)
				: Boolean(this.signInForm.value.countryCode && this.signInForm.value.phone);

		return Boolean(isFormValid);
	}

	isFormValid(): boolean {
		const otpField = this.signInForm.value.phoneOTP || this.signInForm.value.emailOTP;

		return Boolean(this.signInForm.valid && otpField && otpField.length === 6);
	}

	onInput(event: Event) {
		const input = event.target as HTMLInputElement;

		input.value = input.value.replace(/[^0-9]/g, "");
	}

	private _signInWithEmail(dataForm): void {
		this._passwordlessService
			.confirmEmailValidation(dataForm.email, dataForm.emailOTP, this.secondFactorForm?.value?.authenticatorOTP, this.location)
			.subscribe({
				next: (response) => {
					if (response.data.message) {
						this.secondFactorData = response.data;
						this.secondFactorData.emailOTP = dataForm.emailOTP;
						this.loading = false;

						return;
					}

					this.appLoginToken = response.data.token;

					localStorage.setItem("defaultEmail", dataForm.email);

					if (response.data?.showFaceLivenessRecommendation) {
						this.showFaceLivenessRecommendation = true;
						this.loading = false;

						return;
					}

					this.loading = false;

					return this.successLogin(response.data.token);
				},
				error: (err) => {
					console.error({
						err: err.error.message,
					});

					this.errorLogin(err.error.message);

					this.loading = false;
				},
			});
	}

	private _signInWithPhone(dataForm): void {
		this._passwordlessService
			.confirmPhoneValidation(
				dataForm.countryCode,
				dataForm.phone,
				dataForm.phoneOTP,
				this.secondFactorForm.value.authenticatorOTP,
				this.location
			)
			.subscribe({
				next: (response) => {
					if (!response.data) {
						this.loading = false;
						return;
					}

					if (response.data.message) {
						this.secondFactorData = response.data;
						this.secondFactorData.phoneOTP = dataForm.phoneOTP;
						this.loading = false;

						return;
					}

					this.appLoginToken = response.data.token;

					localStorage.setItem("defaultCountryCode", dataForm.countryCode);
					localStorage.setItem("defaultPhone", dataForm.phone);

					if (response.data?.showFaceLivenessRecommendation) {
						this.showFaceLivenessRecommendation = true;
						this.loading = false;

						return;
					}

					this.loading = false;
				},
				error: (err) => {
					this.errorLogin(err.error.message);

					this.loading = false;
				},
			});
	}

	signIn(): void {
		if (this.loading) return;

		this.loading = true;

		const dataForm = this.signInForm.value;

		switch (this.typeLogin) {
			case "email":
				this._signInWithEmail(dataForm);

				break;
			case "phone":
				this._signInWithPhone(dataForm);

				break;
		}
	}

	successLogin(token: any) {
		this._authService.handleRedirect(this.projectFlow, this.project._id, token, "login");
	}

	errorLogin(error: string) {
		this.alert = {
			type: "error",
			message: `login.${error}`,
		};

		this.showAlert = true;

		this._changeDetectorRef.detectChanges();

		setTimeout(() => {
			this.showAlert = false;

			this._changeDetectorRef.detectChanges();
		}, 10000);
	}

	sendOTP(event, gateway): void {
		event.preventDefault();

		this.sendingOTP = true;

		switch (this.typeLogin) {
			case "email":
				this._passwordlessService.sendEmailValidation(this.signInForm.value.email, this.location).subscribe({
					next: (response) => {
						this.emailValidation = response.data;
						this.emailSent = true;

						this._startTimer(this.typeLogin);

						this.sendingOTP = false;
					},
					error: (err) => {
						console.error({ err });

						this.errorLogin(err?.error?.message);

						this.sendingOTP = false;
					},
				});

				break;
			case "phone":
				this._passwordlessService
					.sendPhoneValidation(this.signInForm.value.countryCode, this.signInForm.value.phone, gateway, this.location)
					.subscribe({
						next: (response) => {
							this.phoneValidation = response.data;
							this.smsSent = true;

							this._startTimer(this.typeLogin);

							this.sendingOTP = false;
						},
						error: (err) => {
							this.errorLogin(err?.error?.message);

							this.sendingOTP = false;
						},
					});

				break;
		}
	}

	private _startTimer(field: any): number {
		let interval: ReturnType<typeof setInterval>;

		const baseDate = this.emailValidation ? this.emailValidation.updatedAt : this.phoneValidation ? this.phoneValidation.updatedAt : new Date();
		const dateToCompare = new Date(baseDate).getTime() + 2 * 60 * 1000; // Add 2 minutes

		switch (field) {
			case "email":
				if (!this.emailValidation) return 0;

				this.emailValidation.diff = Math.floor((dateToCompare - Date.now()) / 1000);

				interval = setInterval(() => {
					if (this.emailValidation?.diff > 0) {
						this.emailValidation.diff--;
					} else {
						clearInterval(interval);

						this.emailValidation = null;
						this.emailSent = false;
						this.signInForm.get("email")?.enable();
					}

					this.buttonSendOtp();
					this._changeDetectorRef.detectChanges();
				}, 1000);

				break;
			case "phone":
				if (!this.phoneValidation) return 0;

				this.phoneValidation.diff = Math.floor((dateToCompare - Date.now()) / 1000);

				interval = setInterval(() => {
					if (this.phoneValidation?.diff > 0) {
						this.phoneValidation.diff--;
					} else {
						clearInterval(interval);

						this.phoneValidation = null;
						this.smsSent = false;
						this.signInForm.get("phone")?.enable();
						this.signInForm.get("countryCode")?.enable();
					}

					this.buttonSendOtp();
					this._changeDetectorRef.detectChanges();
				}, 1000);

				break;
		}
	}

	stopTimer(): void {
		if (this.emailValidation) this.emailValidation.diff = 0;
		if (this.phoneValidation) this.phoneValidation.diff = 0;
	}

	showBiometricsLogin(): void {
		if (this.appLoginToken) localStorage.setItem("accessToken", this.appLoginToken);

		this.showBiometrics = true;
	}

	continueRedirection(): void {
		this.sendingOTP = true;

		this.successLogin(this.appLoginToken);
	}

	createAccount(): void {
		window.location.href = `${environment.kycUrl}/kyc/project/${this.project._id}`;
	}
}
