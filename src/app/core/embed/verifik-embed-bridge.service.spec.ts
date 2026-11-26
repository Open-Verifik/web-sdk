import { TestBed } from "@angular/core/testing";
import { VerifikEmbedBridgeService } from "./verifik-embed-bridge.service";

describe("VerifikEmbedBridgeService", () => {
	let service: VerifikEmbedBridgeService;

	beforeEach(() => {
		sessionStorage.clear();
		TestBed.configureTestingModule({});
		service = TestBed.inject(VerifikEmbedBridgeService);
		service.clearContext();
	});

	it("activates embed mode from query parameters and persists across storage", () => {
		service.initFromWindowLocation("?embed=modal&sessionToken=vks_live_123&parentOrigin=https%3A%2F%2Fapp.customer.com");

		expect(service.isEmbedded).toBeTrue();
		expect(service.context.mode).toBe("modal");
		expect(service.context.sessionToken).toBe("vks_live_123");
		expect(service.context.parentOrigin).toBe("https://app.customer.com");
	});

	it("rejects unsafe non-https parentOrigin schemes", () => {
		service.setContext({ embedded: true, mode: "modal", parentOrigin: "javascript:alert(1)" });
		expect(service.context.parentOrigin).toBeNull();
	});

	it("emits typed verifik-sdk envelope via postMessage without throwing", () => {
		service.setContext({
			embedded: true,
			mode: "modal",
			sessionId: "sess_1",
			sessionToken: "vks_test_abc",
			vendorData: "user_9",
		});

		const envelope = service.emit("verifik:completed", { status: "Approved", token: "jwt_1" });
		expect(envelope.source).toBe("verifik-sdk");
		expect(envelope.version).toBe("1.0");
		expect(envelope.event).toBe("verifik:completed");
		expect(envelope.payload.vendorData).toBe("user_9");
		expect(envelope.payload.token).toBe("jwt_1");
	});
});
