import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { TranslocoModule } from "@ngneat/transloco";

import { VerifyBusinessSessionService } from "../verify-business-session.service";
import { CorporateDocument, CorporateDocumentCategory } from "../verify-business.types";
import { COUNTRY_JURISDICTIONS, canProceedFromDocuments } from "../verify-business-flow";

export interface DocumentSlotConfig {
	slotKey: string;
	category: CorporateDocumentCategory;
	documentType?: string;
	promptTemplateId?: string;
	titleKey: string;
	fallbackTitle: string;
	descriptionKey: string;
	fallbackDescription: string;
	required: boolean;
	ocrFields?: string[];
	icon: "incorporation" | "tax" | "bank" | "file";
}

const COUNTRY_DEFAULT_SLOTS: Record<string, DocumentSlotConfig[]> = {
	CO: [
		{
			slotKey: "CAMCOM_CO",
			category: "business_document",
			documentType: "CAMCOM_CO",
			titleKey: "verifyBusiness.slotBusinessTitle",
			fallbackTitle: "Certificado de Existencia y Representación Legal (Cámara de Comercio)",
			descriptionKey: "verifyBusiness.slotBusinessDesc",
			fallbackDescription: "Certificado expedido por la Cámara de Comercio con fecha no mayor a 90 días (PDF o imagen).",
			required: true,
			ocrFields: ["Razón Social", "NIT", "Matrícula Mercantil", "Representante Legal"],
			icon: "incorporation",
		},
		{
			slotKey: "RUT_CO",
			category: "tax_document",
			documentType: "RUT_CO",
			titleKey: "verifyBusiness.slotTaxTitle",
			fallbackTitle: "Registro Único Tributario (RUT)",
			descriptionKey: "verifyBusiness.slotTaxDesc",
			fallbackDescription: "Formulario oficial del Registro Único Tributario con NIT, actividad CIIU y estado activo.",
			required: true,
			ocrFields: ["Razón Social (Casilla 35)", "NIT (Casilla 5)", "DV (Casilla 6)", "CIIU (Casilla 46)"],
			icon: "tax",
		},
		{
			slotKey: "CERT_BANCO_CO",
			category: "bank_document",
			documentType: "CERT_BANCO_CO",
			titleKey: "verifyBusiness.slotBankTitle",
			fallbackTitle: "Certificación Bancaria Corporativa",
			descriptionKey: "verifyBusiness.slotBankDesc",
			fallbackDescription: "Certificación bancaria oficial a nombre de la empresa emitida en los últimos 90 días.",
			required: false,
			ocrFields: ["Titular", "NIT", "Entidad Financiera", "Número de Cuenta"],
			icon: "bank",
		},
	],
	MX: [
		{
			slotKey: "ACTA_CONST_MX",
			category: "business_document",
			documentType: "ACTA_CONST_MX",
			titleKey: "",
			fallbackTitle: "Acta Constitutiva y Poderes Notariales",
			descriptionKey: "",
			fallbackDescription: "Escritura pública constitutiva protocolizada ante Notario o Corredor Público con Folio Mercantil.",
			required: true,
			ocrFields: ["Denominación Social", "Escritura Pública", "Folio Mercantil (RPPC)", "Representante Legal"],
			icon: "incorporation",
		},
		{
			slotKey: "CSF_SAT_MX",
			category: "tax_document",
			documentType: "CSF_SAT_MX",
			titleKey: "",
			fallbackTitle: "Constancia de Situación Fiscal (RFC)",
			descriptionKey: "",
			fallbackDescription: "Constancia oficial vigente con Cédula de Identificación Fiscal (CIF), RFC y domicilio fiscal.",
			required: true,
			ocrFields: ["Razón Social", "RFC", "idCIF", "Régimen de Capital", "Código Postal"],
			icon: "tax",
		},
		{
			slotKey: "ESTADO_CUENTA_MX",
			category: "bank_document",
			documentType: "ESTADO_CUENTA_MX",
			titleKey: "",
			fallbackTitle: "Carátula / Estado de Cuenta Bancario (CLABE)",
			descriptionKey: "",
			fallbackDescription: "Carátula o estado de cuenta bancario corporativo con CLABE interbancaria de 18 dígitos.",
			required: false,
			ocrFields: ["Titular", "RFC", "Banco", "CLABE Interbancaria"],
			icon: "bank",
		},
	],
	US: [
		{
			slotKey: "ARTICLES_INC_US",
			category: "business_document",
			documentType: "ARTICLES_INC_US",
			titleKey: "",
			fallbackTitle: "Certificate of Incorporation / Articles of Organization",
			descriptionKey: "",
			fallbackDescription:
				"State-stamped formation document (Articles of Incorporation or Articles of Organization) or Certificate of Good Standing.",
			required: true,
			ocrFields: ["Legal Entity Name", "State File Number", "State of Formation", "Formation Date"],
			icon: "incorporation",
		},
		{
			slotKey: "IRS_EIN_W9_US",
			category: "tax_document",
			documentType: "IRS_EIN_W9_US",
			titleKey: "",
			fallbackTitle: "Form W-9 / EIN Confirmation Letter (CP 575)",
			descriptionKey: "",
			fallbackDescription: "Signed Form W-9 or official EIN assignment confirmation letter.",
			required: true,
			ocrFields: ["Legal Name", "EIN", "Federal Tax Classification", "Registered Address"],
			icon: "tax",
		},
		{
			slotKey: "BANK_LETTER_US",
			category: "bank_document",
			documentType: "BANK_LETTER_US",
			titleKey: "",
			fallbackTitle: "Corporate Bank Verification Letter / Statement",
			descriptionKey: "",
			fallbackDescription: "Official bank verification letter or recent corporate account statement.",
			required: false,
			ocrFields: ["Account Holder", "Bank Name", "ABA Routing Number", "Account Number"],
			icon: "bank",
		},
	],
};

@Component({
	selector: "business-documents-upload",
	standalone: true,
	imports: [CommonModule, TranslocoModule],
	templateUrl: "./business-documents-upload.component.html",
	styleUrls: ["./business-documents-upload.component.scss"],
})
export class BusinessDocumentsUploadComponent implements OnInit {
	@ViewChild("fileInput") fileInput?: ElementRef<HTMLInputElement>;

	activeSlotForUpload: DocumentSlotConfig | null = null;
	activeCategoryForUpload: CorporateDocumentCategory = "business_document";
	dragCategory: string | null = null;
	uploadProgress: Record<string, boolean> = {};

	slots: DocumentSlotConfig[] = [...COUNTRY_DEFAULT_SLOTS["CO"]];

	constructor(public session: VerifyBusinessSessionService) {}

	ngOnInit(): void {
		this.rebuildSlotsForCountry();
	}

	get currentCountryName(): string {
		const code = (this.session.company?.country || "CO").toUpperCase();
		const found = COUNTRY_JURISDICTIONS.find(
			(j) => j.code.toUpperCase() === code || j.countryKey?.toUpperCase() === code || j.name.toUpperCase() === code,
		);
		return found?.countryKey || found?.name || "Colombia";
	}

	rebuildSlotsForCountry(): void {
		const rawCode = (this.session.company?.country || "CO").toUpperCase();
		const foundJurisdiction = COUNTRY_JURISDICTIONS.find(
			(j) => j.code.toUpperCase() === rawCode || j.countryKey?.toUpperCase() === rawCode || j.name.toUpperCase() === rawCode,
		);
		const countryCode = foundJurisdiction?.code || "CO";
		const countryKey = foundJurisdiction?.countryKey || foundJurisdiction?.name || "Colombia";

		const flowDocTypes: any[] = Array.isArray(this.session.projectFlow?.business?.documentTypes)
			? this.session.projectFlow.business.documentTypes
			: [];

		const countryBlock =
			flowDocTypes.find(
				(dt) =>
					String(dt?.country || "").toLowerCase() === countryKey.toLowerCase() ||
					String(dt?.country || "").toLowerCase() === countryCode.toLowerCase() ||
					String(dt?.country || "").toLowerCase() === String(foundJurisdiction?.name || "").toLowerCase(),
			) || flowDocTypes.find((dt) => String(dt?.country || "") === "World");

		if (countryBlock && Array.isArray(countryBlock.configurations)) {
			const dynamicSlots: DocumentSlotConfig[] = [];
			for (const cfg of countryBlock.configurations) {
				if (!cfg?.active) continue;
				const cat = (cfg.documentCategory || "business_document") as CorporateDocumentCategory;
				const templates = Array.isArray(cfg.documentTemplates) ? cfg.documentTemplates : [];

				for (const entry of templates) {
					const pt = entry?.promptTemplate;
					if (!pt || typeof pt !== "object") continue;
					const dt = pt.documentType && typeof pt.documentType === "object" ? pt.documentType : null;
					const code = dt?.code || pt.documentTypes?.[0] || cat.toUpperCase();
					const name = dt?.name || pt.name || code;
					const fieldsList = Array.isArray(pt.fields) && pt.fields.length > 0 ? pt.fields : Array.isArray(dt?.fields) ? dt.fields : [];
					const fieldNames = fieldsList
						.slice(0, 5)
						.map((f: any) => f.name || f.mapKey)
						.filter(Boolean);

					dynamicSlots.push({
						slotKey: `${cat}:${code}`,
						category: cat,
						documentType: code,
						promptTemplateId: pt._id,
						titleKey: "",
						fallbackTitle: name,
						descriptionKey: "",
						fallbackDescription:
							pt.description ||
							(fieldNames.length > 0
								? `Extracción automática OCR: ${fieldNames.join(", ")}.`
								: "Adjunte el soporte oficial en formato PDF o imagen de alta resolución."),
						required: entry.required === "mandatory",
						ocrFields: fieldNames,
						icon: cat === "tax_document" ? "tax" : cat === "bank_document" ? "bank" : "incorporation",
					});
				}
			}

			if (dynamicSlots.length > 0) {
				this.slots = dynamicSlots;
				return;
			}
		}

		this.slots = [...(COUNTRY_DEFAULT_SLOTS[countryCode] || COUNTRY_DEFAULT_SLOTS["CO"])];
	}

	getDocumentsForSlot(slot: DocumentSlotConfig): CorporateDocument[] {
		return this.session.documents.filter((d) =>
			slot.documentType && d.documentType ? d.documentType === slot.documentType : d.category === slot.category,
		);
	}

	getDocumentsForCategory(category: CorporateDocumentCategory): CorporateDocument[] {
		return this.session.documents.filter((d) => d.category === category);
	}

	hasDocumentForSlot(slot: DocumentSlotConfig): boolean {
		return this.getDocumentsForSlot(slot).length > 0;
	}

	hasDocumentForCategory(category: CorporateDocumentCategory): boolean {
		return this.getDocumentsForCategory(category).length > 0;
	}

	canProceed(): boolean {
		return canProceedFromDocuments(this.session.documents, this.slots);
	}

	triggerUpload(categoryOrSlot: CorporateDocumentCategory | DocumentSlotConfig): void {
		if (typeof categoryOrSlot === "string") {
			this.activeCategoryForUpload = categoryOrSlot;
			this.activeSlotForUpload = this.slots.find((s) => s.category === categoryOrSlot) || null;
		} else {
			this.activeSlotForUpload = categoryOrSlot;
			this.activeCategoryForUpload = categoryOrSlot.category;
		}
		if (this.fileInput?.nativeElement) {
			this.fileInput.nativeElement.value = "";
			this.fileInput.nativeElement.click();
		}
	}

	onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			this._processFile(file, this.activeCategoryForUpload, this.activeSlotForUpload || undefined);
		}
	}

	onDragOver(event: DragEvent, categoryOrKey: string): void {
		event.preventDefault();
		event.stopPropagation();
		this.dragCategory = categoryOrKey;
	}

	onDragLeave(event: DragEvent): void {
		event.preventDefault();
		event.stopPropagation();
		this.dragCategory = null;
	}

	onFileDrop(event: DragEvent, categoryOrSlot: CorporateDocumentCategory | DocumentSlotConfig): void {
		event.preventDefault();
		event.stopPropagation();
		this.dragCategory = null;
		const file = event.dataTransfer?.files?.[0];
		if (file) {
			if (typeof categoryOrSlot === "string") {
				const slot = this.slots.find((s) => s.category === categoryOrSlot);
				this._processFile(file, categoryOrSlot, slot);
			} else {
				this._processFile(file, categoryOrSlot.category, categoryOrSlot);
			}
		}
	}

	private _processFile(file: File, category: CorporateDocumentCategory, slot?: DocumentSlotConfig): void {
		if (file.size > 25 * 1024 * 1024) {
			this.session.error = "El archivo seleccionado supera el límite máximo permitido de 25 MB.";
			return;
		}

		const progressKey = slot?.slotKey || category;
		this.uploadProgress[progressKey] = true;
		this.uploadProgress[category] = true;
		const reader = new FileReader();
		reader.onload = () => {
			const raw = String(reader.result || "");
			const base64 = raw.replace(/^data:.*;base64,/, "");

			this.session
				.uploadDocument(category, file, base64, {
					documentType: slot?.documentType,
					documentTypeName: slot?.fallbackTitle,
					promptTemplateId: slot?.promptTemplateId,
				})
				.subscribe({
					next: () => {
						this.uploadProgress[progressKey] = false;
						this.uploadProgress[category] = false;
					},
					error: () => {
						this.uploadProgress[progressKey] = false;
						this.uploadProgress[category] = false;
					},
				});
		};
		reader.readAsDataURL(file);
	}

	removeDoc(doc: CorporateDocument): void {
		const idx = this.session.documents.indexOf(doc);
		if (idx >= 0) {
			this.session.removeDocument(idx);
		}
	}

	formatFileSize(bytes?: number): string {
		if (!bytes) return "";
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	}

	next(): void {
		if (this.canProceed()) {
			this.session.goTo("representatives");
		}
	}

	back(): void {
		this.session.goTo("company");
	}
}
