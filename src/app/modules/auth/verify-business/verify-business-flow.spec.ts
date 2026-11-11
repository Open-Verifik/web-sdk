import {
	COUNTRY_JURISDICTIONS,
	STEP_ORDER,
	STEP_SEGMENTS,
	calculateCheckDigit,
	canProceedFromCompany,
	canProceedFromDocuments,
	canProceedFromRepresentatives,
	canSubmitReview,
	isTerminalBusinessStatus,
	isUBOByOwnership,
	resolveResumeStep,
	stepIndex,
	validateCheckDigit,
} from "./verify-business-flow";
import {
	CompanyProfile,
	CompanyRepresentative,
	CorporateDocument,
} from "./verify-business.types";

const mockCompany = (overrides: Partial<CompanyProfile> = {}): CompanyProfile => ({
	legalName: "Acme Colombia S.A.S.",
	commercialName: "Acme",
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
	email: "compliance@acme.co",
	phone: "+573001234567",
	industry: "Technology",
	website: "https://acme.co",
	...overrides,
});

const mockDoc = (category: any, status: any = "uploaded", filename = "doc.pdf"): CorporateDocument => ({
	_id: "doc_" + Math.random().toString(36).substring(2, 9),
	category,
	filename,
	mimeType: "application/pdf",
	status,
	size: 1024 * 1024,
});

const mockRep = (overrides: Partial<CompanyRepresentative> = {}): CompanyRepresentative => ({
	firstName: "Carlos",
	lastName: "Gómez",
	role: "legal_representative",
	isUBO: true,
	ownershipPercentage: 35,
	documentType: "CC",
	documentNumber: "1020304050",
	email: "carlos@acme.co",
	phone: "+573001234567",
	kycStatus: "PENDING",
	...overrides,
});

describe("verify-business-flow", () => {
	describe("1. Colombian Modulus 11 Check Digit (DV)", () => {
		it("calculates correct check digit for well-known Colombian NITs", () => {
			// NIT 901234567 -> DV 7
			const dv1 = calculateCheckDigit("901234567");
			expect(dv1).toBe("7");

			// NIT 800197268 -> DV 4 (Bancolombia)
			const dv2 = calculateCheckDigit("800197268");
			expect(dv2).toBe("4");

			// NIT 860002964 -> DV 4 (Banco de Bogotá)
			const dv3 = calculateCheckDigit("860002964");
			expect(dv3).toBe("4");
		});

		it("handles formatted NITs with dots or dashes seamlessly", () => {
			expect(calculateCheckDigit("901.234.567")).toBe("7");
			expect(calculateCheckDigit("800.197.268-4")).toBe("4");
		});

		it("returns empty string for empty or non-numeric input", () => {
			expect(calculateCheckDigit("")).toBe("");
			expect(calculateCheckDigit("   ")).toBe("");
			expect(calculateCheckDigit("abc")).toBe("");
		});

		it("validates check digit correctly", () => {
			expect(validateCheckDigit("901234567", "7")).toBe(true);
			expect(validateCheckDigit("901234567", "5")).toBe(false);
			expect(validateCheckDigit("", "0")).toBe(false);
		});
	});

	describe("2. Ultimate Beneficial Owner (UBO) Threshold", () => {
		it("correctly identifies equity >= 25.0% as UBO", () => {
			expect(isUBOByOwnership(25.0)).toBe(true);
			expect(isUBOByOwnership(25.1)).toBe(true);
			expect(isUBOByOwnership(50.0)).toBe(true);
			expect(isUBOByOwnership(100.0)).toBe(true);
		});

		it("strictly rejects equity below 25.0% as automatic UBO", () => {
			expect(isUBOByOwnership(24.99)).toBe(false);
			expect(isUBOByOwnership(15.0)).toBe(false);
			expect(isUBOByOwnership(0)).toBe(false);
			expect(isUBOByOwnership(-5)).toBe(false);
		});
	});

	describe("3. Step Index and Order", () => {
		it("maps screens to correct zero-based step indices", () => {
			expect(stepIndex("company")).toBe(0);
			expect(stepIndex("documents")).toBe(1);
			expect(stepIndex("representatives")).toBe(2);
			expect(stepIndex("review")).toBe(3);
			expect(stepIndex("submitted")).toBe(4);
			expect(stepIndex("loading")).toBe(0);
			expect(stepIndex("error")).toBe(0);
		});

		it("maintains 4 primary visible steps in STEP_SEGMENTS", () => {
			expect(STEP_SEGMENTS.length).toBe(4);
			expect(STEP_SEGMENTS[0].id).toBe("company");
			expect(STEP_SEGMENTS[1].id).toBe("documents");
			expect(STEP_SEGMENTS[2].id).toBe("representatives");
			expect(STEP_SEGMENTS[3].id).toBe("review");
		});

		it("has 5 steps in complete STEP_ORDER", () => {
			expect(STEP_ORDER).toEqual(["company", "documents", "representatives", "review", "submitted"]);
		});
	});

	describe("4. Step 1: Company Profile Validation", () => {
		it("allows valid company profiles to proceed", () => {
			const profile = mockCompany();
			expect(canProceedFromCompany(profile)).toBe(true);
		});

		it("rejects company profile with missing or too short legalName", () => {
			expect(canProceedFromCompany(mockCompany({ legalName: "" }))).toBe(false);
			expect(canProceedFromCompany(mockCompany({ legalName: "A" }))).toBe(false);
		});

		it("rejects company profile with invalid email", () => {
			expect(canProceedFromCompany(mockCompany({ email: "invalid-email" }))).toBe(false);
			expect(canProceedFromCompany(mockCompany({ email: "user@" }))).toBe(false);
		});

		it("rejects company profile with phone containing fewer than 7 digits", () => {
			expect(canProceedFromCompany(mockCompany({ phone: "123" }))).toBe(false);
		});

		it("rejects company profile with missing street address or city", () => {
			expect(canProceedFromCompany(mockCompany({ address: { ...mockCompany().address, street: "" } }))).toBe(false);
			expect(canProceedFromCompany(mockCompany({ address: { ...mockCompany().address, city: "" } }))).toBe(false);
		});
	});

	describe("5. Step 2: Corporate Document Collection Validation", () => {
		it("allows proceeding when both business existence and tax documents are uploaded", () => {
			const docs = [
				mockDoc("business_document", "uploaded", "camara_de_comercio.pdf"),
				mockDoc("tax_document", "uploaded", "rut.pdf"),
			];
			expect(canProceedFromDocuments(docs)).toBe(true);
		});

		it("allows proceeding with optional bank document included", () => {
			const docs = [
				mockDoc("business_document", "uploaded", "camara.pdf"),
				mockDoc("tax_document", "uploaded", "rut.pdf"),
				mockDoc("bank_document", "uploaded", "cert_bancaria.pdf"),
			];
			expect(canProceedFromDocuments(docs)).toBe(true);
		});

		it("rejects progression if business existence certificate is missing", () => {
			const docs = [mockDoc("tax_document", "uploaded", "rut.pdf")];
			expect(canProceedFromDocuments(docs)).toBe(false);
		});

		it("rejects progression if tax document is missing", () => {
			const docs = [mockDoc("business_document", "uploaded", "camara.pdf")];
			expect(canProceedFromDocuments(docs)).toBe(false);
		});

		it("ignores rejected documents", () => {
			const docs = [
				mockDoc("business_document", "rejected", "camara_expirada.pdf"),
				mockDoc("tax_document", "uploaded", "rut.pdf"),
			];
			expect(canProceedFromDocuments(docs)).toBe(false);
		});
	});

	describe("6. Step 3: Representatives and UBOs Validation", () => {
		it("allows proceeding with valid representatives and total equity <= 100%", () => {
			const reps = [
				mockRep({ ownershipPercentage: 60 }),
				mockRep({ firstName: "Ana", lastName: "Perez", ownershipPercentage: 40 }),
			];
			expect(canProceedFromRepresentatives(reps)).toBe(true);
		});

		it("rejects empty representatives array", () => {
			expect(canProceedFromRepresentatives([])).toBe(false);
		});

		it("rejects representatives when total ownership exceeds 100%", () => {
			const reps = [
				mockRep({ ownershipPercentage: 70 }),
				mockRep({ firstName: "Lucia", lastName: "Torres", ownershipPercentage: 45 }),
			];
			expect(canProceedFromRepresentatives(reps)).toBe(false);
		});

		it("rejects representatives with missing required personal info", () => {
			const reps = [mockRep({ firstName: "", documentNumber: "" })];
			expect(canProceedFromRepresentatives(reps)).toBe(false);
		});
	});

	describe("7. Step 5: Review & Attestation Submission", () => {
		it("permits submission only when legalAttestation is explicitly true", () => {
			expect(canSubmitReview(true)).toBe(true);
			expect(canSubmitReview(false)).toBe(false);
			expect(canSubmitReview(undefined as any)).toBe(false);
		});
	});

	describe("8. State Machine & Resume Step Resolution", () => {
		it("resolves resume step based on backend currentStep", () => {
			expect(resolveResumeStep("company")).toBe("company");
			expect(resolveResumeStep("documents")).toBe("documents");
			expect(resolveResumeStep("corporate_documents")).toBe("documents");
			expect(resolveResumeStep("representatives")).toBe("representatives");
			expect(resolveResumeStep("review")).toBe("review");
			expect(resolveResumeStep("submitted")).toBe("submitted");
		});

		it("routes to submitted screen if dossier has reached a terminal status", () => {
			expect(resolveResumeStep("company", "COMPLETED")).toBe("submitted");
			expect(resolveResumeStep("documents", "NEEDS_MANUAL_VERIFICATION")).toBe("submitted");
			expect(resolveResumeStep("representatives", "APPROVED")).toBe("submitted");
			expect(resolveResumeStep("review", "EXPIRED")).toBe("submitted");
		});

		it("accurately identifies terminal business statuses", () => {
			expect(isTerminalBusinessStatus("COMPLETED")).toBe(true);
			expect(isTerminalBusinessStatus("FAILED")).toBe(true);
			expect(isTerminalBusinessStatus("APPROVED")).toBe(true);
			expect(isTerminalBusinessStatus("REJECTED")).toBe(true);
			expect(isTerminalBusinessStatus("STARTED")).toBe(false);
			expect(isTerminalBusinessStatus("IN_PROGRESS")).toBe(false);
		});
	});

	describe("9. Country Jurisdictions Configuration", () => {
		it("contains Colombia, US, Mexico, Chile, Peru, and Brazil", () => {
			const codes = COUNTRY_JURISDICTIONS.map((j) => j.code);
			expect(codes).toContain("CO");
			expect(codes).toContain("US");
			expect(codes).toContain("MX");
			expect(codes).toContain("CL");
			expect(codes).toContain("PE");
			expect(codes).toContain("BR");
		});

		it("configures SAS and SA for Colombia", () => {
			const co = COUNTRY_JURISDICTIONS.find((j) => j.code === "CO");
			expect(co).toBeDefined();
			expect(co?.hasCheckDigit).toBe(true);
			const coTypes = co?.entityTypes.map((e) => e.value);
			expect(coTypes).toContain("SAS");
			expect(coTypes).toContain("SA");
		});

		it("configures LLC and C_CORP for USA", () => {
			const us = COUNTRY_JURISDICTIONS.find((j) => j.code === "US");
			expect(us).toBeDefined();
			expect(us?.hasCheckDigit).toBe(false);
			const usTypes = us?.entityTypes.map((e) => e.value);
			expect(usTypes).toContain("LLC");
			expect(usTypes).toContain("C_CORP");
		});
	});
});
