import { CommonModule, NgIf, isPlatformBrowser } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation, PLATFORM_ID } from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { FuseAlertComponent, FuseAlertType } from "@fuse/components/alert";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { PasswordlessService } from "../passwordless.service";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "../project";
import { Subject, Subscription } from "rxjs";
import { MatTabsModule } from "@angular/material/tabs";
import { environment } from "environments/environment";
import { TranslocoModule } from "@ngneat/transloco";
import { CountriesService } from "app/modules/demo/countries.service";
import { MatSelectModule } from "@angular/material/select";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import moment from "moment";
import { DemoService } from "app/modules/demo/demo.service";
import { BiometricsLoginComponent } from "../biometrics-login/biometrics-login.component";
import { BiometricsLoginIosComponent } from "../biometrics-login-ios/biometrics-login-ios.component";

@Component({
	selector: "auth-sign-in",
	templateUrl: "./sign-in.component.html",
	styleUrls: ["./sign-in.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		FlexLayoutModule,
		RouterLink,
		FuseAlertComponent,
		NgIf,
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatIconModule,
		MatCheckboxModule,
		MatSelectModule,
		MatProgressSpinnerModule,
		MatTabsModule,
		TranslocoModule,
		CommonModule,
		LanguagesComponent,
		BiometricsLoginComponent,
		BiometricsLoginIosComponent,
	],
})
export class AuthSignInComponent implements OnInit, OnDestroy {
	alert: { type: FuseAlertType; message: string } = {
		type: "success",
		message: "",
	};
	demoData: any;
	showAlert: boolean = false;
	project: Project;
	projectFlow: ProjectFlow;
	kycProjectFlow: ProjectFlow;
	signInForm: FormGroup;
	countries: Array<any>;
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	emailSent: boolean;
	smsSent: boolean;
	emailValidation: any;
	phoneValidation: any;
	groupFields: any;
	typeLogin: string;
	activeSendOtp: boolean;
	biometricsReady: boolean;
	secondFactorData: any;
	secondFactorForm: any;
	showBiometrics: boolean;
	deviceDetails: any;
	sendingOTP: Boolean;
	showFaceLivenessRecommendation: Boolean;
	isVerifikProject: Boolean;
	appLoginToken: string;
	loading: Boolean;
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
	location: any;
	selectedCountryCode: string;

	/**
	 * Constructor
	 */
	constructor(
		private _activatedRoute: ActivatedRoute,
		private _demoService: DemoService,
		private _formBuilder: UntypedFormBuilder,
		private _splashScreenService: FuseSplashScreenService,
		private _passwordlessService: PasswordlessService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countries: CountriesService,
		@Inject(PLATFORM_ID) private platformId: Object
	) {
		this.setLanguage();

		this.countries = this._countries.countryCodes;

		this.showBiometrics = false;

		this._splashScreenService.show();

		this.demoData = this._demoService.getDemoData();

		this._demoService.cleanVariables();

		localStorage.removeItem("accessToken");

		this.deviceDetails = this._demoService.getDeviceDetails();

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
			this.requestProject(params.id);

			this.isVerifikProject = Boolean(params.id === environment.verifikProject || params.id === environment.sandboxProject);
		});

		this._demoService.geoLocation$.subscribe({
			next: async (response) => {
				if (!response) return;

				this.location = await this._demoService.extractLocationFromLatLng(response.lat, response.lng);

				this.location.countryCode = this._countries.findCountryCode(this.location.country);

				this.location.os = this.deviceDetails?.platform;
				this.location.type = "browser";

				localStorage.setItem("loginLocation", JSON.stringify(this.location));
			},
			error: (exception) => {},
			complete: () => {},
		});
	}

	onCountryCodeChange(value: string) {
		if (!value || !this.typeLogin) return;

		this.phoneValidation = null;

		this.smsSent = false;

		this.stopTimer();

		this.sendingOTP = false;
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
	}

	requestProject(projectId?: string): void {
		if (!projectId) projectId = environment.verifikProject;

		this._passwordlessService.requestProject(projectId, "login").subscribe({
			next: (v) => {
				this.project = new ProjectModel({ ...v.data, type: "login" });

				this.projectFlow = this.project.currentProjectFlow;

				for (let index = 0; index < v.data.projectFlows.length; index++) {
					const projectFlow = v.data.projectFlows[index];

					if (projectFlow.type === "onboarding") this.kycProjectFlow = new ProjectFlowModel(projectFlow);
				}
			},
			error: (e) => {
				console.info({ errorHERE: e });
				if (e.error.code === "InternalServer") {
					alert("something went wrong, try  again");
				}

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

		this._activatedRoute.queryParams.subscribe((queryParams) => {
			const email = queryParams.email;
			const emailOTP = queryParams.otp;

			if (!email || !emailOTP) return;

			this._signInWithEmail({
				email,
				emailOTP,
			});
		});
	}

	_init2FAForm(): void {
		this.secondFactorForm = this._formBuilder.group({
			authenticatorOTP: ["", [Validators.required, Validators.minLength(6)]],
		});
	}

	buttonSendOtp() {
		this.activeSendOtp =
			this.typeLogin === "email"
				? this.projectFlow.loginSettings.email && !this.emailSent
				: this.projectFlow.loginSettings.phone && !this.smsSent;
	}

	setFieldRequiredInForm() {
		this.groupFields = {
			email: [localStorage.getItem("defaultEmail") || ""],
			emailOTP: [,],
			countryCode: [localStorage.getItem("defaultCountryCode") || this.location?.countryCode || ""],
			phone: [localStorage.getItem("defaultPhone") || ""],
			phoneOTP: [,],
		};

		switch (this.typeLogin) {
			case "email":
				this.groupFields["email"][1] = [Validators.required, Validators.email];
				this.groupFields["emailOTP"][1] = [Validators.minLength(6), Validators.maxLength(6)];
				break;

			case "phone":
				this.groupFields["countryCode"][1] = [Validators.required];
				this.groupFields["phone"][1] = [Validators.required, Validators.minLength(8)];
				this.groupFields["phoneOTP"][1] = [Validators.minLength(6), Validators.maxLength(6)];
				break;
		}

		this.signInForm = this._formBuilder.group(this.groupFields);
	}

	selectLogin(event) {
		this.groupFields = {};

		this.typeLogin = event.index ? "phone" : "email";

		this.setFieldRequiredInForm();

		this.buttonSendOtp();

		this._changeDetectorRef.markForCheck();
	}

	canSendOTP(): Boolean {
		return Boolean(!this.sendingOTP && this.activeSendOtp && this.signInForm.valid);
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

	checkSixDigits(field: string): void {
		if (!this.signInForm.value[field] || (this.signInForm.value[field] && this.signInForm.value[field].length !== 6) || this.signInForm.invalid)
			return;

		this.signIn();
	}

	_signInWithEmail(dataForm): void {
		this._passwordlessService
			.confirmEmailValidation(dataForm.email, dataForm.emailOTP, this.secondFactorForm?.value?.authenticatorOTP, this.location)
			.subscribe(
				(response) => {
					if (response.data.message) {
						this.secondFactorData = response.data;

						this.secondFactorData.emailOTP = dataForm.emailOTP;

						return;
					}

					this.appLoginToken = response.data.token;

					localStorage.setItem("defaultEmail", dataForm.email);

					if (response.data?.showFaceLivenessRecommendation) {
						this.showFaceLivenessRecommendation = true;

						return;
					}

					this.loading = false;

					return this.successLogin(response.data.token);
				},
				(err) => {
					console.error({
						err: err.error.message,
					});

					this.errorLogin(err.error.message);

					this.loading = false;
				}
			);
	}

	_signInWithPhone(dataForm): void {
		this._passwordlessService
			.confirmPhoneValidation(
				dataForm.countryCode,
				dataForm.phone,
				dataForm.phoneOTP,
				this.secondFactorForm.value.authenticatorOTP,
				this.location
			)
			.subscribe(
				(response) => {
					if (!response.data) return;

					if (response.data.message) {
						this.secondFactorData = response.data;

						this.secondFactorData.phoneOTP = dataForm.phoneOTP;

						return;
					}

					this.appLoginToken = response.data.token;

					localStorage.setItem("defaultCountryCode", dataForm.countryCode);

					localStorage.setItem("defaultPhone", dataForm.phone);

					if (response.data?.showFaceLivenessRecommendation) {
						this.showFaceLivenessRecommendation = true;

						return;
					}

					this.loading = false;

					return this.successLogin(this.appLoginToken);
				},
				(err) => {
					this.errorLogin(err.error.message);

					this.loading = false;
				}
			);
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
		let redirectUrl = this.projectFlow.redirectUrl;

		if (environment.verifikProject === this.project._id) {
			redirectUrl = `${environment.appUrl}/sign-in`;
		} else if (environment.sandboxProject === this.project._id) {
			redirectUrl = `${environment.sandboxUrl}/sign-in`;
		}

		window.location.href = `${redirectUrl}?type=login&token=${token}`;
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

						this.startTimer(this.typeLogin);

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
					.subscribe(
						(response) => {
							this.phoneValidation = response.data;

							this.smsSent = true;

							this.startTimer(this.typeLogin);

							this.sendingOTP = false;
						},
						(err) => {
							this.errorLogin(err?.error?.message);

							this.sendingOTP = false;
						}
					);
				break;
		}
	}

	startTimer(field): number {
		let interval;

		const dateToCompare = moment(
			this.emailValidation ? this.emailValidation.updatedAt : this.phoneValidation ? this.phoneValidation.updatedAt : new Date()
		).add(2, "minute");

		switch (field) {
			case "email":
				if (!this.emailValidation) {
					return 0;
				}

				this.emailValidation.diff = dateToCompare.diff(moment.utc(), "seconds");

				interval = setInterval(() => {
					if (this.emailValidation.diff > 0) {
						this.emailValidation.diff--;
					} else {
						clearInterval(interval);

						this.emailSent = false;

						this.emailValidation = null;
					}
					this.buttonSendOtp();

					this._changeDetectorRef.detectChanges();
				}, 1000);

				break;

			case "phone":
				if (!this.phoneValidation) {
					return 0;
				}

				this.phoneValidation.diff = dateToCompare.diff(moment.utc(), "seconds");

				interval = setInterval(() => {
					if (this.phoneValidation?.diff > 0) {
						this.phoneValidation.diff--;
					} else {
						clearInterval(interval);

						this.smsSent = false;

						this.phoneValidation = null;
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
		if (this.appLoginToken) {
			localStorage.setItem("accessToken", this.appLoginToken);
		}

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
