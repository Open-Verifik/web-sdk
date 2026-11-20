import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { environment } from "environments/environment";

import { SmartLinkRuntimeService } from "./smart-link-runtime.service";

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
});
