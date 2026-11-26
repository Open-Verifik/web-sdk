import { TranslocoService } from "@ngneat/transloco";

import { VERIFY_FONT_HREF, VERIFY_STYLES, VerifyStyleId, resolveVerifyStyle } from "../verify/verify-style";
import { SmartLinkBranding } from "./smart-link.types";

export interface SmartLinkLanguageOption {
	id: string;
	label: string;
}

export interface SmartLinkThemeResult {
	styleId: VerifyStyleId;
	styleVars: Record<string, string>;
	isDarkSurface: boolean;
	bannerImage: string;
	bannerBgColor: string;
}

const LANG_ALIAS_MAP: Record<string, string> = {
	pt: "br",
	zh: "cn",
	ko: "kr",
	hi: "in",
	tl: "ph",
	fil: "ph",
};

const parseHexLuminance = (color: string | undefined): number | null => {
	const raw = String(color || "").trim();
	const hex = raw.startsWith("#") ? raw.slice(1) : "";
	if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;
	const full =
		hex.length === 3
			? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
			: hex;
	const r = parseInt(full.slice(0, 2), 16) / 255;
	const g = parseInt(full.slice(2, 4), 16) / 255;
	const b = parseInt(full.slice(4, 6), 16) / 255;
	const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const contrastRatio = (fg: string | undefined, bg: string | undefined): number => {
	const l1 = parseHexLuminance(fg);
	const l2 = parseHexLuminance(bg);
	if (l1 === null || l2 === null) return 7;
	const bright = Math.max(l1, l2);
	const dark = Math.min(l1, l2);
	return (bright + 0.05) / (dark + 0.05);
};

export const ensureSmartLinkFontsLoaded = (): void => {
	if (typeof document === "undefined" || document.getElementById("verify-style-fonts")) return;
	const sheet = document.createElement("link");
	sheet.id = "verify-style-fonts";
	sheet.rel = "stylesheet";
	sheet.href = VERIFY_FONT_HREF;
	document.head.appendChild(sheet);
};

export const resolveSmartLinkTheme = (
	styleOverride: string | null | undefined,
	savedStyle: string | null | undefined,
	branding?: SmartLinkBranding | null
): SmartLinkThemeResult => {
	const styleId = resolveVerifyStyle(styleOverride, savedStyle || "a", "v2");
	const vars: Record<string, string> = { ...VERIFY_STYLES[styleId].variables };
	const b = branding || {};

	if (b.backgroundColor) {
		vars["--style-page"] = b.backgroundColor;
		vars["--style-page-mobile"] = b.backgroundColor;
	}

	const cardBg = vars["--style-card"] || vars["--style-page"] || "#ffffff";
	const cardLum = parseHexLuminance(cardBg);
	const isDarkSurface = styleId === "d" || (cardLum !== null && cardLum < 0.18);

	if (b.buttonColor) {
		vars["--style-cta"] = b.buttonColor;
		vars["--accent"] = b.buttonColor;
	}
	if (b.buttonTextColor) {
		const ctaBg = vars["--style-cta"];
		vars["--style-cta-text"] =
			contrastRatio(b.buttonTextColor, ctaBg) >= 4.5
				? b.buttonTextColor
				: (parseHexLuminance(ctaBg) ?? 0) > 0.35
					? "#0f172a"
					: "#ffffff";
	}
	if (b.titleColor && contrastRatio(b.titleColor, cardBg) >= 4.5) {
		vars["--style-ink"] = b.titleColor;
		vars["--title"] = b.titleColor;
	}
	if (b.textColor && contrastRatio(b.textColor, cardBg) >= 4.5) {
		vars["--style-body"] = b.textColor;
		vars["--body"] = b.textColor;
	}

	const bannerImage = String(b.image || b.rightImage || "").trim();
	const bannerBgColor =
		String(b.imageBackgroundColor || b.rightBackgroundColor || "").trim() ||
		(isDarkSurface ? "#071426" : "#f1f5f9");

	return {
		styleId,
		styleVars: vars,
		isDarkSurface,
		bannerImage,
		bannerBgColor,
	};
};

export const getAvailableSmartLinkLanguages = (transloco: TranslocoService): SmartLinkLanguageOption[] => {
	const raw = transloco.getAvailableLangs();
	if (!Array.isArray(raw)) return [];
	return raw.map((entry) =>
		typeof entry === "string"
			? { id: entry, label: entry.toUpperCase() }
			: { id: entry.id, label: entry.label || entry.id }
	);
};

export const normalizeSupportedSmartLinkLang = (
	lang: string | null | undefined,
	transloco: TranslocoService
): string | null => {
	const clean = String(lang || "")
		.trim()
		.toLowerCase();
	if (!clean) return null;

	const supported = new Set(getAvailableSmartLinkLanguages(transloco).map((l) => l.id.toLowerCase()));
	if (supported.has(clean)) return clean;

	const base = clean.split(/[-_]/)[0];
	if (supported.has(base)) return base;

	const aliased = LANG_ALIAS_MAP[base] || LANG_ALIAS_MAP[clean];
	if (aliased && supported.has(aliased)) return aliased;

	return null;
};

const GENERIC_HTTP_ERROR_CODES = new Set([
	"BadRequest",
	"Unauthorized",
	"Forbidden",
	"NotFound",
	"Conflict",
	"UnprocessableEntity",
	"TooManyRequests",
	"InternalServerError",
	"ServiceUnavailable",
]);

export const extractApiErrorCode = (err: unknown, fallbackCode: string): string => {
	const anyErr = err as any;
	const bodyCode = String(anyErr?.error?.code || "").trim();
	const candidates = [
		anyErr?.error?.message,
		anyErr?.error?.error,
		!GENERIC_HTTP_ERROR_CODES.has(bodyCode) ? bodyCode : "",
		anyErr?.message,
	];
	for (const raw of candidates) {
		const normalized = String(raw || "")
			.replace(/^\d{3}:/, "")
			.trim();
		if (
			normalized &&
			!/\s/.test(normalized) &&
			normalized.length <= 64 &&
			!GENERIC_HTTP_ERROR_CODES.has(normalized)
		) {
			return normalized;
		}
	}
	return fallbackCode;
};

export const mapSmartLinkInlineErrorKey = (code: string | null | undefined): string => {
	const key = String(code || "").trim();
	const map: Record<string, string> = {
		identifier_required: "smartLink.error.identifierRequired",
		invalid_email: "smartLink.error.invalidEmail",
		invalid_email_format: "smartLink.error.invalidEmail",
		invalid_phone: "smartLink.error.invalidPhone",
		invalid_phone_format: "smartLink.error.invalidPhone",
		personal_project_not_configured: "smartLink.error.projectNotConfigured",
		business_project_not_configured: "smartLink.error.projectNotConfigured",
		human_id_project_not_configured: "smartLink.error.projectNotConfigured",
		access_project_not_configured: "smartLink.error.projectNotConfigured",
		smart_link_lookup_failed: "smartLink.error.lookupFailed",
		face_verification_not_initialized: "smartLink.error.faceNotInitialized",
		face_verification_not_available: "smartLink.error.faceNotAvailable",
		face_verification_failed: "smartLink.error.faceVerifyFailed",
		invalid_face_image: "smartLink.error.invalidFaceImage",
		no_face_detected: "smartLink.error.noFaceDetected",
		face_not_visible: "smartLink.error.noFaceDetected",
		multiple_faces_detected: "smartLink.error.multipleFaces",
		face_close_to_border: "smartLink.error.faceCloseToBorder",
		image_too_large: "smartLink.error.imageTooLarge",
		liveness_unavailable: "smartLink.error.livenessUnavailable",
		liveness_failed: "smartLink.error.livenessFailed",
		liveness_score_not_acceptable: "smartLink.error.livenessFailed",
		face_mismatch: "smartLink.error.faceMismatch",
		face_not_centered: "smartLink.error.faceNotCentered",
		face_too_far: "smartLink.error.faceTooFar",
		face_too_close: "smartLink.error.faceTooClose",
		face_rotation_too_large: "smartLink.error.faceRotation",
		face_occluded: "smartLink.error.faceOccluded",
		poor_lighting: "smartLink.error.poorLighting",
		camera_permission_denied: "smartLink.error.cameraPermissionDenied",
		face_verify_failed: "smartLink.error.faceVerifyFailed",
		RATE_LIMIT_EXCEEDED: "smartLink.error.rateLimited",
		verification_timeout: "smartLink.error.verificationTimeout",
		document_required: "smartLink.error.documentRequired",
		completion_not_finalized: "smartLink.error.completionNotFinalized",
		reverify_document_mismatch: "smartLink.error.documentMismatch",
		invalid_otp_code: "smartLink.otp.errorInvalid",
		otp_expired: "smartLink.otp.errorExpired",
		otp_max_attempts_exceeded: "smartLink.otp.errorMaxAttempts",
		otp_resend_cooldown: "smartLink.otp.errorCooldown",
		otp_challenge_not_found: "smartLink.otp.errorExpired",
		identifier_channel_not_allowed: "smartLink.error.genericInline",
		invalid_phone_number: "smartLink.error.invalidPhone",
		prefill_identifier_mismatch: "smartLink.error.genericInline",
		smart_link_session_exhausted: "smartLink.error.revokedBody",
		no_document_anchor_zero_knowledge: "smartLink.humanIdRecovery.noAnchorBody",
	};
	return map[key] || "smartLink.error.genericInline";
};

export const mapSmartLinkTerminalErrorKeys = (
	code: string | null | undefined
): { titleKey: string; bodyKey: string } => {
	switch (code) {
		case "smart_link_session_expired":
			return { titleKey: "smartLink.error.expiredTitle", bodyKey: "smartLink.error.expiredBody" };
		case "smart_link_session_revoked":
		case "smart_link_session_exhausted":
			return { titleKey: "smartLink.error.revokedTitle", bodyKey: "smartLink.error.revokedBody" };
		case "smart_link_paused":
			return { titleKey: "smartLink.error.pausedTitle", bodyKey: "smartLink.error.pausedBody" };
		case "invalid_smart_link_token":
		case "signed_session_required":
			return { titleKey: "smartLink.error.tokenTitle", bodyKey: "smartLink.error.tokenBody" };
		case "face_check_attempt_limit":
			return { titleKey: "smartLink.error.faceLimitTitle", bodyKey: "smartLink.error.faceLimitBody" };
		case "document_required":
			return { titleKey: "smartLink.error.documentRequiredTitle", bodyKey: "smartLink.error.documentRequired" };
		case "personal_project_not_configured":
		case "business_project_not_configured":
		case "human_id_project_not_configured":
		case "access_project_not_configured":
			return { titleKey: "smartLink.error.configTitle", bodyKey: "smartLink.error.projectNotConfigured" };
		case "invalid_mode":
		default:
			return { titleKey: "smartLink.error.notFoundTitle", bodyKey: "smartLink.error.notFoundBody" };
	}
};
