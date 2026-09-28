import {
	getAuthoritativeAppRegistrationStep,
	resolveEnrollStepFromBackendContinuation,
	resolveSignUpUiStep,
} from "./app-registration-step.util";

const makeJwt = (payload: Record<string, unknown>): string => {
	const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
	const body = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

	return `${header}.${body}.signature`;
};

describe("app-registration-step.util", () => {
	describe("getAuthoritativeAppRegistrationStep", () => {
		it("prefers JWT step over AppRegistration.currentStep", () => {
			const token = makeJwt({ step: "end", accessType: "app_registration_created" });

			expect(getAuthoritativeAppRegistrationStep({ currentStep: "signUpForm" }, token)).toBe("end");
		});

		it("falls back to AppRegistration.currentStep when JWT has no step", () => {
			const token = makeJwt({ accessType: "app_registration_created" });

			expect(getAuthoritativeAppRegistrationStep({ currentStep: "document" }, token)).toBe("document");
		});
	});

	describe("resolveSignUpUiStep", () => {
		const baseRegistration = {
			currentStep: "signUpForm",
			emailValidation: { status: "validated" },
			phoneValidation: { status: "validated" },
		};

		it("routes to complete when backend step is end even if OTPs are validated", () => {
			const token = makeJwt({ step: "end" });

			expect(
				resolveSignUpUiStep({
					appRegistration: { ...baseRegistration, currentStep: "end" },
					sessionToken: token,
					emailVerificationEnabled: true,
					phoneVerificationEnabled: true,
				})
			).toBe("complete");
		});

		it("routes to verify_email when signUpForm and email is not validated", () => {
			expect(
				resolveSignUpUiStep({
					appRegistration: {
						...baseRegistration,
						emailValidation: { status: "pending" },
					},
					sessionToken: null,
					emailVerificationEnabled: true,
					phoneVerificationEnabled: true,
				})
			).toBe("verify_email");
		});

		it("routes to verify_phone when signUpForm, email validated, phone pending", () => {
			expect(
				resolveSignUpUiStep({
					appRegistration: {
						...baseRegistration,
						phoneValidation: { status: "pending" },
					},
					sessionToken: null,
					emailVerificationEnabled: true,
					phoneVerificationEnabled: true,
				})
			).toBe("verify_phone");
		});

		it("routes to complete for fresh signup when signUpForm and OTPs are validated", () => {
			expect(
				resolveSignUpUiStep({
					appRegistration: baseRegistration,
					sessionToken: null,
					emailVerificationEnabled: true,
					phoneVerificationEnabled: true,
				})
			).toBe("complete");
		});

		it("routes to complete when backend step is document or liveness", () => {
			expect(
				resolveSignUpUiStep({
					appRegistration: { ...baseRegistration, currentStep: "document" },
					sessionToken: null,
					emailVerificationEnabled: true,
					phoneVerificationEnabled: true,
				})
			).toBe("complete");

			expect(
				resolveSignUpUiStep({
					appRegistration: { ...baseRegistration, currentStep: "liveness" },
					sessionToken: null,
					emailVerificationEnabled: true,
					phoneVerificationEnabled: true,
				})
			).toBe("complete");
		});
	});

	describe("resolveEnrollStepFromBackendContinuation", () => {
		const projectFlow = {
			onboardingSettings: {
				steps: { document: "skip", liveness: "optional" },
				document: { verifyNames: false },
			},
		} as any;

		it("returns result for backend end", () => {
			expect(
				resolveEnrollStepFromBackendContinuation({
					appRegistration: { currentStep: "end" } as any,
					projectFlow,
					sessionToken: makeJwt({ step: "end" }),
					isDocumentValidAndComplete: () => true,
				})
			).toBe("result");
		});

		it("returns biometric for backend liveness", () => {
			expect(
				resolveEnrollStepFromBackendContinuation({
					appRegistration: { currentStep: "liveness" } as any,
					projectFlow,
					sessionToken: null,
					isDocumentValidAndComplete: () => true,
				})
			).toBe("biometric");
		});

		it("returns null for signUpForm so legacy heuristics can run", () => {
			expect(
				resolveEnrollStepFromBackendContinuation({
					appRegistration: { currentStep: "signUpForm" } as any,
					projectFlow,
					sessionToken: null,
					isDocumentValidAndComplete: () => true,
				})
			).toBeNull();
		});
	});
});
