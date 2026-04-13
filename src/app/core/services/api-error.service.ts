import { Injectable } from "@angular/core";

export interface NormalizedApiError {
    status: number; // HTTP status if available or derived
    code: string; // Stable machine code (PascalCase)
    message: string; // Raw message from backend
    userMessageKey: string; // Translation key for i18n (e.g., "failed_to_read", "unknown")
    details?: any; // Parsed extras (e.g., missingFields)
    raw: any; // Original error body
}

@Injectable({ providedIn: "root" })
export class ApiErrorService {
    normalize(err: any): NormalizedApiError {
        try {
            const httpStatus = err?.status ?? err?.statusCode ?? 0;
            const body = err?.error ?? err?.body ?? err ?? {};
            const message = body?.message ?? body?.error ?? err?.message ?? "Something went wrong";

            // Legacy vs new shapes
            const legacyStatus = typeof body?.status === "number" ? body.status : undefined;
            const explicitCode = body?.code;

            // Colon-coded pattern: "404:ClientSmartEnrollPlan_not_found"
            const colon = this._parseColonMessage(message);

            // Final status resolution (prefer HTTP, then legacy body.status, then colon status)
            const status = httpStatus || legacyStatus || colon?.status || 0;

            // Determine a machine code
            let code = explicitCode || colon?.tokenPascal || this._mapStatusToDefaultCode(status) || "InternalServerError";

            // JOI MissingParameter shape (409) or similar validation text
            const joi = this._maybeParseJoi(message);
            const details: any = {};

            if (joi?.missingFields?.length) {
                details.missingFields = joi.missingFields;
                // Keep code stable for this case
                code = explicitCode || "MissingParameter";
            }

            // Build a translation-oriented key (stable, not raw text)
            const keyPart =
                this._toUserMessageKey({
                    status,
                    code,
                    message,
                    colonToken: colon?.tokenRaw,
                    explicitCode,
                    isJoi: !!joi,
                }) || "unknown";

            const userMessageKey = keyPart.startsWith("errors.") ? keyPart : `errors.${keyPart}`;

            return {
                status,
                code,
                message,
                userMessageKey,
                details: Object.keys(details).length ? details : undefined,
                raw: body,
            };
        } catch (parseError) {
            // Fallback to safe generic error if parsing fails
            console.error("ApiErrorService.normalize failed:", parseError, err);

            return {
                status: err?.status ?? err?.statusCode ?? 500,
                code: "InternalServerError",
                message: "Something went wrong",
                userMessageKey: "errors.unknown",
                raw: err,
            };
        }
    }

    private _parseColonMessage(msg?: string): { status?: number; tokenRaw?: string; tokenPascal?: string } | null {
        if (!msg || typeof msg !== "string") return null;

        const m = msg.match(/^(\d{3}):\s*(.+)$/);

        if (!m) return null;

        const status = Number(m[1]);
        const tokenRaw = m[2].trim();
        const tokenPascal = this._toPascalCase(tokenRaw);

        return { status, tokenRaw, tokenPascal };
    }

    private _maybeParseJoi(msg?: string): { missingFields: string[] } | null {
        if (!msg || typeof msg !== "string") return null;

        // Typical Joi messages contain quoted field names
        const fields = Array.from(msg.matchAll(/"([^"]+)"/g))
            .map((m) => m[1])
            .filter(Boolean);

        if (fields.length === 0) return null;

        return { missingFields: Array.from(new Set(fields)) };
    }

    private _toPascalCase(s: string): string {
        return s
            .replace(/[^a-zA-Z0-9]+/g, " ")
            .split(" ")
            .filter(Boolean)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join("");
    }

    private _mapStatusToDefaultCode(status?: number): string | undefined {
        switch (status) {
            case 400:
                return "BadRequest";
            case 401:
                return "Unauthorized";
            case 402:
                return "PaymentRequired";
            case 403:
                return "Forbidden";
            case 404:
                return "NotFound";
            case 409:
                return "Conflict";
            case 412:
                return "PreconditionFailed";
            case 422:
                return "UnprocessableEntity";
            case 423:
                return "Locked";
            case 429:
                return "TooManyRequests";
            case 500:
                return "InternalServerError";
            case 504:
                return "Timeout";
            default:
                return undefined;
        }
    }

    private _toUserMessageKey(ctx: {
        status: number;
        code: string;
        message: string;
        colonToken?: string;
        explicitCode?: string;
        isJoi: boolean;
    }): string | null {
        // Priority 1: known colon tokens (stable across flows)
        if (ctx.colonToken) {
            const token = ctx.colonToken;

            if (token === "ClientSmartEnrollPlan_not_found") return "errors.client_smart_enroll_plan_not_found";
            if (token === "insufficient_credits") return "errors.insufficient_credits";
            if (token === "plan_not_found") return "errors.plan_not_found";
            if (token === "not_found") return "errors.not_found";
            if (token === "project_not_found") return "errors.project_not_found";
            if (token === "projectFlow_not_found") return "errors.project_flow_not_found";
            if (token === "Project_not_found_or_featured_disabled") return "errors.project_feature_disabled";
            if (token === "ProjectFlow_security_was_not_set" || token === "security_not_set") return "errors.project_security_not_set";
            if (token === "AppRegistration_not_found") return "errors.app_registration_not_found";

            // Document validation errors
            if (token === "document_settings_not_set") return "errors.document_settings_not_set";
            if (token === "already_exists") return "errors.already_exists";
            if (token === "only_images_in_base64") return "errors.only_images_in_base64";
            if (token === "could_not_compress_image") return "errors.could_not_compress_image";
            if (token === "image_is_required") return "errors.image_is_required";
            if (token === "insecure_image_url") return "errors.insecure_image_url";
            if (token === "existing_document_validation_with_document_number") return "errors.existing_document_validation_with_document_number";
            if (token === "document_number_is_not_extracted") return "errors.document_number_is_not_extracted";
            if (token === "failed_to_read" || token === "failed_to_read_document") return "errors.failed_to_read";

            // Biometric validation errors
            if (token === "collection_not_set") return "errors.collection_not_set";
            if (token === "person_already_set") return "errors.person_already_set";

            // Fallback to generic errors.<token> for consistency
            return `errors.${token.replace(/\W+/g, "_").toLowerCase()}`;
        }

        // Priority 1.5: Check if message itself is a stable token (e.g., "failed_to_read")
        // This handles cases where backend sends { code: "Conflict", message: "failed_to_read" }
        if (ctx.message && typeof ctx.message === "string") {
            const msgToken = ctx.message.trim();

            // Check for known stable token messages
            if (msgToken === "failed_to_read" || msgToken === "failed_to_read_document") return "errors.failed_to_read";
            if (msgToken === "document_settings_not_set") return "errors.document_settings_not_set";
            if (msgToken === "already_exists") return "errors.already_exists";
            if (msgToken === "only_images_in_base64") return "errors.only_images_in_base64";
            if (msgToken === "could_not_compress_image") return "errors.could_not_compress_image";
            if (msgToken === "image_is_required") return "errors.image_is_required";
            if (msgToken === "insecure_image_url") return "errors.insecure_image_url";
            if (msgToken === "existing_document_validation_with_document_number") return "errors.existing_document_validation_with_document_number";
            if (msgToken === "document_number_is_not_extracted") return "errors.document_number_is_not_extracted";
            if (msgToken === "insufficient_credits") return "errors.insufficient_credits";
            if (msgToken === "collection_not_set") return "errors.collection_not_set";
            if (msgToken === "person_already_set") return "errors.person_already_set";

            // Backend often sends a semantic token in message (e.g. invalid_email) with a generic code (NotFound).
            // Prefer translating the message token before falling back to errors.<code>.
            if (/^[a-z][a-z0-9_]+$/.test(msgToken)) {
                return `errors.${msgToken}`;
            }
        }

        // Priority 2: explicit backend code
        if (ctx.explicitCode) {
            const c = ctx.explicitCode;

            if (c === "MissingParameter" && ctx.isJoi) return "errors.missing_or_invalid_fields";
            if (c === "PreconditionFailed" && /email domain not allowed/i.test(ctx.message)) return "errors.email_domain_not_allowed";

            if (c === "PreconditionFailed" && /has expired|expired/i.test(ctx.message)) {
                // 412 expired cases for validations
                if (/email validation/i.test(ctx.message)) return "errors.email_validation_expired";
                if (/phone validation/i.test(ctx.message)) return "errors.phone_validation_expired";
            }

            if (c === "NotFound" && /email validation/i.test(ctx.message)) return "errors.email_validation_not_found";
            if (c === "NotFound" && /phone validation/i.test(ctx.message)) return "errors.phone_validation_not_found";
            if (c === "NotFound" && /app registration/i.test(ctx.message)) return "errors.app_registration_not_found";
            if (c === "NotFound" && /document settings/i.test(ctx.message)) return "errors.document_settings_not_set";

            if (c === "PreconditionFailed" && /only.*base64|base64.*only/i.test(ctx.message)) return "errors.only_images_in_base64";
            if (c === "PreconditionFailed" && /compress.*image|image.*compress/i.test(ctx.message)) return "errors.could_not_compress_image";

            const codeSlug = c.replace(/\W+/g, "_").toLowerCase();
            if (codeSlug === "notfound") return "errors.not_found";

            return `errors.${codeSlug}`;
        }

        // Priority 3: status-based fallbacks
        switch (ctx.status) {
            case 409:
                // Document validation specific 409 errors
                if (/already exists/i.test(ctx.message)) return "errors.already_exists";
                if (/image.*required|required.*image/i.test(ctx.message)) return "errors.image_is_required";
                if (/insecure.*url|https/i.test(ctx.message)) return "errors.insecure_image_url";

                if (/document number.*already|duplicate.*document number/i.test(ctx.message)) {
                    return "errors.existing_document_validation_with_document_number";
                }

                if (/extract.*document number|document number.*extract/i.test(ctx.message)) return "errors.document_number_is_not_extracted";
                if (/failed.*read|read.*failed|could not.*read/i.test(ctx.message)) return "errors.failed_to_read";

                return ctx.isJoi ? "errors.missing_or_invalid_fields" : "errors.conflict";
            case 412:
                // Document validation specific 412 errors
                if (/only.*base64|base64.*only/i.test(ctx.message)) return "errors.only_images_in_base64";
                if (/compress.*image|image.*compress/i.test(ctx.message)) return "errors.could_not_compress_image";
                if (/expired|has expired/i.test(ctx.message)) {
                    if (/email validation/i.test(ctx.message)) return "errors.email_validation_expired";
                    if (/phone validation/i.test(ctx.message)) return "errors.phone_validation_expired";
                    if (/token/i.test(ctx.message)) return "errors.token_expired";
                }

                return "errors.unprocessable";
            case 504:
                return "errors.timeout";
            default:
                return null;
        }
    }
}
