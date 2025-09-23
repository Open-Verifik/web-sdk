import { ProjectFlow } from "./project-flow.class";
import { LegacyProject, LegacyBranding } from "../models/legacy-project.model";
import { Branding, DataProtection, Project as ProjectInterface, ProjectTarget, SmartEnrollProjectFlow } from "../models/smart-enroll-project.model";

export class Project {
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
    projectFlows?: ProjectFlow[];
    projectMembers?: string[];
    status: "draft" | "active" | "paused";
    target: ProjectTarget;
    termsAndConditionsUrl?: string;
    updatedAt?: string;

    constructor(data: ProjectInterface | LegacyProject) {
        this._id = data._id;
        this.allowedCountries = data.allowedCountries;
        this.assignedCollection = data.assignedCollection;
        this.branding = this._migrateBranding(data.branding);
        this.client = data.client;
        this.collectionCode = data.collectionCode;
        this.contactEmail = data.contactEmail;
        this.createdAt = data.createdAt;
        this.currentStep = data.currentStep;
        this.dataProtection = data.dataProtection;
        this.identifier = data.identifier;
        this.lastStep = data.lastStep;
        this.name = data.name;
        this.privacyUrl = data.privacyUrl;
        this.projectMembers = data.projectMembers;
        this.status = data.status;
        this.target = data.target;
        this.termsAndConditionsUrl = data.termsAndConditionsUrl;
        this.updatedAt = data.updatedAt;

        if ("projectFlows" in data && data.projectFlows) {
            this.projectFlows = data.projectFlows.map((flow: SmartEnrollProjectFlow) => new ProjectFlow(flow));
        } else if ("projectFlow" in data && data.projectFlow) {
            this.projectFlows = [new ProjectFlow(data.projectFlow as SmartEnrollProjectFlow)];
        } else {
            this.projectFlows = [];
        }
    }

    getOnboardingProjectFlow(): ProjectFlow | undefined {
        if (!this.projectFlows || !this.projectFlows.length) return undefined;

        const onboardingFlow = this.projectFlows.find((flow) => flow.type === "onboarding");

        if (onboardingFlow) return onboardingFlow;

        return this.projectFlows[0];
    }

    getLoginProjectFlow(): ProjectFlow | undefined {
        if (!this.projectFlows || !this.projectFlows.length) return undefined;

        const loginFlow = this.projectFlows.find((flow) => flow.type === "login");

        if (loginFlow) return loginFlow;

        return this.projectFlows[0];
    }

    getProjectFlowByTarget(target: "personal" | "business"): ProjectFlow | undefined {
        return this.projectFlows?.find((flow) => flow.target === target);
    }

    isLegacyProject(): boolean {
        return !("projectFlows" in this) || this.projectFlows === undefined;
    }

    toJSON(): ProjectInterface {
        return {
            _id: this._id,
            allowedCountries: this.allowedCountries,
            assignedCollection: this.assignedCollection,
            branding: this.branding,
            client: this.client,
            collectionCode: this.collectionCode,
            contactEmail: this.contactEmail,
            createdAt: this.createdAt,
            currentStep: this.currentStep,
            dataProtection: this.dataProtection,
            identifier: this.identifier,
            lastStep: this.lastStep,
            name: this.name,
            privacyUrl: this.privacyUrl,
            projectFlows: this.projectFlows?.map((flow) => flow.toJSON()),
            projectMembers: this.projectMembers,
            status: this.status,
            target: this.target,
            termsAndConditionsUrl: this.termsAndConditionsUrl,
            updatedAt: this.updatedAt,
        };
    }

    private _migrateBranding(branding: Branding | LegacyBranding): Branding {
        // If it's already V3 branding, return as-is
        if ("backgroundColor" in branding) return branding as Branding;

        // Migrate from V2 branding
        const legacyBranding = branding as LegacyBranding;

        return {
            backgroundColor: legacyBranding.bgColor || "#01236D",
            buttonColor: legacyBranding.buttonColor,
            buttonTextColor: legacyBranding.buttonTxtColor,
            logo: legacyBranding.logo,
            image: legacyBranding.rightImage,
            imageBackgroundColor: legacyBranding.rightBackgroundColor,
            textColor: legacyBranding.txtColor,
            titleColor: legacyBranding.titleColor,
        };
    }
}
