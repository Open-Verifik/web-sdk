const SANDBOX_AUTH_HOST = "sandbox-auth.verifik.co";
const SANDBOX_APP_HOST = "sandbox.verifik.co";
const PANEL_HOSTS = new Set(["app.verifik.co", "staging.verifik.co", "testing.verifik.co"]);

/**
 * On the sandbox KYC host, panel links that still point at production or staging
 * are sent to sandbox.verifik.co. The path and query are kept.
 */
export const redirectForCurrentHost = (url: string): string => {
	if (!url || typeof window === "undefined") return url;

	if (!window.location.hostname.includes(SANDBOX_AUTH_HOST)) return url;

	try {
		const parsed = new URL(url);

		if (!PANEL_HOSTS.has(parsed.hostname)) return url;

		parsed.protocol = "https:";
		parsed.hostname = SANDBOX_APP_HOST;

		return parsed.toString();
	} catch {
		return url;
	}
};
