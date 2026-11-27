import { of, throwError } from "rxjs";
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
		localStorage.clear();
		sessionStorage.clear();
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
		localStorage.clear();
		sessionStorage.clear();
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

	describe("8. P0-1 Session Hygiene & Fail-Closed Resumption", () => {
		const projectId = "proj-123";
		const storageKey = `verifik_business_token_${projectId}`;

		it("fails closed to error screen on explicit query token 401/404 without creating an anonymous session", () => {
			localStorage.setItem(storageKey, "stale-stored-token");
			sessionStorage.setItem(storageKey, "stale-stored-token");

			const postSpy = jasmine.createSpy("post").and.returnValue(of({ success: true, data: {} }));
			mockHttp.post = postSpy;
			mockHttp.get = jasmine
				.createSpy("get")
				.and.returnValue(throwError(() => ({ status: 401, error: { message: "Expired KYB link" } })));

			service.open(projectId, "explicit-expired-token");

			expect(mockHttp.get).toHaveBeenCalledWith(`${service.apiUrl}/v2/business-registrations/session/explicit-expired-token`);
			expect(postSpy).not.toHaveBeenCalled();
			expect(service.screen).toBe("error");
			expect(service.error).toBe("Expired KYB link");
			expect(service.token).toBeNull();
			expect(service.registrationId).toBe("");
			expect(service.showHeader).toBe(false);
			expect(localStorage.getItem(storageKey)).toBeNull();
			expect(sessionStorage.getItem(storageKey)).toBeNull();
		});

		it("uses default fallback error message on explicit query token 404 without backend message", () => {
			mockHttp.post = jasmine.createSpy("post");
			mockHttp.get = jasmine.createSpy("get").and.returnValue(throwError(() => ({ status: 404 })));

			service.open(projectId, "missing-token");

			expect(mockHttp.post).not.toHaveBeenCalled();
			expect(service.screen).toBe("error");
			expect(service.error).toBe(
				"Your verification session expired or is invalid. Please launch verification again from your account."
			);
			expect(service.token).toBeNull();
		});

		it("clears stale localStorage token on resume error and creates a new isolated session with forceNew: true", () => {
			localStorage.setItem(storageKey, "stale-local-token");
			sessionStorage.setItem(storageKey, "stale-local-token");

			mockHttp.get = jasmine.createSpy("get").and.returnValue(throwError(() => ({ status: 404 })));
			mockHttp.post = jasmine.createSpy("post").and.returnValue(
				of({
					success: true,
					data: {
						_id: "new-reg-1",
						token: "new-session-token",
						currentStep: "company",
						status: "IN_PROGRESS",
					},
				})
			);

			service.open(projectId);

			expect(mockHttp.get).toHaveBeenCalledWith(`${service.apiUrl}/v2/business-registrations/session/stale-local-token`);
			expect(mockHttp.post).toHaveBeenCalledWith(`${service.apiUrl}/v2/business-registrations`, {
				projectId,
				projectFlowId: service.projectFlow?._id,
				forceNew: true,
			});
			expect(service.screen).toBe("company");
			expect(service.token).toBe("new-session-token");
			expect(service.registrationId).toBe("new-reg-1");
			expect(localStorage.getItem(storageKey)).toBe("new-session-token");
		});

		it("starts a fresh isolated session with forceNew: true when no query or stored token exists", () => {
			mockHttp.get = jasmine.createSpy("get").and.returnValue(of({ success: true, data: {} }));
			mockHttp.post = jasmine.createSpy("post").and.returnValue(
				of({
					success: true,
					data: {
						_id: "fresh-reg-1",
						token: "fresh-token-1",
						currentStep: "company",
						status: "PENDING",
					},
				})
			);

			service.open(projectId);

			expect(mockHttp.get).not.toHaveBeenCalledWith(jasmine.stringMatching(/\/session\//));
			expect(mockHttp.post).toHaveBeenCalledWith(`${service.apiUrl}/v2/business-registrations`, {
				projectId,
				projectFlowId: service.projectFlow?._id,
				forceNew: true,
			});
			expect(service.screen).toBe("company");
			expect(service.token).toBe("fresh-token-1");
		});

		it("discards stale localStorage token pointing to a finished session and starts a fresh session with forceNew: true", () => {
			localStorage.setItem(storageKey, "completed-local-token");
			sessionStorage.setItem(storageKey, "completed-local-token");

			mockHttp.get = jasmine.createSpy("get").and.returnValue(
				of({
					success: true,
					data: {
						_id: "old-completed-reg",
						token: "completed-local-token",
						status: "COMPLETED",
						currentStep: "submitted",
						companyInfo: { legalName: "Old Corp", taxId: "900111222", email: "old@corp.co" },
					},
				})
			);
			mockHttp.post = jasmine.createSpy("post").and.returnValue(
				of({
					success: true,
					data: {
						_id: "fresh-reg-2",
						token: "fresh-token-2",
						currentStep: "company",
						status: "PENDING",
					},
				})
			);

			service.open(projectId);

			expect(mockHttp.post).toHaveBeenCalledWith(`${service.apiUrl}/v2/business-registrations`, {
				projectId,
				projectFlowId: service.projectFlow?._id,
				forceNew: true,
			});
			expect(service.screen).toBe("company");
			expect(service.token).toBe("fresh-token-2");
			expect(service.registrationId).toBe("fresh-reg-2");
			expect(service.company.legalName).toBe("");
			expect(localStorage.getItem(storageKey)).toBe("fresh-token-2");
		});

		it("applies dossier and transitions to submitted when explicit query token points to a COMPLETED session", () => {
			mockHttp.post = jasmine.createSpy("post");
			mockHttp.get = jasmine.createSpy("get").and.returnValue(
				of({
					success: true,
					data: {
						_id: "completed-reg-1",
						token: "explicit-completed-token",
						status: "COMPLETED",
						currentStep: "submitted",
						companyInfo: { legalName: "Completed Corp", taxId: "900999888", email: "done@corp.co" },
					},
				})
			);

			service.open(projectId, "explicit-completed-token");

			expect(mockHttp.post).not.toHaveBeenCalled();
			expect(service.screen).toBe("submitted");
			expect(service.registrationId).toBe("completed-reg-1");
			expect(service.company.legalName).toBe("Completed Corp");
			expect(service.token).toBe("explicit-completed-token");
		});
	});

	describe("9. Phase 2 Flow Policy, Document Notes & Progressive Tiers", () => {
		it("loads flowConfig and updates flowPolicy and apiDocumentSlots", () => {
			service.projectId = "proj-kyb-1";
			mockHttp.get = jasmine.createSpy("get").and.returnValue(
				of({
					success: true,
					data: {
						flowPolicy: {
							collectOwnershipPercentage: false,
							collectUboDeclaration: false,
							collectUseCase: true,
							allowPartialSubmissionWithNotes: true,
						},
						documentSlots: [
							{ category: "business_document", documentType: "CERT_INC_WORLD", required: true },
						],
					},
				}),
			);

			service.loadFlowConfig("WORLD");

			expect(mockHttp.get).toHaveBeenCalledWith(
				`${service.apiUrl}/v2/business-registrations/flow-config/proj-kyb-1?country=WORLD`,
			);
			expect(service.flowPolicy.collectOwnershipPercentage).toBe(false);
			expect(service.flowPolicy.collectUboDeclaration).toBe(false);
			expect(service.flowPolicy.collectUseCase).toBe(true);
			expect(service.flowPolicy.allowPartialSubmissionWithNotes).toBe(true);
			expect(service.apiDocumentSlots.length).toBe(1);
		});

		it("saves document notes via PATCH /document-notes", () => {
			service.registrationId = "reg-notes-1";
			service.token = "tok-notes-1";
			mockHttp.patch = jasmine.createSpy("patch").and.returnValue(of({ success: true, data: {} }));

			const notes = [
				{
					category: "tax_document",
					documentType: "TAX_CERT_WORLD",
					reason: "held_by_legal_finance",
					note: "Pending CFO signature",
				},
			];

			service.saveDocumentNotes(notes, "Will upload Friday").subscribe((ok) => {
				expect(ok).toBe(true);
			});

			expect(mockHttp.patch).toHaveBeenCalledWith(
				`${service.apiUrl}/v2/business-registrations/reg-notes-1/document-notes`,
				{ missingDocumentNotes: notes, submissionNotes: "Will upload Friday" },
				jasmine.any(Object),
			);
			expect(service.missingDocumentNotes.length).toBe(1);
			expect(service.submissionNotes).toBe("Will upload Friday");
		});

		it("handles 400 representative_kyc_required error on submitRegistration", () => {
			service.registrationId = "reg-sub-1";
			service.token = "tok-sub-1";
			mockHttp.post = jasmine.createSpy("post").and.returnValue(
				throwError(() => ({
					status: 400,
					error: { code: "representative_kyc_required", message: "representative_kyc_required" },
				})),
			);

			service.submitRegistration().subscribe((ok) => {
				expect(ok).toBe(false);
				expect(service.error).toContain("KYC");
			});
		});
	});
});
