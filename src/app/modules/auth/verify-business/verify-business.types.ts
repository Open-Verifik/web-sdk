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
	| "shareholder"
	| "director";

export type KycMemberStatus =
	| "PENDING"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "FAILED"
	| "NEEDS_MANUAL_VERIFICATION";

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
	status?: "pending" | "uploaded" | "validating" | "validated" | "rejected";
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
	businessDetails: CompanyProfile;
	documents: CorporateDocument[];
	representatives: CompanyRepresentative[];
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
