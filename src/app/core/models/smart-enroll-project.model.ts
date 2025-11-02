import { PromptTemplate } from "./prompt-template.model";

export { LegacyProject, LegacyProjectFlow } from "./legacy-project.model";

export const isProject = (project: any): project is Project => {
    return project && "_id" in project;
};

export const isPersonalProjectFlow = (projectFlow: any): projectFlow is PersonalProjectFlow => {
    return projectFlow && "_id" in projectFlow && "target" in projectFlow && projectFlow.target === "personal" && projectFlow.type === "onboarding";
};

export const isBusinessProjectFlow = (projectFlow: any): projectFlow is BusinessProjectFlow => {
    return projectFlow && "_id" in projectFlow && "target" in projectFlow && projectFlow.target === "business" && projectFlow.type === "onboarding";
};

export type ProjectTarget = "personal" | "business" | "";

export interface Project<T extends SmartEnrollProjectFlow = SmartEnrollProjectFlow> {
    _id?: string;
    allowedCountries?: string[];
    assignedCollection?: string;
    branding: Branding;
    client: string;
    collectionCode?: string;
    contactEmail?: string;
    createdAt?: string;
    currentStep: number;
    dataProtection: DataProtection;
    demoMode?: boolean;
    identifier?: string;
    lastStep: number;
    name: string;
    privacyUrl?: string;
    projectFlows?: T[];
    projectMembers?: string[];
    status: "draft" | "active" | "paused";
    target: ProjectTarget;
    termsAndConditionsUrl?: string;
    updatedAt?: string;
    version?: number;
}

export interface ProjectSmartEnroll {
    _id?: string;
    allowedCountries?: string[];
    assignedCollection?: string;
    branding: Branding;
    client: string;
    collectionCode?: string;
    contactEmail?: string;
    createdAt?: string;
    currentStep: number;
    dataProtection: DataProtection;
    identifier?: string;
    lastStep: number;
    name: string;
    privacyUrl?: string;
    projectFlow?: SmartEnrollProjectFlow;
    projectMembers?: string[];
    status: "draft" | "active" | "paused";
    target: ProjectTarget;
    termsAndConditionsUrl?: string;
    updatedAt?: string;
}

export interface DataProtection {
    address?: string;
    address2?: string;
    city?: string;
    country?: string;
    email?: string;
    name?: string;
    postalCode?: string;
}

export interface Branding {
    backgroundColor: string;
    buttonColor?: string;
    buttonTextColor?: string;
    image?: string | null;
    imageBackgroundColor?: string;
    logo?: string;
    textColor?: string;
    titleColor?: string;
}

export interface DatApiSettings {
    basePrice: number;
    format: "JSON" | "noCode";
    name: string;
    optional: string[];
    required: string[];
}

export interface LoginSettings {
    email?: boolean;
    emailGateway?: "mailgun" | "none";
    faceLiveness?: boolean;
    livenessMinScore?: number;
    phone?: boolean;
    phoneGateway?: "sms" | "whatsapp" | "both" | "none";
    searchMinScore?: number;
    searchMode?: "FAST" | "ACCURATE";
    showFaceLivenessRecommendation?: boolean;
    steps: any[];
}

export interface LinkSettings {
    authWithLegalDocument?: boolean;
    compareMinScore?: number;
    defaultTime?: number;
    enrollmentA?: boolean;
    enrollmentAAgeEstimation?: boolean;
    enrollmentB?: boolean;
    enrollmentBAgeEstimation?: boolean;
    livenessMinScore?: number;
    searchMinScore?: number;
    searchMode?: "FAST" | "ACCURATE";
    useGovernmentID?: boolean;
    useLicense?: boolean;
    usePassport?: boolean;
    validateEmail?: boolean;
    validatePhone?: boolean;
}

export interface OnboardingSteps {
    basicInformation: "mandatory" | "optional" | "skip";
    document: "mandatory" | "optional" | "skip";
    form: "mandatory" | "optional" | "skip";
    liveness: "mandatory" | "optional" | "skip";
    signUpForm: "mandatory" | "optional" | "skip";
}

export interface SignUpFormSettings {
    email?: boolean;
    emailGateway?: "mailgun" | "none";
    extraFields?: string[];
    firstName?: boolean;
    fullName?: boolean;
    lastName?: boolean;
    phone?: boolean;
    phoneGateway?: "sms" | "whatsapp" | "both" | "none";
    showPrivacyNotice?: boolean;
    showTermsAndConditions?: boolean;
}

export interface BasicInformationSettings {
    address?: boolean;
    age?: boolean;
    dateOfBirth?: boolean;
    gender?: boolean;
    postalCode?: boolean;
}

export interface DocumentSettings {
    compareMinScore?: number;
    criminalEndpoints?: string[];
    fallbackValidationMethod?: "SCAN_ZERO" | "SCAN_PROMPT" | "SCAN_STUDIO";
    maxAttempts?: number;
    scanDocumentAllowed?: boolean;
    uploadDocumentAllowed?: boolean;
    useGovernmentID?: boolean;
    useLicense?: boolean;
    usePassport?: boolean;
    validationMethod?: "SCAN_ZERO" | "SCAN_PROMPT" | "SCAN_STUDIO";
    verifyCriminalHistory?: boolean;
    verifyNames?: boolean;
}

export interface LivenessSettings {
    livenessMinScore?: number;
    maxAttempts?: number;
    searchMinScore?: number;
    searchMode?: "FAST" | "ACCURATE";
}

export interface OnboardingSettings {
    basicInformation: BasicInformationSettings;
    document: DocumentSettings;
    form?: string;
    hiddenLoginOption?: boolean;
    liveness: LivenessSettings;
    requiresSignature?: boolean;
    signUpForm: SignUpFormSettings;
    steps: OnboardingSteps;
}

export interface DefaultProjectFlow {
    target?: "";
}

// V3 Model Interfaces (based on backend schema)
export interface PersonalDocumentConfiguration {
    active: boolean;
    documentCategory: "government_id" | "passport" | "license";
    documentTemplates: ProjectDocumentTemplate[];
}

export interface PersonalDocumentType {
    configurations: PersonalDocumentConfiguration[];
    country: string;
}

export interface PersonalDocuments {
    attemptLimit: number;
    criminalHistoryVerification: boolean;
    documentTypes: PersonalDocumentType[];
    informationVerification: boolean;
    screening: boolean;
    verificationMethods: string[];
}

export interface PersonalIntegrations {
    apiTestType?: "email" | "phone";
    apiTestValue?: string;
    apiUrl?: string;
    redirectUrl?: string;
    source?: "API" | "CSV" | "NONE";
    strategy?: "blacklist" | "none";
    webhook?: string;
}

export interface PersonalLiveness {
    attemptLimit: number;
    minScore?: number;
    searchMinScore?: number;
    searchMode: "FAST" | "ACCURATE";
}

export interface PersonalSignUpForm {
    additionalFields: string[];
    allowAdditionalFields: boolean;
    countryCode?: string;
    email: boolean;
    emailGateway: "mailgun" | "none";
    fullName: boolean;
    fullNameStyle: "together" | "separate";
    phone: boolean;
    phoneGateway: "sms" | "whatsapp" | "both" | "none";
    showPrivacyNotice: boolean;
    showTermsAndConditions: boolean;
}

export interface PersonalSteps {
    document: "mandatory" | "optional" | "skip";
    liveness: "mandatory" | "optional" | "skip";
}

// Base interface for common properties
export interface BaseProjectFlow {
    _id?: string;
    client: string;
    createdAt?: string;
    integrations: PersonalIntegrations | BusinessIntegrations;
    liveness: PersonalLiveness | BusinessLiveness;
    project: string | Project;
    signUpForm: PersonalSignUpForm | BusinessSignUpForm;
    status: "draft" | "active" | "paused";
    type: "onboarding";
    updatedAt?: string;
    version: number;
}

export interface PersonalProjectFlow extends BaseProjectFlow {
    documents: PersonalDocuments;
    integrations: PersonalIntegrations;
    liveness: PersonalLiveness;
    signUpForm: PersonalSignUpForm;
    steps: PersonalSteps;
    target: "personal";
}

export interface BusinessProjectFlow extends BaseProjectFlow {
    business: BusinessSettings;
    integrations: BusinessIntegrations;
    liveness: BusinessLiveness;
    representatives: BusinessRepresentatives;
    signUpForm: BusinessSignUpForm;
    steps: BusinessSteps;
    target: "business";
}

export interface LoginProjectFlow extends BaseProjectFlow {
    loginSettings: LoginSettings;
    integrations: PersonalIntegrations;
}

// Union type for both project flows
export type SmartEnrollProjectFlow = PersonalProjectFlow | BusinessProjectFlow;

export type SmartAccessProjectFlow = LoginProjectFlow;

export interface ProjectDocumentTemplate {
    promptTemplate: string | PromptTemplate;
    required?: "mandatory" | "optional";
}

export interface BusinessDocumentConfiguration {
    active: boolean;
    documentCategory: "bank_document" | "tax_document" | "business_document";
    documentTemplates: ProjectDocumentTemplate[];
}

export interface BusinessDocumentType {
    configurations: BusinessDocumentConfiguration[];
    country: string;
}

export interface BusinessSettings {
    attemptLimit: number;
    criminalHistoryVerification: boolean;
    documentTypes: BusinessDocumentType[];
    informationVerification: boolean;
    screening: boolean;
}

export interface BusinessDocuments {
    attemptLimit: number;
    criminalHistoryVerification: boolean;
    documentTypes: BusinessDocumentType[];
    informationVerification: boolean;
    screening: boolean;
    verificationMethods: string[];
}

export interface BusinessRepresentatives {
    information: BusinessSignUpForm;
    documents: BusinessDocuments;
    liveness: BusinessLiveness;
}

export interface BusinessIntegrations {
    redirectUrl?: string;
    webhook?: string;
    apiTestType?: "email" | "phone";
    apiTestValue?: string;
    apiUrl?: string;
    source?: "API" | "CSV" | "NONE";
    strategy?: "blacklist" | "none";
}

export interface BusinessLiveness {
    attemptLimit: number;
    minScore?: number;
    searchMinScore?: number;
    searchMode: "FAST" | "ACCURATE";
}

export interface BusinessSignUpForm {
    additionalFields: string[];
    allowAdditionalFields: boolean;
    countryCode?: string;
    email: boolean;
    emailGateway: "mailgun" | "none";
    fullName: boolean;
    fullNameStyle: "together" | "separate";
    phone: boolean;
    phoneGateway: "sms" | "whatsapp" | "both" | "none";
    showPrivacyNotice: boolean;
    showTermsAndConditions: boolean;
}

export interface BusinessSteps {
    businessVerification: boolean;
    legalRepresentative: "mandatory" | "optional" | "skip";
    liveness: "mandatory" | "optional" | "skip";
}
