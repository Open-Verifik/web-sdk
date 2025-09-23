import { Branding, DataProtection, ProjectTarget } from "./smart-enroll-project.model";

export interface LegacyProject {
    _id?: string;
    allowedCountries?: string[];
    assignedCollection?: string;
    branding: LegacyBranding;
    client: string;
    collectionCode?: string;
    contactEmail?: string;
    createdAt?: string;
    currentStep: number;
    dataProtection: LegacyDataProtection;
    demoMode?: boolean;
    demoOTP?: string;
    identifier?: string;
    lastStep: number;
    name: string;
    privacyUrl?: string;
    projectFlows?: LegacyProjectFlow[];
    projectMembers?: string[];
    status: "draft" | "active" | "paused";
    target: ProjectTarget;
    termsAndConditionsUrl?: string;
    updatedAt?: string;
    version?: number;
}

export interface LegacyBranding {
    bgColor?: string;
    buttonTxtColor?: string;
    buttonColor?: string;
    logo?: string;
    rightImage?: string;
    rightImagePosition?: string;
    rightBackgroundColor?: string;
    secondaryButtonColor?: string;
    secondaryButtonTextColor?: string;
    tabColor?: string;
    titleColor?: string;
    txtColor?: string;
}

export interface LegacyDataProtection {
    address?: string;
    address2?: string;
    city?: string;
    country?: string;
    email?: string;
    name?: string;
    postalCode?: string;
}

export interface LegacyProjectFlow {
    _id?: string;
    allowedCountries?: string[];
    client: string;
    collectionCode?: string;
    createdAt?: string;
    datApiSettings?: LegacyDatApiSettings;
    identityUrl?: string;
    linkSettings?: LegacyLinkSettings;
    loginSettings?: LegacyLoginSettings;
    onboardingSettings?: LegacyOnboardingSettings;
    project: string | LegacyProject;
    redirectUrl?: string;
    security?: LegacySecuritySettings;
    status: "draft" | "active" | "paused";
    systemForm?: string;
    type: "login" | "onboarding" | "oneTimeLink" | "idScan" | "scanPro" | "scanGPT" | "datAPI" | "liveness" | "smartlink";
    updatedAt?: string;
    version?: number;
    webhook?: string;
    webhookUrl?: string;
}

export interface LegacyDatApiSettings {
    basePrice?: number;
    format?: "JSON" | "noCode";
    name?: string;
    optional?: string[];
    required?: string[];
}

export interface LegacyLoginSettings {
    email?: boolean;
    emailGateway?: "mailgun" | "none";
    faceLiveness?: boolean;
    livenessMinScore?: number;
    phone?: boolean;
    phoneGateway?: "sms" | "whatsapp" | "both" | "none";
    searchMinScore?: number;
    searchMode?: "FAST" | "ACCURATE";
    showFaceLivenessRecommendation?: boolean;
    steps?: any[];
}

export interface LegacyLinkSettings {
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
    useTaxInformation?: boolean;
    validateEmail?: boolean;
    validatePhone?: boolean;
}

export interface LegacySecuritySettings {
    apiTestType?: "email" | "phone";
    apiTestValue?: string;
    apiUrl?: string;
    source?: "API" | "CSV" | "NONE";
    strategy?: "whitelist" | "blacklist" | "none";
}

export interface LegacyOnboardingSettings {
    basicInformation?: LegacyBasicInformationSettings;
    document?: LegacyDocumentSettings;
    form?: string;
    hiddenLoginOption?: boolean;
    liveness?: LegacyLivenessSettings;
    requiresSignature?: boolean;
    signUpForm?: LegacySignUpFormSettings;
    steps?: LegacyOnboardingSteps;
}

export interface LegacyOnboardingSteps {
    basicInformation?: "mandatory" | "optional" | "skip";
    document?: "mandatory" | "optional" | "skip";
    form?: "mandatory" | "optional" | "skip";
    liveness?: "mandatory" | "optional" | "skip";
    signUpForm?: "mandatory" | "optional" | "skip";
}

export interface LegacySignUpFormSettings {
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

export interface LegacyBasicInformationSettings {
    address?: boolean;
    age?: boolean;
    dateOfBirth?: boolean;
    gender?: boolean;
    postalCode?: boolean;
}

export interface LegacyDocumentSettings {
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

export interface LegacyLivenessSettings {
    livenessMinScore?: number;
    maxAttempts?: number;
    searchMinScore?: number;
    searchMode?: "FAST" | "ACCURATE";
}
