import { BusinessScreen, BusinessStep, CompanyProfile, CorporateDocument, CompanyRepresentative, CountryJurisdiction } from "./verify-business.types";

/**
 * Colombian official tax ID Modulus 11 check digit weights.
 * Applied right-to-left from least significant digit.
 */
const MODULUS_11_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/**
 * Computes Colombian Modulus 11 verification digit (DV) for a given NIT.
 */
export function calculateCheckDigit(nit: string): string {
	if (!nit) return "";
	const base = nit.includes("-") ? nit.split("-")[0] : nit;
	let clean = base.replace(/\D/g, "");
	if (!clean.length) return "";
	if (clean.length === 10 && (clean.startsWith("8") || clean.startsWith("9"))) {
		clean = clean.slice(0, 9);
	}

	let total = 0;
	for (let i = 0; i < clean.length; i++) {
		const digit = parseInt(clean[clean.length - 1 - i], 10);
		const weight = MODULUS_11_WEIGHTS[i] || 3;
		total += digit * weight;
	}

	const remainder = total % 11;
	if (remainder === 0) return "0";
	if (remainder === 1) return "1";
	return String(11 - remainder);
}

/**
 * Validates whether the given NIT and Check Digit match Modulus 11 calculation.
 */
export function validateCheckDigit(nit: string, dv: string): boolean {
	if (!nit || dv === undefined || dv === null || dv === "") return false;
	const expected = calculateCheckDigit(nit);
	return expected === String(dv).trim();
}

/**
 * Determines whether a stakeholder qualifies as an Ultimate Beneficial Owner (UBO)
 * based on the standard statutory threshold of 25.0% or more equity/voting rights.
 */
export function isUBOByOwnership(percentage: number): boolean {
	return typeof percentage === "number" && percentage >= 25.0;
}

/**
 * Supported jurisdictions with their entity types and tax ID formats.
 */
export const COUNTRY_JURISDICTIONS: CountryJurisdiction[] = [
	{
		code: "CO",
		name: "Colombia",
		countryKey: "Colombia",
		taxIdLabel: "NIT (Número de Identificación Tributaria)",
		taxIdMask: "900.000.000-0",
		hasCheckDigit: true,
		entityTypes: [
			{ value: "SAS", label: "S.A.S. - Sociedad por Acciones Simplificada" },
			{ value: "SA", label: "S.A. - Sociedad Anónima" },
			{ value: "LTDA", label: "Ltda. - Sociedad de Responsabilidad Limitada" },
			{ value: "EU", label: "Empresa Unipersonal" },
			{ value: "SUCURSAL", label: "Sucursal de Sociedad Extranjera" },
			{ value: "PERSONA_NATURAL", label: "Persona Natural Comerciante" },
			{ value: "OTRO", label: "Otra Forma Jurídica" },
		],
	},
	{
		code: "US",
		name: "United States",
		countryKey: "United States",
		taxIdLabel: "EIN / Tax ID (Employer Identification Number)",
		taxIdMask: "00-0000000",
		hasCheckDigit: false,
		entityTypes: [
			{ value: "LLC", label: "Limited Liability Company (LLC)" },
			{ value: "C_CORP", label: "C-Corporation" },
			{ value: "S_CORP", label: "S-Corporation" },
			{ value: "PARTNERSHIP", label: "Partnership" },
			{ value: "SOLE_PROPRIETOR", label: "Sole Proprietorship" },
			{ value: "NON_PROFIT", label: "Non-Profit Corporation (501c3)" },
			{ value: "OTHER", label: "Other Entity Type" },
		],
	},
	{
		code: "MX",
		name: "México",
		countryKey: "Mexico",
		taxIdLabel: "RFC (Registro Federal de Contribuyentes)",
		taxIdMask: "AAA000000AAA",
		hasCheckDigit: false,
		entityTypes: [
			{ value: "SA_DE_CV", label: "S.A. de C.V." },
			{ value: "SAPI_DE_CV", label: "S.A.P.I. de C.V." },
			{ value: "S_DE_RL_DE_CV", label: "S. de R.L. de C.V." },
			{ value: "SAS", label: "S.A.S. (Sociedad por Acciones Simplificada)" },
			{ value: "PERSONA_FISICA", label: "Persona Física con Actividad Empresarial" },
			{ value: "OTRO", label: "Otra Persona Moral" },
		],
	},
	{
		code: "CL",
		name: "Chile",
		countryKey: "Chile",
		taxIdLabel: "RUT (Rol Único Tributario)",
		hasCheckDigit: true,
		entityTypes: [
			{ value: "SPA", label: "SpA - Sociedad por Acciones" },
			{ value: "SRL", label: "Sociedad de Responsabilidad Limitada" },
			{ value: "SA", label: "Sociedad Anónima" },
			{ value: "EIRL", label: "E.I.R.L. - Empresa Individual de Resp. Ltda." },
			{ value: "OTRO", label: "Otro Tipo Social" },
		],
	},
	{
		code: "PE",
		name: "Perú",
		countryKey: "Peru",
		taxIdLabel: "RUC (Registro Único de Contribuyentes)",
		hasCheckDigit: false,
		entityTypes: [
			{ value: "SAC", label: "S.A.C. - Sociedad Anónima Cerrada" },
			{ value: "SA", label: "S.A. - Sociedad Anónima" },
			{ value: "SRL", label: "S.R.L. - Sociedad Comercial de Resp. Ltda." },
			{ value: "EIRL", label: "E.I.R.L." },
			{ value: "OTRO", label: "Otro Tipo" },
		],
	},
	{
		code: "BR",
		name: "Brasil",
		countryKey: "Brazil",
		taxIdLabel: "CNPJ (Cadastro Nacional da Pessoa Jurídica)",
		hasCheckDigit: true,
		entityTypes: [
			{ value: "LTDA", label: "Sociedade Limitada (LTDA)" },
			{ value: "SA", label: "Sociedade Anônima (S/A)" },
			{ value: "EIRELI", label: "EIRELI" },
			{ value: "MEI", label: "Microempreendedor Individual (MEI)" },
			{ value: "OUTRO", label: "Outro" },
		],
	},
	{
		code: "PA",
		name: "Panamá",
		countryKey: "Panama",
		taxIdLabel: "RUC (Registro Único de Contribuyente)",
		hasCheckDigit: true,
		entityTypes: [
			{ value: "SA", label: "Sociedad Anónima (S.A.)" },
			{ value: "SRL", label: "Sociedad de Responsabilidad Limitada (S. de R.L.)" },
			{ value: "FUNDACION", label: "Fundación de Interés Privado" },
			{ value: "OTRO", label: "Otra Forma Jurídica" },
		],
	},
	{
		code: "CR",
		name: "Costa Rica",
		countryKey: "Costa Rica",
		taxIdLabel: "Cédula Jurídica (3-101 / 3-102)",
		hasCheckDigit: false,
		entityTypes: [
			{ value: "SA", label: "Sociedad Anónima (S.A.)" },
			{ value: "SRL", label: "Sociedad de Responsabilidad Limitada (Ltda.)" },
			{ value: "OTRO", label: "Otra Forma Jurídica" },
		],
	},
	{
		code: "ES",
		name: "España",
		countryKey: "Spain",
		taxIdLabel: "NIF / CIF Empresarial",
		hasCheckDigit: false,
		entityTypes: [
			{ value: "SL", label: "Sociedad Limitada (S.L.)" },
			{ value: "SA", label: "Sociedad Anónima (S.A.)" },
			{ value: "SLU", label: "Sociedad Limitada Unipersonal (S.L.U.)" },
			{ value: "OTRO", label: "Otra Forma Jurídica" },
		],
	},
	{
		code: "CA",
		name: "Canada",
		countryKey: "Canada",
		taxIdLabel: "BN (9-Digit Business Number)",
		hasCheckDigit: false,
		entityTypes: [
			{ value: "CORP", label: "Corporation (Inc. / Ltd. / Corp.)" },
			{ value: "LP", label: "Limited Partnership (LP)" },
			{ value: "SOLE_PROPRIETOR", label: "Sole Proprietorship" },
			{ value: "OTHER", label: "Other Entity Type" },
		],
	},
];

export const STEP_ORDER: BusinessStep[] = ["company", "documents", "representatives", "review", "submitted"];

export interface StepSegment {
	id: BusinessStep;
	number: number;
	labelKey: string;
	fallbackLabel: string;
}

export const STEP_SEGMENTS: StepSegment[] = [
	{ id: "company", number: 1, labelKey: "verifyBusiness.stepCompany", fallbackLabel: "Company Profile" },
	{ id: "documents", number: 2, labelKey: "verifyBusiness.stepDocs", fallbackLabel: "Documents" },
	{ id: "representatives", number: 3, labelKey: "verifyBusiness.stepMembers", fallbackLabel: "Members & UBOs" },
	{ id: "review", number: 4, labelKey: "verifyBusiness.stepReview", fallbackLabel: "Review & Submit" },
];

export function stepIndex(screen: BusinessScreen): number {
	switch (screen) {
		case "company":
			return 0;
		case "documents":
			return 1;
		case "representatives":
			return 2;
		case "review":
			return 3;
		case "submitted":
			return 4;
		default:
			return 0;
	}
}

const TERMINAL_STATUSES = new Set([
	"COMPLETED",
	"FAILED",
	"COMPLETED_WITHOUT_REPRESENTATIVES",
	"NEEDS_MANUAL_VERIFICATION",
	"APPROVED",
	"REJECTED",
	"EXPIRED",
]);

export function isTerminalBusinessStatus(status?: string): boolean {
	return TERMINAL_STATUSES.has(status || "");
}

/**
 * Validates Step 1: Company Profile inputs.
 */
export function canProceedFromCompany(profile: Partial<CompanyProfile>): boolean {
	if (!profile) return false;
	const legalNameOk = Boolean(profile.legalName && profile.legalName.trim().length >= 2);
	const taxIdOk = Boolean(profile.taxId && profile.taxId.trim().length >= 4);
	const countryOk = Boolean(profile.country && profile.country.trim().length >= 2);
	const entityTypeOk = Boolean(profile.entityType && profile.entityType.trim().length >= 1);
	const emailOk = Boolean(profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()));
	const phoneOk = Boolean(profile.phone && profile.phone.replace(/\D/g, "").length >= 7);

	const streetOk = Boolean(profile.address?.street && profile.address.street.trim().length >= 3);
	const cityOk = Boolean(profile.address?.city && profile.address.city.trim().length >= 2);

	return legalNameOk && taxIdOk && countryOk && entityTypeOk && emailOk && phoneOk && streetOk && cityOk;
}

/**
 * Validates Step 2: Corporate Document Collection.
 * Requires at least a business existence certificate and a tax document.
 */
export function canProceedFromDocuments(
	docs: CorporateDocument[],
	requiredSlots?: Array<{ category: string; documentType?: string; required: boolean }>,
): boolean {
	if (!Array.isArray(docs) || docs.length === 0) return false;
	if (Array.isArray(requiredSlots) && requiredSlots.length > 0) {
		const mandatory = requiredSlots.filter((s) => s.required);
		if (mandatory.length === 0) return docs.some((d) => d.status !== "rejected");
		return mandatory.every((slot) =>
			docs.some(
				(d) =>
					d.status !== "rejected" &&
					(slot.documentType ? d.documentType === slot.documentType || d.category === slot.category : d.category === slot.category),
			),
		);
	}
	const hasBusinessDoc = docs.some((d) => d.category === "business_document" && d.status !== "rejected");
	const hasTaxDoc = docs.some((d) => d.category === "tax_document" && d.status !== "rejected");
	return hasBusinessDoc && hasTaxDoc;
}

/**
 * Validates Step 3: Beneficial Ownership & Legal Representatives.
 * Requires at least 1 legal representative or beneficial owner, and total ownership <= 100%.
 */
export function canProceedFromRepresentatives(reps: CompanyRepresentative[]): boolean {
	if (!Array.isArray(reps) || reps.length === 0) return false;
	const hasRep = reps.some((r) => r.firstName?.trim() && r.lastName?.trim() && r.documentNumber?.trim() && r.role);
	const totalOwnership = reps.reduce((sum, r) => sum + (Number(r.ownershipPercentage) || 0), 0);
	return hasRep && totalOwnership <= 100;
}

/**
 * Validates Step 5: Submission requirement (legal declaration checked).
 */
export function canSubmitReview(legalAttestation: boolean): boolean {
	return legalAttestation === true;
}

/**
 * Resolves which screen to resume when a session is loaded from backend.
 */
export function resolveResumeStep(currentStep?: string, status?: string): BusinessScreen {
	if (isTerminalBusinessStatus(status)) return "submitted";
	switch (currentStep) {
		case "documents":
		case "corporate_documents":
			return "documents";
		case "representatives":
		case "members":
			return "representatives";
		case "review":
		case "attestation":
			return "review";
		case "submitted":
		case "completed":
		case "end":
			return "submitted";
		case "company":
		case "company_profile":
		default:
			return "company";
	}
}
