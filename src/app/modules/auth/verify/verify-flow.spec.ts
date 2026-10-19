import {
	attemptsRemaining,
	cameraStepsAhead,
	completionStatus,
	contactScreens,
	documentNeedsBack,
	enrollmentClientFrom,
	hasContactBlock,
	needsEmailCode,
	progressIndex,
	progressSegments,
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
		expect(contactScreens(settings())).toEqual(["name", "email", "phone", "agreements"]);
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
});
