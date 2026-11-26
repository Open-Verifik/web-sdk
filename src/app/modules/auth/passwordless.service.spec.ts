import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TranslocoService } from "@ngneat/transloco";
import { environment } from "environments/environment";
import { AntiBotChallengeService } from "app/core/services/anti-bot-challenge.service";
import { SmartEnrollService } from "./smart-enroll/smart-enroll.service";
import { PasswordlessService } from "./passwordless.service";

describe("PasswordlessService", () => {
	let service: PasswordlessService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [
				PasswordlessService,
				{
					provide: TranslocoService,
					useValue: { getActiveLang: () => "en" },
				},
				{
					provide: SmartEnrollService,
					useValue: { unsetLocalStorage: () => {} },
				},
			],
		});
		service = TestBed.inject(PasswordlessService);
	});

	it("should be created", () => {
		expect(service).toBeTruthy();
	});
});

describe("PasswordlessService - AntiBot Header Forwarding", () => {
	let service: PasswordlessService;
	let httpMock: HttpTestingController;
	let mockAntiBotService: jasmine.SpyObj<AntiBotChallengeService>;
	const projectId = "proj_pwdless_test";
	const storageKey = `verifik_antibot_headers_${projectId}`;

	beforeEach(() => {
		mockAntiBotService = jasmine.createSpyObj<AntiBotChallengeService>("AntiBotChallengeService", [
			"prepareVerificationHeaders",
		]);

		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [
				PasswordlessService,
				{ provide: AntiBotChallengeService, useValue: mockAntiBotService },
				{
					provide: TranslocoService,
					useValue: { getActiveLang: () => "en" },
				},
				{
					provide: SmartEnrollService,
					useValue: { unsetLocalStorage: () => {} },
				},
			],
		});

		service = TestBed.inject(PasswordlessService);
		httpMock = TestBed.inject(HttpTestingController);
		sessionStorage.removeItem(storageKey);
		localStorage.removeItem("loginLocation");
		localStorage.removeItem("accessToken");
	});

	afterEach(() => {
		httpMock.verify();
		sessionStorage.removeItem(storageKey);
	});

	it("attaches X-Bot-Ticket, X-Bot-Proof, X-Bot-Attestation, and X-Turnstile-Token from sessionStorage on humanIdLogin", () => {
		const storedHeaders = {
			"X-Bot-Ticket": '{"ticketId":"tick_1"}',
			"X-Bot-Proof": '{"counter":42,"hash":"0000abc"}',
			"X-Bot-Attestation": '{"webdriver":false}',
			"X-Turnstile-Token": "cf_turnstile_tok",
		};
		sessionStorage.setItem(storageKey, JSON.stringify(storedHeaders));

		let responseData: any;
		service
			.humanIdLogin({
				projectId,
				faceBase64: "ZmFjZQ==",
				humanId: "hid_123",
			})
			.subscribe((res) => (responseData = res));

		const req = httpMock.expectOne(`${environment.apiUrl}/v2/app-logins/human-id`);
		expect(req.request.method).toBe("POST");
		expect(req.request.headers.get("X-Bot-Ticket")).toBe(storedHeaders["X-Bot-Ticket"]);
		expect(req.request.headers.get("X-Bot-Proof")).toBe(storedHeaders["X-Bot-Proof"]);
		expect(req.request.headers.get("X-Bot-Attestation")).toBe(storedHeaders["X-Bot-Attestation"]);
		expect(req.request.headers.get("X-Turnstile-Token")).toBe(storedHeaders["X-Turnstile-Token"]);
		expect(mockAntiBotService.prepareVerificationHeaders).not.toHaveBeenCalled();
		expect(sessionStorage.getItem(storageKey)).toBeNull();

		req.flush({ data: { token: "jwt_ok" } });
		expect(responseData.data.token).toBe("jwt_ok");
	});

	it("obtains challenge headers via AntiBotChallengeService when missing in sessionStorage", async () => {
		const generatedHeaders = {
			"X-Bot-Ticket": '{"ticketId":"tick_gen"}',
			"X-Bot-Proof": '{"counter":99,"hash":"0000def"}',
			"X-Bot-Attestation": '{"webdriver":false}',
		};
		mockAntiBotService.prepareVerificationHeaders.and.resolveTo(generatedHeaders);

		const responsePromise = new Promise((resolve) => {
			service
				.humanIdLogin({
					projectId,
					faceBase64: "ZmFjZQ==",
					humanId: "hid_456",
				})
				.subscribe(resolve);
		});

		await Promise.resolve();
		await Promise.resolve();

		const req = httpMock.expectOne(`${environment.apiUrl}/v2/app-logins/human-id`);
		expect(mockAntiBotService.prepareVerificationHeaders).toHaveBeenCalledWith(projectId);
		expect(req.request.headers.get("X-Bot-Ticket")).toBe(generatedHeaders["X-Bot-Ticket"]);
		expect(req.request.headers.get("X-Bot-Proof")).toBe(generatedHeaders["X-Bot-Proof"]);
		expect(req.request.headers.get("X-Bot-Attestation")).toBe(generatedHeaders["X-Bot-Attestation"]);
		req.flush({ data: { token: "jwt_gen" } });

		const res: any = await responsePromise;
		expect(res.data.token).toBe("jwt_gen");
	});

	it("proceeds gracefully when sessionStorage is empty and AntiBotChallengeService rejects", async () => {
		mockAntiBotService.prepareVerificationHeaders.and.rejectWith(new Error("Challenge offline"));

		const responsePromise = new Promise((resolve) => {
			service
				.humanIdLogin({
					projectId,
					faceBase64: "ZmFjZQ==",
					humanId: "hid_graceful",
				})
				.subscribe(resolve);
		});

		await Promise.resolve();
		await Promise.resolve();

		const req = httpMock.expectOne(`${environment.apiUrl}/v2/app-logins/human-id`);
		expect(req.request.headers.has("X-Bot-Ticket")).toBeFalse();
		req.flush({ data: { token: "jwt_graceful" } });

		const res: any = await responsePromise;
		expect(res.data.token).toBe("jwt_graceful");
	});
});
