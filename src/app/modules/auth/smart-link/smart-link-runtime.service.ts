import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "environments/environment";
import { Observable, firstValueFrom, map } from "rxjs";

import { extractApiErrorCode } from "./smart-link-ui.helper";
import {
	ActiveSmartLinkContext,
	SmartLinkCompleteResponse,
	SmartLinkCompletionMode,
	SmartLinkEventPayload,
	SmartLinkEventResponse,
	SmartLinkHumanIdRecoveryContext,
	SmartLinkLookupResponse,
	SmartLinkMode,
	SmartLinkOtpSendRequest,
	SmartLinkOtpSendResponse,
	SmartLinkOtpVerifyRequest,
	SmartLinkOtpVerifyResponse,
	SmartLinkOutcomeType,
	SmartLinkPublicConfig,
	SmartLinkReceiptPayload,
} from "./smart-link.types";

const ACTIVE_SESSION_STORAGE_KEY = "verifik_active_smartlink_v1";
const RECEIPT_STORAGE_PREFIX = "verifik_smartlink_receipt_";
const TOKEN_STORAGE_PREFIX = "verifik_smartlink_token_";
const VERIFIED_CONTACT_STORAGE_PREFIX = "verifik_smartlink_vc_";
const RECOVERY_STORAGE_PREFIX = "verifik_smartlink_recovery_";
const ACTIVE_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const NON_RETRYABLE_HANDOFF_ERRORS = new Set([
	"completion_not_finalized",
	"document_required",
	"invalid_smart_link_token",
	"invalid_completion_proof",
	"smart_link_session_expired",
	"smart_link_session_revoked",
	"smart_link_session_exhausted",
]);

@Injectable({
	providedIn: "root",
})
export class SmartLinkRuntimeService {
	private get _apiUrl(): string {
		const raw = (environment.apiUrl || "").replace(/\/+$/, "");
		if (
			typeof window !== "undefined" &&
			window.location.protocol === "https:" &&
			/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)
		) {
			return "";
		}
		return raw;
	}

	constructor(
		private _http: HttpClient,
		private _router: Router
	) {}

	resolvePublic(
		slugOrToken: string,
		query: Record<string, string | null | undefined> = {}
	): Observable<SmartLinkPublicConfig> {
		let params = new HttpParams();
		for (const [key, val] of Object.entries(query)) {
			if (val !== null && val !== undefined && String(val).trim() !== "") {
				params = params.set(key, String(val).trim());
			}
		}

		return this._http
			.get<{ data: SmartLinkPublicConfig }>(
				`${this._apiUrl}/v3/smart-links/public/resolve/${encodeURIComponent(slugOrToken)}`,
				{ params }
			)
			.pipe(map((res) => res.data));
	}

	lookupTarget(
		shortCode: string,
		identifier: string = "",
		countryCode: string = "",
		mode?: SmartLinkMode,
		accessToken?: string
	): Observable<SmartLinkLookupResponse> {
		const token = this.getAccessToken(shortCode, accessToken);
		return this._http
			.post<{ data: SmartLinkLookupResponse }>(`${this._apiUrl}/v3/smart-links/public/lookup`, {
				shortCode,
				...(mode ? { mode } : {}),
				identifier: identifier.trim(),
				...(countryCode ? { countryCode: countryCode.trim() } : {}),
				...(token ? { t: token } : {}),
			})
			.pipe(map((res) => res.data));
	}

	sendOtp(payload: SmartLinkOtpSendRequest): Observable<SmartLinkOtpSendResponse> {
		const token = this.getAccessToken(payload.slugOrCode, payload.t);
		return this._http
			.post<{ data: SmartLinkOtpSendResponse }>(`${this._apiUrl}/v3/smart-links/public/otp/send`, {
				...payload,
				...(token ? { t: token } : {}),
			})
			.pipe(
				map((res) => {
					const data = res.data;
					if (data?.shortCode && data?.accessToken) {
						this.saveAccessToken(data.shortCode, data.accessToken);
					}
					return data;
				})
			);
	}

	verifyOtp(payload: SmartLinkOtpVerifyRequest): Observable<SmartLinkOtpVerifyResponse> {
		const token = this.getAccessToken(payload.shortCode, payload.t);
		return this._http
			.post<{ data: SmartLinkOtpVerifyResponse }>(`${this._apiUrl}/v3/smart-links/public/otp/verify`, {
				...payload,
				...(token ? { t: token } : {}),
			})
			.pipe(
				map((res) => {
					const data = res.data;
					if (data?.shortCode && data?.verifiedContactToken) {
						this.saveVerifiedContactToken(data.shortCode, data.verifiedContactToken);
					}
					return data;
				})
			);
	}

	verifyFace(shortCode: string, faceBase64: string, accessToken?: string): Observable<SmartLinkCompleteResponse> {
		const token = this.getAccessToken(shortCode, accessToken);
		return this._http
			.post<{ data: SmartLinkCompleteResponse }>(
				`${this._apiUrl}/v3/smart-links/public/sessions/${encodeURIComponent(shortCode)}/verify-face`,
				{
					faceBase64,
					...(token ? { t: token } : {}),
				}
			)
			.pipe(map((res) => res.data));
	}

	reportEvent(shortCode: string, payload: SmartLinkEventPayload, accessToken?: string): Observable<SmartLinkEventResponse> {
		const token = this.getAccessToken(shortCode, accessToken);
		const body: SmartLinkEventPayload & { t?: string } = {
			type: payload.type,
			...(payload.reason ? { reason: String(payload.reason).slice(0, 240) } : {}),
			...(payload.step ? { step: String(payload.step).slice(0, 240) } : {}),
			...(payload.summary ? { summary: String(payload.summary).slice(0, 240) } : {}),
			...(payload.registrationToken ? { registrationToken: payload.registrationToken } : {}),
			...(payload.outcomeType ? { outcomeType: payload.outcomeType } : {}),
			...(token ? { t: token } : {}),
		};
		return this._http
			.post<{ data: SmartLinkEventResponse }>(
				`${this._apiUrl}/v3/smart-links/public/sessions/${encodeURIComponent(shortCode)}/event`,
				body
			)
			.pipe(map((res) => res.data));
	}

	completeSession(
		shortCode: string,
		payload: {
			outcomeType: SmartLinkOutcomeType;
			token?: string;
			registrationId?: string;
		},
		accessToken?: string
	): Observable<SmartLinkCompleteResponse> {
		const sessionToken = this.getAccessToken(shortCode, accessToken);
		return this._http
			.post<{ data: SmartLinkCompleteResponse }>(
				`${this._apiUrl}/v3/smart-links/public/sessions/${encodeURIComponent(shortCode)}/complete`,
				{
					...payload,
					...(sessionToken ? { t: sessionToken } : {}),
				}
			)
			.pipe(map((res) => res.data));
	}

	getReceipt(shortCode: string, accessToken?: string): Observable<SmartLinkReceiptPayload> {
		const token = this.getAccessToken(shortCode, accessToken);
		let params = new HttpParams();
		if (token) {
			params = params.set("t", token);
		}
		return this._http
			.get<{ data: SmartLinkReceiptPayload }>(
				`${this._apiUrl}/v3/smart-links/public/sessions/${encodeURIComponent(shortCode)}/receipt`,
				{ params }
			)
			.pipe(map((res) => res.data));
	}

	saveAccessToken(shortCode: string, token: string | null | undefined): void {
		const cleanCode = (shortCode || "").trim();
		const cleanToken = (token || "").trim();
		if (!cleanCode || !cleanToken || typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.setItem(`${TOKEN_STORAGE_PREFIX}${cleanCode}`, cleanToken);
		} catch {
			// ignore storage quota errors
		}
	}

	getAccessToken(shortCode: string, explicitToken?: string | null): string {
		const cleanExplicit = (explicitToken || "").trim();
		if (cleanExplicit) return cleanExplicit;
		const cleanCode = (shortCode || "").trim();
		if (!cleanCode) return "";

		const active = this.getActiveSession();
		if (active?.shortCode === cleanCode && active.accessToken) {
			return active.accessToken.trim();
		}

		if (typeof sessionStorage === "undefined") return "";
		try {
			return (sessionStorage.getItem(`${TOKEN_STORAGE_PREFIX}${cleanCode}`) || "").trim();
		} catch {
			return "";
		}
	}

	saveVerifiedContactToken(shortCode: string, token: string | null | undefined): void {
		const cleanCode = (shortCode || "").trim();
		const cleanToken = (token || "").trim();
		if (!cleanCode || !cleanToken || typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.setItem(`${VERIFIED_CONTACT_STORAGE_PREFIX}${cleanCode}`, cleanToken);
			const active = this.getActiveSession();
			if (active?.shortCode === cleanCode && active.verifiedContactToken !== cleanToken) {
				this.saveActiveSession({ ...active, verifiedContactToken: cleanToken });
			}
		} catch {
			// ignore storage quota errors
		}
	}

	getVerifiedContactToken(shortCode?: string): string {
		const active = this.getActiveSession();
		const targetCode = (shortCode || active?.shortCode || "").trim();
		if (active && (!shortCode || active.shortCode === targetCode) && active.verifiedContactToken) {
			return active.verifiedContactToken.trim();
		}
		if (!targetCode || typeof sessionStorage === "undefined") return "";
		try {
			return (sessionStorage.getItem(`${VERIFIED_CONTACT_STORAGE_PREFIX}${targetCode}`) || "").trim();
		} catch {
			return "";
		}
	}

	saveHumanIdRecoveryContext(ctx: SmartLinkHumanIdRecoveryContext): void {
		const cleanCode = (ctx?.shortCode || "").trim();
		if (!cleanCode || typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.setItem(`${RECOVERY_STORAGE_PREFIX}${cleanCode}`, JSON.stringify(ctx));
		} catch {
			// ignore storage quota errors
		}
	}

	getHumanIdRecoveryContext(shortCode?: string): SmartLinkHumanIdRecoveryContext | null {
		const active = this.getActiveSession();
		const targetCode = (shortCode || active?.shortCode || "").trim();
		if (!targetCode || typeof sessionStorage === "undefined") return null;
		try {
			const raw = sessionStorage.getItem(`${RECOVERY_STORAGE_PREFIX}${targetCode}`);
			return raw ? (JSON.parse(raw) as SmartLinkHumanIdRecoveryContext) : null;
		} catch {
			return null;
		}
	}

	captureFromUrl(search?: string): ActiveSmartLinkContext | null {
		if (typeof window === "undefined") return null;
		try {
			const queryStr = typeof search === "string" ? search : window.location.search;
			const params = new URLSearchParams(queryStr);
			const shortCode = (params.get("smartLink") || params.get("smartLinkSession") || "").trim();
			const urlToken = (params.get("smartLinkToken") || (shortCode ? params.get("t") : "") || "").trim();
			if (!shortCode) return this.getActiveSession();

			if (urlToken) {
				this.saveAccessToken(shortCode, urlToken);
			}

			const existing = this.getActiveSession();
			const resolvedToken = urlToken || (existing && existing.shortCode === shortCode ? existing.accessToken : undefined) || this.getAccessToken(shortCode);
			const resolvedVerifiedContact =
				(existing && existing.shortCode === shortCode ? existing.verifiedContactToken : undefined) ||
				this.getVerifiedContactToken(shortCode);
			const ctx: ActiveSmartLinkContext = {
				...(existing && existing.shortCode === shortCode ? existing : {}),
				shortCode,
				...(resolvedToken ? { accessToken: resolvedToken } : {}),
				...(resolvedVerifiedContact ? { verifiedContactToken: resolvedVerifiedContact } : {}),
				createdAtMs: Date.now(),
			};
			this.saveActiveSession(ctx);

			if (typeof search !== "string" && (params.has("smartLinkToken") || params.has("t")) && window.history?.replaceState) {
				params.delete("smartLinkToken");
				params.delete("t");
				const nextQuery = params.toString();
				const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash || ""}`;
				window.history.replaceState(null, "", nextUrl);
			}

			return ctx;
		} catch {
			return null;
		}
	}

	saveActiveSession(ctx: ActiveSmartLinkContext): void {
		if (!ctx?.shortCode || typeof sessionStorage === "undefined") return;
		try {
			if (ctx.accessToken) {
				this.saveAccessToken(ctx.shortCode, ctx.accessToken);
			}
			const normalized: ActiveSmartLinkContext = {
				...ctx,
				createdAtMs: ctx.createdAtMs || Date.now(),
			};
			sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(normalized));
		} catch {
			// ignore storage quota errors
		}
	}

	getActiveSession(): ActiveSmartLinkContext | null {
		if (typeof sessionStorage === "undefined") return null;
		try {
			const raw = sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as ActiveSmartLinkContext;
			if (!parsed?.shortCode || !parsed.createdAtMs) return null;
			if (Date.now() - parsed.createdAtMs > ACTIVE_SESSION_TTL_MS) {
				this.clearActiveSession();
				return null;
			}
			return parsed;
		} catch {
			return null;
		}
	}

	hasActiveSession(): boolean {
		return Boolean(this.captureFromUrl() || this.getActiveSession());
	}

	clearActiveSession(): void {
		if (typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
		} catch {
			// ignore
		}
	}

	cacheReceipt(shortCode: string, receipt: SmartLinkReceiptPayload): void {
		if (!shortCode || !receipt || typeof sessionStorage === "undefined") return;
		try {
			sessionStorage.setItem(`${RECEIPT_STORAGE_PREFIX}${shortCode}`, JSON.stringify(receipt));
		} catch {
			// ignore storage quota errors
		}
	}

	getCachedReceipt(shortCode: string): SmartLinkReceiptPayload | null {
		if (!shortCode || typeof sessionStorage === "undefined") return null;
		try {
			const raw = sessionStorage.getItem(`${RECEIPT_STORAGE_PREFIX}${shortCode}`);
			return raw ? (JSON.parse(raw) as SmartLinkReceiptPayload) : null;
		} catch {
			return null;
		}
	}

	buildRedirectUrl(baseUrl: string, params: { sessionCode: string; shortCode: string; externalRefId?: string }): string {
		const target = new URL(baseUrl, typeof window !== "undefined" ? window.location.origin : "https://access.verifik.co");
		target.searchParams.set("sessionCode", params.sessionCode);
		target.searchParams.set("shortCode", params.shortCode);
		if (params.externalRefId) {
			target.searchParams.set("externalRefId", params.externalRefId);
		}
		return target.toString();
	}

	async completeHandoffFromResult(
		shortCode: string,
		result: SmartLinkCompleteResponse,
		fallbackCompletionMode?: SmartLinkCompletionMode
	): Promise<boolean> {
		const cleanShortCode = (shortCode || "").trim();
		if (!cleanShortCode) return false;

		const active = this.getActiveSession();
		this.clearActiveSession();

		if (result?.receipt) {
			this.cacheReceipt(cleanShortCode, result.receipt);
		}

		const mode = result?.completionMode || fallbackCompletionMode || active?.completionMode || "receipt";

		if (mode === "postMessage" && typeof window !== "undefined") {
			const posted = this._dispatchPostMessage(cleanShortCode, result);
			if (posted) {
				return true;
			}
		}

		if (mode === "redirect" && result?.redirectUrl) {
			const destination = this.buildRedirectUrl(result.redirectUrl, {
				sessionCode: result.sessionCode,
				shortCode: cleanShortCode,
				externalRefId: result.externalRefId,
			});
			this._redirectExternal(destination);
			return true;
		}

		await this._router.navigate(["/l", cleanShortCode, "receipt"], { replaceUrl: true });
		return true;
	}

	async finalizeAndHandoff(payload: {
		outcomeType: SmartLinkOutcomeType;
		token?: string;
		registrationId?: string;
	}): Promise<boolean> {
		const active = this.captureFromUrl() || this.getActiveSession();
		if (!active?.shortCode) return false;

		try {
			const result = await firstValueFrom(this.completeSession(active.shortCode, payload, active.accessToken));
			return await this.completeHandoffFromResult(active.shortCode, result, active.completionMode);
		} catch (err: unknown) {
			const code = extractApiErrorCode(err, "");
			if (NON_RETRYABLE_HANDOFF_ERRORS.has(code)) {
				return false;
			}
			if (this.getCachedReceipt(active.shortCode)) {
				await this._router.navigate(["/l", active.shortCode, "receipt"], { replaceUrl: true });
				return true;
			}
			return false;
		}
	}

	private _redirectExternal(url: string): void {
		if (typeof window !== "undefined") {
			window.location.href = url;
		}
	}

	private _getPostMessageTarget(): Window | null {
		if (typeof window === "undefined") return null;
		return window.opener || (window.parent && window.parent !== window ? window.parent : null);
	}

	private _dispatchPostMessage(shortCode: string, result: SmartLinkCompleteResponse): boolean {
		const targetWindow = this._getPostMessageTarget();

		if (!targetWindow) return false;

		const origins = (result.allowedPostMessageOrigins || [])
			.map((origin) => String(origin || "").trim())
			.filter((origin) => /^https?:\/\//i.test(origin));

		if (!origins.length) return false;

		const message = {
			type: "verifik:smartlink:completed",
			shortCode,
			sessionCode: result.sessionCode,
			externalRefId: result.externalRefId || "",
			status: "COMPLETED",
			receipt: result.receipt,
		};

		let sent = false;
		for (const targetOrigin of origins) {
			try {
				targetWindow.postMessage(message, targetOrigin);
				sent = true;
			} catch {
				// origin mismatch or cross-origin restriction on individual target
			}
		}

		if (sent && window.opener) {
			try {
				window.close();
			} catch {
				// ignore if browser prevents programmatic window.close
			}
		}

		return sent;
	}
}
