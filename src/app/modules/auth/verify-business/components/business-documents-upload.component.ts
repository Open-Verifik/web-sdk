import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { Subject, takeUntil } from "rxjs";

import { VerifyBusinessSessionService } from "../verify-business-session.service";
import {
	CorporateDocument,
	CorporateDocumentCategory,
	MissingDocumentNote,
	RequestedDocument,
} from "../verify-business.types";
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

export const SIGNATORY_POA_SLOT: DocumentSlotConfig = {
	slotKey: "SIGNATORY_POA",
	category: "other",
	documentType: "SIGNATORY_POA",
	titleKey: "verifyBusiness.slotPoaTitle",
	fallbackTitle: "Power of Attorney / Signatory Authorization",
	descriptionKey: "verifyBusiness.slotPoaDesc",
	fallbackDescription:
		"Signed Power of Attorney or board resolution authorizing the signatory to act on behalf of the company.",
	required: true,
	icon: "file",
};

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
	WORLD: [
		{
			slotKey: "CERT_INC_WORLD",
			category: "business_document",
			documentType: "CERT_INC_WORLD",
			titleKey: "verifyBusiness.slotBusinessWorldTitle",
			fallbackTitle: "Certificate of Incorporation / Commercial Registry Extract",
			descriptionKey: "verifyBusiness.slotBusinessWorldDesc",
			fallbackDescription: "Official certificate of incorporation or good standing issued by the local corporate registry.",
			required: true,
			icon: "incorporation",
		},
		{
			slotKey: "TAX_CERT_WORLD",
			category: "tax_document",
			documentType: "TAX_CERT_WORLD",
			titleKey: "verifyBusiness.slotTaxWorldTitle",
			fallbackTitle: "Tax Registration Certificate (TIN / VAT)",
			descriptionKey: "verifyBusiness.slotTaxWorldDesc",
			fallbackDescription: "Official tax authority registration certificate showing legal name and tax identification number.",
			required: true,
			icon: "tax",
		},
		{
			slotKey: "BANK_LETTER_WORLD",
			category: "bank_document",
			documentType: "BANK_LETTER_WORLD",
			titleKey: "verifyBusiness.slotBankTitle",
			fallbackTitle: "Official Bank Account Certification",
			descriptionKey: "verifyBusiness.slotBankDesc",
			fallbackDescription: "Official bank letter or account certification issued in the company's name within the last 90 days.",
			required: false,
			icon: "bank",
		},
	],
};

@Component({
	selector: "business-documents-upload",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule],
	templateUrl: "./business-documents-upload.component.html",
	styleUrls: ["./business-documents-upload.component.scss"],
})
export class BusinessDocumentsUploadComponent implements OnInit, OnDestroy {
	@ViewChild("fileInput") fileInput?: ElementRef<HTMLInputElement>;

	activeSlotForUpload: DocumentSlotConfig | null = null;
	activeCategoryForUpload: CorporateDocumentCategory = "business_document";
	dragCategory: string | null = null;
	uploadProgress: Record<string, boolean> = {};

	slots: DocumentSlotConfig[] = [...COUNTRY_DEFAULT_SLOTS["CO"]];
	notListedOnRegistry = false;
	expandedNoteSlots: Record<string, boolean> = {};
	slotDraftReasons: Record<string, string> = {};
	slotDraftNotes: Record<string, string> = {};
	validationAnnouncement = "";

	readonly missingDocReasons = [
		{ value: "held_by_legal_finance", labelKey: "verifyBusiness.reasonHeldByLegalFinance", fallback: "Held by Legal / Finance team" },
		{ value: "pending_government_issuance", labelKey: "verifyBusiness.reasonPendingGov", fallback: "Pending government / registry issuance" },
		{ value: "engineer_onboarding_first", labelKey: "verifyBusiness.reasonEngineerFirst", fallback: "Technical integration in progress first" },
		{ value: "other", labelKey: "verifyBusiness.reasonOther", fallback: "Other reason" },
	];

	readonly signatoryPoaSlot: DocumentSlotConfig = SIGNATORY_POA_SLOT;
	private _destroy$ = new Subject<void>();

	constructor(
		public session: VerifyBusinessSessionService,
		private _el: ElementRef<HTMLElement>,
		private _transloco: TranslocoService,
	) {}

	ngOnInit(): void {
		this._syncDraftNotesFromSession();
		this.rebuildSlotsForCountry();
		this.session.changed.pipe(takeUntil(this._destroy$)).subscribe(() => {
			this._syncDraftNotesFromSession();
			this.rebuildSlotsForCountry();
		});
	}

	ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	private _syncDraftNotesFromSession(): void {
		for (const note of this.session.missingDocumentNotes || []) {
			const key = note.documentType || note.category;
			if (!key) continue;
			this.slotDraftReasons[key] = note.reason || "held_by_legal_finance";
			this.slotDraftNotes[key] = note.note || "";
			this.expandedNoteSlots[key] = true;
		}
	}

	get currentCountryName(): string {
		const code = (this.session.company?.country || "CO").toUpperCase();
		const found = COUNTRY_JURISDICTIONS.find(
			(j) => j.code.toUpperCase() === code || j.countryKey?.toUpperCase() === code || j.name.toUpperCase() === code,
		);
		return found?.countryKey || found?.name || "Colombia";
	}

	get unfulfilledRequestedDocs(): RequestedDocument[] {
		return (this.session.requestedDocuments || []).filter((d) => !d.fulfilledAt);
	}

	get rejectedActiveDocs(): CorporateDocument[] {
		return (this.session.documents || []).filter(
			(d) => !d.supersededAt && String(d.status || "").toUpperCase() === "REJECTED",
		);
	}

	get showChangesRequestedBanner(): boolean {
		return (
			String(this.session.dossierStatus || "").toUpperCase() === "CHANGES_REQUESTED" ||
			this.unfulfilledRequestedDocs.length > 0 ||
			this.rejectedActiveDocs.length > 0
		);
	}

	get showSignatoryPoaSlot(): boolean {
		const alreadyInMainSlots = this.slots.some((s) => s.documentType === "SIGNATORY_POA");
		if (alreadyInMainSlots) return false;
		const hasPoaDoc = this.getDocumentsForSlot(this.signatoryPoaSlot).length > 0;
		const requestedPoa = this.unfulfilledRequestedDocs.some((d) => d.documentType === "SIGNATORY_POA");
		return this.notListedOnRegistry || hasPoaDoc || requestedPoa;
	}

	get effectiveRequiredSlots(): DocumentSlotConfig[] {
		return this.showSignatoryPoaSlot ? [...this.slots, this.signatoryPoaSlot] : this.slots;
	}

	rebuildSlotsForCountry(): void {
		const hideBankForTier = Boolean(this.session.flowPolicy?.enableProgressiveTiers);

		if (Array.isArray(this.session.apiDocumentSlots) && this.session.apiDocumentSlots.length > 0) {
			const mapped: DocumentSlotConfig[] = [];
			for (const apiSlot of this.session.apiDocumentSlots) {
				if (hideBankForTier && apiSlot.category === "bank_document") continue;
				if (apiSlot.documentType === "SIGNATORY_POA" && apiSlot.conditional) continue;
				mapped.push({
					slotKey: apiSlot.slotKey || apiSlot.documentType || apiSlot.category,
					category: apiSlot.category || "business_document",
					documentType: apiSlot.documentType,
					promptTemplateId: apiSlot.promptTemplateId,
					titleKey: apiSlot.titleKey || "",
					fallbackTitle: apiSlot.title || apiSlot.documentType || apiSlot.category,
					descriptionKey: apiSlot.descriptionKey || "",
					fallbackDescription: apiSlot.description || "",
					required: Boolean(apiSlot.required),
					ocrFields: apiSlot.ocrFields,
					icon: apiSlot.icon || (apiSlot.category === "tax_document" ? "tax" : apiSlot.category === "bank_document" ? "bank" : "incorporation"),
				});
			}
			if (mapped.length > 0) {
				this.slots = mapped;
				this._autoEnablePoaIfPresent();
				return;
			}
		}

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
				if (hideBankForTier && cat === "bank_document") continue;
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
				this._autoEnablePoaIfPresent();
				return;
			}
		}

		const fallback = COUNTRY_DEFAULT_SLOTS[countryCode] || COUNTRY_DEFAULT_SLOTS["WORLD"] || COUNTRY_DEFAULT_SLOTS["CO"];
		this.slots = fallback.filter((s) => !(hideBankForTier && s.category === "bank_document"));
		this._autoEnablePoaIfPresent();
	}

	private _autoEnablePoaIfPresent(): void {
		const hasPoa = this.getDocumentsForSlot(this.signatoryPoaSlot).length > 0;
		const requestedPoa = this.unfulfilledRequestedDocs.some((d) => d.documentType === "SIGNATORY_POA");
		if (hasPoa || requestedPoa) {
			this.notListedOnRegistry = true;
		}
	}

	getDocumentsForSlot(slot: DocumentSlotConfig): CorporateDocument[] {
		return this.session.documents.filter((d) => {
			if (d.supersededAt) return false;
			return slot.documentType && d.documentType ? d.documentType === slot.documentType : d.category === slot.category;
		});
	}

	getDocumentsForCategory(category: CorporateDocumentCategory): CorporateDocument[] {
		return this.session.documents.filter((d) => !d.supersededAt && d.category === category);
	}

	hasDocumentForSlot(slot: DocumentSlotConfig): boolean {
		return this.getDocumentsForSlot(slot).some((d) => String(d.status || "").toUpperCase() !== "REJECTED");
	}

	isDocRejected(doc: CorporateDocument): boolean {
		return String(doc.status || "").toUpperCase() === "REJECTED";
	}

	isDocApproved(doc: CorporateDocument): boolean {
		const st = String(doc.status || "").toUpperCase();
		return st === "APPROVED" || st === "VALIDATED" || st === "VERIFIED";
	}

	hasDocumentForCategory(category: CorporateDocumentCategory): boolean {
		return this.getDocumentsForCategory(category).some((d) => !this.isDocRejected(d));
	}

	slotNoteKey(slot: DocumentSlotConfig): string {
		return slot.documentType || slot.category;
	}

	isNoteExpanded(slot: DocumentSlotConfig): boolean {
		return Boolean(this.expandedNoteSlots[this.slotNoteKey(slot)]);
	}

	toggleSlotNote(slot: DocumentSlotConfig): void {
		const key = this.slotNoteKey(slot);
		const next = !this.expandedNoteSlots[key];
		this.expandedNoteSlots[key] = next;
		if (next) {
			if (!this.slotDraftReasons[key]) {
				this.slotDraftReasons[key] = "held_by_legal_finance";
			}
			this.syncSlotNoteToSession(slot);
		} else {
			this.session.missingDocumentNotes = this.session.missingDocumentNotes.filter(
				(n) => (n.documentType || n.category) !== key,
			);
			delete this.slotDraftNotes[key];
		}
	}

	syncSlotNoteToSession(slot: DocumentSlotConfig): void {
		const key = this.slotNoteKey(slot);
		const reason = this.slotDraftReasons[key] || "held_by_legal_finance";
		const note = (this.slotDraftNotes[key] || "").trim();
		const nextNotes: MissingDocumentNote[] = this.session.missingDocumentNotes.filter(
			(n) => (n.documentType || n.category) !== key,
		);
		nextNotes.push({
			category: slot.category,
			documentType: slot.documentType,
			reason,
			note,
			addedAt: new Date().toISOString(),
		});
		this.session.missingDocumentNotes = nextNotes;
	}

	canProceed(): boolean {
		return canProceedFromDocuments(this.session.documents, this.effectiveRequiredSlots, {
			allowPartialSubmissionWithNotes: this.session.flowPolicy?.allowPartialSubmissionWithNotes,
		});
	}

	triggerUpload(categoryOrSlot: CorporateDocumentCategory | DocumentSlotConfig): void {
		if (typeof categoryOrSlot === "string") {
			this.activeCategoryForUpload = categoryOrSlot;
			this.activeSlotForUpload = this.effectiveRequiredSlots.find((s) => s.category === categoryOrSlot) || null;
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
				const slot = this.effectiveRequiredSlots.find((s) => s.category === categoryOrSlot);
				this._processFile(file, categoryOrSlot, slot);
			} else {
				this._processFile(file, categoryOrSlot.category, categoryOrSlot);
			}
		}
	}

	private _processFile(file: File, category: CorporateDocumentCategory, slot?: DocumentSlotConfig): void {
		if (file.size > 25 * 1024 * 1024) {
			this.session.error =
				this._transloco.translate("verifyBusiness.fileTooLargeError") ||
				"El archivo seleccionado supera el límite máximo permitido de 25 MB.";
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
		if (this.session.busy) return;
		this.session.error = null;

		if (!this.canProceed()) {
			const msg =
				this._transloco.translate("verifyBusiness.errMissingRequiredDocs") ||
				"Please upload all required corporate documents before continuing.";
			this.session.error = msg;
			this.validationAnnouncement = "";
			setTimeout(() => {
				this.validationAnnouncement = msg;
				const firstMissingSlot = this.effectiveRequiredSlots.find((s) => s.required && !this.hasDocumentForSlot(s));
				if (firstMissingSlot) {
					const trigger = this._el.nativeElement.querySelector<HTMLElement>(
						`[data-slot-key="${firstMissingSlot.slotKey}"] .dropzone-trigger`,
					);
					trigger?.focus();
				}
			}, 0);
			return;
		}

		this.validationAnnouncement = "";
		const hasNotesToSave =
			this.session.flowPolicy?.allowPartialSubmissionWithNotes ||
			this.session.missingDocumentNotes.length > 0 ||
			Boolean(this.session.submissionNotes?.trim());

		if (hasNotesToSave) {
			this.session
				.saveDocumentNotes(this.session.missingDocumentNotes, this.session.submissionNotes)
				.subscribe((ok) => {
					if (ok) {
						this.session.goTo("representatives");
					}
				});
		} else {
			this.session.goTo("representatives");
		}
	}

	back(): void {
		this.session.goTo("company");
	}
}
