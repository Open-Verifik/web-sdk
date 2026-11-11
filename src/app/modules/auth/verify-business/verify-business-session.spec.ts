import { of } from "rxjs";
import { VerifyBusinessSessionService } from "./verify-business-session.service";
import { CompanyProfile, CompanyRepresentative, CorporateDocument } from "./verify-business.types";
import { resolveVerifyStyle } from "../verify/verify-style";

describe("VerifyBusinessSessionService", () => {
	let service: VerifyBusinessSessionService;
	let mockHttp: any;
	let mockPasswordless: any;
	let mockRouter: any;
	let mockTransloco: any;

	beforeEach(() => {
		mockHttp = {
			get: () => of({ success: true, data: {} }),
			post: () => of({ success: true, data: {} }),
			patch: () => of({ success: true, data: {} }),
		};
		mockPasswordless = {
			requestProject: () => of({ data: { name: "Test Project" }, planCode: "pro" }),
		};
		mockRouter = {
			navigate: () => Promise.resolve(true),
		};
		mockTransloco = {
			getActiveLang: () => "es",
			getAvailableLangs: () => ["es", "en"],
			setActiveLang: () => {},
		};

		service = new VerifyBusinessSessionService(
			mockHttp,
			mockPasswordless,
			mockRouter,
			mockTransloco
		);
	});

	afterEach(() => {
		service.ngOnDestroy();
	});

	describe("1. Initial State & Defaults", () => {
		it("initializes with loading screen and empty dossier", () => {
			expect(service.screen).toBe("loading");
			expect(service.company.country).toBe("CO");
			expect(service.documents.length).toBe(0);
			expect(service.representatives.length).toBe(0);
			expect(service.legalAttestation).toBe(false);
			expect(service.kycModalOpen).toBe(false);
		});
	});

	describe("2. Navigation & History Stack", () => {
		it("navigates forward and tracks screen history", () => {
			service.screen = "company";
			service.goTo("documents");
			expect(service.screen).toBe("documents");
			expect(service.history).toEqual(["company"]);

			service.goTo("representatives");
			expect(service.screen).toBe("representatives");
			expect(service.history).toEqual(["company", "documents"]);
		});

		it("pops previous screen upon calling back()", () => {
			service.screen = "company";
			service.goTo("documents");
			service.goTo("representatives");

			service.back();
			expect(service.screen).toBe("documents");
			expect(service.history).toEqual(["company"]);

			service.back();
			expect(service.screen).toBe("company");
			expect(service.history.length).toBe(0);
		});
	});

	describe("3. Step Validation Predicates", () => {
		it("correctly evaluates canProceedFromStep for each stage", () => {
			// Initially company profile is empty -> false
			expect(service.canProceedFromStep("company")).toBe(false);

			// Fill company profile
			service.company = {
				legalName: "Inversiones Demo S.A.S.",
				commercialName: "Demo",
				taxId: "901234567",
				checkDigit: "7",
				country: "CO",
				entityType: "SAS",
				address: {
					street: "Calle 100 # 15-20",
					city: "Bogotá",
					state: "Cundinamarca",
					postalCode: "110111",
					country: "CO",
				},
				email: "info@demo.co",
				phone: "+573001234567",
			};
			expect(service.canProceedFromStep("company")).toBe(true);

			// Step 2: Documents initially empty -> false
			expect(service.canProceedFromStep("documents")).toBe(false);

			// Upload required documents
			service.documents.push(
				{ category: "business_document", filename: "camara.pdf", mimeType: "application/pdf" },
				{ category: "tax_document", filename: "rut.pdf", mimeType: "application/pdf" }
			);
			expect(service.canProceedFromStep("documents")).toBe(true);

			// Step 3: Representatives initially empty -> false
			expect(service.canProceedFromStep("representatives")).toBe(false);

			// Add valid legal rep
			service.representatives.push({
				firstName: "Carlos",
				lastName: "Gómez",
				role: "legal_representative",
				isUBO: true,
				ownershipPercentage: 40,
				documentType: "CC",
				documentNumber: "1020304050",
				email: "carlos@demo.co",
				phone: "+573001234567",
			});
			expect(service.canProceedFromStep("representatives")).toBe(true);

			// Step 4: Review attestation initially unchecked -> false
			expect(service.canProceedFromStep("review")).toBe(false);
			service.legalAttestation = true;
			expect(service.canProceedFromStep("review")).toBe(true);
		});
	});

	describe("4. Document and Representative Mutators", () => {
		it("removes documents by index", () => {
			service.documents = [
				{ category: "business_document", filename: "doc1.pdf", mimeType: "application/pdf" },
				{ category: "tax_document", filename: "doc2.pdf", mimeType: "application/pdf" },
			];
			service.removeDocument(0);
			expect(service.documents.length).toBe(1);
			expect(service.documents[0].filename).toBe("doc2.pdf");
		});

		it("removes representatives by index", () => {
			service.representatives = [
				{
					firstName: "A",
					lastName: "B",
					role: "legal_representative",
					isUBO: false,
					ownershipPercentage: 10,
					documentType: "CC",
					documentNumber: "1",
					email: "a@b.co",
					phone: "123",
				},
				{
					firstName: "C",
					lastName: "D",
					role: "beneficial_owner",
					isUBO: true,
					ownershipPercentage: 30,
					documentType: "CC",
					documentNumber: "2",
					email: "c@d.co",
					phone: "456",
				},
			];
			service.removeRepresentative(0);
			expect(service.representatives.length).toBe(1);
			expect(service.representatives[0].firstName).toBe("C");
		});
	});

	describe("5. KYC Modal Lifecycle", () => {
		it("opens and closes biometric verification modal for representative", () => {
			const rep: CompanyRepresentative = {
				firstName: "Maria",
				lastName: "Torres",
				role: "legal_representative",
				isUBO: false,
				ownershipPercentage: 20,
				documentType: "CC",
				documentNumber: "52000111",
				email: "maria@demo.co",
				phone: "+573101234567",
			};

			service.openKycModal(rep);
			expect(service.kycModalOpen).toBe(true);
			expect(service.activeRepForKyc).toEqual(rep);

			service.closeKycModal();
			expect(service.kycModalOpen).toBe(false);
			expect(service.activeRepForKyc).toBeNull();
		});
	});

	describe("6. Submission Flow", () => {
		it("transitions screen to submitted on submitRegistration", () => {
			service.submitRegistration().subscribe((ok) => {
				expect(ok).toBe(true);
				expect(service.screen).toBe("submitted");
				expect(service.submissionResult).toBeDefined();
			});
		});
	});

	describe("7. Visual Styles Parity (Styles A through F)", () => {
		it("resolves all styles a through f accurately", () => {
			expect(resolveVerifyStyle(null, "a", "v2")).toBe("a");
			expect(resolveVerifyStyle(null, "b", "v2")).toBe("b");
			expect(resolveVerifyStyle(null, "c", "v2")).toBe("c");
			expect(resolveVerifyStyle(null, "d", "v2")).toBe("d");
			expect(resolveVerifyStyle(null, "e", "v2")).toBe("e");
			expect(resolveVerifyStyle(null, "f", "v2")).toBe("f");
		});

		it("prioritizes preview style override over saved project verifyStyle", () => {
			expect(resolveVerifyStyle("f", "a", "v2")).toBe("f");
			expect(resolveVerifyStyle("d", "b", "v2")).toBe("d");
		});
	});
});
