import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "app/core/auth/auth.service";
import { AuthUtils } from "app/core/auth/auth.utils";
import { AntiBotChallengeService } from "app/core/services/anti-bot-challenge.service";
import { catchError, Observable, throwError } from "rxjs";

const ANTI_BOT_PROTECTED_PATHS = [
    "/v2/app-logins/human-id",
    "/v2/app-login/human-id",
    "/v2/app-login/zk-proof",
    "/v2/projects/biometrics/sign-in",
    "/v2/biometric-validations",
    "/v2/app-registrations/human-id",
];

function attachStoredAntiBotHeaders(req: HttpRequest<unknown>): HttpRequest<unknown> {
    if (req.method !== "POST" || req.headers.has("X-Bot-Ticket") || typeof sessionStorage === "undefined") {
        return req;
    }

    const isProtectedUrl = ANTI_BOT_PROTECTED_PATHS.some((path) => req.url.includes(path));
    if (!isProtectedUrl) {
        return req;
    }

    const body = req.body as Record<string, any> | null | undefined;
    const projectId = body?.projectId || body?.project;
    if (typeof projectId !== "string" || !projectId) {
        return req;
    }

    const storageKey = AntiBotChallengeService.getStorageKey(projectId);
    try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) return req;

        const validHeaders = AntiBotChallengeService.extractValidHeaders(JSON.parse(raw));
        if (!validHeaders) return req;

        sessionStorage.removeItem(storageKey);

        let updatedHeaders = req.headers;
        for (const [headerName, headerValue] of Object.entries(validHeaders)) {
            if (!updatedHeaders.has(headerName)) {
                updatedHeaders = updatedHeaders.set(headerName, headerValue);
            }
        }

        return req.clone({ headers: updatedHeaders });
    } catch {
        return req;
    }
}

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);

    // Clone the request object
    let newReq = req.clone();

    // Request
    //
    // If the access token didn't expire, add the Authorization header.
    // We won't add the Authorization header if the access token expired.
    // This will force the server to return a "401 Unauthorized" response
    // for the protected API routes which our response interceptor will
    // catch and delete the access token from the local storage while logging
    // the user out from the app.
    if (!req.headers.has("Authorization") && authService.accessToken && !AuthUtils.isJwtExpired(authService.accessToken)) {
        newReq = req.clone({
            headers: req.headers.set("Authorization", "Bearer " + authService.accessToken),
        });
    }

    newReq = attachStoredAntiBotHeaders(newReq);

    // Response
    return next(newReq).pipe(
        catchError((error) => {
            // Catch "401 Unauthorized" responses
            if (error instanceof HttpErrorResponse && error.status === 401) {
                console.error({ error });

                // authService.signOut();

                // location.reload();
            }

            return throwError(error);
        })
    );
};
