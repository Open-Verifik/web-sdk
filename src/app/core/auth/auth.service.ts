import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthUtils } from "app/core/auth/auth.utils";
import { UserService } from "app/core/user/user.service";
import { environment } from "environments/environment";
import { catchError, Observable, of, switchMap, throwError } from "rxjs";
import { ProjectFlow } from "../classes/project-flow.class";

@Injectable({ providedIn: "root" })
export class AuthService {
	private _authenticated: boolean = false;

	constructor(private _httpClient: HttpClient, private _userService: UserService) {}

	set accessToken(token: string) {
		localStorage.setItem("accessToken", token);
	}

	get accessToken(): string {
		return localStorage.getItem("accessToken") ?? "";
	}

	get baseAppUrl(): string {
		const origin = window.location.origin;

		if (origin.includes("staging-access.verifik.co")) {
			return `${environment.stagingUrl}`;
		} else if (origin.includes("testing-access.verifik.co")) {
			return `${environment.sandboxUrl}`;
		} else {
			return `${environment.appUrl}`;
		}
	}

	handleRedirect(
		projectFlow: ProjectFlow,
		projectId: string,
		token: string,
		type: "login" | "onboarding" = "login",
		demoMode: boolean = false
	): void {
		const verifikProject =
			window.location.hostname.includes("localhost") ||
			window.location.hostname.includes("access.app") ||
			window.location.hostname.includes("staging-access.verifik.co")
				? environment.sandboxProject
				: environment.verifikProject;

		// Only redirect to smart-enroll-preview if demoMode is true AND it's not a main project
		const isMainProject = projectId === verifikProject || projectId === environment.verifikProject || projectId === environment.sandboxProject;

		if (demoMode && !isMainProject) {
			const redirectUrl = `${this.baseAppUrl}/smart-enroll-preview`;

			window.location.href = `${redirectUrl}?type=${type}&token=${token}`;

			return;
		}

		let redirectUrl = projectFlow.integrations.redirectUrl;

		const bridgeUrl = this._resolveSmartAgentBridgeUrl();
		const integrationsRedirect = (projectFlow.integrations?.redirectUrl ?? "").trim();

		if (projectId !== verifikProject) {
			if (bridgeUrl && this._shouldUseSmartAgentBridge(integrationsRedirect)) {
				window.location.href = `${bridgeUrl}?type=${type}&token=${token}`;
				return;
			}

			if (integrationsRedirect) {
				window.location.href = `${integrationsRedirect}?type=${type}&token=${token}`;
				return;
			}
		}

		redirectUrl = `${this.baseAppUrl}`;

		if (bridgeUrl) {
			window.location.href = `${bridgeUrl}?type=${type}&token=${token}`;
			return;
		}

		window.location.href = `${redirectUrl}/sign-in?type=${type}&token=${token}`;
	}

	forgotPassword(email: string): Observable<any> {
		return this._httpClient.post("api/auth/forgot-password", email);
	}

	resetPassword(password: string): Observable<any> {
		return this._httpClient.post("api/auth/reset-password", password);
	}

	signIn(credentials: { email: string; password: string }): Observable<any> {
		if (this._authenticated) return throwError("User is already logged in.");

		return this._httpClient.post("api/auth/sign-in", credentials).pipe(
			switchMap((response: any) => {
				this.accessToken = response.accessToken;

				this._authenticated = true;
				this._userService.user = response.user;

				return of(response);
			})
		);
	}

	signInUsingToken(): Observable<any> {
		return this._httpClient
			.post("api/auth/sign-in-with-token", {
				accessToken: this.accessToken,
			})
			.pipe(
				catchError(() => of(false)),
				switchMap((response: any) => {
					if (response.accessToken) this.accessToken = response.accessToken;

					this._authenticated = true;

					this._userService.user = response.user;

					return of(true);
				})
			);
	}

	signOut(): Observable<any> {
		localStorage.removeItem("accessToken");

		this._authenticated = false;

		return of(true);
	}

	signUp(user: { name: string; email: string; password: string; company: string }): Observable<any> {
		return this._httpClient.post("api/auth/sign-up", user);
	}

	unlockSession(credentials: { email: string; password: string }): Observable<any> {
		return this._httpClient.post("api/auth/unlock-session", credentials);
	}

	/**
	 * Check the authentication status
	 */
	check(): Observable<boolean> {
		if (this._authenticated) return of(true);

		if (!this.accessToken) return of(false);

		if (AuthUtils.isTokenExpired(this.accessToken)) return of(false);

		return this.signInUsingToken();
	}

	projectLogin(expiresIn: number, jwt: string): Observable<any> {
		return this._httpClient.post(
			`${environment.apiUrl}/v2/auth/project-login`,
			{
				expiresIn,
			},
			{
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			}
		);
	}

	registerAppPasskey(password: string, jwt: string): Observable<any> {
		return this._httpClient.post(
			`${environment.apiUrl}/v2/app-registrations/register-passkey`,
			{
				password,
			},
			{
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			}
		);
	}

	loginAppPasskey(projectId: string, identifier: string, password: string): Observable<any> {
		const isEmail = identifier.includes("@");

		return this._httpClient.post(`${environment.apiUrl}/v2/app-registrations/login-passkey`, {
			password,
			email: isEmail ? identifier : undefined,
			phone: !isEmail ? identifier : undefined,
			projectId: projectId, // Backend might expect this in body if not in token?
		});
	}

	private _resolveSmartAgentBridgeUrl(): string {
		const hostname = window.location.hostname;

		if (hostname.includes("staging-access.verifik.co") || hostname.includes("testing-access.verifik.co")) {
			return "https://staging.verifik.co/bridge";
		}

		const fromEnv =
			typeof environment.smartAgentBridgeUrl === "string" ? environment.smartAgentBridgeUrl.trim() : "";

		if (fromEnv) return fromEnv;

		if (hostname.includes("access.verifik.co") || hostname.includes("access.app")) {
			return "https://ai.verifik.co/bridge";
		}

		if (hostname === "localhost" || hostname === "127.0.0.1") {
			return "http://localhost:4201/bridge";
		}

		return "";
	}

	/** Legacy Smart Access handoff pointed at client-panel /sign-in; use Smart-Agent /bridge instead. */
	private _shouldUseSmartAgentBridge(integrationsRedirect: string): boolean {
		if (!integrationsRedirect) return false;

		try {
			const url = new URL(integrationsRedirect);
			const path = url.pathname.replace(/\/+$/, "") || "/";
			const isVerifikPanelHost = /^(staging\.verifik\.co|testing\.verifik\.co|app\.verifik\.co)$/i.test(url.hostname);

			return isVerifikPanelHost && path === "/sign-in";
		} catch {
			return /\/sign-in\/?(\?.*)?$/i.test(integrationsRedirect);
		}
	}
}
