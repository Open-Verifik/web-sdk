import { Router } from "@angular/router";
import { FormBuilder } from "@angular/forms";
import { AntiBotChallengeService } from "app/core/services/anti-bot-challenge.service";
import { AuthSignInComponent } from "./sign-in.component";

describe("AuthSignInComponent - Biometric Sign-In AntiBot Wiring", () => {
    let component: AuthSignInComponent;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockAntiBotService: jasmine.SpyObj<AntiBotChallengeService>;
    const fb = new FormBuilder();

    beforeEach(() => {
        mockRouter = jasmine.createSpyObj<Router>("Router", ["navigate"]);
        mockAntiBotService = jasmine.createSpyObj<AntiBotChallengeService>("AntiBotChallengeService", [
            "prepareVerificationHeaders",
        ]);

        component = Object.create(AuthSignInComponent.prototype);
        (component as any).platformId = "browser";
        (component as any)._router = mockRouter;
        (component as any)._antiBotChallengeService = mockAntiBotService;
        component.antiBotHeaders = null;
        component.project = { _id: "proj_test_123" } as any;
        component.projectFlow = { linkedProjectsMeta: [] } as any;
        component.typeLogin = "email";
        component.signInForm = fb.group({
            email: ["user@example.com"],
            phone: [""],
        });
        sessionStorage.removeItem("verifik_antibot_headers_proj_test_123");
    });

    afterEach(() => {
        sessionStorage.removeItem("verifik_antibot_headers_proj_test_123");
    });

    it("invokes AntiBotChallengeService.prepareVerificationHeaders and navigates to human-id on biometric action", async () => {
        const mockHeaders = {
            "X-Bot-Ticket": '{"ticketId":"t1"}',
            "X-Bot-Proof": '{"counter":1,"hash":"0000abc"}',
            "X-Bot-Attestation": '{"webdriver":false}',
        };
        mockAntiBotService.prepareVerificationHeaders.and.resolveTo(mockHeaders);

        component.onBiometricActionClick();
        await Promise.resolve();
        await Promise.resolve();

        expect(mockAntiBotService.prepareVerificationHeaders).toHaveBeenCalledWith("proj_test_123");
        expect(component.antiBotHeaders).toEqual(mockHeaders);
        expect(sessionStorage.getItem("verifik_antibot_headers_proj_test_123")).toBe(
            JSON.stringify(mockHeaders)
        );
        expect(mockRouter.navigate).toHaveBeenCalledWith(
            ["/sign-in", "proj_test_123", "human-id"],
            { queryParams: { identifier: "user@example.com", direct: "selfie" } }
        );
    });

    it("still navigates to human-id when AntiBotChallengeService.prepareVerificationHeaders rejects", async () => {
        mockAntiBotService.prepareVerificationHeaders.and.rejectWith(new Error("Challenge unavailable"));

        component.onBiometricActionClick();
        await Promise.resolve();
        await Promise.resolve();

        expect(mockAntiBotService.prepareVerificationHeaders).toHaveBeenCalledWith("proj_test_123");
        expect(component.antiBotHeaders).toBeNull();
        expect(mockRouter.navigate).toHaveBeenCalledWith(
            ["/sign-in", "proj_test_123", "human-id"],
            { queryParams: { identifier: "user@example.com", direct: "selfie" } }
        );
    });
});
