import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "environments/environment";
import { Observable, firstValueFrom, map } from "rxjs";

import {
	ActiveSmartLinkContext,
	SmartLinkCompleteResponse,
	SmartLinkLookupResponse,
	SmartLinkMode,
	SmartLinkOutcomeType,
	SmartLinkPublicConfig,
	SmartLinkReceiptPayload,
} from "./smart-link.types";

const ACTIVE_SESSION_STORAGE_KEY = "verifik_active_smartlink_v1";
const RECEIPT_STORAGE_PREFIX = "verifik_smartlink_receipt_";
const ACTIVE_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

@Injectable({
	providedIn: "root",
})
export class SmartLinkRuntimeService {
	private readonly _apiUrl = (environment.apiUrl || "").replace(/\/+$/, "");

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
		mode?: SmartLinkMode
	): Observable<SmartLinkLookupResponse> {
		return this._http
			.post<{ data: SmartLinkLookupResponse }>(`${this._apiUrl}/v3/smart-links/public/lookup`, {
				shortCode,
				...(mode ? { mode } : {}),
				identifier: identifier.trim(),
				...(countryCode ? { countryCode: countryCode.trim() } : {}),
			})
			.pipe(map((res) => res.data));
	}

	completeSession(
		shortCode: string,
		payload: {
			outcomeType: SmartLinkOutcomeType;
			token?: string;
			registrationId?: string;
		}
	): Observable<SmartLinkCompleteResponse> {
		return this._http
			.post<{ data: SmartLinkCompleteResponse }>(
				`${this._apiUrl}/v3/smart-links/public/sessions/${encodeURIComponent(shortCode)}/complete`,
				payload
			)
			.pipe(map((res) => res.data));
	}

	getReceipt(shortCode: string): Observable<SmartLinkReceiptPayload> {
		return this._http
			.get<{ data: SmartLinkReceiptPayload }>(
				`${this._apiUrl}/v3/smart-links/public/sessions/${encodeURIComponent(shortCode)}/receipt`
			)
			.pipe(map((res) => res.data));
	}

	captureFromUrl(search?: string): ActiveSmartLinkContext | null {
		if (typeof window === "undefined") return null;
		try {
			const queryStr = typeof search === "string" ? search : window.location.search;
			const params = new URLSearchParams(queryStr);
			const shortCode = (params.get("smartLink") || params.get("smartLinkSession") || "").trim();
			if (!shortCode) return this.getActiveSession();

			const existing = this.getActiveSession();
			const ctx: ActiveSmartLinkContext = {
				...(existing && existing.shortCode === shortCode ? existing : {}),
				shortCode,
				createdAtMs: Date.now(),
			};
			this.saveActiveSession(ctx);
			return ctx;
		} catch {
			return null;
		}
	}

	saveActiveSession(ctx: ActiveSmartLinkContext): void {
		if (!ctx?.shortCode || typeof sessionStorage === "undefined") return;
		try {
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

	async finalizeAndHandoff(payload: {
		outcomeType: SmartLinkOutcomeType;
		token?: string;
		registrationId?: string;
	}): Promise<boolean> {
		const active = this.captureFromUrl() || this.getActiveSession();
		if (!active?.shortCode) return false;

		try {
			const result = await firstValueFrom(this.completeSession(active.shortCode, payload));
			this.clearActiveSession();

			if (result?.receipt && typeof sessionStorage !== "undefined") {
				try {
					sessionStorage.setItem(
						`${RECEIPT_STORAGE_PREFIX}${active.shortCode}`,
						JSON.stringify(result.receipt)
					);
				} catch {
					// ignore
				}
			}

			const mode = result.completionMode || active.completionMode || "receipt";

			if (mode === "postMessage" && typeof window !== "undefined") {
				const posted = this._dispatchPostMessage(active.shortCode, result);
				if (posted) {
					return true;
				}
			}

			if (mode === "redirect" && result.redirectUrl) {
				const destination = this.buildRedirectUrl(result.redirectUrl, {
					sessionCode: result.sessionCode,
					shortCode: active.shortCode,
					externalRefId: result.externalRefId,
				});
				this._redirectExternal(destination);
				return true;
			}

			await this._router.navigate(["/l", active.shortCode, "receipt"], { replaceUrl: true });
			return true;
		} catch {
			await this._router.navigate(["/l", active.shortCode, "receipt"], { replaceUrl: true });
			return true;
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
