export type EnrollmentClient = "legacy" | "v2";
export type StepFlag = "skip" | "optional" | "mandatory";
export type DocumentCategory = "government_id" | "passport" | "license";

export type VerifyScreen =
	| "loading"
	| "upgrade"
	| "countryBlocked"
	| "signup"
	| "name"
	| "email"
	| "phone"
	| "agreements"
	| "emailCode"
	| "phoneCode"
	| "kycPrompt"
	| "consent"
	| "decline"
	| "handoff"
	| "ready"
	| "front"
	| "reviewFront"
	| "flip"
	| "back"
	| "reviewBack"
	| "ocrReview"
	| "selfieIntro"
	| "selfie"
	| "retry"
	| "submitted"
	| "humanId"
	| "error";

export type ContactScreen = "signup";

export type HumanIdOutputFormat = "string" | "qrCode";
export type HumanIdStorage = "ipfs" | "cloud" | "none";

/** HumanAuthn differentiators: the journey ends on a HumanID instead of a verification summary. */
export interface HumanAuthnSettings {
	outputFormat: HumanIdOutputFormat;
	publicDataKeys: string[];
	storage: HumanIdStorage;
}

export interface VerifySettings {
	additionalFields?: string[];
	humanAuthn?: HumanAuthnSettings;
	colombianBarcodeValidation?: boolean;
	countryCode?: string;
	email: boolean;
	emailGateway: string;
	firstName: boolean;
	fullName: boolean;
	lastName: boolean;
	phone: boolean;
	phoneGateway: string;
	showPrivacy: boolean;
	showTerms: boolean;
	document: StepFlag;
	liveness: StepFlag;
	useGovernmentId: boolean;
	useLicense: boolean;
	usePassport: boolean;
	scanAllowed: boolean;
	uploadAllowed: boolean;
	documentMaxAttempts: number;
	livenessMaxAttempts: number;
	compareMinScore: number;
	livenessMinScore: number;
}

export interface ResumeInput {
	currentStep?: string;
	documentFailed: boolean;
	documentMismatch?: boolean;
	documentStep: StepFlag;
	emailNeeded: boolean;
	handoff?: boolean;
	hasBack: boolean;
	hasBiometric: boolean;
	hasDocument: boolean;
	livenessStep: StepFlag;
	needsBack: boolean;
	phoneNeeded: boolean;
	status?: string;
}

export type VerifyHandoffPhase = "qr" | "document" | "liveness" | "completed";

export interface HandoffPhaseInput {
	currentStep?: string;
	hasBiometric?: boolean;
	hasDocument?: boolean;
	status?: string;
}

export interface CompletionInput {
	compareMinScore: number;
	comparePassed?: boolean | null;
	compareScore?: number;
	documentSkipped: boolean;
	hasCompare: boolean;
	livenessMinScore: number;
	livenessScore?: number;
	livenessSkipped: boolean;
	livenessStatus?: string;
}

const TERMINAL = new Set(["COMPLETED", "FAILED", "COMPLETED_WITHOUT_KYC", "NEEDS_MANUAL_VERIFICATION", "EXPIRED"]);
const IN_PROGRESS_STEPS = new Set(["signUpForm", "instructions", "document", "liveness"]);

export const enrollmentClientFrom = (value: unknown): EnrollmentClient => (value === "v2" ? "v2" : "legacy");

/** V1 and the setup preview collect name, email, phone and terms on a single sign-up screen, so v2 does the same. */
export const contactScreens = (settings: VerifySettings): ContactScreen[] =>
	settings.fullName ||
	settings.firstName ||
	settings.lastName ||
	settings.email ||
	settings.phone ||
	settings.showTerms ||
	settings.showPrivacy ||
	Boolean(settings.additionalFields?.length)
		? ["signup"]
		: [];

export const hasContactBlock = (settings: VerifySettings): boolean => contactScreens(settings).length > 0;

export const needsEmailCode = (settings: VerifySettings, validated: boolean): boolean =>
	Boolean(settings.email && settings.emailGateway && settings.emailGateway !== "none" && !validated);

export const needsPhoneCode = (settings: VerifySettings, validated: boolean): boolean =>
	Boolean(settings.phone && settings.phoneGateway && settings.phoneGateway !== "none" && !validated);

export const cameraStepsAhead = (settings: VerifySettings): boolean => settings.document !== "skip" || settings.liveness !== "skip";

export const canSkipIdentity = (settings?: Pick<VerifySettings, "document" | "liveness"> | null): boolean =>
	Boolean(
		settings &&
			settings.document !== "mandatory" &&
			settings.liveness !== "mandatory" &&
			(settings.document === "optional" || settings.liveness === "optional")
	);

export const documentNeedsBack = (category: string, requiresBackSide?: boolean): boolean => {
	if (typeof requiresBackSide === "boolean") return requiresBackSide;

	return category === "government_id" || category === "license" || category === "id" || category === "driving_license";
};

export const attemptsRemaining = (maxAttempts: number, failedCount: number): number => Math.max(0, (maxAttempts || 3) - (failedCount || 0));

export const isTerminalStatus = (status?: string, currentStep?: string): boolean => {
	if (currentStep === "end" || currentStep === "skipKYC") return true;
	if (status === "NEEDS_MANUAL_VERIFICATION" && currentStep && IN_PROGRESS_STEPS.has(currentStep)) {
		return false;
	}
	return TERMINAL.has(status || "");
};

export const resumeScreen = (input: ResumeInput): VerifyScreen => {
	if (isTerminalStatus(input.status, input.currentStep) || input.hasBiometric) return "submitted";
	if (input.emailNeeded) return "emailCode";
	if (input.phoneNeeded) return "phoneCode";
	if (input.documentFailed) return "retry";
	if (input.hasDocument && input.documentMismatch) return "ocrReview";
	if (input.hasDocument && input.needsBack && !input.hasBack) return "flip";

	if (
		!input.handoff &&
		!input.hasDocument &&
		!input.hasBiometric &&
		canSkipIdentity({ document: input.documentStep, liveness: input.livenessStep })
	) {
		return "kycPrompt";
	}

	const startedCapture =
		input.currentStep === "instructions" ||
		input.currentStep === "document" ||
		input.currentStep === "liveness" ||
		Boolean(input.handoff) ||
		input.hasDocument;

	if (startedCapture && input.documentStep !== "skip" && !input.hasDocument) return "ready";
	if (input.hasDocument && input.currentStep === "document") return "ocrReview";
	if (input.hasDocument && input.livenessStep !== "skip") return "selfieIntro";
	if (startedCapture && input.documentStep === "skip" && input.livenessStep !== "skip") return "selfieIntro";
	if (input.hasDocument && input.livenessStep === "skip") return "submitted";

	return "consent";
};

export const resolveHandoffPhase = (input: HandoffPhaseInput): VerifyHandoffPhase => {
	if (isTerminalStatus(input.status, input.currentStep) || input.hasBiometric) {
		return "completed";
	}
	if (input.currentStep === "liveness" || input.hasDocument) {
		return "liveness";
	}
	if (input.currentStep === "document") {
		return "document";
	}

	return "qr";
};

export const completionStatus = (input: CompletionInput): "COMPLETED" | "FAILED" | "COMPLETED_WITHOUT_KYC" => {
	if (input.documentSkipped && input.livenessSkipped) return "COMPLETED_WITHOUT_KYC";

	if (input.hasCompare) {
		if (input.comparePassed === false) return "FAILED";
		if (input.comparePassed == null && (input.compareScore || 0) < input.compareMinScore) return "FAILED";
	}

	if (!input.livenessSkipped) {
		if (input.livenessStatus === "failed") return "FAILED";
		if (input.livenessStatus !== "validated" && (input.livenessScore || 0) < input.livenessMinScore) return "FAILED";
	}

	return "COMPLETED";
};

export const progressSegments = (
	hasContact: boolean,
	hasDocument = true,
): Array<"contact" | "consent" | "document" | "selfie" | "done"> => {
	const segments: Array<"contact" | "consent" | "document" | "selfie" | "done"> = [];

	if (hasContact) segments.push("contact");

	segments.push("consent");
	if (hasDocument) segments.push("document");
	segments.push("selfie", "done");

	return segments;
};

const CONTACT_SCREENS = new Set<VerifyScreen>(["signup", "name", "email", "phone", "agreements", "emailCode", "phoneCode"]);
const CONSENT_SCREENS = new Set<VerifyScreen>(["kycPrompt", "consent", "decline"]);
const DOCUMENT_SCREENS = new Set<VerifyScreen>(["handoff", "ready", "front", "reviewFront", "flip", "back", "reviewBack", "ocrReview"]);
const SELFIE_SCREENS = new Set<VerifyScreen>(["selfieIntro", "selfie", "retry"]);

export const progressIndex = (screen: VerifyScreen, hasContact: boolean, hasDocument = true): number => {
	const segments = progressSegments(hasContact, hasDocument);

	if (screen === "submitted" || screen === "humanId") return segments.length - 1;
	if (CONTACT_SCREENS.has(screen)) return Math.max(0, segments.indexOf("contact"));
	if (CONSENT_SCREENS.has(screen)) return segments.indexOf("consent");
	if (DOCUMENT_SCREENS.has(screen)) {
		const docIdx = segments.indexOf("document");
		return docIdx >= 0 ? docIdx : Math.max(0, segments.indexOf("selfie"));
	}
	if (SELFIE_SCREENS.has(screen)) return segments.indexOf("selfie");

	return 0;
};

/** What the enrollee receives at the end of a HumanAuthn journey (shown once, never stored by Verifik). */
export interface HumanIdResult {
	/** Encrypted HumanID string, or the QR image (data URL) when the project outputs a QR. */
	value: string;
	outputFormat: HumanIdOutputFormat;
	storage: HumanIdStorage;
	/** IPFS CID or URL when the project pins the HumanID. */
	ipfsReference: string;
}

/** Screen that closes the journey: the HumanID for HumanAuthn projects, the summary otherwise. */
export const finalScreen = (settings?: Pick<VerifySettings, "humanAuthn"> | null): "submitted" | "humanId" =>
	settings?.humanAuthn ? "humanId" : "submitted";

export const nextAfterCapture = (settings: VerifySettings, skippedDocument: boolean): VerifyScreen => {
	if (settings.liveness !== "skip" && !skippedDocument) return "selfieIntro";
	if (settings.liveness !== "skip") return "selfieIntro";

	return finalScreen(settings);
};
