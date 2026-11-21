export type SmartLinkMode = "personal" | "business" | "humanId" | "access";

export type SmartLinkResolvedMode = SmartLinkMode | "step_up";

export type SmartLinkCompletionMode = "redirect" | "receipt" | "postMessage";

export type SmartLinkOutcomeType = "kyc" | "kyb" | "human_id" | "access";

export interface SmartLinkBranding {
	logo?: string;
	image?: string;
	rightImage?: string;
	buttonColor?: string;
	buttonTextColor?: string;
	titleColor?: string;
	textColor?: string;
	backgroundColor?: string;
	imageBackgroundColor?: string;
	rightBackgroundColor?: string;
}

export interface SmartLinkPublicProject {
	_id: string;
	name: string;
	branding?: SmartLinkBranding;
	defaultLanguage?: string;
	privacyUrl?: string;
	termsAndConditionsUrl?: string;
}

export interface SmartLinkPrefill {
	email?: string;
	phone?: string;
	countryCode?: string;
	taxId?: string;
	fullName?: string;
}

export interface SmartLinkReceiptPayload {
	shortCode: string;
	confirmationCode: string;
	outcomeType: SmartLinkOutcomeType | string;
	completedAt?: string;
	projectName?: string;
	verifiedName?: string;
	requireDocument?: boolean;
	verificationMethod?: string;
	project?: {
		name: string;
		branding?: SmartLinkBranding;
		defaultLanguage?: string;
		privacyUrl?: string;
		termsAndConditionsUrl?: string;
	};
	verifyStyle?: string;
	receiptMessage?: string;
	allowPdfDownload?: boolean;
}

export interface SmartLinkPublicConfig {
	shortCode: string;
	state: string;
	alreadyCompleted?: boolean;
	receipt?: SmartLinkReceiptPayload;
	project: SmartLinkPublicProject;
	verifyStyle?: string;
	flowOrder?: "contact_first" | "consent_first";
	allowedIdentifiers?: ("email" | "phone")[];
	requireDocument?: boolean;
	hasPrefilledIdentifier?: boolean;
	supportedModes?: SmartLinkMode[];
	defaultMode?: SmartLinkMode | "prompt";
	lockedMode?: SmartLinkMode | null;
	autoDetectExisting?: boolean;
	completionMode: SmartLinkCompletionMode;
	prefill?: SmartLinkPrefill;
	linkedTargetsAvailable?: Record<SmartLinkMode, boolean>;
}

export interface SmartLinkLookupResponse {
	shortCode: string;
	identifier?: string;
	resolvedMode: SmartLinkResolvedMode;
	verificationAction?: "face_only" | "document_and_face" | "enroll";
	hasExistingAccount?: boolean;
	requireDocument?: boolean;
	directSelfie?: boolean;
	inlineFaceVerify?: boolean;
	matchedNameHint?: string | null;
	matchedAppRegistrationId?: string;
	targetProjectId: string;
	targetRoute: string | null;
	stepUpReason: string | null;
}

export interface SmartLinkCompleteResponse {
	state: string;
	completionMode: SmartLinkCompletionMode;
	redirectUrl: string;
	allowedPostMessageOrigins: string[];
	sessionCode: string;
	externalRefId?: string;
	receipt: SmartLinkReceiptPayload;
}

export interface SmartLinkEventPayload {
	type: "FAILED" | "IN_PROGRESS";
	reason?: string;
	step?: string;
	summary?: string;
}

export interface SmartLinkEventResponse {
	ok: boolean;
	state: string;
}

export interface ActiveSmartLinkContext {
	shortCode: string;
	completionMode?: SmartLinkCompletionMode;
	verifyStyle?: string;
	projectName?: string;
	createdAtMs: number;
}
