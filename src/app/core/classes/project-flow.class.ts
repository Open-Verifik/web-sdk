import {
    BusinessDocuments,
    BusinessDocumentType,
    BusinessIntegrations,
    BusinessLiveness,
    BusinessProjectFlow,
    BusinessRepresentatives,
    BusinessSettings,
    BusinessSignUpForm,
    BusinessSteps,
    LivenessSettings,
    LoginProjectFlow,
    LoginSettings,
    OnboardingSettings,
    PersonalDocuments,
    PersonalDocumentType,
    PersonalIntegrations,
    PersonalLiveness,
    PersonalProjectFlow,
    PersonalSignUpForm,
    PersonalSteps,
    ProjectDocumentTemplate,
    SignUpFormSettings,
    SmartAccessProjectFlow,
    SmartEnrollProjectFlow,
} from "../models/smart-enroll-project.model";
import { LegacyProjectFlow } from "../models/legacy-project.model";
import { PromptTemplate } from "../models/prompt-template.model";

export class ProjectFlow {
    _id?: string;
    business?: BusinessSettings;
    client: string;
    createdAt?: string;
    documents?: PersonalDocuments | BusinessDocuments;
    integrations: PersonalIntegrations | BusinessIntegrations;
    liveness: PersonalLiveness | BusinessLiveness;
    loginSettings?: LoginSettings;
    project: string | any;
    representatives?: BusinessRepresentatives;
    signUpForm: PersonalSignUpForm | BusinessSignUpForm;
    status: "draft" | "active" | "paused";
    steps?: PersonalSteps | BusinessSteps;
    target: "personal" | "business";
    type: "login" | "onboarding" | "oneTimeLink" | "idScan" | "scanPro" | "scanGPT" | "datAPI" | "liveness" | "smartlink";
    updatedAt?: string;
    version: number;

    constructor(data: SmartEnrollProjectFlow | LegacyProjectFlow) {
        this._id = data._id;
        this.client = data.client;
        this.createdAt = data.createdAt;
        this.project = data.project;
        this.status = data.status;
        this.type = data.type;
        this.updatedAt = data.updatedAt;
        this.version = data.version || 2; // Default to V2 - V3 will have the version set
        this.target = this._determineTarget(data);

        if (!this.version || this.version < 3) {
            this._migrateFromV2(data as LegacyProjectFlow);
        } else {
            this._migrateFromV3(data as SmartEnrollProjectFlow);
        }
    }

    get documentScanAllowed(): boolean {
        const documents = this.documents as PersonalDocuments;
        return documents?.verificationMethods?.includes("scan") || true;
    }

    get documentUploadAllowed(): boolean {
        const documents = this.documents as PersonalDocuments;
        return documents?.verificationMethods?.includes("upload") || true;
    }

    get isBusiness(): boolean {
        return this.target === "business";
    }

    get isPersonal(): boolean {
        return this.target === "personal";
    }

    get onboardingSettings(): OnboardingSettings {
        const documents = this.documents as PersonalDocuments;
        const liveness = this.liveness as PersonalLiveness;
        const signUpForm = this.signUpForm as PersonalSignUpForm;
        const steps = this.steps as PersonalSteps;

        return {
            basicInformation: {
                address: false,
                age: false,
                dateOfBirth: false,
                gender: false,
                postalCode: false,
            },
            document: {
                compareMinScore: 0.8,
                maxAttempts: documents?.attemptLimit || 3,
                scanDocumentAllowed: documents?.verificationMethods?.includes("scan") || true,
                uploadDocumentAllowed: documents?.verificationMethods?.includes("upload") || true,
                useGovernmentID: this._hasDocumentType("government_id"),
                useLicense: this._hasDocumentType("license"),
                usePassport: this._hasDocumentType("passport"),
                verifyCriminalHistory: documents?.criminalHistoryVerification || false,
                verifyNames: documents?.informationVerification || false,
            },
            liveness: {
                livenessMinScore: liveness?.minScore || 0.65,
                maxAttempts: liveness?.attemptLimit || 3,
                searchMinScore: liveness?.searchMinScore || 0.8,
                searchMode: liveness?.searchMode || "FAST",
            },
            signUpForm: {
                email: signUpForm?.email || false,
                emailGateway: signUpForm?.emailGateway || "none",
                fullName: signUpForm?.fullName || false,
                phone: signUpForm?.phone || false,
                phoneGateway: signUpForm?.phoneGateway || "sms",
                showPrivacyNotice: signUpForm?.showPrivacyNotice || false,
                showTermsAndConditions: signUpForm?.showTermsAndConditions || false,
            },
            steps: {
                basicInformation: "skip",
                document: steps?.document || "skip",
                form: "skip",
                liveness: steps?.liveness || "skip",
                signUpForm: "mandatory",
            },
        };
    }

    private _determineTarget(data: SmartEnrollProjectFlow | LegacyProjectFlow): "personal" | "business" {
        if ("target" in data && data.target) return data.target as "personal" | "business";

        return "personal";
    }

    private _filterPromptTemplates(category: string, country: string = ""): PromptTemplate[] {
        const documents = this.documents as PersonalDocuments;

        return documents.documentTypes.reduce((acc, docType) => {
            if (this.version !== 3 && country) return acc;

            if (country && docType.country !== country) return acc;

            return acc.concat(
                docType.configurations
                    .filter((config) => config.documentCategory === category && config.active)
                    .reduce(
                        (acc, config) => acc.concat(config.documentTemplates.map((template) => template.promptTemplate as PromptTemplate)),
                        [] as PromptTemplate[]
                    )
            );
        }, [] as PromptTemplate[]);
    }

    private _getVerificationMethods(v2Document: any): string[] {
        const methods: string[] = [];

        if (v2Document.scanDocumentAllowed) {
            methods.push("scan");
        }

        if (v2Document.uploadDocumentAllowed) {
            methods.push("upload");
        }

        return methods.length > 0 ? methods : ["scan", "upload"];
    }

    private _hasDocumentType(category: string, country: string = ""): boolean {
        const documents = this.documents as PersonalDocuments;

        if (!documents?.documentTypes) return false;

        return documents.documentTypes.some(
            (docType) =>
                (this.version === 3 && country ? docType.country === country : true) &&
                docType.configurations.some((config) => config.documentCategory === category && config.active)
        );
    }

    private _migrateFromV2(data: LegacyProjectFlow): void {
        const onboardingSettings = data.onboardingSettings || ({} as OnboardingSettings);

        this.signUpForm = this._migrateSignUpForm(onboardingSettings.signUpForm || ({} as SignUpFormSettings));
        this.liveness = this._migrateLivenessSettings(onboardingSettings.liveness || ({} as LivenessSettings));
        this.integrations = this._migrateIntegrations(data);
        this.documents = this._migrateDocuments(onboardingSettings.document || {});
        this.steps = this._migrateSteps(onboardingSettings.steps || {});
        this.loginSettings = this._migrateLoginSettings(data.loginSettings || {});
    }

    private _migrateFromV3(data: SmartEnrollProjectFlow | SmartAccessProjectFlow): void {
        this.business = (data as BusinessProjectFlow).business;
        this.documents = (data as PersonalProjectFlow).documents;
        this.integrations = data.integrations;
        this.liveness = data.liveness;
        this.representatives = (data as BusinessProjectFlow).representatives;
        this.signUpForm = data.signUpForm;
        this.steps = (data as PersonalProjectFlow | BusinessProjectFlow).steps;
        this.loginSettings = (data as LoginProjectFlow).loginSettings;
    }

    private _migrateIntegrations(data: LegacyProjectFlow): PersonalIntegrations | BusinessIntegrations {
        const security = data.security || {};

        return {
            apiTestType: security.apiTestType || "email",
            apiTestValue: security.apiTestValue || "",
            apiUrl: security.apiUrl || "",
            redirectUrl: data.redirectUrl || "",
            source: security.source || "NONE",
            strategy: security.strategy === "whitelist" ? "blacklist" : security.strategy || "none",
            webhook: data.webhookUrl || undefined,
        };
    }

    private _migrateSignUpForm(v2SignUpForm: any): PersonalSignUpForm | BusinessSignUpForm {
        return {
            additionalFields: v2SignUpForm.extraFields || [],
            allowAdditionalFields: false,
            countryCode: undefined,
            email: v2SignUpForm.email || false,
            emailGateway: v2SignUpForm.emailGateway || "none",
            fullName: v2SignUpForm.fullName || false,
            fullNameStyle: "together",
            phone: v2SignUpForm.phone || false,
            phoneGateway: v2SignUpForm.phoneGateway || "sms",
            showPrivacyNotice: v2SignUpForm.showPrivacyNotice || false,
            showTermsAndConditions: v2SignUpForm.showTermsAndConditions || false,
        };
    }

    private _migrateLivenessSettings(v2Liveness: any): PersonalLiveness | BusinessLiveness {
        return {
            attemptLimit: v2Liveness.maxAttempts || 3,
            minScore: v2Liveness.livenessMinScore || 0.65,
            searchMinScore: v2Liveness.searchMinScore || 0.8,
            searchMode: v2Liveness.searchMode || "FAST",
        };
    }

    private _migrateLoginSettings(v2Login: any): LoginSettings {
        return {
            email: v2Login.email || false,
            emailGateway: v2Login.emailGateway || "none",
            faceLiveness: v2Login.faceLiveness || false,
            livenessMinScore: v2Login.livenessMinScore || 0.65,
            phone: v2Login.phone || false,
            phoneGateway: v2Login.phoneGateway || "sms",
            searchMinScore: v2Login.searchMinScore || 0.8,
            searchMode: v2Login.searchMode || "FAST",
            showFaceLivenessRecommendation: v2Login.showFaceLivenessRecommendation || false,
            steps: v2Login.steps || [],
        };
    }

    private _migrateDocuments(v2Document: any): PersonalDocuments | BusinessDocuments {
        return {
            attemptLimit: v2Document.maxAttempts || 3,
            criminalHistoryVerification: v2Document.verifyCriminalHistory || false,
            documentTypes: this._migrateDocumentTypes(v2Document),
            informationVerification: v2Document.verifyNames || false,
            screening: false,
            verificationMethods: this._getVerificationMethods(v2Document),
        } as PersonalDocuments | BusinessDocuments;
    }

    private _migrateDocumentTypes(v2Document: any): PersonalDocumentType[] | BusinessDocumentType[] {
        const documentTypes: PersonalDocumentType[] = [];

        if (v2Document.usePassport) {
            documentTypes.push({
                configurations: [
                    {
                        active: true,
                        documentCategory: "passport",
                        documentTemplates: [{ promptTemplate: "" } as ProjectDocumentTemplate],
                    },
                ],
                country: "",
            });
        }

        if (v2Document.useLicense) {
            documentTypes.push({
                configurations: [
                    {
                        active: true,
                        documentCategory: "license",
                        documentTemplates: [{ promptTemplate: "" } as ProjectDocumentTemplate],
                    },
                ],
                country: "",
            });
        }

        if (v2Document.useGovernmentID) {
            documentTypes.push({
                configurations: [
                    {
                        active: true,
                        documentCategory: "government_id",
                        documentTemplates: [{ promptTemplate: "" } as ProjectDocumentTemplate],
                    },
                ],
                country: "",
            });
        }

        return documentTypes;
    }

    private _migrateSteps(v2Steps: any): PersonalSteps | BusinessSteps {
        if (this.target === "business") {
            return {
                businessVerification: false,
                legalRepresentative: "skip",
                liveness: v2Steps.liveness || "skip",
            };
        }

        return {
            document: v2Steps.document || "skip",
            liveness: v2Steps.liveness || "skip",
        };
    }

    allowedCountries(): string[] {
        return this.documents?.documentTypes.map((docType: PersonalDocumentType | BusinessDocumentType) => docType.country) || [];
    }

    documentCategories(country: string = ""): string[] {
        const documents = this.documents as PersonalDocuments;

        return documents.documentTypes.reduce((acc, docType) => {
            if (docType.country === country) return acc.concat(docType.configurations.map((config) => config.documentCategory));

            return acc;
        }, [] as string[]);
    }

    documentGovernmentIDAllowed(country: string = ""): boolean {
        return this._hasDocumentType("government_id", country);
    }

    documentPassportAllowed(country: string = ""): boolean {
        return this._hasDocumentType("passport", country);
    }

    documentLicenseAllowed(country: string = ""): boolean {
        return this._hasDocumentType("license", country);
    }

    promptTemplates(country: string = "", category: string = ""): PromptTemplate[] {
        return this._filterPromptTemplates(category, country);
    }

    toJSON(): SmartEnrollProjectFlow {
        const base = {
            _id: this._id,
            client: this.client,
            createdAt: this.createdAt,
            integrations: this.integrations,
            liveness: this.liveness,
            project: this.project,
            signUpForm: this.signUpForm,
            status: this.status,
            target: this.target,
            type: this.type,
            updatedAt: this.updatedAt,
            version: this.version,
        };

        if (this.isPersonal) {
            return {
                ...base,
                documents: this.documents as PersonalDocuments,
                steps: this.steps as PersonalSteps,
            } as PersonalProjectFlow;
        } else {
            return {
                ...base,
                business: this.business,
                representatives: this.representatives,
                documents: this.documents as BusinessDocuments,
                steps: this.steps as BusinessSteps,
            } as BusinessProjectFlow;
        }
    }
}
