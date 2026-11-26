import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { environment } from "environments/environment";
import { firstValueFrom } from "rxjs";

import { SmartLinkRuntimeService } from "./smart-link-runtime.service";
import { SmartLinkCompleteResponse } from "./smart-link.types";
import {
	extractApiErrorCode,
	mapSmartLinkInlineErrorKey,
	mapSmartLinkTerminalErrorKeys,
	normalizeSupportedSmartLinkLang,
	resolveSmartLinkTheme,
} from "./smart-link-ui.helper";

describe("SmartLinkRuntimeService", () => {
	let service: SmartLinkRuntimeService;
	let httpMock: HttpTestingController;
	let routerSpy: jasmine.SpyObj<Router>;
	const apiUrl = (environment.apiUrl || "").replace(/\/+$/, "");

	beforeEach(() => {
		sessionStorage.clear();
		routerSpy = jasmine.createSpyObj<Router>("Router", ["navigate"]);
		routerSpy.navigate.and.resolveTo(true);

		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [SmartLinkRuntimeService, { provide: Router, useValue: routerSpy }],
		});

		service = TestBed.inject(SmartLinkRuntimeService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
		sessionStorage.clear();
	});

	it("captures ?smartLink from URL and persists active session in sessionStorage", () => {
		expect(service.hasActiveSession()).toBeFalse();

		const captured = service.captureFromUrl("?smartLink=AbCd1234&email=test@example.com");
		expect(captured?.shortCode).toBe("AbCd1234");
		expect(service.hasActiveSession()).toBeTrue();
		expect(service.getActiveSession()?.shortCode).toBe("AbCd1234");

		service.clearActiveSession();
		expect(service.getActiveSession()).toBeNull();
	});

	it("captures smartLinkToken or ?t= from URL and forwards t across lookup, verifyFace, event, complete, and receipt", async () => {
		const ctxFromToken = service.captureFromUrl("?smartLink=SecLink01&smartLinkToken=slt_tok_123");
		expect(ctxFromToken?.shortCode).toBe("SecLink01");
		expect(ctxFromToken?.accessToken).toBe("slt_tok_123");
		expect(service.getAccessToken("SecLink01")).toBe("slt_tok_123");

		const lookupPromise = firstValueFrom(service.lookupTarget("SecLink01", "user@example.com", "+57", "personal"));
		const lookupReq = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/lookup`);
		expect(lookupReq.request.body).toEqual({
			shortCode: "SecLink01",
			mode: "personal",
			identifier: "user@example.com",
			countryCode: "+57",
			t: "slt_tok_123",
		});
		lookupReq.flush({ data: { shortCode: "SecLink01", resolvedMode: "personal" } });
		await lookupPromise;

		const facePromise = firstValueFrom(service.verifyFace("SecLink01", "base64_selfie_payload_123456"));
		const faceReq = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/SecLink01/verify-face`);
		expect(faceReq.request.body).toEqual({
			faceBase64: "base64_selfie_payload_123456",
			t: "slt_tok_123",
		});
		faceReq.flush({ data: { state: "COMPLETED", receipt: { shortCode: "SecLink01" } } });
		await facePromise;

		const eventPromise = firstValueFrom(service.reportEvent("SecLink01", { type: "IN_PROGRESS", step: "document" }));
		const eventReq = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/SecLink01/event`);
		expect(eventReq.request.body).toEqual({ type: "IN_PROGRESS", step: "document", t: "slt_tok_123" });
		eventReq.flush({ data: { ok: true, state: "IN_PROGRESS" } });
		await eventPromise;

		const completePromise = firstValueFrom(service.completeSession("SecLink01", { outcomeType: "kyc", token: "jwt-ok" }));
		const completeReq = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/SecLink01/complete`);
		expect(completeReq.request.body).toEqual({ outcomeType: "kyc", token: "jwt-ok", t: "slt_tok_123" });
		completeReq.flush({ data: { state: "COMPLETED", receipt: { shortCode: "SecLink01" } } });
		await completePromise;

		const ctxFromT = service.captureFromUrl("?smartLink=SecLink02&t=t_fallback_456");
		expect(ctxFromT?.accessToken).toBe("t_fallback_456");
		const receiptPromise = firstValueFrom(service.getReceipt("SecLink02"));
		const receiptReq = httpMock.expectOne((req) => req.url === `${apiUrl}/v3/smart-links/public/sessions/SecLink02/receipt`);
		expect(receiptReq.request.params.get("t")).toBe("t_fallback_456");
		receiptReq.flush({ data: { shortCode: "SecLink02", confirmationCode: "VFK-SEC02", outcomeType: "kyc" } });
		await receiptPromise;
	});

	it("returns false without navigating to receipt when finalizeAndHandoff hits non-retryable completion errors", async () => {
		service.saveActiveSession({
			shortCode: "NonRet01",
			completionMode: "receipt",
			createdAtMs: Date.now(),
		});
		service.cacheReceipt("NonRet01", {
			shortCode: "NonRet01",
			confirmationCode: "VFK-OLD",
			outcomeType: "kyc",
		});

		const firstAttempt = service.finalizeAndHandoff({ outcomeType: "kyc", token: "pending-jwt" });
		const req1 = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/NonRet01/complete`);
		req1.flush({ message: "completion_not_finalized" }, { status: 403, statusText: "Forbidden" });
		expect(await firstAttempt).toBeFalse();
		expect(routerSpy.navigate).not.toHaveBeenCalled();

		const secondAttempt = service.finalizeAndHandoff({ outcomeType: "kyc", token: "no-doc-jwt" });
		const req2 = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/NonRet01/complete`);
		req2.flush({ message: "document_required" }, { status: 403, statusText: "Forbidden" });
		expect(await secondAttempt).toBeFalse();
		expect(routerSpy.navigate).not.toHaveBeenCalled();

		const fallbackAttempt = service.finalizeAndHandoff({ outcomeType: "kyc", token: "network-flake-jwt" });
		const req3 = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/NonRet01/complete`);
		req3.flush({ message: "Service Unavailable" }, { status: 503, statusText: "Service Unavailable" });
		expect(await fallbackAttempt).toBeTrue();
		expect(routerSpy.navigate).toHaveBeenCalledWith(["/l", "NonRet01", "receipt"], { replaceUrl: true });
	});

	it("builds redirect URLs with sessionCode, shortCode, and optional externalRefId", () => {
		const url = service.buildRedirectUrl("https://partner.example.com/callback?foo=bar", {
			sessionCode: "slc_secret_123",
			shortCode: "AbCd1234",
			externalRefId: "ord-55",
		});

		const parsed = new URL(url);
		expect(parsed.searchParams.get("foo")).toBe("bar");
		expect(parsed.searchParams.get("sessionCode")).toBe("slc_secret_123");
		expect(parsed.searchParams.get("shortCode")).toBe("AbCd1234");
		expect(parsed.searchParams.get("externalRefId")).toBe("ord-55");
	});

	it("completes session and navigates to /l/:shortCode/receipt when completionMode is receipt", async () => {
		service.saveActiveSession({
			shortCode: "RcPt999",
			completionMode: "receipt",
			createdAtMs: Date.now(),
		});

		const handoffPromise = service.finalizeAndHandoff({
			outcomeType: "kyc",
			token: "jwt-token-1",
		});

		const req = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/RcPt999/complete`);
		expect(req.request.method).toBe("POST");
		expect(req.request.body).toEqual({ outcomeType: "kyc", token: "jwt-token-1" });
		req.flush({
			data: {
				state: "COMPLETED",
				completionMode: "receipt",
				redirectUrl: "",
				allowedPostMessageOrigins: [],
				sessionCode: "slc_receipt_code",
				receipt: {
					shortCode: "RcPt999",
					confirmationCode: "VFK-RCPT99",
					outcomeType: "kyc",
				},
			},
		});

		const handled = await handoffPromise;
		expect(handled).toBeTrue();
		expect(service.getActiveSession()).toBeNull();
		expect(service.getCachedReceipt("RcPt999")?.confirmationCode).toBe("VFK-RCPT99");
		expect(routerSpy.navigate).toHaveBeenCalledWith(["/l", "RcPt999", "receipt"], { replaceUrl: true });
	});

	it("filters postMessage origins to valid https/http allowlist entries and notifies opener", async () => {
		const postMessageSpy = jasmine.createSpy("postMessage");
		spyOn(service as any, "_getPostMessageTarget").and.returnValue({ postMessage: postMessageSpy });

		service.saveActiveSession({
			shortCode: "PmCode01",
			completionMode: "postMessage",
			createdAtMs: Date.now(),
		});

		const handoffPromise = service.finalizeAndHandoff({
			outcomeType: "access",
			token: "login-jwt-1",
		});

		const req = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/PmCode01/complete`);
		req.flush({
			data: {
				state: "COMPLETED",
				completionMode: "postMessage",
				redirectUrl: "",
				allowedPostMessageOrigins: ["javascript:alert(1)", "https://app.partner.io"],
				sessionCode: "slc_pm_1",
				externalRefId: "case-9",
				receipt: {
					shortCode: "PmCode01",
					confirmationCode: "VFK-PMCODE",
					outcomeType: "access",
				},
			},
		});

		const handled = await handoffPromise;
		expect(handled).toBeTrue();
		expect(postMessageSpy).toHaveBeenCalledTimes(1);
		expect(postMessageSpy.calls.mostRecent().args[0]).toEqual(
			jasmine.objectContaining({
				type: "verifik:smartlink:completed",
				shortCode: "PmCode01",
				sessionCode: "slc_pm_1",
				externalRefId: "case-9",
				status: "COMPLETED",
			})
		);
		expect(postMessageSpy.calls.mostRecent().args[1]).toBe("https://app.partner.io");
	});

	it("redirects externally when completionMode is redirect", async () => {
		const redirectSpy = spyOn(service as any, "_redirectExternal");

		service.saveActiveSession({
			shortCode: "Redir01",
			completionMode: "redirect",
			createdAtMs: Date.now(),
		});

		const handoffPromise = service.finalizeAndHandoff({
			outcomeType: "kyb",
			registrationId: "reg123",
		});

		const req = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/Redir01/complete`);
		req.flush({
			data: {
				state: "COMPLETED",
				completionMode: "redirect",
				redirectUrl: "https://partner.example.com/done",
				allowedPostMessageOrigins: [],
				sessionCode: "slc_redir_1",
				externalRefId: "kyb-44",
				receipt: {
					shortCode: "Redir01",
					confirmationCode: "VFK-REDIR0",
					outcomeType: "kyb",
				},
			},
		});

		await handoffPromise;
		expect(redirectSpy).toHaveBeenCalledWith(
			"https://partner.example.com/done?sessionCode=slc_redir_1&shortCode=Redir01&externalRefId=kyb-44"
		);
	});

	it("submits inline face verification to POST /v3/smart-links/public/sessions/:shortCode/verify-face", async () => {
		const facePromise = firstValueFrom(service.verifyFace("Face01", "base64_selfie_payload_123456"));

		const req = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/Face01/verify-face`);
		expect(req.request.method).toBe("POST");
		expect(req.request.body).toEqual({ faceBase64: "base64_selfie_payload_123456" });
		req.flush({
			data: {
				state: "COMPLETED",
				completionMode: "receipt",
				redirectUrl: "",
				allowedPostMessageOrigins: [],
				sessionCode: "slc_face_1",
				receipt: {
					shortCode: "Face01",
					confirmationCode: "VFK-FACE01",
					outcomeType: "access",
					verifiedName: "Ada Lovelace",
					requireDocument: false,
				},
			},
		});

		const res = await facePromise;
		expect(res.state).toBe("COMPLETED");
		expect(res.receipt.verifiedName).toBe("Ada Lovelace");
		expect(res.receipt.requireDocument).toBeFalse();
	});

	it("posts public session events to /v3/smart-links/public/sessions/:shortCode/event and clamps strings to 240 chars", async () => {
		const longReason = "r".repeat(300);
		const longSummary = "s".repeat(300);
		const eventPromise = firstValueFrom(
			service.reportEvent("Evt01", {
				type: "FAILED",
				reason: longReason,
				step: "document",
				summary: longSummary,
			})
		);

		const req = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/Evt01/event`);
		expect(req.request.method).toBe("POST");
		expect(req.request.body.type).toBe("FAILED");
		expect(req.request.body.step).toBe("document");
		expect(req.request.body.reason.length).toBe(240);
		expect(req.request.body.summary.length).toBe(240);
		req.flush({ data: { ok: true, state: "IN_PROGRESS" } });

		const res = await eventPromise;
		expect(res).toEqual({ ok: true, state: "IN_PROGRESS" });
	});

	it("runs completeHandoffFromResult directly for inline face verification results across receipt, redirect, and postMessage", async () => {
		service.saveActiveSession({
			shortCode: "Inline01",
			completionMode: "receipt",
			createdAtMs: Date.now(),
		});

		const receiptResult: SmartLinkCompleteResponse = {
			state: "COMPLETED",
			completionMode: "receipt",
			redirectUrl: "",
			allowedPostMessageOrigins: [],
			sessionCode: "slc_in_1",
			receipt: {
				shortCode: "Inline01",
				confirmationCode: "VFK-INL01",
				outcomeType: "access",
				verifiedName: "Grace Hopper",
				requireDocument: false,
			},
		};

		const okReceipt = await service.completeHandoffFromResult("Inline01", receiptResult);
		expect(okReceipt).toBeTrue();
		expect(service.getActiveSession()).toBeNull();
		expect(service.getCachedReceipt("Inline01")?.verifiedName).toBe("Grace Hopper");
		expect(routerSpy.navigate).toHaveBeenCalledWith(["/l", "Inline01", "receipt"], { replaceUrl: true });

		const redirectSpy = spyOn(service as any, "_redirectExternal");
		const okRedirect = await service.completeHandoffFromResult("Inline02", {
			...receiptResult,
			completionMode: "redirect",
			redirectUrl: "https://partner.example.com/callback",
			externalRefId: "ext-9",
		});
		expect(okRedirect).toBeTrue();
		expect(redirectSpy).toHaveBeenCalledWith(
			"https://partner.example.com/callback?sessionCode=slc_in_1&shortCode=Inline02&externalRefId=ext-9"
		);
	});

	it("caches and reads pre-completed receipts via cacheReceipt/getCachedReceipt", () => {
		service.cacheReceipt("Done01", {
			shortCode: "Done01",
			confirmationCode: "VFK-DONE01",
			outcomeType: "kyc",
			verifiedName: "Alan Turing",
			requireDocument: true,
		});

		const cached = service.getCachedReceipt("Done01");
		expect(cached?.confirmationCode).toBe("VFK-DONE01");
		expect(cached?.verifiedName).toBe("Alan Turing");
		expect(cached?.requireDocument).toBeTrue();
	});

	it("sends and verifies inline OTP, persists verifiedContactToken & humanIdRecoveryContext, and forwards registrationToken in reportEvent", async () => {
		const sendPromise = firstValueFrom(
			service.sendOtp({
				slugOrCode: "acme-slug",
				identifier: "3001112233",
				channel: "phone",
				countryCode: "+57",
				phoneGateway: "sms",
			})
		);
		const sendReq = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/otp/send`);
		expect(sendReq.request.body.phoneGateway).toBe("sms");
		sendReq.flush({
			data: {
				sent: true,
				shortCode: "Spawned01",
				accessToken: "sl_spawned_tok",
				channel: "phone",
				phoneGateway: "sms",
				maskedTarget: "+57 ***2233",
				expiresAt: "2026-11-21T22:00:00Z",
				resendAvailableAt: "2026-11-21T21:50:30Z",
			},
		});
		const sendRes = await sendPromise;
		expect(sendRes.shortCode).toBe("Spawned01");
		expect(service.getAccessToken("Spawned01")).toBe("sl_spawned_tok");

		const verifyPromise = firstValueFrom(
			service.verifyOtp({
				shortCode: "Spawned01",
				code: "123456",
			})
		);
		const verifyReq = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/otp/verify`);
		expect(verifyReq.request.body).toEqual({
			shortCode: "Spawned01",
			code: "123456",
			t: "sl_spawned_tok",
		});
		verifyReq.flush({
			data: {
				verified: true,
				shortCode: "Spawned01",
				verifiedContactToken: "jwt_verified_contact",
			},
		});
		await verifyPromise;

		service.saveActiveSession({
			shortCode: "Spawned01",
			accessToken: "sl_spawned_tok",
			verifiedContactToken: service.getVerifiedContactToken("Spawned01"),
			createdAtMs: Date.now(),
		});
		expect(service.getVerifiedContactToken()).toBe("jwt_verified_contact");

		service.saveHumanIdRecoveryContext({
			shortCode: "Spawned01",
			allowHumanIdRecovery: true,
			recoveryEnrollProjectId: "proj-enroll-1",
			recoveryReverifyToken: "jwt-recovery-1",
		});
		expect(service.getHumanIdRecoveryContext()?.allowHumanIdRecovery).toBeTrue();
		expect(service.getHumanIdRecoveryContext()?.recoveryEnrollProjectId).toBe("proj-enroll-1");

		const eventPromise = firstValueFrom(
			service.reportEvent("Spawned01", {
				type: "IN_PROGRESS",
				step: "manual_review",
				registrationToken: "kyc-reg-jwt",
				outcomeType: "kyc",
			})
		);
		const eventReq = httpMock.expectOne(`${apiUrl}/v3/smart-links/public/sessions/Spawned01/event`);
		expect(eventReq.request.body).toEqual({
			type: "IN_PROGRESS",
			step: "manual_review",
			registrationToken: "kyc-reg-jwt",
			outcomeType: "kyc",
			t: "sl_spawned_tok",
		});
		eventReq.flush({ data: { ok: true, state: "IN_PROGRESS" } });
		await eventPromise;
	});
});

describe("SmartLinkUiHelper", () => {
	it("extracts backend snake_case error messages even when AppError sets generic code like UnprocessableEntity", () => {
		expect(
			extractApiErrorCode(
				{ error: { code: "UnprocessableEntity", message: "face_mismatch" } },
				"face_verify_failed"
			)
		).toBe("face_mismatch");
		expect(
			extractApiErrorCode(
				{ error: { code: "BadRequest", message: "400:face_verification_not_initialized" } },
				"face_verify_failed"
			)
		).toBe("face_verification_not_initialized");
		expect(
			extractApiErrorCode(
				{ error: { code: "Forbidden", message: "smart_link_session_exhausted" } },
				"smart_link_lookup_failed"
			)
		).toBe("smart_link_session_exhausted");
		expect(
			extractApiErrorCode({ error: { code: "UnprocessableEntity" } }, "face_verify_failed")
		).toBe("face_verify_failed");
	});

	it("maps all backend face/lookup error codes to localized translation keys without leaking raw codes", () => {
		const codes = [
			"identifier_required",
			"invalid_email_format",
			"invalid_phone_format",
			"personal_project_not_configured",
			"face_verification_not_initialized",
			"face_verification_not_available",
			"face_verification_failed",
			"invalid_face_image",
			"no_face_detected",
			"multiple_faces_detected",
			"face_close_to_border",
			"face_too_far",
			"image_too_large",
			"liveness_unavailable",
			"liveness_failed",
			"face_mismatch",
			"RATE_LIMIT_EXCEEDED",
			"verification_timeout",
			"document_required",
			"completion_not_finalized",
			"reverify_document_mismatch",
		];
		for (const code of codes) {
			const mapped = mapSmartLinkInlineErrorKey(code);
			expect(mapped.startsWith("smartLink.error.")).toBeTrue();
			expect(mapped).not.toBe("smartLink.error.genericInline");
		}
		expect(mapSmartLinkTerminalErrorKeys("smart_link_session_expired").titleKey).toBe(
			"smartLink.error.expiredTitle"
		);
		expect(mapSmartLinkTerminalErrorKeys("personal_project_not_configured").titleKey).toBe(
			"smartLink.error.configTitle"
		);
		expect(mapSmartLinkTerminalErrorKeys("face_check_attempt_limit").titleKey).toBe(
			"smartLink.error.faceLimitTitle"
		);
		expect(mapSmartLinkTerminalErrorKeys("document_required").titleKey).toBe(
			"smartLink.error.documentRequiredTitle"
		);
		expect(mapSmartLinkTerminalErrorKeys("invalid_mode").titleKey).toBe(
			"smartLink.error.notFoundTitle"
		);
		expect(mapSmartLinkTerminalErrorKeys("invalid_smart_link_token").titleKey).toBe(
			"smartLink.error.tokenTitle"
		);
		expect(mapSmartLinkInlineErrorKey("invalid_otp_code")).toBe("smartLink.otp.errorInvalid");
		expect(mapSmartLinkInlineErrorKey("otp_expired")).toBe("smartLink.otp.errorExpired");
		expect(mapSmartLinkInlineErrorKey("otp_max_attempts_exceeded")).toBe("smartLink.otp.errorMaxAttempts");
		expect(mapSmartLinkInlineErrorKey("otp_resend_cooldown")).toBe("smartLink.otp.errorCooldown");
		expect(mapSmartLinkInlineErrorKey("no_document_anchor_zero_knowledge")).toBe(
			"smartLink.humanIdRecovery.noAnchorBody"
		);
	});

	it("normalizes supported Transloco languages including backend aliases", () => {
		const fakeTransloco: any = {
			getAvailableLangs: () => [{ id: "en" }, { id: "es" }, { id: "br" }, { id: "cn" }, { id: "kr" }],
		};
		expect(normalizeSupportedSmartLinkLang("es-CO", fakeTransloco)).toBe("es");
		expect(normalizeSupportedSmartLinkLang("pt", fakeTransloco)).toBe("br");
		expect(normalizeSupportedSmartLinkLang("zh-CN", fakeTransloco)).toBe("cn");
		expect(normalizeSupportedSmartLinkLang("ko", fakeTransloco)).toBe("kr");
		expect(normalizeSupportedSmartLinkLang("xx-UNKNOWN", fakeTransloco)).toBeNull();
	});

	it("resolves theme dark surface and right banner image cleanly across styles A-F", () => {
		const darkTheme = resolveSmartLinkTheme(null, "d", {
			image: "https://cdn.example.com/banner.jpg",
			titleColor: "#0e0f0c",
		});
		expect(darkTheme.styleId).toBe("d");
		expect(darkTheme.isDarkSurface).toBeTrue();
		expect(darkTheme.bannerImage).toBe("https://cdn.example.com/banner.jpg");
		expect(darkTheme.styleVars["--style-ink"]).toBe("#f8fafc");

		const rightImageTheme = resolveSmartLinkTheme("b", "a", {
			rightImage: "https://cdn.example.com/right.png",
			rightBackgroundColor: "#112233",
		});
		expect(rightImageTheme.styleId).toBe("b");
		expect(rightImageTheme.isDarkSurface).toBeFalse();
		expect(rightImageTheme.bannerImage).toBe("https://cdn.example.com/right.png");
		expect(rightImageTheme.bannerBgColor).toBe("#112233");
	});
});
