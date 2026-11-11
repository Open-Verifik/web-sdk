import { flowOrderFrom, flowOrderFromQuery, ProjectFlow } from "app/core/classes/project-flow.class";
import {
	attemptsRemaining,
	cameraStepsAhead,
	completionStatus,
	contactScreens,
	documentNeedsBack,
	enrollmentClientFrom,
	hasContactBlock,
	isTerminalStatus,
	needsEmailCode,
	progressIndex,
	progressSegments,
	resolveHandoffPhase,
	resumeScreen,
	VerifySettings,
} from "./verify-flow";

const settings = (overrides: Partial<VerifySettings> = {}): VerifySettings => ({
	compareMinScore: 0.85,
	document: "mandatory",
	documentMaxAttempts: 3,
	email: true,
	emailGateway: "mailgun",
	firstName: false,
	fullName: true,
	lastName: false,
	liveness: "mandatory",
	livenessMaxAttempts: 3,
	livenessMinScore: 0.65,
	phone: true,
	phoneGateway: "sms",
	scanAllowed: true,
	showPrivacy: true,
	showTerms: true,
	uploadAllowed: true,
	useGovernmentId: true,
	useLicense: true,
	usePassport: true,
	...overrides,
});

describe("verify-flow", () => {
	it("treats a missing enrollment client as legacy", () => {
		expect(enrollmentClientFrom(undefined)).toBe("legacy");
		expect(enrollmentClientFrom("v2")).toBe("v2");
	});

	it("builds contact screens from the sign-up flags", () => {
		expect(contactScreens(settings())).toEqual(["signup"]);
		expect(hasContactBlock(settings({ email: false, phone: false, fullName: false, showPrivacy: false, showTerms: false }))).toBeFalse();
	});

	it("asks for an email code only when the gateway is on and the address is not validated", () => {
		expect(needsEmailCode(settings(), false)).toBeTrue();
		expect(needsEmailCode(settings({ emailGateway: "none" }), false)).toBeFalse();
		expect(needsEmailCode(settings(), true)).toBeFalse();
	});

	it("keeps a back side for licenses and national IDs", () => {
		expect(documentNeedsBack("passport", false)).toBeFalse();
		expect(documentNeedsBack("license")).toBeTrue();
		expect(documentNeedsBack("government_id", true)).toBeTrue();
	});

	it("resumes into the code, consent, document, or submitted screen", () => {
		expect(
			resumeScreen({
				currentStep: "signUpForm",
				documentFailed: false,
				documentStep: "mandatory",
				emailNeeded: true,
				hasBack: false,
				hasBiometric: false,
				hasDocument: false,
				livenessStep: "mandatory",
				needsBack: false,
				phoneNeeded: false,
			})
		).toBe("emailCode");

		expect(
			resumeScreen({
				currentStep: "signUpForm",
				documentFailed: false,
				documentStep: "skip",
				emailNeeded: false,
				hasBack: false,
				hasBiometric: false,
				hasDocument: false,
				livenessStep: "skip",
				needsBack: false,
				phoneNeeded: false,
			})
		).toBe("consent");

		expect(
			resumeScreen({
				currentStep: "document",
				documentFailed: false,
				documentStep: "mandatory",
				emailNeeded: false,
				hasBack: false,
				hasBiometric: false,
				hasDocument: false,
				livenessStep: "mandatory",
				needsBack: true,
				phoneNeeded: false,
			})
		).toBe("ready");

		expect(
			resumeScreen({
				currentStep: "document",
				documentFailed: false,
				documentMismatch: true,
				documentStep: "mandatory",
				emailNeeded: false,
				hasBack: false,
				hasBiometric: false,
				hasDocument: true,
				livenessStep: "mandatory",
				needsBack: true,
				phoneNeeded: false,
			})
		).toBe("ocrReview");

		expect(
			resumeScreen({
				currentStep: "document",
				documentFailed: false,
				documentStep: "mandatory",
				emailNeeded: false,
				hasBack: true,
				hasBiometric: false,
				hasDocument: true,
				livenessStep: "mandatory",
				needsBack: true,
				phoneNeeded: false,
			})
		).toBe("ocrReview");

		expect(
			resumeScreen({
				currentStep: "end",
				documentFailed: false,
				documentStep: "mandatory",
				emailNeeded: false,
				hasBack: true,
				hasBiometric: true,
				hasDocument: true,
				livenessStep: "mandatory",
				needsBack: true,
				phoneNeeded: false,
				status: "FAILED",
			})
		).toBe("submitted");
	});

	it("fails closed when the compare result did not pass", () => {
		expect(
			completionStatus({
				compareMinScore: 0.85,
				comparePassed: false,
				compareScore: 0.2,
				documentSkipped: false,
				hasCompare: true,
				livenessMinScore: 0.65,
				livenessScore: 0.9,
				livenessSkipped: false,
				livenessStatus: "validated",
			})
		).toBe("FAILED");

		expect(
			completionStatus({
				compareMinScore: 0.85,
				documentSkipped: true,
				hasCompare: false,
				livenessMinScore: 0.65,
				livenessSkipped: true,
			})
		).toBe("COMPLETED_WITHOUT_KYC");
	});

	it("counts contact in the progress bar only when that block exists", () => {
		expect(progressSegments(true)[0]).toBe("contact");
		expect(progressSegments(false)).not.toContain("contact");
		expect(progressIndex("submitted", true)).toBe(progressSegments(true).length - 1);
		expect(cameraStepsAhead(settings({ document: "skip", liveness: "skip" }))).toBeFalse();
		expect(attemptsRemaining(3, 3)).toBe(0);
	});

	it("reads the flow order from the saved project or the ?order query", () => {
		expect(flowOrderFrom({ onboardingSettings: { flowOrder: "consent_first" } })).toBe("consent_first");
		expect(flowOrderFrom({ onboardingSettings: { flowOrder: "nope" } })).toBeUndefined();
		expect(flowOrderFromQuery("a")).toBe("contact_first");
		expect(flowOrderFromQuery("B")).toBe("consent_first");
		expect(flowOrderFromQuery("x")).toBeUndefined();
	});

	it("maps document verificationMethods for both v3 and legacy v2 flows", () => {
		const both = new ProjectFlow({
			version: 3,
			documents: { verificationMethods: ["upload", "scan"], documentTypes: [] },
		} as any);
		expect(both.documentScanAllowed).toBeTrue();
		expect(both.documentUploadAllowed).toBeTrue();
		expect(both.onboardingSettings.document.scanDocumentAllowed).toBeTrue();
		expect(both.onboardingSettings.document.uploadDocumentAllowed).toBeTrue();

		const uploadOnly = new ProjectFlow({
			version: 3,
			documents: { verificationMethods: ["upload"], documentTypes: [] },
		} as any);
		expect(uploadOnly.documentScanAllowed).toBeFalse();
		expect(uploadOnly.documentUploadAllowed).toBeTrue();

		const scanOnly = new ProjectFlow({
			version: 3,
			documents: { verificationMethods: ["scan"], documentTypes: [] },
		} as any);
		expect(scanOnly.documentScanAllowed).toBeTrue();
		expect(scanOnly.documentUploadAllowed).toBeFalse();

		const legacyUploadOnly = new ProjectFlow({
			version: 2,
			onboardingSettings: {
				document: { scanDocumentAllowed: false, uploadDocumentAllowed: true },
			},
		} as any);
		expect(legacyUploadOnly.documentScanAllowed).toBeFalse();
		expect(legacyUploadOnly.documentUploadAllowed).toBeTrue();
	});

	it("skips redundant consent on mobile handoff or when currentStep is instructions", () => {
		expect(
			resumeScreen({
				currentStep: "instructions",
				documentFailed: false,
				documentStep: "mandatory",
				emailNeeded: false,
				hasBack: false,
				hasBiometric: false,
				hasDocument: false,
				livenessStep: "mandatory",
				needsBack: true,
				phoneNeeded: false,
			})
		).toBe("ready");

		expect(
			resumeScreen({
				currentStep: "signUpForm",
				documentFailed: false,
				documentStep: "mandatory",
				emailNeeded: false,
				handoff: true,
				hasBack: false,
				hasBiometric: false,
				hasDocument: false,
				livenessStep: "mandatory",
				needsBack: true,
				phoneNeeded: false,
			})
		).toBe("ready");

		expect(
			resumeScreen({
				currentStep: "instructions",
				documentFailed: false,
				documentStep: "skip",
				emailNeeded: false,
				hasBack: false,
				hasBiometric: false,
				hasDocument: false,
				livenessStep: "mandatory",
				needsBack: false,
				phoneNeeded: false,
			})
		).toBe("selfieIntro");
	});

	it("resolves desktop handoff live phases and terminal statuses accurately", () => {
		expect(isTerminalStatus("COMPLETED")).toBeTrue();
		expect(isTerminalStatus("NEEDS_MANUAL_VERIFICATION")).toBeTrue();
		expect(isTerminalStatus("EXPIRED")).toBeTrue();
		expect(isTerminalStatus("STARTED")).toBeFalse();

		expect(
			resolveHandoffPhase({
				currentStep: "instructions",
				hasBiometric: false,
				hasDocument: false,
				status: "STARTED",
			})
		).toBe("qr");

		expect(
			resolveHandoffPhase({
				currentStep: "document",
				hasBiometric: false,
				hasDocument: false,
				status: "STARTED",
			})
		).toBe("document");

		expect(
			resolveHandoffPhase({
				currentStep: "liveness",
				hasBiometric: false,
				hasDocument: true,
				status: "ONGOING",
			})
		).toBe("liveness");

		expect(
			resolveHandoffPhase({
				currentStep: "end",
				hasBiometric: true,
				hasDocument: true,
				status: "COMPLETED",
			})
		).toBe("completed");
	});

	it("auto-upgrades enrollmentClient to v2 when verifyStyle is selected and preserves additionalFields", () => {
		const flow = new ProjectFlow({
			version: 3,
			onboardingSettings: {
				verifyStyle: "f",
			},
			signUpForm: {
				allowAdditionalFields: true,
				additionalFields: ["gender", "dateOfBirth"],
				countryCode: "+57",
				email: true,
				fullNameStyle: "separate",
			},
		} as any);

		expect(flow.verifyStyle).toBe("f");
		expect(flow.enrollmentClient).toBe("v2");
		expect(flow.onboardingSettings.enrollmentClient).toBe("v2");
		expect(flow.onboardingSettings.signUpForm?.additionalFields).toEqual(["gender", "dateOfBirth"]);
		expect(flow.onboardingSettings.signUpForm?.countryCode).toBe("+57");
		expect(hasContactBlock(settings({ email: false, phone: false, fullName: false, showPrivacy: false, showTerms: false, additionalFields: ["gender"] }))).toBeTrue();
	});
});
