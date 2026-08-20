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
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { MatTabsModule } from "@angular/material/tabs";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { DEFAULT_PHONE_COUNTRY_CODE } from "app/core/constants/phone-defaults";
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
import { CountryCodeSelectComponent } from "app/core/components/country-code-select/country-code-select.component";
import { CountryService } from "app/core/services/country.service";
import { ProjectStorageService } from "app/core/services/project-storage.service";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { DemoService } from "app/modules/demo/demo.service";
import { environment } from "environments/environment";
import { OneTimePasswordInputComponent } from "../../../core/components/one-time-password-input/one-time-password-input.component";

import { PasswordlessService } from "../passwordless.service";
import { PasskeySuccessComponent } from "../passkey-success/passkey-success.component";
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
        CountryCodeSelectComponent,
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
    ],
})
export class AuthSignInComponent implements OnInit, OnDestroy {
    private unsubscriber$: Subject<void> = new Subject<void>();

    activeSendOtp: boolean;
    appLoginToken: string;
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
    signInForm: FormGroup;
    smsSent: boolean;
    typeLogin: string;

    // Passkey State
    isPasskeyLoading: boolean = false;
    passkeyAvailable: boolean = false;
    passkeyExistsForContact: boolean = false;
    lastPasskeyAttemptFound: boolean = false;
    showPasskeyEnrollStep: boolean = false;
    showPasskeySuccess: boolean = false;
    private _pendingPasskeyIdentifier: string = "";
    private _passkeyDebounceTimer: any;

    // --- Passkey Logic ---

    onPasskeySuccessContinue(): void {
        this.showPasskeySuccess = false;
        this.successLogin(this.appLoginToken);
    }

    /**
     * After OTP success, offer an inline Faster Login enroll step when passkeys are enabled.
     * Skips the offer when this contact already has a passkey (e.g. user chose OTP instead of Passkey).
     * Returns true when enrollment UI took over (caller should not redirect yet).
     */
    private async _offerPasskeyRegistration(token: string, contact: string): Promise<boolean> {
        if (!this.projectFlow?.loginSettings?.allowPasskeys) return false;

        const isSupported = await this._biometricSecurityService.isPasskeySupported();

        if (!isSupported) return false;

        try {
            const existing = await this._listPasskeysForContact(contact, false);

            if (existing.length > 0) {
                this.passkeyExistsForContact = true;
                return false;
            }
        } catch (e) {
            console.warn("[Passkeys] Could not check existing passkeys before enroll offer", e);
        }

        this.appLoginToken = token;
        this._pendingPasskeyIdentifier = contact;
        this.showPasskeyEnrollStep = true;
        this.loading = false;
        this._changeDetectorRef.markForCheck();

        return true;
    }

    async setupPasskey(): Promise<void> {
        if (this.loading || !this.appLoginToken || !this._pendingPasskeyIdentifier) return;

        await this._registerPasskey(this.appLoginToken, this._pendingPasskeyIdentifier);
    }

    skipPasskey(): void {
        this.showPasskeyEnrollStep = false;
        this._pendingPasskeyIdentifier = "";
        this.successLogin(this.appLoginToken);
    }

    private async _registerPasskey(token: string, contact: string) {
        this.loading = true;
        this._changeDetectorRef.markForCheck();

        try {
            const { secretToEncrypt, tokenForRequest, isToken } = await this._preparePasskeySecret(token);

            const clientId =
                this._resolveClientIdFromToken(tokenForRequest) || this._resolveClientIdFromToken(token);

            if (!clientId) {
                throw new Error("Unable to resolve client id for passkey registration");
            }

            const { credentialId } = await this._registerBiometric(contact);

            // Encrypt with client id so the same vault works for email or phone login.
            const payloadString = await this._encryptPasskeySecret(clientId, secretToEncrypt, isToken);

            await this._uploadPasskeyToZelf(clientId, contact, credentialId, payloadString, tokenForRequest);

            this._handlePasskeySuccess();
        } catch (error) {
            console.error("Passkey Registration Failed", error);
            this.loading = false;
            this._changeDetectorRef.markForCheck();
        }
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
            const refreshResponse: any = await firstValueFrom(this._authService.projectLogin(12, token));

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

    private async _encryptPasskeySecret(encryptionSubject: string, secret: string, isToken: boolean): Promise<string> {
        const encryptionKey = await this._biometricSecurityService.deriveEncryptionKey(encryptionSubject);
        const { ciphertext, iv } = await this._biometricSecurityService.encryptData(encryptionKey, secret);

        if (isToken) {
            return JSON.stringify({ iv, ciphertext, tokenExp: this._getTokenExpiration(secret) });
        }
        return JSON.stringify({ iv, ciphertext, type: "password" });
    }

    private async _uploadPasskeyToZelf(
        clientId: string,
        contact: string,
        credentialId: string,
        payloadString: string,
        tokenForRequest: string
    ) {
        const identifier = `${clientId}_passKey`;
        const isEmail = contact.includes("@");

        // Store token in localStorage so HttpWrapperService can add Authorization header (ensure it's the valid one)
        localStorage.setItem("accessToken", tokenForRequest);

        await this._passkeyZelfService.createPasskey({
            publicData: {
                identifier,
                clientId,
                project: this.project?._id,
                category: `${this.project?._id}_passKeys`,
                credentialId,
                expiresAt: this._getTokenExpiration(tokenForRequest),
                email: isEmail ? contact : undefined,
                phone: !isEmail ? contact : undefined,
            },
            identifier,
            payload: payloadString, // Encrypted Token or Password
        } as any);
    }

    private _handlePasskeySuccess() {
        this.showPasskeyEnrollStep = false;
        this._pendingPasskeyIdentifier = "";
        this.showPasskeySuccess = true;
        this.loading = false;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Resolve the stable client id from a login JWT (`id` on passwordless tokens, `clientId` after project-login).
     */
    private _resolveClientIdFromToken(token: string): string {
        try {
            const decoded = AuthUtils.decodeToken(token) || {};
            return `${decoded.clientId || decoded.id || ""}`.trim();
        } catch {
            return "";
        }
    }

    private async _listPasskeysForContact(contact: string, fetchEncryptedContent = false): Promise<any[]> {
        const isEmail = contact.includes("@");
        const response = await this._passkeyZelfService.listPasskeys(
            isEmail ? { email: contact } : { phone: contact },
            fetchEncryptedContent
        );

        const currentProjectId = this.project?._id;

        return (response?.data || []).filter((f: any) => {
            const type = f.publicData?.type;
            const category = f.publicData?.category;
            const isPasskey = type === "passKeys" || `${category || ""}`.endsWith("_passKeys");

            return isPasskey && category === `${currentProjectId}_passKeys`;
        });
    }

    private async _checkAndLoginWithPasskey(contact: string): Promise<boolean> {
        if (!this.projectFlow?.loginSettings?.allowPasskeys) return false;

        this.lastPasskeyAttemptFound = false;

        let matches: any[] = [];

        try {
            matches = await this._listPasskeysForContact(contact, true);
        } catch (e) {
            console.error("[Passkey Login] Failed to list passkeys", e);
            return false;
        }

        if (!matches.length) return false;

        // A passkey exists for this account; any failure from here is an auth/decrypt error, not "not found".
        this.lastPasskeyAttemptFound = true;

        try {
            this.passkeyAvailable = true;
            this.loading = true;
            this._changeDetectorRef.markForCheck();

            // Offer every registered credential so the authenticator can use whichever lives on this device
            const allowCredentials = matches.map((m) => m.publicData?.credentialId).filter((id: any): id is string => Boolean(id));

            const { credentialId: usedCredentialId } = await this._biometricSecurityService.authenticatePasskey(allowCredentials);

            // Prefer the record tied to the credential actually used, then fall back to the rest
            const ordered = [
                ...matches.filter((m) => m.publicData?.credentialId === usedCredentialId),
                ...matches.filter((m) => m.publicData?.credentialId !== usedCredentialId),
            ];

            const clientId =
                `${ordered[0]?.publicData?.clientId || ""}`.trim() ||
                `${`${ordered[0]?.publicData?.identifier || ""}`.replace(/_passKey$/, "")}`.trim();

            if (!clientId) {
                throw new Error("Passkey record is missing client id");
            }

            // Decrypt with the client-id-derived key (stable across email/phone)
            const encryptionKey = await this._biometricSecurityService.deriveEncryptionKey(clientId);

            const tokenOrPassword = await this._decryptFirstAvailablePasskey(ordered, encryptionKey);

            if (tokenOrPassword === null) {
                throw new Error("Unable to decrypt any passkey record for this account");
            }

            let finalToken: string;

            if (this.project?._id === environment.verifikProject || this.project?._id === environment.sandboxProject) {
                // For Verifik Project, the decrypted data IS the token
                finalToken = tokenOrPassword;
            } else {
                // For other projects, it is the password. Login to get token.
                const loginResponse = await firstValueFrom(this._authService.loginAppPasskey(this.project?._id, contact, tokenOrPassword));

                if (loginResponse && loginResponse.data && loginResponse.data.token) {
                    finalToken = loginResponse.data.token;
                } else {
                    throw new Error("Failed to login with passkey password");
                }
            }

            this.successLogin(finalToken);
            return true;
        } catch (e) {
            console.error("[Passkey Login] Authentication failed", e);
            this.loading = false;
            this._changeDetectorRef.markForCheck();
            return false;
        }
    }

    /**
     * Tries to decrypt each candidate passkey record in order, returning the first success.
     * Returns null when none can be decrypted.
     */
    private async _decryptFirstAvailablePasskey(passkeys: any[], encryptionKey: CryptoKey): Promise<string | null> {
        for (const passkey of passkeys) {
            try {
                let iv: string, ciphertext: string;

                if (passkey.encryptedContent) {
                    ({ iv, ciphertext } = passkey.encryptedContent);
                } else if (passkey.url) {
                    const res = await fetch(passkey.url);
                    const contentType = `${res.headers.get("content-type") || ""}`.toLowerCase();
                    if (contentType.includes("image/")) {
                        continue;
                    }

                    const raw = (await res.text()).trim();
                    if (!raw || raw.charCodeAt(0) === 0x89 || raw.startsWith("PNG")) {
                        continue;
                    }

                    const encryptedFile = JSON.parse(raw);
                    const payloadString = encryptedFile.encryptedToken || encryptedFile;
                    ({ iv, ciphertext } = typeof payloadString === "string" ? JSON.parse(payloadString) : payloadString);
                    passkey.encryptedContent = { iv, ciphertext };
                } else {
                    continue;
                }

                if (!iv || !ciphertext) continue;

                return await this._biometricSecurityService.decryptData(encryptionKey, ciphertext, iv);
            } catch (e) {
                console.warn("[Passkey Login] Could not decrypt a passkey record, trying the next one", e);
            }
        }

        return null;
    }

    private _getTokenExpiration(token: string): number {
        try {
            const payload = AuthUtils.decodeToken(token) || {};
            if (payload.exp) return payload.exp;

            const expiresAt = payload.expiresAt;
            if (typeof expiresAt === "number") {
                return expiresAt > 1e12 ? Math.floor(expiresAt / 1000) : expiresAt;
            }

            return 0;
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
        private _countryService: CountryService,
        private _demoService: DemoService,
        private _formBuilder: UntypedFormBuilder,
        private _passwordlessService: PasswordlessService,
        private _projectStorageService: ProjectStorageService,
        private _splashScreenService: FuseSplashScreenService,
        private _translocoService: TranslocoService,
        private _passkeyZelfService: PasskeyZelfService,
        private _biometricSecurityService: BiometricSecurityService,
    ) {
        this.setLanguage();

        this._passwordlessService.flow = "login";

        this.emailValidation = null;
        this.phoneValidation = null;

        this._splashScreenService.show();

        this.demoData = this._demoService.getDemoData();

        this._demoService.cleanVariables();

        localStorage.removeItem("accessToken");

        this.deviceDetails = this._appService.getDeviceDetails();

        this.sendingOTP = false;
        this.smsSent = false;
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

                this.location.countryCode = this._countryService.findCountryCodeByName(this.location.country);
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
        if (phone) {
            this._checkPasskeyAvailability(this._isPhoneComplete(value, phone) ? `${value}${phone}` : "");
        } else {
            this._checkPasskeyAvailability("");
        }
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

                this._applyDefaultLanguageFromProject();

                this._appService.applyDynamicTheming(this.project);

                for (let index = 0; index < v.data.projectFlows.length; index++) {
                    const projectFlow = v.data.projectFlows[index];

                    if (projectFlow.type === "onboarding") {
                        this.kycProjectFlow = new ProjectFlow(projectFlow);
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

            const handoffToken = queryParams.token;

            if ((type === "login" || type === "onboarding") && handoffToken) {
                const redirectType = type === "onboarding" ? "onboarding" : "login";
                this._authService.handleRedirect(this.projectFlow, this.project._id, handoffToken, redirectType);
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
                if (this.typeLogin !== "email") return;

                this._checkPasskeyAvailability(this.isValidEmail(value) ? value : "");
            });

        this.signInForm
            .get("phone")
            ?.valueChanges.pipe(takeUntil(this.unsubscriber$))
            .subscribe((value) => {
                if (this.typeLogin !== "phone") return;

                const countryCode = this.signInForm.get("countryCode")?.value;

                if (countryCode && value) {
                    this._checkPasskeyAvailability(this._isPhoneComplete(countryCode, value) ? `${countryCode}${value}` : "");
                } else {
                    this._checkPasskeyAvailability("");
                }
            });
    }

    /**
     * Whether the entered phone matches the expected length for the selected country code.
     */
    private _isPhoneComplete(countryCode: string, phone: string): boolean {
        if (!countryCode || !phone) return false;

        const [min, max] = this._countryService.getPhoneLengthForCountryCode(countryCode);

        return phone.length >= min && phone.length <= max;
    }

    /**
     * Debounced lookup that flags whether a passkey already exists for the given contact,
     * so the passkey CTA only appears when it can actually be used.
     */
    private _checkPasskeyAvailability(contact: string): void {
        clearTimeout(this._passkeyDebounceTimer);

        this.passkeyExistsForContact = false;

        if (!this.canOfferPasskey || !contact) {
            this._changeDetectorRef.markForCheck();
            return;
        }

        this._passkeyDebounceTimer = setTimeout(async () => {
            try {
                const matches = await this._listPasskeysForContact(contact, false);

                this.passkeyExistsForContact = matches.length > 0;

                this._changeDetectorRef.markForCheck();
            } catch (e) {
                console.error("Failed to check passkey availability", e);
            }
        }, 500);
    }

    buttonSendOtp() {
        this.activeSendOtp =
            this.typeLogin === "email"
                ? this.projectFlow.loginSettings.email && !this.emailSent
                : this.projectFlow.loginSettings.phone && !this.smsSent;
    }

    setFieldRequiredInForm() {
        this.selectedCountryCode =
            localStorage.getItem("defaultCountryCode") || this.location?.countryCode || DEFAULT_PHONE_COUNTRY_CODE;

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
        this._syncPasskeyAvailabilityFromForm();
    }

    /**
     * Prefill from localStorage does not emit valueChanges, so run an explicit passkey lookup
     * for the current contact after the form is built or the login tab changes.
     */
    private _syncPasskeyAvailabilityFromForm(): void {
        if (!this.signInForm) return;

        if (this.typeLogin === "email") {
            const email = this.signInForm.get("email")?.value;
            this._checkPasskeyAvailability(this.isValidEmail(email) ? email : "");
            return;
        }

        const countryCode = this.signInForm.get("countryCode")?.value;
        const phone = this.signInForm.get("phone")?.value;
        this._checkPasskeyAvailability(this._isPhoneComplete(countryCode, phone) ? `${countryCode}${phone}` : "");
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

        this.passkeyExistsForContact = false;

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

                    this._offerPasskeyRegistration(response.data.token, dataForm.email).then((enrollOffered) => {
                        if (enrollOffered) return;

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
                this.location,
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

                    this._offerPasskeyRegistration(response.data.token, `${dataForm.countryCode}${dataForm.phone}`).then((enrollOffered) => {
                        if (enrollOffered) return;

                        this.loading = false;
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

    createAccount(): void {
        window.location.href = `${environment.kycUrl}/kyc/project/${this.project._id}`;
    }

    /**
     * Whether the project flow exposes passkey login, used to render the dedicated passkey CTA.
     */
    get canOfferPasskey(): boolean {
        return Boolean(this.projectFlow?.loginSettings?.allowPasskeys);
    }

    /**
     * Only surface the passkey CTA once a passkey has been confirmed for the entered contact.
     */
    get showPasskeyButton(): boolean {
        return this.canOfferPasskey && this.passkeyExistsForContact;
    }

    /**
     * Explicit passkey sign-in entry point for the redesigned UI. Reuses the existing passkey
     * detection/login flow without introducing new crypto or network logic.
     */
    async signInWithPasskey(): Promise<void> {
        if (this.loading || !this.canOfferPasskey) return;

        const identifier =
            this.typeLogin === "email"
                ? this.signInForm.value.email
                : `${this.signInForm.value.countryCode || ""}${this.signInForm.value.phone || ""}`;

        if (!identifier) {
            this.errorLogin(this.typeLogin === "email" ? "required_email" : "required_phone");
            return;
        }

        this.loading = true;
        this._changeDetectorRef.markForCheck();

        const loggedIn = await this._checkAndLoginWithPasskey(identifier);

        if (!loggedIn) {
            this.loading = false;
            this.errorLogin(this.lastPasskeyAttemptFound ? "passkey_login_failed" : "passkey_not_found");
            this._changeDetectorRef.markForCheck();
        }
    }

    /**
     * Masked representation of the destination the OTP was sent to (privacy-friendly).
     */
    get maskedDestination(): string {
        if (this.typeLogin === "email") {
            return this._maskEmail(this.signInForm?.value?.email || "");
        }

        const countryCode = this.signInForm?.value?.countryCode || "";
        const phone = `${this.signInForm?.value?.phone || ""}`;

        if (!phone) return "";

        const tail = phone.slice(-4);
        const masked = phone.length > 4 ? `${"•".repeat(Math.max(phone.length - 4, 0))}${tail}` : tail;

        return `${countryCode} ${masked}`.trim();
    }

    private _maskEmail(email: string): string {
        if (!email || !email.includes("@")) return email;

        const [localPart, domain] = email.split("@");
        const visible = localPart.slice(0, 1);
        const maskedLocal = localPart.length > 1 ? `${visible}${"•".repeat(Math.min(localPart.length - 1, 4))}` : visible;

        return `${maskedLocal}@${domain}`;
    }

    /**
     * Resets the OTP step so the user can edit their email/phone again.
     */
    changeContact(): void {
        this.stopTimer();

        this.passkeyExistsForContact = false;

        if (this.typeLogin === "email") {
            this.emailValidation = null;
            this.emailSent = false;
            this.signInForm.get("email")?.enable();
            this.signInForm.get("emailOTP")?.reset();
        } else {
            this.phoneValidation = null;
            this.smsSent = false;
            this.signInForm.get("phone")?.enable();
            this.signInForm.get("countryCode")?.enable();
            this.signInForm.get("phoneOTP")?.reset();
        }

        this.buttonSendOtp();
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Resolves whether the redesigned surface should render in dark mode. Prefers the branding
     * background luminance when provided, otherwise falls back to the OS color scheme.
     */
    get isDark(): boolean {
        const background = this.project?.branding?.backgroundColor;

        if (background) {
            return this._isColorDark(background);
        }

        if (!isPlatformBrowser(this.platformId) || typeof window === "undefined" || !window.matchMedia) {
            return false;
        }

        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    private _isColorDark(color: string): boolean {
        const hex = color.replace("#", "").trim();

        if (hex.length !== 3 && hex.length !== 6) return false;

        const normalized = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;

        const r = parseInt(normalized.substring(0, 2), 16);
        const g = parseInt(normalized.substring(2, 4), 16);
        const b = parseInt(normalized.substring(4, 6), 16);

        if ([r, g, b].some((v) => Number.isNaN(v))) return false;

        // Perceived luminance (ITU-R BT.601)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        return luminance < 0.5;
    }
}
