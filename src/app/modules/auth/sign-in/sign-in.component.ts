import { CommonModule, NgIf, isPlatformBrowser } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormGroup, FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { MatTabsModule } from "@angular/material/tabs";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { FuseAlertComponent, FuseAlertType } from "@fuse/components/alert";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { Subject, firstValueFrom, takeUntil } from "rxjs";

import { PasskeyZelfService } from "app/core/services/passkey-zelf.service";
import { BiometricSecurityService } from "app/core/services/biometric-security.service";
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

import { PasswordlessService } from "../passwordless.service";
import { PasskeyPromptComponent } from "../passkey-prompt/passkey-prompt.component";
import { PasskeySuccessComponent } from "../passkey-success/passkey-success.component";
import { ZkAuthLoginComponent } from "../zk-auth-login/zk-auth-login.component";
import { VerifikMediaDisplayComponent } from "app/shared/components/verifik-media-display";
import { AuthUtils } from "app/core/auth/auth.utils";

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	selector: "auth-sign-in",
	standalone: true,
	styleUrls: ["./sign-in.component.scss"],
	templateUrl: "./sign-in.component.html",
	imports: [
		PasskeyPromptComponent,
		PasskeySuccessComponent,
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
		MatTooltipModule,
		ZkAuthLoginComponent,
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

	// Passkey State
	isPasskeyLoading: boolean = false;
	passkeyAvailable: boolean = false;
	showPasskeyPrompt: boolean = false;
	showPasskeySuccess: boolean = false;
	// ZK Auth
	offerZkLogin: boolean = false;
	hasZkOnboarding: boolean = false;
	zkAuthRecord: any; // Store IPFS URL for ZK Auth
	private _passkeyPromptResolver: (value: boolean) => void;
	private _debounceTimer: any;

	// --- Passkey Logic ---

	onPasskeyPromptChoice(choice: boolean) {
		console.log("[Passkey Modal] User choice:", choice);
		this.showPasskeyPrompt = false;
		if (this._passkeyPromptResolver) {
			this._passkeyPromptResolver(choice);
			this._passkeyPromptResolver = null;
		}
	}

	onPasskeySuccessContinue(): void {
		this.showPasskeySuccess = false;
		this.successLogin(this.appLoginToken);
	}

	private async _offerPasskeyRegistration(token: string, identifier: string): Promise<boolean> {
		console.log("[Passkeys] Checking availability", {
			allowPasskeys: this.projectFlow?.loginSettings?.allowPasskeys,
			settings: this.projectFlow?.loginSettings,
		});

		if (!this.projectFlow?.loginSettings?.allowPasskeys) return false;

		const isSupported = await this._biometricSecurityService.isPasskeySupported();

		console.log("[Passkeys] Passkey Supported:", isSupported);

		if (!isSupported) return false;

		// Show custom modal and wait for response
		const accepted = await new Promise<boolean>((resolve) => {
			this._passkeyPromptResolver = resolve;
			this.showPasskeyPrompt = true;
			this._changeDetectorRef.detectChanges(); // Ensure UI updates
		});

		if (accepted) {
			await this._registerPasskey(token, identifier);
			return true;
		}

		return false;
	}

	private async _registerPasskey(token: string, username: string) {
		this.loading = true;

		try {
			const { credentialId } = await this._registerBiometric(username);

			const { secretToEncrypt, tokenForRequest, isToken } = await this._preparePasskeySecret(token);

			const payloadString = await this._encryptPasskeySecret(username, secretToEncrypt, isToken);

			await this._uploadPasskeyToZelf(username, credentialId, payloadString, tokenForRequest);

			this._handlePasskeySuccess();
		} catch (error) {
			console.error("Passkey Registration Failed", error);
		}

		this.loading = false;
	}

	private async _registerBiometric(username: string): Promise<{ credentialId: string }> {
		const userId = new TextEncoder().encode(username);
		return this._biometricSecurityService.registerPasskey(username, userId);
	}

	private async _preparePasskeySecret(token: string): Promise<{ secretToEncrypt: string; tokenForRequest: string; isToken: boolean }> {
		if (this.project?._id === environment.verifikProject || this.project?._id === environment.sandboxProject) {
			return this._prepareVerifikSecret(token);
		}

		return this._prepareAppSecret(token);
	}

	private async _prepareVerifikSecret(token: string): Promise<{ secretToEncrypt: string; tokenForRequest: string; isToken: boolean }> {
		let tokenForRequest = token;
		try {
			// We must set the current token first so the refresh request is authenticated
			localStorage.setItem("accessToken", token);
			const refreshResponse: any = await firstValueFrom(this._authService.projectLogin(24, token));

			if (refreshResponse && refreshResponse.data && refreshResponse.data.accessToken) {
				tokenForRequest = refreshResponse.data.accessToken;
				// Update valid token in local storage
				localStorage.setItem("accessToken", tokenForRequest);
				this.appLoginToken = tokenForRequest;
			}
		} catch (e) {
			console.warn("[Passkey Registration] Failed to refresh token for long-lived passkey", e);
		}

		return { secretToEncrypt: tokenForRequest, tokenForRequest, isToken: true };
	}

	private async _prepareAppSecret(token: string): Promise<{ secretToEncrypt: string; tokenForRequest: string; isToken: boolean }> {
		// Generate random password
		const password = AuthUtils.generateRandomPassword(32);

		// Register with backend (hashed)
		console.log({ token });
		await firstValueFrom(this._authService.registerAppPasskey(password, token));

		return { secretToEncrypt: password, tokenForRequest: token, isToken: false };
	}

	private async _encryptPasskeySecret(username: string, secret: string, isToken: boolean): Promise<string> {
		const encryptionKey = await this._biometricSecurityService.deriveEncryptionKey(username);
		const { ciphertext, iv } = await this._biometricSecurityService.encryptData(encryptionKey, secret);

		if (isToken) {
			return JSON.stringify({ iv, ciphertext, tokenExp: this._getTokenExpiration(secret) });
		}
		return JSON.stringify({ iv, ciphertext, type: "password" });
	}

	private async _uploadPasskeyToZelf(username: string, credentialId: string, payloadString: string, tokenForRequest: string) {
		const identifier = `${username.replace(/[^a-zA-Z0-9]/g, "_")}_passKey`;

		// Store token in localStorage so HttpWrapperService can add Authorization header (ensure it's the valid one)
		localStorage.setItem("accessToken", tokenForRequest);

		await this._passkeyZelfService.createPasskey({
			publicData: {
				identifier,
				project: this.project?._id,
				category: `${this.project?._id}_passKeys`,
				credentialId,
				expiresAt: this._getTokenExpiration(tokenForRequest),
				email: this.typeLogin === "email" ? username : undefined,
				phone: this.typeLogin === "phone" ? username : undefined,
			},
			identifier,
			payload: payloadString, // Encrypted Token or Password
		} as any);
	}

	private _handlePasskeySuccess() {
		// Show success modal
		this.showPasskeySuccess = true;
		this.loading = false;
		this._changeDetectorRef.markForCheck(); // Ensure UI updates
	}

	private _checkZkAuthAvailability(loginValue: string) {
		if (!this.hasZkOnboarding) return;

		this.offerZkLogin = false;

		clearTimeout(this._debounceTimer);

		this._debounceTimer = setTimeout(async () => {
			if (!loginValue) return;

			try {
				let query: any = { category: "" }; // Empty category to search by email/phone only without category filter

				if (this.typeLogin === "email") {
					query.email = loginValue;
				} else {
					query.phone = loginValue;
				}

				const response = await this._passkeyZelfService.listPasskeys(query);

				if (response && response.data && response.data.length > 0) {
					// Filter by category "appRegistration"
					const hasAppRegistration = response.data.some((item) => item.publicData?.type === "appRegistration");

					if (hasAppRegistration) {
						this.offerZkLogin = true;

						// Find the app registration item to get its IPFS URL
						const appRegItem = response.data.find((item) => item.publicData?.type === "appRegistration");
						if (appRegItem) {
							this.zkAuthRecord = appRegItem;
						}

						this._changeDetectorRef.markForCheck();
					}
				}
			} catch (e) {
				console.error("Failed to check ZkAuth availability", e);
			}
		}, 500);
	}

	private async _checkAndLoginWithPasskey(identifier: string): Promise<boolean> {
		if (!this.projectFlow?.loginSettings?.allowPasskeys) return false;

		try {
			// 1. Check if Passkey exists
			const rawIdentifier = identifier;
			const constructedIdentifier = `${rawIdentifier.replace(/[^a-zA-Z0-9]/g, "_")}_passKey`;

			let query: any = {
				identifier: constructedIdentifier,
			};

			const response = await this._passkeyZelfService.listPasskeys(query);

			if (response && response.data && response.data.length > 0) {
				// Filter by current Project
				const currentProjectId = this.project?._id;
				const matchingPasskey = response.data.find((f: any) => f.publicData?.category === `${currentProjectId}_passKeys`);

				if (matchingPasskey) {
					// 2. Passkey Found!
					this.passkeyAvailable = true;
					this.loading = true;

					const credentialId = matchingPasskey.publicData?.credentialId;
					const allowCredentials = credentialId ? [credentialId] : [];

					// 3. Authenticate with Passkey (biometric verification)
					await this._biometricSecurityService.authenticatePasskey(allowCredentials);

					// 4. Derive encryption key from identifier
					const encryptionKey = await this._biometricSecurityService.deriveEncryptionKey(identifier);

					// Fetch Encrypted Blob
					const fileUrl = matchingPasskey.url;
					const encryptedFile = await fetch(fileUrl).then((res) => res.json());

					// Handle structure (whether directly in file or nested)
					const payloadString = encryptedFile.encryptedToken || encryptedFile;
					const { iv, ciphertext } = typeof payloadString === "string" ? JSON.parse(payloadString) : payloadString;

					const tokenOrPassword = await this._biometricSecurityService.decryptData(encryptionKey, ciphertext, iv);

					let finalToken: string;

					if (this.project?._id === environment.verifikProject || this.project?._id === environment.sandboxProject) {
						// For Verifik Project, the decrypted data IS the token
						finalToken = tokenOrPassword;
					} else {
						// For other projects, it is the password. Login to get token.
						const loginResponse = await firstValueFrom(this._authService.loginAppPasskey(this.project?._id, identifier, tokenOrPassword));
						if (loginResponse && loginResponse.data && loginResponse.data.token) {
							finalToken = loginResponse.data.token;
						} else {
							throw new Error("Failed to login with passkey password");
						}
					}

					// 4. Success
					this.successLogin(finalToken);
					return true;
				}
			}
		} catch (e) {
			console.error("Passkey Check Failed", e);
			this.loading = false;
		}
		return false;
	}

	private _getTokenExpiration(token: string): number {
		try {
			const payload = JSON.parse(atob(token.split(".")[1]));
			return payload.exp || 0;
		} catch (e) {
			return 0;
		}
	}

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
		private _translocoService: TranslocoService,
		private _passkeyZelfService: PasskeyZelfService,
		private _biometricSecurityService: BiometricSecurityService,
		private _matDialog: MatDialog
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

		const phone = this.signInForm.get("phone")?.value;
		if (phone) this._checkZkAuthAvailability(`${value}${phone}`);
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

					if (projectFlow.type === "onboarding") {
						this.kycProjectFlow = new ProjectFlow(projectFlow);
						if (projectFlow.liveness?.kycType === "zero_knowledge") {
							this.hasZkOnboarding = true;
						}
					}
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
				// We don't want to trigger ZK modal immediately on 'liveness' query param
				// unless we have specific info, for now let's just show biometrics or handle differently
				if (!this.offerZkLogin) {
					this.showBiometrics = true;
				}
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

		this.signInForm
			.get("email")
			?.valueChanges.pipe(takeUntil(this.unsubscriber$))
			.subscribe((value) => {
				if (this.typeLogin === "email") this._checkZkAuthAvailability(value);
			});

		this.signInForm
			.get("phone")
			?.valueChanges.pipe(takeUntil(this.unsubscriber$))
			.subscribe((value) => {
				if (this.typeLogin === "phone") {
					const countryCode = this.signInForm.get("countryCode")?.value;
					if (countryCode && value) this._checkZkAuthAvailability(`${countryCode}${value}`);
				}
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

	get shouldShowBiometricsButton(): boolean {
		if (!this.projectFlow?.loginSettings?.faceLiveness) return false;

		if (this.hasZkOnboarding) {
			return this.offerZkLogin;
		}

		return true;
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

					// Passkey Offer Hook
					this._offerPasskeyRegistration(response.data.token, dataForm.email).then((accepted) => {
						if (accepted) return; // Registration flow took over

						if (response.data?.showFaceLivenessRecommendation) {
							this.showFaceLivenessRecommendation = true;
							this.loading = false;
							return;
						}

						this.loading = false;
						return this.successLogin(response.data.token);
					});
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

					// Passkey Offer Hook for Phone
					this._offerPasskeyRegistration(response.data.token, `${dataForm.countryCode}${dataForm.phone}`).then((accepted) => {
						if (accepted) return;
						return this.successLogin(response.data.token);
					});
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

	async sendOTP(event, gateway): Promise<void> {
		event.preventDefault();

		// Passkey Check
		const idToCheck =
			this.typeLogin === "email" ? this.signInForm.value.email : `${this.signInForm.value.countryCode}${this.signInForm.value.phone}`;

		if (await this._checkAndLoginWithPasskey(idToCheck)) return;

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
		if (this.offerZkLogin) {
			// Open ZK Auth Modal
			const dialogRef = this._matDialog.open(ZkAuthLoginComponent, {
				panelClass: "custom-dialog-container",
				width: "900px",
				height: "700px",
				maxWidth: "95vw",
				maxHeight: "95vh",
				data: {
					project: this.project,
					projectFlow: this.projectFlow,
					record: this.zkAuthRecord,
				},
			});

			dialogRef.afterClosed().subscribe((result) => {
				if (result && result.success && result.token) {
					this.successLogin(result.token);
				}
			});

			return;
		}
	}

	continueRedirection(): void {
		this.sendingOTP = true;

		this.successLogin(this.appLoginToken);
	}

	createAccount(): void {
		window.location.href = `${environment.kycUrl}/kyc/project/${this.project._id}`;
	}
}
