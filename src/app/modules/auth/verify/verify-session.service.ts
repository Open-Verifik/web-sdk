import { Injectable, OnDestroy } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { TranslocoService } from "@ngneat/transloco";
import * as faceapi from "@vladmandic/face-api";
import { catchError, Observable, of, shareReplay, Subject, switchMap, take, takeUntil } from "rxjs";
import { environment } from "environments/environment";

import { FlowOrder, ProjectFlow } from "app/core/classes/project-flow.class";
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
	resolveHandoffPhase,
	resumeScreen,
	VerifyHandoffPhase,
	VerifyScreen,
	VerifySettings,
} from "./verify-flow";
import { VerifyStyleId } from "./verify-style";

const FULL_REGISTRATION_POPULATES = [
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
];

const HANDOFF_POLL_INTERVAL_MS = 2500;

export type VerifySheet = null | "acceptedIds" | "language" | "otherOptions" | "document" | "camera" | "trouble";

export interface VerifyDraft {
	addressLine1: string;
	addressLine2: string;
	age: string;
	agreements: boolean;
	city: string;
	country: string;
	countryCode: string;
	dateOfBirth: string;
	email: string;
	firstName: string;
	fullName: string;
	gender: string;
	lastName: string;
	otp: string;
	phone: string;
	phoneGateway: string;
	postalCode: string;
	state: string;
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
	documentMethod: "scan" | "upload" = "scan";
	draft: VerifyDraft = this._emptyDraft();
	errorKey = "";
	errorTitleKey = "verify.errorTitle";
	retryTitleKey = "verify.retryTitle";
	retryBodyKey = "verify.retryBody";
	retryAttemptsRemaining: number | null = null;
	docImageFailed = false;
	selfieImageFailed = false;
	frontDocumentFace: string | null = null;
	frontDocumentImage: string | null = null;
	handoffPhase: VerifyHandoffPhase = "qr";
	history: VerifyScreen[] = [];
	isMobileHandoff = false;
	isRepresentativeKyc = false;
	repContext: {
		memberId?: string;
		fullName: string;
		documentType: string;
		documentNumber: string;
		role?: string;
		companyName?: string;
		country?: string;
		businessRegistrationId?: string;
	} | null = null;
	manualVerificationRequested = false;
	mode: "auto" | "manual" = "auto";
	nameValidationState: "idle" | "running" | "passed" | "mismatch" | "unsupported" | "error" = "idle";
	ocrDraft: Record<string, string> = {};
	ocrEditing = false;
	ocrFields: Array<{ key: string; labelKey: string; fallbackLabel: string }> = [];
	ocrOriginal: Record<string, string> = {};
	pending: ImageScan | null = null;
	project: Project | null = null;
	projectFlow: ProjectFlow | null = null;
	projectId = "";
	redirectSeconds = 7;
	registration: any = null;
	retryTarget: "front" | "selfie" = "front";
	screen: VerifyScreen = "loading";
	selfieImage: string | null = null;
	selfiePhase: "idle" | "liveness" | "compare" | "finishing" = "idle";
	sheet: VerifySheet = null;
	showQrOverride = false;
	previewStyle: VerifyStyleId | null = null;
	/** `?order=a|b` from the URL; wins over the order saved on the project so both can be compared. */
	orderOverride: FlowOrder | null = null;
	template: PromptTemplate | null = null;
	readonly changed = new Subject<void>();
	readonly selfieDone$ = new Subject<void>();

	private _agreed = false;
	private _destroy$ = new Subject<void>();
	private _device: any;
	private _documentFailures = 0;
	private _handoffPollInFlight = false;
	private _handoffPollTimer: ReturnType<typeof setInterval> | null = null;
	private _key = "";
	private _livenessFailures = 0;
	private _location: any = null;
	private _emailSend$: Observable<unknown> | null = null;
	private _phoneSend$: Observable<unknown> | null = null;
	private _redirectTimer: ReturnType<typeof setTimeout> | null = null;
	private _skippedDocument = false;
	private _skippedLiveness = false;
	private _token = "";
	private _rawToken = "";
	private _onVisibilityChange = (): void => {
		if (typeof document !== "undefined" && document.visibilityState === "visible" && this.screen === "handoff") {
			this._pollHandoffStatus();
		}
	};

	constructor(
		private _app: AppService,
		private _auth: AuthService,
		private _countries: CountryService,
		private _demo: DemoService,
		private _http: HttpClient,
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
		this._stopHandoffPolling();
		if (this._redirectTimer) clearTimeout(this._redirectTimer);
		this._destroy$.next();
		this._destroy$.complete();
	}

	markMobileHandoff(projectId?: string): void {
		this.isMobileHandoff = true;
		try {
			if (projectId) sessionStorage.setItem(`verifik_handoff_${projectId}`, "1");
		} catch {}
	}

	toggleQrOverride(showQr: boolean): void {
		this.showQrOverride = showQr;
		this._touch();
	}

	get settings(): VerifySettings | null {
		return this.projectFlow ? settingsFromFlow(this.projectFlow) : null;
	}

	get flowOrder(): FlowOrder {
		return this.orderOverride || this.projectFlow?.flowOrder || "contact_first";
	}

	get showHeader(): boolean {
		return this.screen !== "loading" && this.screen !== "upgrade" && this.screen !== "countryBlocked" && this.screen !== "submitted";
	}

	get sessionUrl(): string {
		const params = new URLSearchParams();

		if (this._token) params.set("token", this._token);
		if (this.previewStyle) params.set("style", this.previewStyle);
		if (this.orderOverride) params.set("order", this.orderOverride === "consent_first" ? "b" : "a");
		params.set("handoff", "1");

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
		return this.captureSide === "back" && Boolean(this.settings?.colombianBarcodeValidation);
	}

	/** Cropped portrait extracted from the front of the ID document. */
	get documentFaceImage(): string | null {
		if (this.registration?.documentFace?.isPurged) return null;

		const raw =
			this.registration?.documentFace?.base64 ||
			this.registration?.documentFace?.url ||
			(!this.registration?.documentFace ? this.frontDocumentFace || this.pending?.face : null);

		if (!raw) return null;

		return String(raw).startsWith("data:") || String(raw).startsWith("http")
			? String(raw)
			: `data:image/jpeg;base64,${raw}`;
	}

	/** Live selfie portrait (or ID portrait fallback when liveness was not run) for the submitted screen. */
	get submittedSelfie(): string | null {
		if (this.selfieImageFailed) return null;
		if (this.registration?.face?.isPurged) return null;

		const rawFace =
			this.registration?.face?.base64 ||
			this.registration?.face?.url ||
			this.registration?.biometricValidation?.url ||
			(!this.registration?.face ? this.selfieImage : null);

		if (rawFace) return String(rawFace).startsWith("data:") || String(rawFace).startsWith("http") ? String(rawFace) : `data:image/jpeg;base64,${rawFace}`;

		return this.documentFaceImage;
	}

	/** Scanned front of the ID document for the submitted screen when document verification was used. */
	get submittedDocument(): string | null {
		if (this.docImageFailed) return null;
		if (this.registration?.documentValidation?.isPurged) return null;

		const docUrl = this.registration?.documentValidation?.frontUrl || this.registration?.documentValidation?.url;
		if (docUrl) return String(docUrl);

		if (this.registration?.documentValidation && typeof this.registration.documentValidation === "object") {
			return null;
		}

		return this.frontDocumentImage || this.pending?.rawImage || null;
	}

	onSubmittedDocError(): void {
		this.docImageFailed = true;
		this._touch();
	}

	onSubmittedSelfieError(): void {
		this.selfieImageFailed = true;
		this._touch();
	}

	get skippedLiveness(): boolean {
		return Boolean(this._skippedLiveness || this.settings?.liveness === "skip");
	}

	get skippedDocument(): boolean {
		return Boolean(this._skippedDocument || this.settings?.document === "skip");
	}

	/** AI classification result comparing requested document type vs. scanned document. */
	get documentClassification(): any {
		return this.registration?.documentValidation?.OCRExtraction?.documentClassification || null;
	}

	/** True when the scanned document does not match the requested document type/country. */
	get documentMismatch(): boolean {
		return Boolean(this.documentClassification && this.documentClassification.isMatch === false);
	}

	get verifyNamesEnabled(): boolean {
		return Boolean(this.projectFlow?.onboardingSettings?.document?.verifyNames);
	}

	get verifyCriminalHistoryEnabled(): boolean {
		return Boolean(this.projectFlow?.onboardingSettings?.document?.verifyCriminalHistory);
	}

	get zeroKnowledgeEnabled(): boolean {
		return Boolean((this.projectFlow?.onboardingSettings?.document as any)?.zero_knowledge);
	}

	get scanAllowed(): boolean {
		return this.settings?.scanAllowed !== false;
	}

	get uploadAllowed(): boolean {
		return this.settings?.uploadAllowed !== false;
	}

	get bothDocumentMethodsAllowed(): boolean {
		return this.scanAllowed && this.uploadAllowed;
	}

	get uploadOnlyDocumentMethod(): boolean {
		return !this.scanAllowed && this.uploadAllowed;
	}

	get effectiveDocumentMethod(): "scan" | "upload" {
		if (!this.scanAllowed && this.uploadAllowed) return "upload";
		if (this.scanAllowed && !this.uploadAllowed) return "scan";

		return this.documentMethod;
	}

	get modifiedOcrCount(): number {
		return this.ocrFields.filter((f) => this.isOcrFieldModified(f.key)).length;
	}

	isOcrFieldModified(key: string): boolean {
		return String(this.ocrDraft[key] ?? "").trim() !== String(this.ocrOriginal[key] ?? "").trim();
	}

	toggleOcrEditing(): void {
		this.ocrEditing = !this.ocrEditing;
		this._touch();
	}

	resetOcrField(key: string): void {
		this.ocrDraft[key] = this.ocrOriginal[key] ?? "";
		this._touch();
	}

	resetAllOcrFields(): void {
		this.ocrDraft = { ...this.ocrOriginal };
		this._touch();
	}

	retakeFromOcrReview(): void {
		this._startDocumentCapture("front");
	}

	changeDocumentTypeFromOcrReview(): void {
		this.sheet = "document";
		this._touch();
	}

	resolveErrorText(t: (key: string, params?: any) => string): string {
		const key = this.errorKey;
		if (!key) return t("verify.errorBody");

		if (key.includes(".")) {
			const translated = t(key);
			if (translated && translated !== key) return translated;
		}

		for (const ns of ["errors.", "liveness.", "id_scanning.", "verify."]) {
			const candidate = `${ns}${key}`;
			const translated = t(candidate);
			if (translated && translated !== candidate) return translated;
		}

		return key;
	}

	resolveRetryText(t: (key: string, params?: any) => string): string {
		const key = this.retryBodyKey;
		if (!key) return t("verify.retryBody");

		if (key.includes(".")) {
			const translated = t(key);
			if (translated && translated !== key) return translated;
		}

		for (const ns of ["liveness.", "id_scanning.", "errors.", "verify."]) {
			const candidate = `${ns}${key}`;
			const translated = t(candidate);
			if (translated && translated !== candidate) return translated;
		}

		return t("verify.retryBody");
	}

	private _mapBiometricReason(reason: string): string {
		const key = String(reason || "").trim();
		const knownQuality: Record<string, string> = {
			face_not_centered: "liveness.face_not_centered",
			face_rotation_too_large: "liveness.face_rotation_too_large",
			face_occluded: "liveness.face_occluded",
			no_face_detected: "liveness.no_face_detected",
			multiple_faces_detected: "liveness.multiple_faces_detected",
			face_too_far: "liveness.face_too_far",
			face_too_close: "liveness.face_too_close",
			poor_lighting: "liveness.poor_lighting",
			face_not_visible: "liveness.face_not_visible",
			liveness_failed: "errors.liveness_failed",
			liveness_score_not_acceptable: "errors.Liveness_score_not_acceptable",
		};

		return knownQuality[key] || (key && !key.includes("unknown") ? `liveness.${key}` : "verify.retryBody");
	}

	private _mapDocumentReason(reason: string): string {
		const key = String(reason || "").trim();
		const knownDoc: Record<string, string> = {
			document_not_detected: "id_scanning.document_not_detected_description",
			country_mismatch: "id_scanning.country_mismatch",
			face_not_found: "id_scanning.face_not_found_details",
			failed_to_read: "id_scanning.error_extracting_document_information",
			error_extracting_document_information: "id_scanning.error_extracting_document_information",
			driver_license_not_allowed: "id_scanning.driver_license_not_allowed",
			passport_not_allowed: "id_scanning.passport_not_allowed",
		};

		return knownDoc[key] || "verify.retryBody";
	}

	open(projectId: string, rawToken?: string): void {
		try {
			if (!this.isMobileHandoff && projectId && sessionStorage.getItem(`verifik_handoff_${projectId}`) === "1") {
				this.isMobileHandoff = true;
			}
		} catch {}

		this._rawToken = typeof rawToken === "string" ? rawToken.trim() : "";
		if (this._rawToken) {
			this.isRepresentativeKyc = true;
		}

		const token = resolveToken(projectId, rawToken);
		const key = `${projectId}:${token || this._rawToken}`;

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

		if (this.screen === "submitted") return;
		if (this.screen === "handoff") this._stopHandoffPolling();

		const previous = this.history.pop();

		if (!previous) {
			if (this.screen === "error") {
				const first = contactScreens(this.settings)[0] || "consent";
				this.screen = first;
				this._touch();
			}
			return;
		}

		this.screen = previous;
		if (this.screen === "handoff") {
			this._startHandoffPolling();
		}
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
			const screens = this.settings ? contactScreens(this.settings) : [];

			if (this.flowOrder === "consent_first" && screens.length) {
				this._push(screens[0]);
				return;
			}

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
		this._stopHandoffPolling();
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
		this._syncDocumentMethod();
		this._syncCategory();
		this.sheet = "document";
		this._touch();
	}

	selectDocumentMethod(method: "scan" | "upload"): void {
		if (method === "scan" && !this.scanAllowed) return;
		if (method === "upload" && !this.uploadAllowed) return;

		this.documentMethod = method;

		if ((this.screen === "front" || this.screen === "back") && method === "scan") {
			void this._openCamera(this.captureSide);
			return;
		}

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
		if (!this.country || !this.category) return;
		if (!this.template) this._syncTemplate();
		if (!this.template) return;

		this.sheet = null;
		this._startDocumentCapture("front");
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
		if (this.captureSide === "front" && scan.face) {
			this.frontDocumentFace = scan.face;
		}
		this.pending = scan;
		this._push(this.captureSide === "front" ? "reviewFront" : "reviewBack");
	}

	retake(): void {
		this.pending = null;
		this._startDocumentCapture(this.captureSide);
	}

	useFile(scan: ImageScan): void {
		this.sheet = null;
		this.documentMethod = "upload";
		this.mode = "manual";
		const pendingScan: ImageScan = { ...scan, inputMethod: "FILE_UPLOAD", front: this.captureSide === "front" };
		this.pending = pendingScan;

		if (this.captureSide === "front" && pendingScan.rawImage && !pendingScan.face) {
			void this._extractFaceFromRaw(pendingScan.rawImage)
				.then((face) => {
					if (face) {
						pendingScan.face = face;
						this.frontDocumentFace = face;
						this._touch();
					}
				})
				.catch((err) => {
					console.warn("Document face extraction skipped:", err);
				});
		}

		this._push(this.captureSide === "front" ? "reviewFront" : "reviewBack");
	}

	submitPhoto(): void {
		if (this.screen === "reviewBack" || this.captureSide === "back") {
			this._submitBack();
		} else {
			this._submitFront();
		}
	}

	confirmOcrReview(): void {
		if (this.busy || this.documentMismatch) return;

		const docId = this.registration?.documentValidation?._id;

		if (!docId) {
			this._proceedAfterOcrReview();
			return;
		}

		this.busy = true;
		this._touch();

		const hadChanges = this.modifiedOcrCount > 0;
		const updatedOcr = {
			...(this.registration?.documentValidation?.OCRExtraction || {}),
			...this.ocrDraft,
		};

		this._kyc
			.updateDocumentValidation(docId, { OCRExtraction: this.ocrDraft })
			.pipe(catchError(() => of(null)))
			.subscribe((res) => {
				if (res?.data) {
					this.registration.documentValidation = res.data;
				} else if (this.registration?.documentValidation) {
					this.registration.documentValidation.OCRExtraction = updatedOcr;
				}
				this._kyc.appRegistration = this.registration;
				this.ocrOriginal = { ...this.ocrDraft };
				this.ocrEditing = false;

				if (
					this.verifyNamesEnabled &&
					!this.manualVerificationRequested &&
					(hadChanges || this.nameValidationState === "idle" || this.nameValidationState === "mismatch")
				) {
					this.nameValidationState = "running";
					this._touch();

					this._kyc
						.updateDocumentValidationNameValidation({ _id: docId, force: hadChanges })
						.pipe(catchError(() => of(null)))
						.subscribe((valRes) => {
							const data = valRes?.data?.documentValidation || valRes?.data;

							if (data?._id) {
								this.registration.documentValidation = data;
							}
							if (valRes?.data?.informationValidation) {
								this.registration.informationValidation = valRes.data.informationValidation;
							}
							this._kyc.appRegistration = this.registration;

							if (data?.namesMatch === false && data?.infoValidationSupported !== false) {
								this.nameValidationState = "mismatch";
								this.busy = false;
								this._touch();
								return;
							}

							this.nameValidationState = data?.infoValidationSupported === false ? "unsupported" : "passed";
							this._dispatchPostDocumentChecks();
							this._proceedAfterOcrReview();
						});
					return;
				}

				this._dispatchPostDocumentChecks();
				this._proceedAfterOcrReview();
			});
	}

	proceedWithManualVerification(): void {
		if (this.busy) return;

		const docId = this.registration?.documentValidation?._id;
		this.manualVerificationRequested = true;

		if (!docId) {
			this.confirmOcrReview();
			return;
		}

		this.busy = true;
		this._touch();

		this._kyc
			.setDocumentValidationManualVerification({
				_id: docId,
				reason: "name_mismatch_user_proceeded",
				timeoutType: "name_validation",
				elapsedTime: 0,
			})
			.pipe(catchError(() => of(null)))
			.subscribe(() => {
				this.busy = false;
				this.confirmOcrReview();
			});
	}

	runNameValidation(silent = true): void {
		const docId = this.registration?.documentValidation?._id;

		if (!docId || !this.verifyNamesEnabled) return;

		this.nameValidationState = "running";
		if (!silent) this._touch();

		this._kyc
			.updateDocumentValidationNameValidation({ _id: docId })
			.pipe(catchError(() => of(null)))
			.subscribe((res) => {
				const data = res?.data?.documentValidation || res?.data;

				if (!data) {
					this.nameValidationState = "error";
					this._touch();
					return;
				}

				if (data._id) {
					this.registration.documentValidation = data;
				}
				if (res?.data?.informationValidation) {
					this.registration.informationValidation = res.data.informationValidation;
				}
				this._kyc.appRegistration = this.registration;

				if (data.namesMatch === false && data.infoValidationSupported !== false) {
					this.nameValidationState = "mismatch";
				} else if (data.infoValidationSupported === false) {
					this.nameValidationState = "unsupported";
				} else {
					this.nameValidationState = "passed";
				}
				this._touch();
			});
	}

	readyForBack(): void {
		this._startDocumentCapture("back");
	}

	continueSelfie(): void {
		this._push("selfie");
	}

	onSelfie(scan: ImageScan): void {
		this._submitSelfie(scan);
	}

	tryAgain(): void {
		this.pending = null;
		if (this.retryTarget === "selfie") this._push("selfie");
		else this._startDocumentCapture("front");
	}

	selectLanguage(id: string): void {
		this._transloco.setActiveLang(id);
		this.sheet = null;
		this._touch();
	}

	setMode(mode: "auto" | "manual"): void {
		this.mode = mode;
		this.sheet = null;
		if (this.documentMethod !== "scan" && this.scanAllowed) {
			this.documentMethod = "scan";
			if (this.screen === "front" || this.screen === "back") {
				void this._openCamera(this.captureSide);
				return;
			}
		}
		this._touch();
	}

	anotherDevice(): void {
		this.sheet = null;
		this._enterHandoff();
	}

	redirectNow(): void {
		if (this._redirectTimer) {
			clearInterval(this._redirectTimer);
			this._redirectTimer = null;
		}

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

		if (enrollmentClientFrom(this.projectFlow?.enrollmentClient) !== "v2" && !this.projectFlow?.verifyStyle) {
			this._router.navigate(["/sign-up", this.projectId], {
				queryParams: this._token ? { token: this._token } : {},
				replaceUrl: true,
			});
			return;
		}

		if (this.settings?.countryCode) {
			this.draft.countryCode = this.settings.countryCode;
		}

		if (!response.planCode) {
			this.busy = false;
			this.screen = "upgrade";
			this._touch();
			return;
		}

		this._syncDocumentMethod();
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
						this.busy = false;
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
		if (this._rawToken && (this.projectFlow?.target === "business" || !this._token)) {
			this._http
				.get<{ success: boolean; data: any }>(
					`${environment.apiUrl}/v2/business-registrations/rep-kyc/${encodeURIComponent(this._rawToken)}`
				)
				.pipe(takeUntil(this._destroy$))
				.subscribe({
					next: (res) => {
						const data = res?.data;
						if (data?.token) {
							this._setToken(data.token);
						}
						if (data?.representativesPolicy && this.projectFlow) {
							this.projectFlow.representativesPolicy = data.representativesPolicy;
						}
						if (data?.member) {
							this.isRepresentativeKyc = true;
							this.repContext = {
								memberId: data.member._id,
								fullName:
									data.member.fullName ||
									`${data.member.firstName || ""} ${data.member.lastName || ""}`.trim(),
								documentType: data.member.documentType || "ID",
								documentNumber: data.member.documentNumber || "",
								role: data.member.role || "legal_representative",
								companyName:
									data.companyInfo?.legalName || data.companyInfo?.commercialName || "",
								country: data.companyInfo?.country || "",
								businessRegistrationId: data.businessRegistrationId,
							};

							if (!this.country) {
								const companyCountry = String(data.companyInfo?.country || "").trim();
								const matchedCountry = this.countries.find(
									(c) =>
										c.country.toLowerCase() === companyCountry.toLowerCase() ||
										c.code?.toLowerCase() === companyCountry.toLowerCase()
								);
								this.country = matchedCountry?.country || this.countries[0]?.country || "Colombia";
							}
							if (!this.category) {
								const docTypeUpper = String(data.member.documentType || "").toUpperCase();
								if (docTypeUpper === "PA" || docTypeUpper === "PASSPORT") {
									this.category = "passport";
								} else if (docTypeUpper === "LIC" || docTypeUpper === "LICENSE") {
									this.category = "license";
								} else {
									this.category = "government_id";
								}
							}
							this._syncCategory();
						}

						if (this._token) {
							this._kyc
								.getAppRegistration({
									populates: FULL_REGISTRATION_POPULATES,
								})
								.pipe(takeUntil(this._destroy$))
								.subscribe({
									next: (regRes) => {
										this.registration = regRes.data || data?.appRegistration;
										this._kyc.appRegistration = this.registration;
										this._documentFailures =
											this.registration?.failedDocumentValidations?.length || 0;
										this._livenessFailures =
											this.registration?.failedBiometricValidations?.length || 0;
										this._applyResume();
									},
									error: () => {
										if (data?.appRegistration) {
											this.registration = data.appRegistration;
											this._kyc.appRegistration = this.registration;
											this._applyResume();
											return;
										}
										this._startFresh();
									},
								});
							return;
						}

						this._startFresh();
					},
					error: () => {
						if (this._token) {
							this._fetchRegistrationByToken();
							return;
						}
						this._startFresh();
					},
				});
			return;
		}

		if (!this._token) {
			this._startFresh();
			return;
		}

		this._fetchRegistrationByToken();
	}

	private _fetchRegistrationByToken(): void {
		this._kyc
			.getAppRegistration({
				populates: FULL_REGISTRATION_POPULATES,
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
		this.busy = false;
		this.screen = this.flowOrder === "consent_first" ? "consent" : screens[0] || "consent";
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
			documentMismatch: this.documentMismatch,
			documentStep: settings.document,
			emailNeeded: needsEmailCode(settings, this.registration?.emailValidation?.status === "validated"),
			handoff: this.isMobileHandoff,
			hasBack: Boolean(document?.backUrl || document?.hasBackImage),
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

		// If Desktop refreshes while waiting on the handoff screen (`currentStep === "instructions"`),
		// restore the handoff screen & poller on Desktop instead of jumping into desktop camera capture.
		if (
			!this.compact &&
			!this.isMobileHandoff &&
			!this.isRepresentativeKyc &&
			this.registration?.currentStep === "instructions" &&
			!document &&
			!this.registration?.biometricValidation &&
			(screen === "ready" || screen === "selfieIntro")
		) {
			this._enterHandoff();
			return;
		}

		if (screen === "emailCode") this._sendEmailCode();
		if (screen === "phoneCode") this._sendPhoneCode();
		if (screen === "submitted") {
			this._showSubmitted(this.registration?.token || this._token);
			return;
		}

		this._hydrateDocumentMeta(document);
		this._syncDocumentMethod();

		if (screen === "ocrReview") {
			this._hydrateOcrDraft();
			if (!this.documentMismatch && this.verifyNamesEnabled) {
				this.runNameValidation(true);
			}
		}

		if (screen === "back" || screen === "flip" || screen === "reviewBack") {
			this.captureSide = "back";
		}

		// When Mobile opens the handoff link (or resumes into capture), notify the backend
		// so the Desktop handoff poller immediately transitions to the "Connected to phone" progress view.
		if (this.registration?._id) {
			if (screen === "ready" && this.registration.currentStep !== "document") {
				this._kyc
					.syncAppRegistration("document", "ONGOING")
					.pipe(
						catchError(() => of(null)),
						takeUntil(this._destroy$)
					)
					.subscribe();
			} else if (screen === "selfieIntro" && this.registration.currentStep !== "liveness") {
				this._kyc
					.syncAppRegistration("liveness", "ONGOING")
					.pipe(
						catchError(() => of(null)),
						takeUntil(this._destroy$)
					)
					.subscribe();
			}
		}

		const first = this.isRepresentativeKyc
			? settings.document !== "skip"
				? "ready"
				: "selfieIntro"
			: contactScreens(settings)[0] || "consent";

		this.history = screen === first ? [] : [first];
		this.busy = false;
		this.screen = screen;
		this._touch();
	}

	private _hydrateDocumentMeta(document: any): void {
		if (!document || typeof document !== "object") return;

		if (document.country) this.country = document.country;
		if (document.documentCategory) this.category = document.documentCategory;
		if (document.inputMethod === "FILE_UPLOAD" && this.uploadAllowed) {
			this.documentMethod = "upload";
		}
		if (document.template) {
			const all = this.projectFlow?.promptTemplates ? this.projectFlow.promptTemplates() : [];
			const found = all.find(
				(t) => String(t._id || t) === String(document.template?._id || document.template)
			);
			this.template = found || document.template;
		}
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
					// stays busy until the next screen shows, so the button keeps its spinner during the follow-up request
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

		if (!this.compact && !this.isMobileHandoff) {
			this._enterHandoff();
			return;
		}

		this._enterCapture();
	}

	private _enterHandoff(): void {
		this.handoffPhase = resolveHandoffPhase({
			currentStep: this.registration?.currentStep === "instructions" ? undefined : this.registration?.currentStep,
			hasBiometric: Boolean(this.registration?.biometricValidation),
			hasDocument: Boolean(this.registration?.documentValidation),
			status: this.registration?.status,
		});
		this.showQrOverride = false;
		this._push("handoff");

		if (
			this.registration?._id &&
			(!this.registration.currentStep ||
				this.registration.currentStep === "signUpForm" ||
				this.registration.currentStep === "basicInformation")
		) {
			this._kyc
				.syncAppRegistration("instructions", "ONGOING")
				.pipe(
					catchError(() => of(null)),
					takeUntil(this._destroy$)
				)
				.subscribe();
		}

		this._startHandoffPolling();
	}

	private _startHandoffPolling(): void {
		this._stopHandoffPolling();
		if (!this._token) return;

		if (typeof document !== "undefined") {
			document.addEventListener("visibilitychange", this._onVisibilityChange);
		}
		if (typeof window !== "undefined") {
			window.addEventListener("focus", this._onVisibilityChange);
		}

		this._handoffPollTimer = setInterval(() => {
			if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
			this._pollHandoffStatus();
		}, HANDOFF_POLL_INTERVAL_MS);
	}

	private _stopHandoffPolling(): void {
		if (this._handoffPollTimer) {
			clearInterval(this._handoffPollTimer);
			this._handoffPollTimer = null;
		}
		this._handoffPollInFlight = false;
		if (typeof document !== "undefined") {
			document.removeEventListener("visibilitychange", this._onVisibilityChange);
		}
		if (typeof window !== "undefined") {
			window.removeEventListener("focus", this._onVisibilityChange);
		}
	}

	private _pollHandoffStatus(): void {
		if (this.screen !== "handoff" || !this._token || this._handoffPollInFlight) return;

		this._handoffPollInFlight = true;
		this._kyc
			.getAppRegistration({ populates: [] })
			.pipe(
				catchError(() => of(null)),
				takeUntil(this._destroy$)
			)
			.subscribe((response) => {
				this._handoffPollInFlight = false;
				const reg = response?.data;
				if (!reg || this.screen !== "handoff") return;

				const nextPhase = resolveHandoffPhase({
					currentStep: reg.currentStep === "instructions" ? undefined : reg.currentStep,
					hasBiometric: Boolean(reg.biometricValidation),
					hasDocument: Boolean(reg.documentValidation),
					status: reg.status,
				});

				if (nextPhase === "completed") {
					this._completeHandoffOnDesktop(reg);
					return;
				}

				if (nextPhase !== this.handoffPhase) {
					this.handoffPhase = nextPhase;
					if (nextPhase !== "qr") {
						this.showQrOverride = false;
					}
					if (this.registration) {
						this.registration.currentStep = reg.currentStep;
						this.registration.status = reg.status;
					}
					this._touch();
				}
			});
	}

	private _completeHandoffOnDesktop(lightReg: any): void {
		this._stopHandoffPolling();
		this.handoffPhase = "completed";
		this.busy = true;
		this._touch();

		this._kyc
			.getAppRegistration({ populates: FULL_REGISTRATION_POPULATES })
			.pipe(
				catchError(() => of({ data: lightReg })),
				takeUntil(this._destroy$)
			)
			.subscribe((fullResponse) => {
				const fullReg = fullResponse?.data || lightReg;
				this.registration = fullReg;
				this._kyc.appRegistration = fullReg;
				this._hydrateDocumentMeta(fullReg?.documentValidation);

				if (fullReg?.token) {
					this._showSubmitted(fullReg.token);
					return;
				}

				const terminalStatus =
					fullReg?.status === "FAILED" || fullReg?.status === "COMPLETED_WITHOUT_KYC"
						? fullReg.status
						: "COMPLETED";

				this._kyc
					.syncAppRegistration("end", terminalStatus)
					.pipe(
						catchError(() => of(null)),
						takeUntil(this._destroy$)
					)
					.subscribe((syncRes) => {
						const finalToken = syncRes?.data?.token || fullReg?.token || this._token;
						this._showSubmitted(finalToken);
					});
			});
	}

	private _enterCapture(): void {
		const settings = this.settings;

		if (!settings) return;
		if (settings.document !== "skip") {
			if (this.registration?._id && this.registration.currentStep !== "document") {
				this._kyc
					.syncAppRegistration("document", "ONGOING")
					.pipe(
						catchError(() => of(null)),
						takeUntil(this._destroy$)
					)
					.subscribe();
			}
			this._push("ready");
			return;
		}

		if (settings.liveness !== "skip") {
			if (this.registration?._id && this.registration.currentStep !== "liveness") {
				this._kyc
					.syncAppRegistration("liveness", "ONGOING")
					.pipe(
						catchError(() => of(null)),
						takeUntil(this._destroy$)
					)
					.subscribe();
			}
			this._push("selfieIntro");
			return;
		}

		this._finish("COMPLETED_WITHOUT_KYC", "skipKYC");
	}

	private _startDocumentCapture(side: "front" | "back"): void {
		this.captureSide = side;
		this.pending = null;
		this._syncDocumentMethod();

		if (this.effectiveDocumentMethod === "upload") {
			this.sheet = null;
			this._push(side);
			return;
		}

		void this._openCamera(side);
	}

	private async _openCamera(side: "front" | "back"): Promise<void> {
		this.captureSide = side;
		this.pending = null;

		if (!this.scanAllowed && this.uploadAllowed) {
			this.documentMethod = "upload";
			this.sheet = null;
			this._push(side);
			return;
		}

		if (await cameraAlreadyGranted()) {
			this.sheet = null;
			this._push(side);
			return;
		}

		this.sheet = "camera";
		this._touch();
	}

	private _submitFront(): void {
		void this._postDocument(false);
	}

	private _submitBack(): void {
		void this._postDocument(true);
	}

	private async _postDocument(back: boolean): Promise<void> {
		if (this.busy) return;

		if (!this.pending) {
			console.warn("submitPhoto called without pending scan");
			return;
		}

		const template = this.template || this._resolveTemplateFromRegistration();
		const country = this.country || this.registration?.documentValidation?.country || (this.countries?.length ? this.countries[0]?.country : "") || "";
		const category = this.category || this.registration?.documentValidation?.documentCategory || (this.settings ? flagCategories(this.settings)[0] : "government_id") || "government_id";
		const promptTemplateId = template?._id || template || this.registration?.documentValidation?.template;

		const settings = this.settings;
		const failures = this.registration?.failedDocumentValidations?.length || this._documentFailures;

		if (settings && attemptsRemaining(settings.documentMaxAttempts, failures) <= 0) {
			this._finish("FAILED", "end");
			return;
		}

		this.busy = true;
		this._touch();

		if (!back && !this.pending.face && !this.frontDocumentFace && this.pending.rawImage) {
			try {
				const extractedFace = await this._extractFaceFromRaw(this.pending.rawImage);
				if (extractedFace) {
					this.pending.face = extractedFace;
					this.frontDocumentFace = extractedFace;
				}
			} catch (e) {
				console.warn("Document face extraction skipped:", e);
			}
		}

		const base64Image = this.pending.base64Image || this.pending.rawImage?.replace(/^data:.*;base64,/, "");

		const body: any = {
			category,
			country,
			force: Boolean(this.registration?.documentValidation) || failures > 0,
			inputMethod: this.pending.inputMethod || "FILE_UPLOAD",
		};

		if (promptTemplateId) {
			body.promptTemplate = promptTemplateId;
		}

		if (back) {
			body.backImage = base64Image;
			if (this.settings?.colombianBarcodeValidation) {
				body.colombianBarcodeValidation = true;
			}
			if (this.pending.barcodeReadAttempts) body.barcodeReadAttempts = this.pending.barcodeReadAttempts;
		} else {
			this.frontDocumentImage = this.pending.rawImage || (base64Image ? `data:image/jpeg;base64,${base64Image}` : null);
			if (this.pending.face) this.frontDocumentFace = this.pending.face;
			body.image = base64Image;
			body.documentFace = this.pending.face || this.frontDocumentFace;
		}

		this._kyc.createDocumentValidation(body).subscribe({
			next: (response) => this._afterDocument(response, back),
			error: (err) => this._failAttempt("document", err),
		});
	}

	private _resolveTemplateFromRegistration(): any {
		const docTemplate = this.registration?.documentValidation?.template;

		if (docTemplate) {
			const all = this.projectFlow?.promptTemplates ? this.projectFlow.promptTemplates() : [];
			const found = all.find(
				(t) => String(t._id || t) === String(docTemplate?._id || docTemplate)
			);

			if (found) return found;
			return docTemplate;
		}

		if (this.templates?.length) return this.templates[0];
		const all = this.projectFlow?.promptTemplates ? this.projectFlow.promptTemplates() : [];
		if (all.length) return all[0];

		return null;
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
		} else if (!back && (this.pending?.face || this.frontDocumentFace)) {
			this.registration.documentFace = { base64: this.pending?.face || this.frontDocumentFace };
		}
		this._kyc.appRegistration = this.registration;

		if (document?.status === "FAILED") {
			this._failAttempt("document");
			return;
		}

		// If the scanned front document does not match the requested document type/country,
		// open OCR Review immediately so the user isn't forced to scan the back of the wrong ID.
		if (!back && this.documentMismatch) {
			this.pending = null;
			this._openOcrReview();
			return;
		}

		const needsBack = documentNeedsBack(this.category, this.template?.requiresBackSide ?? document?.requiresBackSide);

		if (!back && needsBack) {
			this.pending = null;
			this._push("flip");
			return;
		}

		this.pending = null;
		this._openOcrReview();
	}

	private _openOcrReview(): void {
		this._hydrateOcrDraft();
		this.ocrEditing = false;
		this.nameValidationState = "idle";
		this.manualVerificationRequested = false;
		this._push("ocrReview");

		if (!this.documentMismatch && this.verifyNamesEnabled) {
			this.runNameValidation(true);
		}
	}

	private _proceedAfterOcrReview(): void {
		if (this.settings?.liveness !== "skip") {
			this._kyc
				.syncAppRegistration("liveness", "ONGOING")
				.pipe(catchError(() => of(null)))
				.subscribe(() => {
					this._push("selfieIntro");
				});
			return;
		}

		this._finish("COMPLETED", "end");
	}

	private _dispatchPostDocumentChecks(): void {
		if (this.verifyCriminalHistoryEnabled) {
			this._kyc
				.dispatchBackgroundChecks()
				.pipe(catchError(() => of(null)))
				.subscribe();
		}

		if (this.zeroKnowledgeEnabled) {
			this._kyc
				.createZkProof()
				.pipe(catchError(() => of(null)))
				.subscribe();
		}
	}

	private _hydrateOcrDraft(): void {
		const rawOcr = this.registration?.documentValidation?.OCRExtraction || {};
		const doc = this.registration?.documentValidation || {};
		const preferredFields: Array<{ key: string; labelKey: string; fallbackLabel: string }> = [
			{ key: "firstName", labelKey: "verify.ocrFieldFirstName", fallbackLabel: "First name" },
			{ key: "lastName", labelKey: "verify.ocrFieldLastName", fallbackLabel: "Last name" },
			{ key: "fullName", labelKey: "verify.ocrFieldFullName", fallbackLabel: "Full name" },
			{ key: "documentNumber", labelKey: "verify.ocrFieldDocumentNumber", fallbackLabel: "Document number" },
			{ key: "documentType", labelKey: "verify.ocrFieldDocumentType", fallbackLabel: "Document type" },
			{ key: "dateOfBirth", labelKey: "verify.ocrFieldDateOfBirth", fallbackLabel: "Date of birth" },
			{ key: "expirationDate", labelKey: "verify.ocrFieldExpirationDate", fallbackLabel: "Expiration date" },
			{ key: "expeditionDate", labelKey: "verify.ocrFieldExpeditionDate", fallbackLabel: "Issue date" },
			{ key: "dateOfIssue", labelKey: "verify.ocrFieldDateOfIssue", fallbackLabel: "Issue date" },
			{ key: "nationality", labelKey: "verify.ocrFieldNationality", fallbackLabel: "Nationality" },
			{ key: "country", labelKey: "verify.ocrFieldCountry", fallbackLabel: "Country" },
			{ key: "gender", labelKey: "verify.ocrFieldGender", fallbackLabel: "Sex / Gender" },
			{ key: "sex", labelKey: "verify.ocrFieldGender", fallbackLabel: "Sex / Gender" },
			{ key: "placeOfBirth", labelKey: "verify.ocrFieldPlaceOfBirth", fallbackLabel: "Place of birth" },
			{ key: "expeditionPlace", labelKey: "verify.ocrFieldExpeditionPlace", fallbackLabel: "Place of issue" },
			{ key: "address", labelKey: "verify.ocrFieldAddress", fallbackLabel: "Address" },
			{ key: "MRZ", labelKey: "verify.ocrFieldMrz", fallbackLabel: "MRZ" },
		];
		const ignoredKeys = new Set([
			"documentClassification",
			"barcodeValidation",
			"raw",
			"_id",
			"id",
			"status",
			"confidence",
			"isMatch",
		]);

		const draft: Record<string, string> = {};
		const fields: Array<{ key: string; labelKey: string; fallbackLabel: string }> = [];
		const seen = new Set<string>();

		for (const item of preferredFields) {
			const val = rawOcr[item.key];
			if (val !== undefined && val !== null && typeof val !== "object" && String(val).trim() !== "") {
				draft[item.key] = String(val).trim();
				fields.push(item);
				seen.add(item.key);
			}
		}

		for (const [key, val] of Object.entries(rawOcr)) {
			if (seen.has(key) || ignoredKeys.has(key)) continue;
			if (val === undefined || val === null || typeof val === "object") continue;
			const str = String(val).trim();
			if (!str) continue;
			draft[key] = str;
			fields.push({
				key,
				labelKey: "",
				fallbackLabel: humanizeOcrKey(key),
			});
			seen.add(key);
		}

		// Ensure core identity fields are always present so the user can review or fill them
		const coreDefaults: Array<{ key: string; labelKey: string; fallbackLabel: string; fallbackValue?: string }> = [
			{ key: "firstName", labelKey: "verify.ocrFieldFirstName", fallbackLabel: "First name", fallbackValue: rawOcr.firstName || "" },
			{ key: "lastName", labelKey: "verify.ocrFieldLastName", fallbackLabel: "Last name", fallbackValue: rawOcr.lastName || "" },
			{
				key: "documentNumber",
				labelKey: "verify.ocrFieldDocumentNumber",
				fallbackLabel: "Document number",
				fallbackValue: rawOcr.documentNumber || doc.documentNumber || "",
			},
			{
				key: "documentType",
				labelKey: "verify.ocrFieldDocumentType",
				fallbackLabel: "Document type",
				fallbackValue: rawOcr.documentType || doc.documentType || "",
			},
		];

		if (fields.length === 0) {
			for (const core of coreDefaults) {
				draft[core.key] = String(core.fallbackValue || "").trim();
				fields.push({ key: core.key, labelKey: core.labelKey, fallbackLabel: core.fallbackLabel });
			}
		} else {
			for (const core of coreDefaults) {
				if (!seen.has(core.key) && core.fallbackValue) {
					draft[core.key] = String(core.fallbackValue).trim();
					fields.unshift({ key: core.key, labelKey: core.labelKey, fallbackLabel: core.fallbackLabel });
					seen.add(core.key);
				}
			}
		}

		this.ocrFields = fields;
		this.ocrDraft = { ...draft };
		this.ocrOriginal = { ...draft };
	}

	private _isFaceModelLoaded(): boolean {
		return Boolean(
			(this._demo.useSsdMobilenetv1 && faceapi.nets.ssdMobilenetv1?.isLoaded) ||
			(!this._demo.useSsdMobilenetv1 && faceapi.nets.tinyFaceDetector?.isLoaded)
		);
	}

	private async _extractFaceFromRaw(rawImage: string): Promise<string | undefined> {
		try {
			if (!this._isFaceModelLoaded()) {
				await this._demo.loadModels().catch(() => {});
			}

			if (!this._isFaceModelLoaded()) {
				return undefined;
			}

			const img = await loadHtmlImage(rawImage);
			const detections = await faceapi.detectAllFaces(img, this._demo.faceEngine);

			if (!detections?.length) return undefined;

			const found: any = this._demo.findBiggestFace(detections);
			const box = found?.alignedRect?.box || found?.detection?.box || found?.box;
			if (!box) return undefined;

			const canvas = document.createElement("canvas");
			const cropped = this._demo.cutFaceIdCard(img, box, canvas);
			return String(cropped || "").replace(/^data:.*;base64,/, "") || undefined;
		} catch (err) {
			console.warn("Could not extract face from document:", err);
			return undefined;
		}
	}

	private _submitSelfie(scan: ImageScan): void {
		const settings = this.settings;
		const failures = this.registration?.failedBiometricValidations?.length || this._livenessFailures;

		if (settings && attemptsRemaining(settings.livenessMaxAttempts, failures) <= 0) {
			this._finish("FAILED", "end");
			return;
		}

		this.busy = true;
		this.selfieImage = scan.rawImage || (scan.face ? `data:image/jpeg;base64,${scan.face}` : scan.base64Image ? `data:image/jpeg;base64,${scan.base64Image}` : null);
		this.selfiePhase = "liveness";
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
						this._failAttempt("liveness", {
							failureReason: this.registration.biometricValidation.failedReason,
						});
						return;
					}

					if (this.registration.documentValidation) {
						this._compareAndFinish();
						return;
					}

					this._finish(this._score(), "end");
				},
				error: (err) => this._failAttempt("liveness", err),
			});
	}

	private _compareAndFinish(): void {
		this.selfiePhase = "compare";
		this._touch();
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

	private _failAttempt(kind: "document" | "liveness", error?: any): void {
		this.busy = false;
		this.selfiePhase = "idle";
		this.selfieDone$.next();
		const settings = this.settings;

		const parsed = parseApiError(error);

		// Unrecoverable identity conflicts or fatal account/billing errors
		if (
			parsed.kind === "conflict" ||
			parsed.kind === "billing" ||
			parsed.reason.includes("linked_to_another") ||
			parsed.reason.includes("already_set") ||
			parsed.reason.includes("duplicated_person") ||
			parsed.reason === "insufficient_credits" ||
			parsed.reason === "existing_document_validation_with_document_number"
		) {
			this.errorTitleKey = parsed.kind === "conflict" ? "errors.conflict" : "verify.errorTitle";
			this.errorKey = parsed.reason.includes(".") ? parsed.reason : `errors.${parsed.reason}`;
			this.screen = "error";
			this._touch();
			return;
		}

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

		this.retryAttemptsRemaining = remaining;
		this.retryTarget = kind === "document" ? "front" : "selfie";
		this.captureSide = "front";

		if (kind === "liveness") {
			this.retryTitleKey = "verify.retryTitle";
			this.retryBodyKey = this._mapBiometricReason(parsed.reason);
		} else {
			this.retryTitleKey = "verify.retryTitle";
			this.retryBodyKey = this._mapDocumentReason(parsed.reason);
		}

		this._push("retry");
	}

	private _finish(status: "COMPLETED" | "FAILED" | "COMPLETED_WITHOUT_KYC", step: "end" | "skipKYC"): void {
		this.busy = true;
		if (this.selfiePhase !== "idle") this.selfiePhase = "finishing";
		this.sheet = null;
		this._touch();

		const completeRepIfApplicable = (finalToken: string): void => {
			const repLookupToken = this._rawToken || finalToken;
			if (this.isRepresentativeKyc && repLookupToken && status !== "FAILED") {
				this._http
					.post(
						`${environment.apiUrl}/v2/business-registrations/rep-kyc/${encodeURIComponent(repLookupToken)}/complete`,
						{ status }
					)
					.pipe(catchError(() => of(null)))
					.subscribe(() => {
						this._showSubmitted(finalToken);
					});
				return;
			}
			this._showSubmitted(finalToken);
		};

		this._kyc.syncAppRegistration(step, status).subscribe({
			next: (response) => {
				const token = response?.data?.token || this._token;

				this._setToken(token);
				if (status === "FAILED" && this._passwordless.isVerifikProject) {
					this._kyc.submitKycApprovalRequest().subscribe({ error: () => undefined });
				}
				completeRepIfApplicable(token);
			},
			error: () => completeRepIfApplicable(this._token),
		});
	}

	private _showSubmitted(token: string): void {
		this._stopHandoffPolling();
		this.busy = false;
		this.selfiePhase = "idle";
		this.selfieDone$.next();
		this._setToken(token);
		this.history.push(this.screen);
		this.screen = "submitted";
		if (this._redirectTimer) {
			clearInterval(this._redirectTimer);
			this._redirectTimer = null;
		}

		if (this.isMobileHandoff) {
			this.redirectSeconds = 0;
			this._touch();
			return;
		}

		this.redirectSeconds = 7;
		this._touch();
		this._redirectTimer = setInterval(() => {
			this.redirectSeconds -= 1;
			if (this.redirectSeconds <= 0) {
				clearInterval(this._redirectTimer!);
				this._redirectTimer = null;
				this.redirectNow();
			} else {
				this._touch();
			}
		}, 1000);
	}

	private _push(screen: VerifyScreen): void {
		if (this.screen === "handoff" && screen !== "handoff") {
			this._stopHandoffPolling();
		}
		if (this.screen !== screen && this.screen !== "loading") this.history.push(this.screen);

		this.screen = screen;
		this.sheet = null;
		this.busy = false;
		this.selfiePhase = "idle";
		if (screen !== "error" && screen !== "retry") {
			this.errorKey = "";
			this.errorTitleKey = "verify.errorTitle";
			this.retryBodyKey = "verify.retryBody";
		}
		this._touch();
	}

	private _fail(key: string, titleKey?: string): void {
		this.busy = false;
		this.errorTitleKey = titleKey || "verify.errorTitle";
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

		const extraFields = settings?.additionalFields || [];
		if (extraFields.includes("gender") && this.draft.gender) payload.gender = this.draft.gender.trim();
		if (extraFields.includes("dateOfBirth") && this.draft.dateOfBirth) payload.dateOfBirth = this.draft.dateOfBirth.trim();
		if (extraFields.includes("age") && this.draft.age) payload.age = Number(this.draft.age);
		if (extraFields.includes("address")) {
			if (this.draft.addressLine1) payload.addressLine1 = this.draft.addressLine1.trim();
			if (this.draft.addressLine2) payload.addressLine2 = this.draft.addressLine2.trim();
			if (this.draft.city) payload.city = this.draft.city.trim();
			if (this.draft.state) payload.state = this.draft.state.trim();
		}
		if (extraFields.includes("postalCode") && this.draft.postalCode) payload.postalCode = this.draft.postalCode.trim();
		if (extraFields.includes("country") && this.draft.country) payload.country = this.draft.country.trim();

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
		const flowNames = (this.projectFlow?.allowedCountries() || []).filter((country) => country);
		const projectNames = Array.isArray(this.project?.allowedCountries)
			? this.project!.allowedCountries.filter((c: string) => c && c.toLowerCase() !== "all")
			: [];
		const names = flowNames.length ? flowNames : projectNames;
		const options = names.length ? this._countries.findAllowedCountryOptions(names) : this._countries.countries;

		this.countries = options.filter((option) => option.country && option.country.toLowerCase() !== "all");
	}

	private _syncDocumentMethod(): void {
		if (!this.scanAllowed && this.uploadAllowed) {
			this.documentMethod = "upload";
		} else if (this.scanAllowed && !this.uploadAllowed) {
			this.documentMethod = "scan";
		}
	}

	private _syncCategory(): void {
		if (this.categories.length === 1) this.category = this.categories[0];
		this._syncTemplate();
	}

	private _syncTemplate(): void {
		if (this.templates.length >= 1) {
			if (this.repContext?.documentType) {
				const targetCode = this.repContext.documentType.trim().toUpperCase();
				const matchedByCode = this.templates.find(
					(t) => String((t.documentType as any)?.code || "").toUpperCase() === targetCode
				);
				if (matchedByCode) {
					this.template = matchedByCode;
					return;
				}
			}
			this.template = this.templates[0];
		} else if (this.country && this.category) {
			this.template = {
				_id: `fallback_${this.category}_${this.country.toLowerCase().replace(/\s+/g, "_")}`,
				name:
					this.category === "government_id"
						? "National Identity Document"
						: this.category === "passport"
							? "Passport"
							: "Driver's License",
				country: this.country,
				documentCategory: this.category as any,
				requiresBackSide: this.category === "government_id",
				system: true,
				active: true,
			} as any;
		}
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
			addressLine1: "",
			addressLine2: "",
			age: "",
			agreements: false,
			city: "",
			country: "",
			countryCode: DEFAULT_PHONE_COUNTRY_CODE,
			dateOfBirth: "",
			email: "",
			firstName: "",
			fullName: "",
			gender: "",
			lastName: "",
			otp: "",
			phone: "",
			phoneGateway: "sms",
			postalCode: "",
			state: "",
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
		additionalFields: Array.isArray(signUp.additionalFields) ? signUp.additionalFields : [],
		colombianBarcodeValidation: Boolean(document.colombianBarcodeValidation),
		compareMinScore: document.compareMinScore || liveness.compareMinScore || 0.85,
		countryCode: signUp.countryCode,
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

const humanizeOcrKey = (key: string): string => {
	const spaced = key
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.trim();

	return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
};

const loadHtmlImage = (src: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});

interface ParsedApiError {
	reason: string;
	kind: string;
	message: string;
	status: number;
}

const parseApiError = (err: any): ParsedApiError => {
	if (!err) return { reason: "unknown", kind: "unknown", message: "", status: 0 };
	const status = Number(err.status || err.statusCode || 0);
	const body = err.error || err.body || (typeof err === "object" ? err : {});
	const rawMsg = String(body?.message || body?.error || err.message || "").replace(/^\d{3}:/, "").trim();
	const bodyReason = String(body?.failureReason || "").replace(/^\d{3}:/, "").trim();
	const reason =
		bodyReason && bodyReason !== "liveness_error" && bodyReason !== "unknown"
			? bodyReason
			: rawMsg || bodyReason || "unknown";

	let kind = String(body?.failureKind || "").trim();

	if (!kind || kind === "unknown") {
		if (
			status === 409 ||
			reason.includes("linked_to_another") ||
			reason.includes("already_set") ||
			reason.includes("duplicated_person")
		) {
			kind = "conflict";
		} else if (status === 402 || reason === "insufficient_credits") {
			kind = "billing";
		}
	}

	return {
		reason: reason || "unknown",
		kind: kind || "unknown",
		message: rawMsg,
		status,
	};
};
