import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import {
    AntiBotChallengeService,
    ChallengeTicket,
} from "./anti-bot-challenge.service";
import { environment } from "environments/environment";

describe("AntiBotChallengeService", () => {
    let service: AntiBotChallengeService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AntiBotChallengeService],
        });
        service = TestBed.inject(AntiBotChallengeService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        service.destroyWorker();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("isFallbackRequired", () => {
        it("should return true for status 428", () => {
            expect(service.isFallbackRequired({ status: 428 })).toBeTrue();
            expect(service.isFallbackRequired({ statusCode: 428 })).toBeTrue();
        });

        it("should return true for FALLBACK_CHALLENGE code", () => {
            expect(service.isFallbackRequired({ error: { code: "FALLBACK_CHALLENGE" } })).toBeTrue();
            expect(service.isFallbackRequired({ code: "FALLBACK_CHALLENGE" })).toBeTrue();
        });

        it("should return false for other errors", () => {
            expect(service.isFallbackRequired(null)).toBeFalse();
            expect(service.isFallbackRequired({ status: 400 })).toBeFalse();
            expect(service.isFallbackRequired({ status: 500 })).toBeFalse();
        });
    });

    describe("extractFallbackData", () => {
        it("should extract turnstileSiteKey and challengeId from HTTP 428 error", () => {
            const error = {
                status: 428,
                error: {
                    code: "FALLBACK_CHALLENGE",
                    data: {
                        turnstileSiteKey: "0x4AAAAAAtestkey",
                        challengeId: "ch_123456",
                    },
                },
            };

            const data = service.extractFallbackData(error);
            expect(data).toBeTruthy();
            expect(data?.turnstileSiteKey).toBe("0x4AAAAAAtestkey");
            expect(data?.challengeId).toBe("ch_123456");
        });

        it("should return null if error is not a fallback", () => {
            expect(service.extractFallbackData({ status: 404 })).toBeNull();
        });
    });

    describe("requestChallenge", () => {
        it("should send POST to /v2/anti-bot/challenge and return ticket", async () => {
            const mockTicket: ChallengeTicket = {
                ticketId: "tick_test_123",
                nonce: "nonce_abc456",
                difficulty: 4,
                timestamp: Date.now(),
                hmac: "hmac_signature_xyz",
            };

            const promise = service.requestChallenge("proj_test_id");

            const req = httpMock.expectOne(`${environment.apiUrl}/v2/anti-bot/challenge`);
            expect(req.request.method).toBe("POST");
            expect(req.request.body.projectId).toBe("proj_test_id");
            req.flush({ data: mockTicket });

            const ticket = await promise;
            expect(ticket.ticketId).toBe("tick_test_123");
            expect(ticket.nonce).toBe("nonce_abc456");
            expect(ticket.difficulty).toBe(4);
        });
    });

    describe("collectHardwareAttestation", () => {
        it("should return valid hardware and rendering telemetry object", async () => {
            const telemetry = await service.collectHardwareAttestation();

            expect(telemetry).toBeDefined();
            expect(typeof telemetry.canvasFingerprint).toBe("string");
            expect(telemetry.webglRenderer).toBeDefined();
            expect(typeof telemetry.webglRenderer.vendor).toBe("string");
            expect(typeof telemetry.webglRenderer.renderer).toBe("string");
            expect(typeof telemetry.webglRenderer.isSoftwareRenderer).toBe("boolean");
            expect(telemetry.hardwareConcurrency).toBeGreaterThan(0);
            expect(typeof telemetry.touchSupport).toBe("boolean");
            expect(typeof telemetry.webdriver).toBe("boolean");
            expect(telemetry.screen).toBeDefined();
            expect(typeof telemetry.screen.devicePixelRatio).toBe("number");
            expect(typeof telemetry.timezone).toBe("string");
            expect(telemetry.timestamp).toBeGreaterThan(0);
        });
    });

    describe("destroyWorker", () => {
        it("should cleanly terminate worker and reset state", () => {
            expect(() => service.destroyWorker()).not.toThrow();
        });
    });

    describe("solvePoW", () => {
        it("should solve difficulty 4 synchronously via Blob Worker with genuine SHA-256 hash", async () => {
            if (typeof Worker === "undefined" || typeof Blob === "undefined") {
                pending("Web Worker API unavailable in current environment");
                return;
            }

            const nonce = "test_nonce_pow_2026";
            const solution = await service.solvePoW(nonce, 4, 2000000);

            expect(solution.counter).toBeGreaterThanOrEqual(0);
            expect(solution.iterations).toBe(solution.counter + 1);
            expect(solution.hash).toMatch(/^0000[0-9a-f]{60}$/);
            expect(solution.durationMs).toBeLessThanOrEqual(250);

            if (typeof crypto !== "undefined" && crypto.subtle) {
                const encoded = new TextEncoder().encode(`${nonce}${solution.counter}`);
                const digest = await crypto.subtle.digest("SHA-256", encoded);
                const expectedHex = Array.from(new Uint8Array(digest))
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join("");
                expect(solution.hash).toBe(expectedHex);
            }
        });

        it("should reject with MAX_ITERATIONS_EXCEEDED when difficulty cannot be met within budget", async () => {
            if (typeof Worker === "undefined" || typeof Blob === "undefined") {
                pending("Web Worker API unavailable in current environment");
                return;
            }

            await expectAsync(service.solvePoW("deadbeef", 6, 5)).toBeRejectedWithError(
                "MAX_ITERATIONS_EXCEEDED"
            );
        });
    });

    describe("consumeStoredHeaders & extractValidHeaders", () => {
        const projectId = "proj_storage_test";
        const storageKey = AntiBotChallengeService.getStorageKey(projectId);

        afterEach(() => {
            sessionStorage.removeItem(storageKey);
        });

        it("should read, validate, and consume anti-bot headers from sessionStorage", () => {
            const stored = {
                "X-Bot-Ticket": '{"ticketId":"t1"}',
                "X-Bot-Proof": '{"counter":5,"hash":"0000ab"}',
                "X-Bot-Attestation": '{"webdriver":false}',
                "X-Turnstile-Token": "cf_tok_123",
                extraHeader: "ignored",
            };
            sessionStorage.setItem(storageKey, JSON.stringify(stored));

            const consumed = service.consumeStoredHeaders(projectId);
            expect(consumed).toEqual({
                "X-Bot-Ticket": '{"ticketId":"t1"}',
                "X-Bot-Proof": '{"counter":5,"hash":"0000ab"}',
                "X-Bot-Attestation": '{"webdriver":false}',
                "X-Turnstile-Token": "cf_tok_123",
            });
            expect(sessionStorage.getItem(storageKey)).toBeNull();
        });

        it("should return null gracefully when sessionStorage entry is missing or malformed", () => {
            expect(service.consumeStoredHeaders(projectId)).toBeNull();

            sessionStorage.setItem(storageKey, "{not-valid-json");
            expect(service.consumeStoredHeaders(projectId)).toBeNull();

            sessionStorage.setItem(storageKey, JSON.stringify({ "X-Bot-Ticket": "only-ticket" }));
            expect(service.consumeStoredHeaders(projectId)).toBeNull();
        });

        it("should use stored headers in getOrPrepareVerificationHeaders without requesting a new challenge", async () => {
            const stored = {
                "X-Bot-Ticket": '{"ticketId":"t2"}',
                "X-Bot-Proof": '{"counter":1,"hash":"0000ff"}',
                "X-Bot-Attestation": '{"webdriver":false}',
            };
            sessionStorage.setItem(storageKey, JSON.stringify(stored));
            const prepareSpy = spyOn(service, "prepareVerificationHeaders");

            const result = await service.getOrPrepareVerificationHeaders(projectId);
            expect(result).toEqual(stored);
            expect(prepareSpy).not.toHaveBeenCalled();
            expect(sessionStorage.getItem(storageKey)).toBeNull();
        });
    });
});
