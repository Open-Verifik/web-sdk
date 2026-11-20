export type SmartLinkMode = "personal" | "business" | "humanId" | "access";

export type SmartLinkResolvedMode = SmartLinkMode | "step_up";

export type SmartLinkCompletionMode = "redirect" | "receipt" | "postMessage";

export type SmartLinkOutcomeType = "kyc" | "kyb" | "human_id" | "access";

export interface SmartLinkBranding {
	logo?: string;
	image?: string;
	buttonColor?: string;
	buttonTextColor?: string;
	titleColor?: string;
	textColor?: string;
	backgroundColor?: string;
	imageBackgroundColor?: string;
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

export interface SmartLinkPublicConfig {
	shortCode: string;
	state: string;
	project: SmartLinkPublicProject;
	verifyStyle?: string;
	flowOrder?: "contact_first" | "consent_first";
	allowedIdentifiers?: ("email" | "phone")[];
	requireDocument?: boolean;
	hasPrefilledIdentifier?: boolean;
	supportedModes?: SmartLinkMode[];
	defaultMode?: SmartLinkMode | "prompt";
	lockedMode?: SmartLinkMode | null;
	autoDetectExisting: boolean;
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
	targetProjectId: string;
	targetRoute: string;
	stepUpReason: string | null;
}

export interface SmartLinkReceiptPayload {
	shortCode: string;
	confirmationCode: string;
	outcomeType: SmartLinkOutcomeType | string;
	completedAt?: string;
	projectName?: string;
	project?: {
		name: string;
		branding?: SmartLinkBranding;
		defaultLanguage?: string;
	};
	verifyStyle?: string;
	receiptMessage?: string;
	allowPdfDownload?: boolean;
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

export interface ActiveSmartLinkContext {
	shortCode: string;
	completionMode?: SmartLinkCompletionMode;
	verifyStyle?: string;
	projectName?: string;
	createdAtMs: number;
}
