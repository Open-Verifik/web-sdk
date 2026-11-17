import { ChangeDetectorRef } from "@angular/core";
import { Subject, of, throwError } from "rxjs";
import { AntiBotChallengeService } from "app/core/services/anti-bot-challenge.service";
import { HumanIdLoginComponent } from "./human-id-login.component";

describe("HumanIdLoginComponent - Format Validation & Payload Extraction", () => {
	let component: HumanIdLoginComponent;
	let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;

	beforeEach(() => {
		mockCdr = jasmine.createSpyObj<ChangeDetectorRef>("ChangeDetectorRef", ["markForCheck", "detectChanges"]);

		// Create component instance using prototype to isolate format validation & extraction unit logic
		component = Object.create(HumanIdLoginComponent.prototype);
		(component as any)._cdr = mockCdr;
		component.pastedHumanId = "";
		component.isTextValid = false;
		component.textValidationErrorKey = null;
		component.humanId = null;
		component.qrImageBase64 = null;
	});

	describe("_validateHumanIdFormat", () => {
		it("accepts valid JSON proofs with humanId, zelfProof, or proof", () => {
			const validate = (component as any)._validateHumanIdFormat.bind(component);

			expect(validate(JSON.stringify({ humanId: "hid_123", proof: "proof_123" }))).toBeTrue();
			expect(validate(JSON.stringify({ humanId: "hid_123" }))).toBeTrue();
			expect(validate(JSON.stringify({ proof: "proof_123" }))).toBeTrue();
			expect(validate(JSON.stringify({ zelfProof: "zp_123" }))).toBeTrue();
		});

		it("accepts JSON proof containing data payload string", () => {
			const validate = (component as any)._validateHumanIdFormat.bind(component);

			expect(validate(JSON.stringify({ data: "test_payload_123" }))).toBeTrue();
			expect(validate(JSON.stringify({ data: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3" }))).toBeTrue();
		});

		it("accepts JSON proof containing data payload object", () => {
			const validate = (component as any)._validateHumanIdFormat.bind(component);

			expect(validate(JSON.stringify({ data: { proof: "nested_proof" } }))).toBeTrue();
			expect(validate(JSON.stringify({ data: { zelfProof: "nested_zp" } }))).toBeTrue();
			expect(validate(JSON.stringify({ data: { humanId: "nested_hid" } }))).toBeTrue();
			expect(validate(JSON.stringify({ data: { customField: "customVal" } }))).toBeTrue();
		});

		it("rejects invalid or empty JSON objects", () => {
			const validate = (component as any)._validateHumanIdFormat.bind(component);

			expect(validate(JSON.stringify({ data: "" }))).toBeFalse();
			expect(validate(JSON.stringify({ data: "   " }))).toBeFalse();
			expect(validate(JSON.stringify({ data: {} }))).toBeFalse();
			expect(validate(JSON.stringify({ data: null }))).toBeFalse();
			expect(validate(JSON.stringify({}))).toBeFalse();
			expect(validate(JSON.stringify({ wrongKey: "invalid" }))).toBeFalse();
			expect(validate("{\"data\": not_json}")).toBeFalse();
		});

		it("accepts valid base64 strings >= 32 chars", () => {
			const validate = (component as any)._validateHumanIdFormat.bind(component);

			expect(validate("A".repeat(32))).toBeTrue();
			expect(validate("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=")).toBeTrue();
			expect(validate("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNk-_==")).toBeTrue();
		});

		it("accepts valid data URLs", () => {
			const validate = (component as any)._validateHumanIdFormat.bind(component);

			expect(validate("data:image/png;base64,iVBORw0KGgo=")).toBeTrue();
			expect(validate("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBeTrue();
		});

		it("rejects short or malicious strings", () => {
			const validate = (component as any)._validateHumanIdFormat.bind(component);

			expect(validate("")).toBeFalse();
			expect(validate("   ")).toBeFalse();
			expect(validate("abc")).toBeFalse();
			expect(validate("A".repeat(31))).toBeFalse();
			expect(validate("' OR 1=1 --")).toBeFalse();
			expect(validate("<script>alert(1)</script>")).toBeFalse();
		});
	});

	describe("_extractHumanId & submitPastedText / _onQrCodeExtracted", () => {
		beforeEach(() => {
			(component as any)._skipToSelfie = jasmine.createSpy("_skipToSelfie");
		});

		it("extracts data string payload when pasted", () => {
			component.pastedHumanId = JSON.stringify({ data: "extracted_proof_string" });
			component.isTextValid = true;

			component.submitPastedText();

			expect(component.humanId).toBe("extracted_proof_string");
			expect((component as any)._skipToSelfie).toHaveBeenCalled();
		});

		it("extracts nested proof inside data object when pasted", () => {
			component.pastedHumanId = JSON.stringify({ data: { proof: "inner_proof_val" } });
			component.isTextValid = true;

			component.submitPastedText();

			expect(component.humanId).toBe("inner_proof_val");
		});

		it("extracts nested stringified JSON proof inside data string", () => {
			component.pastedHumanId = JSON.stringify({ data: JSON.stringify({ proof: "nested_json_proof" }) });
			component.isTextValid = true;

			component.submitPastedText();

			expect(component.humanId).toBe("nested_json_proof");
		});

		it("extracts top-level proof when data is not present", () => {
			component.pastedHumanId = JSON.stringify({ proof: "top_level_proof" });
			component.isTextValid = true;

			component.submitPastedText();

			expect(component.humanId).toBe("top_level_proof");
		});

		it("extracts proof payload from scanned QR code text", () => {
			const qrText = JSON.stringify({ data: "qr_extracted_proof_payload" });
			const qrDataUrl = "data:image/png;base64,fakeQrPng";

			(component as any)._onQrCodeExtracted(qrText, qrDataUrl);

			expect(component.humanId).toBe("qr_extracted_proof_payload");
			expect(component.qrImageBase64).toBe(qrDataUrl);
			expect((component as any)._skipToSelfie).toHaveBeenCalled();
		});
	});
});

describe("HumanIdLoginComponent - AntiBot Header Forwarding", () => {
	let component: HumanIdLoginComponent;
	let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;
	let mockPasswordlessService: any;
	let mockAntiBotService: jasmine.SpyObj<AntiBotChallengeService>;
	let mockAuthService: any;
	const projectId = "proj_human_id_test";
	const storageKey = `verifik_antibot_headers_${projectId}`;

	beforeEach(() => {
		mockCdr = jasmine.createSpyObj<ChangeDetectorRef>("ChangeDetectorRef", ["markForCheck", "detectChanges"]);
		mockPasswordlessService = {
			humanIdLogin: jasmine.createSpy("humanIdLogin").and.returnValue(of({ data: { token: "tok_ok", appLogin: {} } })),
		};
		mockAntiBotService = jasmine.createSpyObj<AntiBotChallengeService>("AntiBotChallengeService", [
			"prepareVerificationHeaders",
			"isFallbackRequired",
			"extractFallbackData",
			"handleTurnstileFallback",
		]);
		mockAntiBotService.isFallbackRequired.and.returnValue(false);
		mockAuthService = {
			handleRedirect: jasmine.createSpy("handleRedirect"),
		};

		component = Object.create(HumanIdLoginComponent.prototype);
		(component as any).platformId = "browser";
		(component as any)._cdr = mockCdr;
		(component as any)._passwordlessService = mockPasswordlessService;
		(component as any)._antiBotChallengeService = mockAntiBotService;
		(component as any)._authService = mockAuthService;
		(component as any)._destroy$ = new Subject<void>();
		component.projectId = projectId;
		component.projectFlow = {} as any;
		component.humanId = "hid_test_1";
		component.faceBase64 = "ZmFjZUI2NA==";
		component.step = "selfie";
		component.selfiePhase = "idle";
		sessionStorage.removeItem(storageKey);
	});

	afterEach(() => {
		(component as any)._destroy$.next();
		(component as any)._destroy$.complete();
		sessionStorage.removeItem(storageKey);
	});

	it("reads stored anti-bot headers from sessionStorage and forwards them to humanIdLogin", async () => {
		const storedHeaders = {
			"X-Bot-Ticket": '{"ticketId":"t_stored"}',
			"X-Bot-Proof": '{"counter":12,"hash":"000012"}',
			"X-Bot-Attestation": '{"webdriver":false}',
			"X-Turnstile-Token": "ts_stored",
		};
		sessionStorage.setItem(storageKey, JSON.stringify(storedHeaders));

		await (component as any)._submitLogin();

		expect(mockAntiBotService.prepareVerificationHeaders).not.toHaveBeenCalled();
		expect(sessionStorage.getItem(storageKey)).toBeNull();
		expect(mockPasswordlessService.humanIdLogin).toHaveBeenCalledWith(
			jasmine.objectContaining({
				projectId,
				faceBase64: "ZmFjZUI2NA==",
				humanId: "hid_test_1",
			}),
			storedHeaders
		);
		expect(component.step).toBe("success");
	});

	it("requests fresh anti-bot headers via AntiBotChallengeService when missing in sessionStorage", async () => {
		const preparedHeaders = {
			"X-Bot-Ticket": '{"ticketId":"t_fresh"}',
			"X-Bot-Proof": '{"counter":7,"hash":"000077"}',
			"X-Bot-Attestation": '{"webdriver":false}',
		};
		mockAntiBotService.prepareVerificationHeaders.and.resolveTo(preparedHeaders);

		await (component as any)._submitLogin();

		expect(mockAntiBotService.prepareVerificationHeaders).toHaveBeenCalledWith(projectId);
		expect(mockPasswordlessService.humanIdLogin).toHaveBeenCalledWith(
			jasmine.objectContaining({ projectId }),
			preparedHeaders
		);
	});

	it("proceeds gracefully when sessionStorage is empty and challenge preparation fails", async () => {
		mockAntiBotService.prepareVerificationHeaders.and.rejectWith(new Error("Network error"));

		await (component as any)._submitLogin();

		expect(mockPasswordlessService.humanIdLogin).toHaveBeenCalledWith(
			jasmine.objectContaining({ projectId }),
			undefined
		);
	});

	it("handles HTTP 428 FALLBACK_CHALLENGE by solving Turnstile, refreshing PoW headers, and retrying with X-Turnstile-Token", async () => {
		const initialHeaders = {
			"X-Bot-Ticket": '{"ticketId":"t_init"}',
			"X-Bot-Proof": '{"counter":1,"hash":"000011"}',
			"X-Bot-Attestation": '{"webdriver":false}',
		};
		const retryHeaders = {
			"X-Bot-Ticket": '{"ticketId":"t_retry"}',
			"X-Bot-Proof": '{"counter":2,"hash":"000022"}',
			"X-Bot-Attestation": '{"webdriver":false}',
		};
		sessionStorage.setItem(storageKey, JSON.stringify(initialHeaders));

		const fallbackError = {
			status: 428,
			error: {
				code: "FALLBACK_CHALLENGE",
				data: { turnstileSiteKey: "0xSiteKeyTest" },
			},
		};

		mockPasswordlessService.humanIdLogin.and.returnValues(
			throwError(() => fallbackError),
			of({ data: { token: "tok_retry_ok", appLogin: {} } })
		);
		mockAntiBotService.isFallbackRequired.and.returnValue(true);
		mockAntiBotService.extractFallbackData.and.returnValue({ turnstileSiteKey: "0xSiteKeyTest" });
		mockAntiBotService.handleTurnstileFallback.and.resolveTo("cf_solved_token_999");
		mockAntiBotService.prepareVerificationHeaders.and.resolveTo(retryHeaders);

		await (component as any)._submitLogin();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		expect(mockAntiBotService.handleTurnstileFallback).toHaveBeenCalledWith("0xSiteKeyTest");
		expect(mockPasswordlessService.humanIdLogin).toHaveBeenCalledTimes(2);
		expect(mockPasswordlessService.humanIdLogin.calls.mostRecent().args[1]).toEqual({
			...retryHeaders,
			"X-Turnstile-Token": "cf_solved_token_999",
		});
		expect(component.step).toBe("success");
	});
});
