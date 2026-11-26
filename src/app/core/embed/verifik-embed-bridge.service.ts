import { Injectable } from "@angular/core";
import { environment } from "environments/environment";

export type VerifikEmbedMode = "modal" | "inline" | "webview" | "redirect";

export type VerifikEmbedEventName =
	| "verifik:ready"
	| "verifik:step"
	| "verifik:completed"
	| "verifik:in_review"
	| "verifik:declined"
	| "verifik:error"
	| "verifik:canceled";

export interface VerifikEmbedContext {
	embedded: boolean;
	mode: VerifikEmbedMode;
	sessionToken?: string | null;
	sessionId?: string | null;
	parentOrigin?: string | null;
	vendorData?: string | null;
	locale?: string | null;
}

export interface VerifikBridgeEnvelope {
	source: "verifik-sdk";
	version: "1.0";
	event: VerifikEmbedEventName;
	sessionId: string | null;
	sessionToken: string | null;
	timestamp: string;
	payload: Record<string, any>;
}

const EMBED_STORAGE_KEY = "verifik_embed_ctx";

@Injectable({ providedIn: "root" })
export class VerifikEmbedBridgeService {
	private _context: VerifikEmbedContext = {
		embedded: false,
		mode: "redirect",
		sessionToken: null,
		sessionId: null,
		parentOrigin: null,
		vendorData: null,
		locale: null,
	};

	constructor() {
		this._restoreFromStorage();
		this.initFromWindowLocation();
	}

	get context(): VerifikEmbedContext {
		return this._context;
	}

	get isEmbedded(): boolean {
		return Boolean(this._context.embedded || this._hasNativeBridge() || this._isInIframe());
	}

	initFromWindowLocation(search?: string): void {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(search !== undefined ? search : window.location.search || "");
		const rawEmbed = (params.get("embed") || params.get("mode") || "").trim().toLowerCase();
		const sessionToken = params.get("sessionToken") || this._context.sessionToken || null;
		const sessionId = params.get("sessionId") || this._context.sessionId || null;
		const rawOrigin = params.get("parentOrigin") || this._context.parentOrigin || null;
		const vendorData = params.get("vendorData") || this._context.vendorData || null;
		const locale = params.get("locale") || this._context.locale || null;

		const explicitEmbedded =
			rawEmbed === "1" ||
			rawEmbed === "true" ||
			rawEmbed === "modal" ||
			rawEmbed === "inline" ||
			rawEmbed === "webview";

		if (explicitEmbedded || this._hasNativeBridge() || this._isInIframe()) {
			const mode: VerifikEmbedMode =
				rawEmbed === "inline"
					? "inline"
					: rawEmbed === "webview" || this._hasNativeBridge()
						? "webview"
						: "modal";
			this.setContext({
				embedded: true,
				mode,
				sessionToken,
				sessionId,
				parentOrigin: this._sanitizeOrigin(rawOrigin),
				vendorData,
				locale,
			});
		}
	}

	setContext(partial: Partial<VerifikEmbedContext>): void {
		this._context = {
			...this._context,
			...partial,
			parentOrigin:
				partial.parentOrigin !== undefined
					? this._sanitizeOrigin(partial.parentOrigin)
					: this._context.parentOrigin,
		};
		this._persistToStorage();
	}

	clearContext(): void {
		this._context = {
			embedded: false,
			mode: "redirect",
			sessionToken: null,
			sessionId: null,
			parentOrigin: null,
			vendorData: null,
			locale: null,
		};
		try {
			sessionStorage.removeItem(EMBED_STORAGE_KEY);
		} catch (_) {
			// ignore storage restrictions
		}
	}

	emit(event: VerifikEmbedEventName, payload: Record<string, any> = {}): VerifikBridgeEnvelope {
		const envelope: VerifikBridgeEnvelope = {
			source: "verifik-sdk",
			version: "1.0",
			event,
			sessionId: this._context.sessionId || null,
			sessionToken: this._context.sessionToken || null,
			timestamp: new Date().toISOString(),
			payload: {
				...(this._context.vendorData ? { vendorData: this._context.vendorData } : {}),
				...payload,
			},
		};

		if (typeof window !== "undefined") {
			const targetOrigin = this._context.parentOrigin || "*";
			try {
				if (window.opener) {
					window.opener.postMessage(envelope, targetOrigin);
				} else if (window.parent && window.parent !== window) {
					window.parent.postMessage(envelope, targetOrigin);
				}
			} catch (_) {
				// ignore cross-origin postMessage restrictions
			}

			this._dispatchNativeBridges(envelope);
		}

		this._syncSessionEventToBackend(event, envelope.payload);
		return envelope;
	}

	private _dispatchNativeBridges(envelope: VerifikBridgeEnvelope): void {
		const win = window as any;
		const serialized = JSON.stringify(envelope);

		try {
			if (win.webkit?.messageHandlers?.verifik?.postMessage) {
				win.webkit.messageHandlers.verifik.postMessage(envelope);
			}
		} catch (_) {}

		try {
			if (win.VerifikAndroid?.postMessage) {
				win.VerifikAndroid.postMessage(serialized);
			}
		} catch (_) {}

		try {
			if (win.ReactNativeWebView?.postMessage) {
				win.ReactNativeWebView.postMessage(serialized);
			}
		} catch (_) {}

		try {
			if (win.VerifikFlutter?.postMessage) {
				win.VerifikFlutter.postMessage(serialized);
			}
		} catch (_) {}
	}

	private _syncSessionEventToBackend(event: VerifikEmbedEventName, payload: Record<string, any>): void {
		const token = this._context.sessionToken;
		if (!token || typeof fetch !== "function") return;

		const eventMap: Record<VerifikEmbedEventName, string | null> = {
			"verifik:ready": null,
			"verifik:step": "step",
			"verifik:completed": "completed",
			"verifik:in_review": "in_review",
			"verifik:declined": "declined",
			"verifik:canceled": "canceled",
			"verifik:error": null,
		};

		const mapped = eventMap[event];
		if (!mapped) return;

		try {
			const apiBase = (environment.apiUrl || "").replace(/\/+$/, "");
			const url = `${apiBase}/v3/sessions/public/${encodeURIComponent(token)}/events`;
			void fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					event: mapped,
					step: payload?.step ? String(payload.step) : undefined,
					linkedRecordId: payload?.linkedRecordId ? String(payload.linkedRecordId) : undefined,
					decision: payload?.status ? { status: payload.status } : undefined,
				}),
				keepalive: true,
			}).catch(() => {});
		} catch (_) {}
	}

	private _hasNativeBridge(): boolean {
		if (typeof window === "undefined") return false;
		const win = window as any;
		return Boolean(
			win.ReactNativeWebView ||
				win.webkit?.messageHandlers?.verifik ||
				win.VerifikAndroid ||
				win.VerifikFlutter
		);
	}

	private _isInIframe(): boolean {
		if (typeof window === "undefined") return false;
		try {
			return window.self !== window.top;
		} catch (_) {
			return true;
		}
	}

	private _sanitizeOrigin(origin: string | null | undefined): string | null {
		if (!origin || typeof origin !== "string") return null;
		const trimmed = origin.trim();
		if (!trimmed) return null;
		try {
			const parsed = new URL(trimmed);
			const isLocal =
				parsed.hostname === "localhost" ||
				parsed.hostname === "127.0.0.1" ||
				parsed.hostname.endsWith(".localhost");
			if (parsed.protocol === "https:" || (parsed.protocol === "http:" && isLocal)) {
				return parsed.origin;
			}
		} catch (_) {
			return null;
		}
		return null;
	}

	private _persistToStorage(): void {
		try {
			sessionStorage.setItem(EMBED_STORAGE_KEY, JSON.stringify(this._context));
		} catch (_) {}
	}

	private _restoreFromStorage(): void {
		try {
			const raw = sessionStorage.getItem(EMBED_STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === "object") {
				this._context = { ...this._context, ...parsed };
			}
		} catch (_) {}
	}
}
