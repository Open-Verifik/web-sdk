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
        if (demoMode) {
            const redirectUrl = `${this.baseAppUrl}/smart-enroll-preview`;

            window.location.href = `${redirectUrl}?type=${type}&token=${token}`;

            return;
        }

        let redirectUrl = projectFlow.integrations.redirectUrl;

        const verifikProject =
            window.location.hostname.includes("localhost") || window.location.hostname.includes("staging-access.verifik.co")
                ? environment.sandboxProject
                : environment.verifikProject;

        if (projectId !== verifikProject) {
            redirectUrl = projectFlow.integrations.redirectUrl;

            window.location.href = `${redirectUrl}?type=${type}&token=${token}`;

            return;
        }

        redirectUrl = `${this.baseAppUrl}/sign-in`;

        window.location.href = `${redirectUrl}?type=${type}&token=${token}`;
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
}
