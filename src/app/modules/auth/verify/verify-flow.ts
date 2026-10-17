export type EnrollmentClient = "legacy" | "v2";
export type StepFlag = "skip" | "optional" | "mandatory";
export type DocumentCategory = "government_id" | "passport" | "license";

export type VerifyScreen =
	| "loading"
	| "upgrade"
	| "countryBlocked"
	| "name"
	| "email"
	| "phone"
	| "agreements"
	| "emailCode"
	| "phoneCode"
	| "consent"
	| "decline"
	| "handoff"
	| "ready"
	| "front"
	| "reviewFront"
	| "flip"
	| "back"
	| "reviewBack"
	| "selfieIntro"
	| "selfie"
	| "retry"
	| "submitted"
	| "error";

export type ContactScreen = "name" | "email" | "phone" | "agreements";

export interface VerifySettings {
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
	documentStep: StepFlag;
	emailNeeded: boolean;
	hasBack: boolean;
	hasBiometric: boolean;
	hasDocument: boolean;
	livenessStep: StepFlag;
	needsBack: boolean;
	phoneNeeded: boolean;
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

const TERMINAL = new Set(["COMPLETED", "FAILED", "COMPLETED_WITHOUT_KYC"]);

export const enrollmentClientFrom = (value: unknown): EnrollmentClient => (value === "v2" ? "v2" : "legacy");

export const contactScreens = (settings: VerifySettings): ContactScreen[] => {
	const screens: ContactScreen[] = [];

	if (settings.fullName || settings.firstName || settings.lastName) screens.push("name");
	if (settings.email) screens.push("email");
	if (settings.phone) screens.push("phone");
	if (settings.showTerms || settings.showPrivacy) screens.push("agreements");

	return screens;
};

export const hasContactBlock = (settings: VerifySettings): boolean => contactScreens(settings).length > 0;

export const needsEmailCode = (settings: VerifySettings, validated: boolean): boolean =>
	Boolean(settings.email && settings.emailGateway && settings.emailGateway !== "none" && !validated);

export const needsPhoneCode = (settings: VerifySettings, validated: boolean): boolean =>
	Boolean(settings.phone && settings.phoneGateway && settings.phoneGateway !== "none" && !validated);

export const cameraStepsAhead = (settings: VerifySettings): boolean => settings.document !== "skip" || settings.liveness !== "skip";

export const documentNeedsBack = (category: string, requiresBackSide?: boolean): boolean => {
	if (typeof requiresBackSide === "boolean") return requiresBackSide;

	return category === "government_id" || category === "license" || category === "id" || category === "driving_license";
};

export const attemptsRemaining = (maxAttempts: number, failedCount: number): number => Math.max(0, (maxAttempts || 3) - (failedCount || 0));

export const isTerminalStatus = (status?: string, currentStep?: string): boolean =>
	TERMINAL.has(status || "") || currentStep === "end" || currentStep === "skipKYC";

export const resumeScreen = (input: ResumeInput): VerifyScreen => {
	if (isTerminalStatus(input.status, input.currentStep) || input.hasBiometric) return "submitted";
	if (input.emailNeeded) return "emailCode";
	if (input.phoneNeeded) return "phoneCode";
	if (input.documentFailed) return "retry";
	if (input.hasDocument && input.needsBack && !input.hasBack) return "flip";

	const startedCapture = input.currentStep === "document" || input.currentStep === "liveness" || input.hasDocument;

	if (startedCapture && input.documentStep !== "skip" && !input.hasDocument) return "ready";
	if (input.hasDocument && input.livenessStep !== "skip") return "selfieIntro";
	if (startedCapture && input.documentStep === "skip" && input.livenessStep !== "skip") return "selfieIntro";
	if (input.hasDocument && input.livenessStep === "skip") return "submitted";

	return "consent";
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

export const progressSegments = (hasContact: boolean): Array<"contact" | "consent" | "document" | "selfie" | "done"> => {
	const segments: Array<"contact" | "consent" | "document" | "selfie" | "done"> = [];

	if (hasContact) segments.push("contact");

	segments.push("consent", "document", "selfie", "done");

	return segments;
};

const CONTACT_SCREENS = new Set<VerifyScreen>(["name", "email", "phone", "agreements", "emailCode", "phoneCode"]);
const CONSENT_SCREENS = new Set<VerifyScreen>(["consent", "decline"]);
const DOCUMENT_SCREENS = new Set<VerifyScreen>(["handoff", "ready", "front", "reviewFront", "flip", "back", "reviewBack"]);
const SELFIE_SCREENS = new Set<VerifyScreen>(["selfieIntro", "selfie", "retry"]);

export const progressIndex = (screen: VerifyScreen, hasContact: boolean): number => {
	const segments = progressSegments(hasContact);

	if (screen === "submitted") return segments.length - 1;
	if (CONTACT_SCREENS.has(screen)) return Math.max(0, segments.indexOf("contact"));
	if (CONSENT_SCREENS.has(screen)) return segments.indexOf("consent");
	if (DOCUMENT_SCREENS.has(screen)) return segments.indexOf("document");
	if (SELFIE_SCREENS.has(screen)) return segments.indexOf("selfie");

	return 0;
};

export const nextAfterCapture = (settings: VerifySettings, skippedDocument: boolean): VerifyScreen => {
	if (settings.liveness !== "skip" && !skippedDocument) return "selfieIntro";
	if (settings.liveness !== "skip") return "selfieIntro";

	return "submitted";
};
