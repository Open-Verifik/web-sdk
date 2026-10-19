import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { TranslocoService } from "@ngneat/transloco";
import { catchError, Observable, of, shareReplay, Subject, switchMap, take, takeUntil } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { DEFAULT_PHONE_COUNTRY_CODE } from "app/core/constants/phone-defaults";
import { AuthService } from "app/core/auth/auth.service";
import { PromptTemplate } from "app/core/models/prompt-template.model";
import { CountryOption, CountryService } from "app/core/services/country.service";
import {
	isUsableAppRegistrationSessionToken,
	readSignUpAppRegistrationToken,
	saveSignUpAppRegistrationToken,
} from "app/core/services/app-registration-session.storage";
import { AppService } from "app/core/services/app.service";
import { shouldBlockCountry } from "app/modules/auth/sign-up/kyc-country-restriction";
import { ImageScan } from "app/modules/auth/project";
import { KYCService } from "app/modules/auth/kyc.service";
import { PasswordlessService } from "app/modules/auth/passwordless.service";
import { DemoService } from "app/modules/demo/demo.service";
import {
	attemptsRemaining,
	cameraStepsAhead,
	completionStatus,
	contactScreens,
	ContactScreen,
	documentNeedsBack,
	enrollmentClientFrom,
	hasContactBlock,
	needsEmailCode,
	needsPhoneCode,
	resumeScreen,
	VerifyScreen,
	VerifySettings,
} from "./verify-flow";
import { VerifyStyleId } from "./verify-style";

export type VerifySheet = null | "acceptedIds" | "language" | "otherOptions" | "document" | "camera" | "trouble";

export interface VerifyDraft {
	agreements: boolean;
	countryCode: string;
	email: string;
	firstName: string;
	fullName: string;
	lastName: string;
	otp: string;
	phone: string;
	phoneGateway: string;
}

@Injectable()
export class VerifySessionService implements OnDestroy {
	busy = false;
	captureSide: "front" | "back" = "front";
	category = "";
	compact = false;
	copied = false;
	country = "";
	countries: CountryOption[] = [];
	detectedCountry = "";
	draft: VerifyDraft = this._emptyDraft();
	errorKey = "";
	history: VerifyScreen[] = [];
	mode: "auto" | "manual" = "auto";
	pending: ImageScan | null = null;
	project: Project | null = null;
	projectFlow: ProjectFlow | null = null;
	projectId = "";
	registration: any = null;
	retryTarget: "front" | "selfie" = "front";
	screen: VerifyScreen = "loading";
	sheet: VerifySheet = null;
	previewStyle: VerifyStyleId | null = null;
	template: PromptTemplate | null = null;
	readonly changed = new Subject<void>();
	readonly selfieDone$ = new Subject<void>();

	private _agreed = false;
	private _destroy$ = new Subject<void>();
	private _device: any;
	private _documentFailures = 0;
	private _key = "";
	private _livenessFailures = 0;
	private _location: any = null;
	private _emailSend$: Observable<unknown> | null = null;
	private _phoneSend$: Observable<unknown> | null = null;
	private _redirectTimer: ReturnType<typeof setTimeout> | null = null;
	private _skippedDocument = false;
	private _skippedLiveness = false;
	private _token = "";

	constructor(
		private _app: AppService,
		private _auth: AuthService,
		private _countries: CountryService,
		private _demo: DemoService,
		private _kyc: KYCService,
		private _passwordless: PasswordlessService,
		private _router: Router,
		private _transloco: TranslocoService
	) {
		this._passwordless.flow = "onboarding";
		this._device = this._app.getDeviceDetails();
		this._watchLocation();
	}

	ngOnDestroy(): void {
		if (this._redirectTimer) clearTimeout(this._redirectTimer);
		this._destroy$.next();
		this._destroy$.complete();
	}

	get settings(): VerifySettings | null {
		return this.projectFlow ? settingsFromFlow(this.projectFlow) : null;
	}

	get showHeader(): boolean {
		return this.history.length > 0 && this.screen !== "loading" && this.screen !== "upgrade" && this.screen !== "countryBlocked";
	}

	get sessionUrl(): string {
		const params = new URLSearchParams();

		if (this._token) params.set("token", this._token);
		if (this.previewStyle) params.set("style", this.previewStyle);

		const query = params.toString();

		return `${window.location.origin}/verify/${this.projectId}${query ? `?${query}` : ""}`;
	}

	get languages(): Array<{ id: string; label: string }> {
		const langs = this._transloco.getAvailableLangs();

		if (!Array.isArray(langs)) return [];

		return langs.map((lang) => (typeof lang === "string" ? { id: lang, label: lang } : { id: lang.id, label: lang.label || lang.id }));
	}

	get activeLang(): string {
		return this._transloco.getActiveLang();
	}

	get categories(): string[] {
		if (!this.projectFlow || !this.settings) return [];

		const fromFlow = this.projectFlow.documentCategories(this.country) || [];
		const allowed = fromFlow.length ? fromFlow : flagCategories(this.settings);

		return allowed.filter((category) => categoryAllowed(category, this.settings));
	}

	get templates(): PromptTemplate[] {
		if (!this.projectFlow || !this.country || !this.category) return [];

		return (this.projectFlow.promptTemplates(this.country, this.category) || []).filter((item) => item && (item._id || item.name));
	}

	get checkBarcode(): boolean {
		return this.captureSide === "back";
	}

	open(projectId: string, rawToken?: string): void {
		const token = resolveToken(projectId, rawToken);
		const key = `${projectId}:${token}`;

		if (key === this._key && this.screen !== "loading") return;

		const sameProject = this.projectId === projectId && this.projectFlow;
		this._key = key;
		this.projectId = projectId;
		this._setToken(token);

		if (sameProject) {
			this._loadRegistrationOrStart();
			return;
		}

		this.screen = "loading";
		this._touch();
		this._passwordless
			.requestProject(projectId, "onboarding")
			.pipe(takeUntil(this._destroy$))
			.subscribe({
				next: (response) => this._applyProject(response),
				error: () => this._fail("verify.errorBody"),
			});
	}

	back(): void {
		if (this.sheet) {
			this.sheet = null;
			this._touch();
			return;
		}

		const previous = this.history.pop();

		if (!previous) return;

		this.screen = previous;
		this._touch();
	}

	openSheet(sheet: VerifySheet): void {
		this.sheet = sheet;
		this._touch();
	}

	closeSheet(): void {
		this.sheet = null;
		this._touch();
	}

	continueContact(): void {
		const settings = this.settings;
		const order = settings ? contactScreens(settings) : [];
		const index = order.indexOf(this.screen as ContactScreen);

		if (index < 0) return;
		if (index < order.length - 1) {
			this._push(order[index + 1]);
			return;
		}

		this._createRegistration();
	}

	setGateway(gateway: string): void {
		this.draft.phoneGateway = gateway;
		this._touch();
	}

	submitCode(): void {
		if (this.screen === "emailCode") this._confirmEmail();
		if (this.screen === "phoneCode") this._confirmPhone();
	}

	resendCode(): void {
		if (this.screen === "emailCode") this._sendEmailCode();
		if (this.screen === "phoneCode") this._sendPhoneCode();
	}

	agree(): void {
		this._agreed = true;

		if (!this.registration) {
			this._createRegistration();
			return;
		}

		this._enterAfterAgree();
	}

	decline(): void {
		this._push("decline");
	}

	backToConsent(): void {
		this.screen = "consent";
		this._touch();
	}

	leaveProject(): void {
		const redirectUrl = this.projectFlow?.integrations?.redirectUrl;

		if (redirectUrl) window.location.href = redirectUrl;
	}

	continueOnDevice(): void {
		this.sheet = null;
		this._enterCapture();
	}

	async copyLink(): Promise<void> {
		try {
			await navigator.clipboard.writeText(this.sessionUrl);
			this.copied = true;
			this._touch();
		} catch {
			this.copied = false;
		}
	}

	skipDocument(): void {
		if (this.settings?.document === "mandatory") return;

		this._skippedDocument = true;

		if (this.settings?.liveness === "skip") {
			this._finish("COMPLETED_WITHOUT_KYC", "skipKYC");
			return;
		}

		this._push("selfieIntro");
	}

	skipLiveness(): void {
		if (this.settings?.liveness === "mandatory") return;

		this._skippedLiveness = true;
		const status = this._skippedDocument || this.settings?.document === "skip" ? "COMPLETED_WITHOUT_KYC" : "COMPLETED";
		const step = status === "COMPLETED_WITHOUT_KYC" ? "skipKYC" : "end";

		this._finish(status, step);
	}

	imReady(): void {
		this.country = this.countries.length === 1 ? this.countries[0].country : this.country;
		this._syncCategory();
		this.sheet = "document";
		this._touch();
	}

	selectCountry(country: string): void {
		this.country = country;
		this.category = "";
		this.template = null;
		this._syncCategory();
		this._touch();
	}

	selectCategory(category: string): void {
		this.category = category;
		this.template = null;
		this._syncTemplate();
		this._touch();
	}

	selectTemplate(template: PromptTemplate): void {
		this.template = template;
		this._touch();
	}

	confirmDocument(): void {
		if (!this.country || !this.category || !this.template) return;

		this.sheet = null;
		this.captureSide = "front";
		void this._openCamera("front");
	}

	async grantCamera(): Promise<void> {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });

			stream.getTracks().forEach((track) => track.stop());
			this.sheet = null;
			this._push(this.captureSide);
		} catch {
			this.errorKey = "verify.cameraBody";
			this._touch();
		}
	}

	onCaptured(scan: ImageScan): void {
		this.pending = scan;
		this._push(this.captureSide === "front" ? "reviewFront" : "reviewBack");
	}

	retake(): void {
		this.pending = null;
		void this._openCamera(this.captureSide);
	}

	useFile(scan: ImageScan): void {
		this.sheet = null;
		this.mode = "manual";
		this.pending = { ...scan, inputMethod: "FILE_UPLOAD", front: this.captureSide === "front" };
		this._push(this.captureSide === "front" ? "reviewFront" : "reviewBack");
	}

	submitPhoto(): void {
		if (this.captureSide === "front") this._submitFront();
		else this._submitBack();
	}

	readyForBack(): void {
		this.captureSide = "back";
		void this._openCamera("back");
	}

	continueSelfie(): void {
		this._push("selfie");
	}

	onSelfie(scan: ImageScan): void {
		this.selfieDone$.next();
		this._submitSelfie(scan);
	}

	tryAgain(): void {
		this.pending = null;
		if (this.retryTarget === "selfie") this._push("selfie");
		else void this._openCamera("front");
	}

	selectLanguage(id: string): void {
		this._transloco.setActiveLang(id);
		this.sheet = null;
		this._touch();
	}

	setMode(mode: "auto" | "manual"): void {
		this.mode = mode;
		this.sheet = null;
		this._touch();
	}

	anotherDevice(): void {
		this.sheet = null;
		this._push("handoff");
	}

	redirectNow(): void {
		if (this._redirectTimer) clearTimeout(this._redirectTimer);

		const token = this._token;
		const projectId = this.project?._id || this.projectId;

		if (!this.projectFlow || !token) return;

		this._auth.handleRedirect(this.projectFlow, projectId, token, "onboarding", Boolean(this.project?.demoMode));
	}

	leaveBlockedCountry(): void {
		this.leaveProject();
	}

	private _applyProject(response: { data: any; planCode?: string }): void {
		this.project = new Project({ ...response.data, type: "onboarding" });
		this.projectFlow = this.project.getOnboardingProjectFlow() || null;
		this._kyc.setProjectData(this.project, this.projectFlow);

		if (enrollmentClientFrom(this.projectFlow?.enrollmentClient) !== "v2") {
			this._router.navigate(["/sign-up", this.projectId], {
				queryParams: this._token ? { token: this._token } : {},
				replaceUrl: true,
			});
			return;
		}

		if (!response.planCode) {
			this.screen = "upgrade";
			this._touch();
			return;
		}

		this._loadCountries();
		this._checkCountry(response);
	}

	private _checkCountry(response: { data: any }): void {
		const allowed = response.data?.allowedCountries || this.project?.allowedCountries;

		if (!allowed?.length || allowed.some((country: string) => String(country).toLowerCase() === "all")) {
			this._loadRegistrationOrStart();
			return;
		}

		this._passwordless
			.requestIpLocation()
			.pipe(takeUntil(this._destroy$))
			.subscribe({
				next: (ip) => {
					if (shouldBlockCountry(allowed, ip?.data)) {
						this.detectedCountry = ip?.data?.country || "";
						this.screen = "countryBlocked";
						this._touch();
						return;
					}

					this._loadRegistrationOrStart();
				},
				error: () => this._loadRegistrationOrStart(),
			});
	}

	private _loadRegistrationOrStart(): void {
		if (!this._token) {
			this._startFresh();
			return;
		}

		this._kyc
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
			.pipe(takeUntil(this._destroy$))
			.subscribe({
				next: (response) => {
					this.registration = response.data;
					this._kyc.appRegistration = this.registration;
					this._documentFailures = this.registration?.failedDocumentValidations?.length || 0;
					this._livenessFailures = this.registration?.failedBiometricValidations?.length || 0;
					this._applyResume();
				},
				error: () => this._startFresh(),
			});
	}

	private _startFresh(): void {
		const settings = this.settings;
		const screens = settings ? contactScreens(settings) : [];

		this._seedPhoneGateway();
		this.history = [];
		this.screen = screens[0] || "consent";
		this._touch();
	}

	private _seedPhoneGateway(): void {
		const gateway = this.settings?.phoneGateway;

		if (gateway === "sms" || gateway === "whatsapp") this.draft.phoneGateway = gateway;
	}

	private _applyResume(): void {
		const settings = this.settings;

		if (!settings) return this._fail("verify.errorBody");

		const document = this.registration?.documentValidation;
		const screen = resumeScreen({
			currentStep: this.registration?.currentStep,
			documentFailed: document?.status === "FAILED",
			documentStep: settings.document,
			emailNeeded: needsEmailCode(settings, this.registration?.emailValidation?.status === "validated"),
			hasBack: Boolean(document?.backUrl),
			hasBiometric: Boolean(this.registration?.biometricValidation),
			hasDocument: Boolean(document),
			livenessStep: settings.liveness,
			needsBack: documentNeedsBack(document?.documentCategory || this.category, document?.requiresBackSide),
			phoneNeeded: needsPhoneCode(settings, this.registration?.phoneValidation?.status === "validated"),
			status: this.registration?.status,
		});

		if (screen === "consent" && this._agreed) {
			this._enterAfterAgree();
			return;
		}

		if (screen === "emailCode") this._sendEmailCode();
		if (screen === "phoneCode") this._sendPhoneCode();
		if (screen === "submitted") {
			this._showSubmitted(this._token);
			return;
		}

		const first = contactScreens(settings)[0] || "consent";

		this.history = screen === first ? [] : [first];
		this.screen = screen;
		this._touch();
	}

	private _createRegistration(): void {
		if (this.busy || !this.project || !this.projectFlow) return;

		this.busy = true;
		this._touch();

		const payload = this._createPayload();

		this._passwordless
			.createAppRegistration(payload)
			.pipe(takeUntil(this._destroy$))
			.subscribe({
				next: (response) => {
					this.busy = false;
					const token = response?.data?.token;

					this.registration = response?.data?.appRegistration;
					if (this.registration) this.registration.token = token;
					this._kyc.appRegistration = this.registration;
					this._setToken(token);
					if (token) saveSignUpAppRegistrationToken(this.projectId, token);

					this._router.navigate(["/verify", this.projectId], {
						queryParams: { token },
						replaceUrl: true,
					});
				},
				error: (error) => {
					this.busy = false;
					this._fail(error?.error?.message || "verify.errorBody");
				},
			});
	}

	private _confirmEmail(): void {
		if (!this.settings) return;

		this.busy = true;
		this._afterSend(this._emailSend$, () => this._kyc.confirmEmailValidation(this.draft.email, this.draft.otp)).subscribe({
			next: () => {
				this.busy = false;
				this.draft.otp = "";
				if (this.registration?.emailValidation) this.registration.emailValidation.status = "validated";
				if (needsPhoneCode(this.settings, false)) {
					this._sendPhoneCode();
					this._push("phoneCode");
					return;
				}

				this._syncContact();
			},
			error: () => {
				this.busy = false;
				this._fail("verify.errorBody");
			},
		});
	}

	private _confirmPhone(): void {
		this.busy = true;
		this._afterSend(this._phoneSend$, () =>
			this._kyc.confirmPhoneValidation(this.draft.countryCode, this.draft.phone, this.draft.otp)
		).subscribe({
			next: () => {
				this.busy = false;
				this.draft.otp = "";
				if (this.registration?.phoneValidation) this.registration.phoneValidation.status = "validated";
				this._syncContact();
			},
			error: () => {
				this.busy = false;
				this._fail("verify.errorBody");
			},
		});
	}

	private _sendEmailCode(): void {
		this._emailSend$ = this._rememberSend(this._kyc.sendAppRegistationEmailValidation(this.draft.email || this.registration?.email));
	}

	private _sendPhoneCode(): void {
		const gateway = this.draft.phoneGateway === "both" ? "sms" : this.draft.phoneGateway || "sms";

		this._phoneSend$ = this._rememberSend(
			this._kyc.sendAppRegistrationPhoneValidation(this.draft.countryCode, this.draft.phone || this.registration?.phone, gateway)
		);
	}

	private _rememberSend(send$: Observable<unknown>): Observable<unknown> {
		const remembered = send$.pipe(
			catchError(() => of(null)),
			shareReplay(1)
		);

		remembered.pipe(takeUntil(this._destroy$)).subscribe();

		return remembered;
	}

	private _afterSend<T>(send$: Observable<unknown> | null, confirm: () => Observable<T>): Observable<T> {
		return (send$ || of(null)).pipe(
			take(1),
			switchMap(() => confirm())
		);
	}

	private _syncContact(): void {
		this._kyc.syncAppRegistration("signUpForm", "ONGOING").subscribe({
			next: () => {
				if (this._agreed) this._enterAfterAgree();
				else this._push("consent");
			},
			error: () => this._push("consent"),
		});
	}

	private _enterAfterAgree(): void {
		const settings = this.settings;

		if (!settings) return;
		if (!cameraStepsAhead(settings) || (settings.document === "skip" && settings.liveness === "skip")) {
			this._finish("COMPLETED_WITHOUT_KYC", "skipKYC");
			return;
		}

		if (!this.compact) {
			this._push("handoff");
			return;
		}

		this._enterCapture();
	}

	private _enterCapture(): void {
		const settings = this.settings;

		if (!settings) return;
		if (settings.document !== "skip") {
			this._push("ready");
			return;
		}

		if (settings.liveness !== "skip") {
			this._push("selfieIntro");
			return;
		}

		this._finish("COMPLETED_WITHOUT_KYC", "skipKYC");
	}

	private async _openCamera(side: "front" | "back"): Promise<void> {
		this.captureSide = side;
		this.pending = null;

		if (await cameraAlreadyGranted()) {
			this.sheet = null;
			this._push(side);
			return;
		}

		this.sheet = "camera";
		this._touch();
	}

	private _submitFront(): void {
		this._postDocument(false);
	}

	private _submitBack(): void {
		this._postDocument(true);
	}

	private _postDocument(back: boolean): void {
		if (!this.pending || !this.template || this.busy) return;

		const settings = this.settings;
		const failures = this.registration?.failedDocumentValidations?.length || this._documentFailures;

		if (settings && attemptsRemaining(settings.documentMaxAttempts, failures) <= 0) {
			this._finish("FAILED", "end");
			return;
		}

		this.busy = true;
		this._touch();

		const body: any = {
			category: this.category,
			country: this.country,
			force: Boolean(this.registration?.documentValidation) || failures > 0,
			inputMethod: this.pending.inputMethod,
			promptTemplate: this.template._id || this.template,
		};

		if (back) {
			body.backImage = this.pending.base64Image;
			if (this.pending.barcodeReadAttempts) body.barcodeReadAttempts = this.pending.barcodeReadAttempts;
		} else {
			body.image = this.pending.base64Image;
			body.documentFace = this.pending.face;
		}

		this._kyc.createDocumentValidation(body).subscribe({
			next: (response) => this._afterDocument(response, back),
			error: () => this._failAttempt("document"),
		});
	}

	private _afterDocument(response: any, back: boolean): void {
		this.busy = false;
		const document = response?.data?.documentValidation;

		this.registration = this.registration || {};
		this.registration.documentValidation = document || this.registration.documentValidation;
		if (response?.data?.appRegistration?.informationValidation) {
			this.registration.informationValidation = response.data.appRegistration.informationValidation;
		}
		if (response?.data?.documentFace || response?.data?.appRegistration?.documentFace) {
			this.registration.documentFace = response.data.documentFace || response.data.appRegistration.documentFace;
		} else if (this.pending?.face) {
			this.registration.documentFace = { base64: this.pending.face };
		}
		this._kyc.appRegistration = this.registration;

		if (document?.status === "FAILED") {
			this._failAttempt("document");
			return;
		}

		const needsBack = documentNeedsBack(this.category, this.template?.requiresBackSide ?? document?.requiresBackSide);

		if (!back && needsBack) {
			this.pending = null;
			this._push("flip");
			return;
		}

		this._afterDocumentDone();
	}

	private _afterDocumentDone(): void {
		if (this.settings?.liveness !== "skip") {
			this._push("selfieIntro");
			return;
		}

		this._finish("COMPLETED", "end");
	}

	private _submitSelfie(scan: ImageScan): void {
		const settings = this.settings;
		const failures = this.registration?.failedBiometricValidations?.length || this._livenessFailures;

		if (settings && attemptsRemaining(settings.livenessMaxAttempts, failures) <= 0) {
			this._finish("FAILED", "end");
			return;
		}

		this.busy = true;
		this._touch();

		this._kyc
			.createBiometricValidation({
				force: Boolean(this.registration?.biometricValidation),
				image: scan.face || scan.base64Image,
				os: this._demo.detectOS(),
			})
			.subscribe({
				next: (response) => {
					this.registration.biometricValidation = response?.data?.biometricValidation;
					this.registration.person = response?.data?.person;
					this.registration.livenessScore = response?.data?.biometricValidation?.livenessScore;
					this._kyc.appRegistration = this.registration;

					if (this.registration.biometricValidation?.status === "failed") {
						this._failAttempt("liveness");
						return;
					}

					if (this.registration.documentValidation) {
						this._compareAndFinish();
						return;
					}

					this._finish(this._score(), "end");
				},
				error: () => this._failAttempt("liveness"),
			});
	}

	private _compareAndFinish(): void {
		this._kyc.compareFaces().subscribe({
			next: (response) => {
				this.registration.compareFaceVerification = response?.data?.compareFaceVerification;
				this._kyc.appRegistration = this.registration;
				this._finish(this._score(), "end");
			},
			error: () => this._finish("FAILED", "end"),
		});
	}

	private _score(): "COMPLETED" | "FAILED" | "COMPLETED_WITHOUT_KYC" {
		const settings = this.settings;
		const compare = this.registration?.compareFaceVerification;

		return completionStatus({
			compareMinScore: settings?.compareMinScore || 0.85,
			comparePassed: compare?.result?.passed,
			compareScore: compare?.result?.score,
			documentSkipped: Boolean(this._skippedDocument || settings?.document === "skip"),
			hasCompare: Boolean(compare),
			livenessMinScore: settings?.livenessMinScore || 0.65,
			livenessScore: this.registration?.biometricValidation?.livenessScore,
			livenessSkipped: Boolean(this._skippedLiveness || settings?.liveness === "skip"),
			livenessStatus: this.registration?.biometricValidation?.status,
		});
	}

	private _failAttempt(kind: "document" | "liveness"): void {
		this.busy = false;
		const settings = this.settings;

		if (kind === "document") this._documentFailures += 1;
		else this._livenessFailures += 1;

		const remaining =
			kind === "document"
				? attemptsRemaining(settings?.documentMaxAttempts || 3, this._documentFailures)
				: attemptsRemaining(settings?.livenessMaxAttempts || 3, this._livenessFailures);

		if (remaining <= 0) {
			this._finish("FAILED", "end");
			return;
		}

		this.retryTarget = kind === "document" ? "front" : "selfie";
		this.captureSide = "front";
		this._push("retry");
	}

	private _finish(status: "COMPLETED" | "FAILED" | "COMPLETED_WITHOUT_KYC", step: "end" | "skipKYC"): void {
		this.busy = true;
		this.sheet = null;
		this._kyc.syncAppRegistration(step, status).subscribe({
			next: (response) => {
				const token = response?.data?.token || this._token;

				this._setToken(token);
				if (status === "FAILED" && this._passwordless.isVerifikProject) {
					this._kyc.submitKycApprovalRequest().subscribe({ error: () => undefined });
				}
				this._showSubmitted(token);
			},
			error: () => this._showSubmitted(this._token),
		});
	}

	private _showSubmitted(token: string): void {
		this.busy = false;
		this._setToken(token);
		this.history.push(this.screen);
		this.screen = "submitted";
		this._touch();
		if (this._redirectTimer) clearTimeout(this._redirectTimer);
		this._redirectTimer = setTimeout(() => this.redirectNow(), 7000);
	}

	private _push(screen: VerifyScreen): void {
		if (this.screen !== screen && this.screen !== "loading") this.history.push(this.screen);

		this.screen = screen;
		this.sheet = null;
		this.busy = false;
		this.errorKey = "";
		this._touch();
	}

	private _fail(key: string): void {
		this.busy = false;
		this.errorKey = key;
		this.screen = "error";
		this._touch();
	}

	private _createPayload(): any {
		const settings = this.settings;
		const cached = !this._location && localStorage.getItem("appLocation") ? JSON.parse(localStorage.getItem("appLocation") || "null") : this._location;
		const payload: any = {
			language: this.activeLang,
			location: cached || { type: "browser" },
			project: this.project?._id,
			projectFlow: this.projectFlow?._id,
		};

		if (settings?.fullName && this.draft.fullName) payload.fullName = this.draft.fullName.trim();
		if (settings?.firstName && this.draft.firstName) payload.firstName = this.draft.firstName.trim();
		if (settings?.lastName && this.draft.lastName) payload.lastName = this.draft.lastName.trim();
		if (settings?.email && this.draft.email) payload.email = this.draft.email.trim();
		if (settings?.phone && this.draft.phone) {
			payload.countryCode = this.draft.countryCode || DEFAULT_PHONE_COUNTRY_CODE;
			payload.phone = this.draft.phone.replace(/\D/g, "");
			payload.phoneGateway = this.draft.phoneGateway === "both" ? "sms" : this.draft.phoneGateway;
		}
		if ((settings?.showTerms || settings?.showPrivacy) && this.draft.agreements) payload.agreements = true;

		const device = this._device;

		if (device) {
			payload.deviceInformation = {
				colorDepth: device.colorDepth,
				deviceMemory: device.deviceMemory,
				devicePixelRatio: device.devicePixelRatio,
				hardwareConcurrency: device.hardwareConcurrency,
				innerHeight: device.innerHeight,
				innerWidth: device.innerWidth,
				isDesktop: device.isDesktop,
				isMobile: device.isMobile,
				isTablet: device.isTablet,
				maxTouchPoints: device.maxTouchPoints,
				operatingSystem: device.operatingSystem,
				outerHeight: device.outerHeight,
				outerWidth: device.outerWidth,
				pixelDepth: device.pixelDepth,
				screenAvailableResolution: device.screenAvailableResolution,
				screenResolution: device.screenResolution,
				touchSupported: device.touchSupported,
			};
			payload.browserInformation = {
				browserName: device.browserName,
				browserVersion: device.browserVersion,
				connectionDownlink: device.connectionDownlink,
				connectionEffectiveType: device.connectionEffectiveType,
				connectionRtt: device.connectionRtt,
				cookiesEnabled: device.cookiesEnabled,
				geolocationSupported: device.geolocationSupported,
				javaEnabled: device.javaEnabled,
				language: device.language,
				languages: device.languages,
				onLine: device.onLine,
				onlineStatus: device.onlineStatus,
				prefersDarkMode: device.prefersDarkMode,
				prefersReducedMotion: device.prefersReducedMotion,
				timezoneOffset: device.timezoneOffset,
				userAgent: device.userAgent,
				userAgentData: device.userAgentData,
			};
		}

		return payload;
	}

	private _loadCountries(): void {
		const names = (this.projectFlow?.allowedCountries() || []).filter((country) => country);
		const options = names.length ? this._countries.findAllowedCountryOptions(names) : this._countries.countries;

		this.countries = options.filter((option) => option.country && option.country.toLowerCase() !== "all");
	}

	private _syncCategory(): void {
		if (this.categories.length === 1) this.category = this.categories[0];
		this._syncTemplate();
	}

	private _syncTemplate(): void {
		if (this.templates.length === 1) this.template = this.templates[0];
	}

	private _setToken(token?: string): void {
		if (!token) return;

		this._token = token;
		localStorage.setItem("accessToken", token);
	}

	private _watchLocation(): void {
		this._demo.getLocation();
		this._demo.geoLocation$.pipe(take(1), takeUntil(this._destroy$)).subscribe(async (response) => {
			if (!response?.lat) return;

			const location = await this._demo.extractLocationFromLatLng(response.lat, response.lng);

			if (!location) return;

			location.os = this._device?.platform;
			location.type = "browser";
			location.countryCode = this._countries.findCountryCodeByName(location.country) || this.draft.countryCode;
			this._location = location;
			if (location.countryCode) this.draft.countryCode = location.countryCode;
			this._touch();
		});
	}

	private _emptyDraft(): VerifyDraft {
		return {
			agreements: false,
			countryCode: DEFAULT_PHONE_COUNTRY_CODE,
			email: "",
			firstName: "",
			fullName: "",
			lastName: "",
			otp: "",
			phone: "",
			phoneGateway: "sms",
		};
	}

	private _touch(): void {
		this.changed.next();
	}
}

const settingsFromFlow = (flow: ProjectFlow): VerifySettings => {
	const settings = flow.onboardingSettings;
	const signUp = settings.signUpForm || {};
	const document = settings.document || {};
	const liveness = settings.liveness || {};
	const steps = settings.steps || ({} as VerifySettings);

	return {
		compareMinScore: document.compareMinScore || liveness.compareMinScore || 0.85,
		document: (steps.document || "skip") as VerifySettings["document"],
		documentMaxAttempts: document.maxAttempts || 3,
		email: Boolean(signUp.email),
		emailGateway: signUp.emailGateway || "none",
		firstName: Boolean(signUp.firstName),
		fullName: Boolean(signUp.fullName),
		lastName: Boolean(signUp.lastName),
		liveness: (steps.liveness || "skip") as VerifySettings["liveness"],
		livenessMaxAttempts: liveness.maxAttempts || 3,
		livenessMinScore: liveness.livenessMinScore || 0.65,
		phone: Boolean(signUp.phone),
		phoneGateway: signUp.phoneGateway || "none",
		scanAllowed: document.scanDocumentAllowed !== false,
		showPrivacy: Boolean(signUp.showPrivacyNotice),
		showTerms: Boolean(signUp.showTermsAndConditions),
		uploadAllowed: document.uploadDocumentAllowed !== false,
		useGovernmentId: Boolean(document.useGovernmentID),
		useLicense: Boolean(document.useLicense),
		usePassport: Boolean(document.usePassport),
	};
};

const flagCategories = (settings: VerifySettings): string[] => {
	const categories: string[] = [];

	if (settings.usePassport) categories.push("passport");
	if (settings.useLicense) categories.push("license");
	if (settings.useGovernmentId) categories.push("government_id");

	return categories;
};

const categoryAllowed = (category: string, settings: VerifySettings | null): boolean => {
	if (!settings) return false;
	if (category === "passport") return settings.usePassport;
	if (category === "license") return settings.useLicense;
	if (category === "government_id") return settings.useGovernmentId;

	return false;
};

const resolveToken = (projectId: string, rawToken?: string): string => {
	const query = typeof rawToken === "string" ? rawToken.trim() : "";

	if (query && isUsableAppRegistrationSessionToken(query)) return query;

	return readSignUpAppRegistrationToken(projectId) || "";
};

const cameraAlreadyGranted = async (): Promise<boolean> => {
	try {
		const status = await navigator.permissions?.query({ name: "camera" as PermissionName });

		return status?.state === "granted";
	} catch {
		return false;
	}
};
