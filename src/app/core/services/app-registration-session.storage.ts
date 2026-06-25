import { AuthUtils } from "app/core/auth/auth.utils";

const KEY_PREFIX = "verifik.signUpAppRegistrationToken.";

const APP_REGISTRATION_ACCESS_TYPES = new Set(["app_registration_initiated", "app_registration_created"]);

const storageKey = (projectId: string): string => `${KEY_PREFIX}${projectId}`;

/**
 * Returns true when the JWT is an app-registration session token (sign-up / KYC flow).
 */
export const isAppRegistrationSessionJwt = (token: string | null | undefined): boolean => {
	if (!token?.trim()) {
		return false;
	}

	try {
		const decoded = AuthUtils.decodeToken(token);
		return typeof decoded?.accessType === "string" && APP_REGISTRATION_ACCESS_TYPES.has(decoded.accessType);
	} catch {
		return false;
	}
};

/**
 * True when the token is an app-registration JWT and not past expiry (supports `exp` or `expiresAt`).
 */
export const isUsableAppRegistrationSessionToken = (token: string | null | undefined): boolean => {
	if (!token?.trim() || !isAppRegistrationSessionJwt(token)) {
		return false;
	}

	return !AuthUtils.isJwtExpired(token);
};

export const saveSignUpAppRegistrationToken = (projectId: string, token: string): void => {
	if (!projectId || !token?.trim()) {
		return;
	}

	localStorage.setItem(storageKey(projectId), token.trim());
};

/**
 * Returns stored token for the project if present, valid type, and not expired; otherwise removes stale storage.
 */
export const readSignUpAppRegistrationToken = (projectId: string): string | null => {
	if (!projectId) {
		return null;
	}

	const key = storageKey(projectId);
	const raw = localStorage.getItem(key);

	if (!raw?.trim()) {
		return null;
	}

	if (!isUsableAppRegistrationSessionToken(raw)) {
		localStorage.removeItem(key);
		return null;
	}

	return raw.trim();
};

export const clearSignUpAppRegistrationToken = (projectId: string): void => {
	if (!projectId) {
		return;
	}

	localStorage.removeItem(storageKey(projectId));
};

export const clearAllSignUpAppRegistrationTokens = (): boolean => {
	let removed = false;

	for (let i = localStorage.length - 1; i >= 0; i--) {
		const k = localStorage.key(i);

		if (k?.startsWith(KEY_PREFIX)) {
			localStorage.removeItem(k);
			removed = true;
		}
	}

	return removed;
};

/**
 * Removes `accessToken` only when it is an app-registration session JWT.
 */
export const clearAccessTokenIfAppRegistrationSession = (): boolean => {
	const token = localStorage.getItem("accessToken");

	if (!isAppRegistrationSessionJwt(token)) {
		return false;
	}

	localStorage.removeItem("accessToken");
	return true;
};

/**
 * Clears persisted sign-up session data after HTTP 403; runs enroll localStorage reset when anything was cleared.
 */
const SESSION_TERMINATING_FORBIDDEN_MESSAGES = new Set(["access_denied", "expired_token", "Access forbidden"]);

/**
 * Returns true when a 403 response indicates the app-registration session is invalid and should be cleared.
 * Permission denials (e.g. insufficient_permissions) must not wipe the onboarding token.
 */
export const shouldClearAppRegistrationSessionOnHttpForbidden = (error: { error?: unknown } | null | undefined): boolean => {
	if (!error || typeof error !== "object") {
		return false;
	}

	const body = error.error;

	if (!body || typeof body !== "object") {
		return false;
	}

	const message = (body as { message?: unknown }).message;

	if (typeof message !== "string" || message === "insufficient_permissions") {
		return false;
	}

	return SESSION_TERMINATING_FORBIDDEN_MESSAGES.has(message);
};

export const onHttpForbiddenClearAppRegistrationSession = (unsetEnrollStorage: () => void): void => {
	const clearedKeys = clearAllSignUpAppRegistrationTokens();
	const clearedAccess = clearAccessTokenIfAppRegistrationSession();

	if (clearedKeys || clearedAccess) {
		unsetEnrollStorage();
	}
};

/**
 * Clears project-scoped sign-up token and app-registration accessToken when leaving the flow (e.g. final redirect).
 */
export const clearSignUpFlowPersistedSession = (projectId: string): void => {
	clearSignUpAppRegistrationToken(projectId);
	clearAccessTokenIfAppRegistrationSession();
};
