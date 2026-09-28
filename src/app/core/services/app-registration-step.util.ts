import { AuthUtils } from "app/core/auth/auth.utils";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { AppRegistration } from "app/modules/auth/project";
import { EnrollStep } from "app/modules/auth/smart-enroll/smart-enroll.service";

export type SignUpUiStep = "create" | "verify_email" | "verify_phone" | "complete";

const KYC_BACKEND_STEPS = new Set(["document", "liveness", "end"]);

/**
 * Prefer JWT `step` claim, then AppRegistration.currentStep from the API.
 */
export const getAuthoritativeAppRegistrationStep = (
	appRegistration: Pick<AppRegistration, "currentStep"> | null | undefined,
	sessionToken?: string | null
): string | null => {
	if (sessionToken?.trim()) {
		try {
			const decoded = AuthUtils.decodeToken(sessionToken.trim());

			if (typeof decoded?.step === "string" && decoded.step.trim()) {
				return decoded.step.trim();
			}
		} catch {
			// Fall through to AppRegistration.currentStep.
		}
	}

	const arStep = appRegistration?.currentStep;

	return typeof arStep === "string" && arStep.trim() ? arStep.trim() : null;
};

export interface ResolveSignUpUiStepInput {
	appRegistration: Pick<AppRegistration, "currentStep" | "emailValidation" | "phoneValidation"> | null | undefined;
	sessionToken?: string | null;
	emailVerificationEnabled: boolean;
	phoneVerificationEnabled: boolean;
}

/**
 * Maps backend continuation state to the sign-up shell step.
 * Backend/JWT step wins over email+phone validation heuristics.
 */
export const resolveSignUpUiStep = (input: ResolveSignUpUiStepInput): SignUpUiStep => {
	const backendStep = getAuthoritativeAppRegistrationStep(input.appRegistration, input.sessionToken);

	if (backendStep && KYC_BACKEND_STEPS.has(backendStep)) {
		return "complete";
	}

	const emailStatus = input.appRegistration?.emailValidation?.status;
	const phoneStatus = input.appRegistration?.phoneValidation?.status;

	if (input.emailVerificationEnabled && emailStatus !== "validated") {
		return "verify_email";
	}

	if (input.phoneVerificationEnabled && phoneStatus !== "validated") {
		return "verify_phone";
	}

	return "complete";
};

export interface ResolveEnrollStepInput {
	appRegistration: AppRegistration;
	projectFlow: ProjectFlow;
	sessionToken?: string | null;
	isDocumentValidAndComplete: (projectFlow: ProjectFlow, appRegistration: AppRegistration) => boolean;
}

/**
 * Maps backend continuation step to a SmartEnroll step when resuming KYC.
 * Returns null when backend step is signUpForm or unknown so legacy heuristics apply.
 */
export const resolveEnrollStepFromBackendContinuation = (input: ResolveEnrollStepInput): EnrollStep | null => {
	const backendStep = getAuthoritativeAppRegistrationStep(input.appRegistration, input.sessionToken);

	if (!backendStep || backendStep === "signUpForm") {
		return null;
	}

	switch (backendStep) {
		case "end":
			return "result";
		case "liveness":
			return "biometric";
		case "document":
			return input.appRegistration.documentValidation ? "document-review" : "document";
		default:
			return null;
	}
};
