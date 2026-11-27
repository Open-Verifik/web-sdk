export type BusinessScreen =
	| "loading"
	| "upgrade"
	| "company"
	| "documents"
	| "representatives"
	| "review"
	| "submitted"
	| "error";

export type BusinessStep = "company" | "documents" | "representatives" | "review" | "submitted";

export type CorporateDocumentCategory =
	| "business_document"
	| "tax_document"
	| "bank_document"
	| "proof_of_address"
	| "other";

export type RepresentativeRole =
	| "legal_representative"
	| "beneficial_owner"
	| "director"
	| "executive"
	| "signatory";

export type KycMemberStatus =
	| "PENDING"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "FAILED"
	| "NEEDS_MANUAL_VERIFICATION";

export interface BusinessFlowPolicy {
	collectOwnershipPercentage: boolean;
	collectUboDeclaration: boolean;
	allowSelfAsRepresentative: boolean;
	requireRepresentativeKyc: boolean;
	minVerifiedRepresentatives: number;
	collectUseCase: boolean;
	allowPartialSubmissionWithNotes: boolean;
	enableProgressiveTiers: boolean;
	tier1RequiresRepresentativeKyc: boolean;
	tier2RequiresAllMandatoryDocs: boolean;
}

export interface DocumentSlotFromApi {
	slotKey?: string;
	category: CorporateDocumentCategory;
	documentType?: string;
	promptTemplateId?: string;
	title?: string;
	titleKey?: string;
	description?: string;
	descriptionKey?: string;
	required: boolean;
	ocrFields?: string[];
	icon?: "incorporation" | "tax" | "bank" | "file";
	conditional?: boolean;
	conditionKey?: string;
}

export interface MissingDocumentNote {
	category: string;
	documentType?: string;
	reason: string;
	note: string;
	addedAt?: string;
}

export interface RequestedDocument {
	_id?: string;
	documentType: string;
	category?: string;
	reason?: string;
	requestedAt?: string;
	fulfilledAt?: string;
}

export interface CompanyAddress {
	street: string;
	city: string;
	state: string;
	postalCode: string;
	country: string;
}

export interface CompanyProfile {
	legalName: string;
	commercialName: string;
	taxId: string;
	checkDigit: string;
	country: string;
	entityType: string;
	address: CompanyAddress;
	email: string;
	phone: string;
	industry?: string;
	website?: string;
	intendedUseCase?: string;
	expectedMonthlyVolume?: string;
	privacyPolicyUrl?: string;
}

export interface CorporateDocument {
	_id?: string;
	category: CorporateDocumentCategory;
	documentType?: string;
	documentTypeName?: string;
	promptTemplateId?: string;
	filename: string;
	fileUrl?: string;
	mimeType: string;
	size?: number;
	status?:
		| "pending"
		| "uploaded"
		| "validating"
		| "validated"
		| "rejected"
		| "verified"
		| "PENDING"
		| "APPROVED"
		| "REJECTED"
		| "NEEDS_MANUAL_REVIEW";
	rejectionReason?: string;
	version?: number;
	supersededAt?: string;
	ocrData?: Record<string, any>;
	uploadedAt?: string;
}

export interface CompanyRepresentative {
	_id?: string;
	firstName: string;
	lastName: string;
	role: RepresentativeRole;
	isUBO: boolean;
	ownershipPercentage: number;
	documentType: string;
	documentNumber: string;
	email: string;
	phone: string;
	kycStatus?: KycMemberStatus;
	kycAppRegistration?: string;
	kycToken?: string;
	inviteSentAt?: string;
}

export interface BusinessRegistrationDossier {
	_id: string;
	projectId: string;
	projectFlowId: string;
	status: string;
	currentStep: string;
	kybTier?: string;
	businessDetails: CompanyProfile;
	documents: CorporateDocument[];
	representatives: CompanyRepresentative[];
	missingDocumentNotes?: MissingDocumentNote[];
	submissionNotes?: string;
	requestedDocuments?: RequestedDocument[];
	flowPolicy?: Partial<BusinessFlowPolicy>;
	documentSlots?: DocumentSlotFromApi[];
	legalAttestation?: boolean;
	signatureDate?: string;
	token?: string;
	expiresAt?: string;
	verificationSummary?: {
		officialRegistryVerified?: boolean;
		amlScreeningPassed?: boolean;
		representativesKycPassed?: boolean;
		riskLevel?: string;
	};
}

export interface EntityTypeOption {
	value: string;
	label: string;
	country?: string;
}

export interface CountryJurisdiction {
	code: string;
	name: string;
	countryKey?: string;
	taxIdLabel: string;
	taxIdMask?: string;
	hasCheckDigit: boolean;
	entityTypes: EntityTypeOption[];
}
