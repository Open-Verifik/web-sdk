import { CommonModule, isPlatformBrowser, NgIf } from "@angular/common";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, TemplateRef, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import QRCode from "qrcode";
import { Subject, takeUntil } from "rxjs";

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { VerifikRadioGroupComponent } from "app/core/components/verifik-radio-group/verifik-radio-group.component";
import { VerifikRadioItemComponent } from "app/core/components/verifik-radio-item/verifik-radio-item.component";
import { PromptTemplate } from "app/core/models/prompt-template.model";
import { CountryOption, CountryService } from "app/core/services/country.service";
import { CoreValidators } from "app/core/validators/validators";
import { DemoService } from "app/modules/demo/demo.service";
import { VerifikMediaDisplayComponent } from "app/shared/components/verifik-media-display";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration, DocumentValidation, ImageScan } from "../../project";
import { DocumentCategory, EnrollDocumentMethod, EnrollSettings, SmartEnrollService } from "../smart-enroll.service";
import { SmartErrorDisplayComponent } from "../smart-error-display/smart-error-display.component";
import { SmartScannerDemoComponent } from "../smart-scanner/smart-scanner-demo.component";
import { SmartScannerMobileComponent } from "../smart-scanner/smart-scanner-mobile.component";
import { SmartScannerComponent } from "../smart-scanner/smart-scanner.component";
import { SmartUploadComponent } from "../smart-upload/smart-upload.component";
import { ApiErrorService } from "app/core/services/api-error.service";

@Component({
	animations: fuseAnimations,
	selector: "smart-documents",
	standalone: true,
	styleUrls: ["../smart-enroll.component.scss", "../../sign-up/sign-up.component.scss"],
	templateUrl: "./smart-documents.component.html",
	imports: [
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		LanguagesComponent,
		MatButtonModule,
		MatCardModule,
		MatDialogModule,
		MatDividerModule,
		MatIconModule,
		MatInputModule,
		MatListModule,
		MatSelectModule,
		NgIf,
		ReactiveFormsModule,
		SmartErrorDisplayComponent,
		SmartScannerComponent,
		SmartScannerDemoComponent,
		SmartScannerMobileComponent,
		SmartUploadComponent,
		MatTooltipModule,
		TranslocoModule,
		VerifikMediaDisplayComponent,
		VerifikRadioGroupComponent,
		VerifikRadioItemComponent,
	],
})
export class SmartDocumentsComponent implements AfterViewInit, OnDestroy, OnInit {
	@ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("qrCodeCanvas", { static: false }) public qrCodeCanvas: ElementRef<HTMLCanvasElement>;

	private _unsubscriber$ = new Subject<void>();

	appRegistration: AppRegistration;
	countries: CountryOption[];
	demoData: any;
	demoModeChoice: "own" | "demo" | "" = "";
	enrollSettings: EnrollSettings;
	errorContent: { message: string };
	errorResult: boolean;
	faceIdCard: string;
	formSubmitted: boolean = false;
	isVerifikProject: boolean = false;
	language: string;
	methodSelectionForm: FormGroup;
	project: Project;
	projectFlow: ProjectFlow;
	selectedReferenceDoc: any;
	successfulUploadSubject: Subject<void> = new Subject<void>();
	useDemoData: boolean = false;
	flagCodes = {
		en: "us",
		es: "es",
		br: "br",
		fr: "fr",
		it: "it",
		ru: "ru",
		kr: "kr",
		in: "in",
		cn: "cn",
		ph: "ph",
	};

	constructor(
		private _apiErrorService: ApiErrorService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countryService: CountryService,
		private _demoService: DemoService,
		private _formBuilder: FormBuilder,
		private _KYCService: KYCService,
		private _matDialog: MatDialog,
		private _passwordlessService: PasswordlessService,
		private _smartEnrollService: SmartEnrollService,
		private _translocoService: TranslocoService,
		@Inject(PLATFORM_ID) private platformId: Object
	) {
		this.appRegistration = this._KYCService.appRegistration;
		this.enrollSettings = this._smartEnrollService.enrollSettings;
		this.project = this._passwordlessService.currentProject;
		this.projectFlow = this._passwordlessService.currentProjectFlow;
		this.isVerifikProject = this._passwordlessService.isVerifikProject;

		this.countries = this.projectFlow ? this._countryService.findAllowedCountryOptions(this.projectFlow.allowedCountries()) : [];

		this._initForm();

		this.errorResult = this._smartEnrollService.store.document.remaining === 0;
		this.errorContent = { message: "" };

		// If front side is already uploaded, skip selection screen and go directly to upload component
		const frontAlreadyUploaded = !!this.appRegistration?.documentValidation?.url;
		if (frontAlreadyUploaded && this.enrollSettings.documentMethod) {
			this.formSubmitted = true;
		}

		this.demoData = this._demoService.getDemoData();
		this.demoModeChoice = this._demoService.demoModeChoice as "own" | "demo" | "";

		this.onDemoModeSelected(this.demoModeChoice);

		this._smartEnrollService.enrollSettings$.pipe(takeUntil(this._unsubscriber$)).subscribe({
			next: (enrollSettings) => this._onEnrollSettingsChange(enrollSettings),
		});
	}

	ngOnInit(): void {
		this._setLanguage();
	}

	ngAfterViewInit(): void {
		this._prepareQrCode();
	}

	ngOnDestroy(): void {
		this.successfulUploadSubject.complete();

		this._unsubscriber$.next();
		this._unsubscriber$.complete();
	}

	private _setLanguage(): void {
		if (!isPlatformBrowser(this.platformId)) {
			this.language = "en";
			return;
		}

		const savedLanguage = localStorage.getItem("currentLanguage");
		if (savedLanguage && this.flagCodes[savedLanguage]) {
			this.language = savedLanguage;
			this._translocoService.setActiveLang(savedLanguage);
		} else {
			let browserLang = navigator.language;
			if (browserLang.includes("-")) browserLang = browserLang.split("-")[0];
			this.language = this.flagCodes[browserLang] ? browserLang : "en";
			localStorage.setItem("currentLanguage", this.language);
			this._translocoService.setActiveLang(this.language);
		}
	}

	onLanguageChange(lang: string): void {
		if (!this.flagCodes[lang]) return;
		localStorage.setItem("currentLanguage", lang);
		this._translocoService.setActiveLang(lang);
	}

	private _createDocumentValidation(body: any) {
		this._smartEnrollService.setSkippedDocument(false);

		this._KYCService.createDocumentValidation(body).subscribe({
			next: (response) => {
				if (this._KYCService.appRegistration) {
					this._KYCService.appRegistration.documentValidation = response.data.documentValidation;
					this._KYCService.appRegistration.informationValidation =
						response.data.appRegistration?.informationValidation || this._KYCService.appRegistration.informationValidation;
				}

				this.appRegistration.documentValidation = response.data.documentValidation as DocumentValidation;
				this.appRegistration.informationValidation =
					response.data.appRegistration?.informationValidation || this.appRegistration.informationValidation;

				this._smartEnrollService.setDocumentMethodFromInputMethod(this.appRegistration?.documentValidation?.inputMethod);

				this.successfulUploadSubject.next();
			},
			error: (error) => this._handleError(error),
		});
	}

	private async _generateQRCode(canvas: HTMLCanvasElement, text: string) {
		try {
			await QRCode.toCanvas(canvas, text, { errorCorrectionLevel: "L" });
		} catch (err) {
			console.error(err);
		}
	}

	private _handleError(exception: any): void {
		if (exception?.error?.code === "PaymentRequired") {
			this._smartEnrollService.insufficientCreditsTrigger();

			return;
		}

		this._smartEnrollService.subtractAttempt("document");

		this.errorResult = true;

		const normalizedError = this._apiErrorService.normalize(exception);
		this.errorContent = this._translocoService.translate(normalizedError.userMessageKey);
	}

	private _initForm() {
		this.methodSelectionForm = this._formBuilder.group({
			country: [{ value: "", disabled: false }, [Validators.required]],
			documentCategory: [{ value: "", disabled: true }, [Validators.required]],
			documentMethod: ["", [Validators.required]],
			promptTemplate: [{ value: null, disabled: true }, [CoreValidators.requiredIfVersion3(this.projectFlow.version)]],
		});

		this._initializeFormValues();
		this._setFormSubscriptions();

		this._changeDetectorRef.markForCheck();
	}

	private _initializeFormValues(): void {
		const onboardSettingsDocument = this.projectFlow.onboardingSettings.document;

		// Step 1: Set documentMethod (always enabled)
		const documentMethod = this._getDocumentMethod(onboardSettingsDocument);
		this.methodSelectionForm.patchValue({ documentMethod }, { emitEvent: false });

		// Step 2: Set country (only if documentMethod is set)
		if (!documentMethod) {
			this.methodSelectionForm.patchValue({ country: "" }, { emitEvent: false });
			this.methodSelectionForm.get("country")?.disable({ emitEvent: false });
			return;
		}

		const country = this._getCountry();
		this.methodSelectionForm.patchValue({ country }, { emitEvent: false });
		this.methodSelectionForm.get("country")?.enable({ emitEvent: false });

		// Step 3: Set documentCategory (only if documentMethod AND country are set)
		if (!country) {
			this.methodSelectionForm.patchValue({ documentCategory: "" }, { emitEvent: false });
			this.methodSelectionForm.get("documentCategory")?.disable({ emitEvent: false });
			return;
		}

		const documentCategory = this._getDocumentCategory(onboardSettingsDocument);
		this.methodSelectionForm.patchValue({ documentCategory }, { emitEvent: false });
		this.methodSelectionForm.get("documentCategory")?.enable({ emitEvent: false });

		// Step 4: Set promptTemplate (only if documentMethod, country, AND documentCategory are set)
		if (!documentCategory) {
			this.methodSelectionForm.patchValue({ promptTemplate: null }, { emitEvent: false });
			this.methodSelectionForm.get("promptTemplate")?.disable({ emitEvent: false });
			return;
		}

		const promptTemplate = this._getPromptTemplate();
		this.methodSelectionForm.patchValue({ promptTemplate }, { emitEvent: false });
		this.methodSelectionForm.get("promptTemplate")?.enable({ emitEvent: false });
	}

	private _getDocumentMethod(onboardSettingsDocument: any): string {
		if (this.enrollSettings.documentMethod) return this.enrollSettings.documentMethod;

		const documentMethods = Object.keys(onboardSettingsDocument).filter((key) => ["uploadDocumentAllowed", "scanDocumentAllowed"].includes(key));

		if (documentMethods.length === 1) {
			switch (documentMethods[0]) {
				case "uploadDocumentAllowed":
					return "upload";
				case "scanDocumentAllowed":
					return "scan";
			}
		}

		return "";
	}

	private _getCountry(): string {
		if (this.countries.length === 1) return this.enrollSettings.country || this.countries[0].country || "";

		return this.enrollSettings.country || "";
	}

	private _getDocumentCategory(onboardSettingsDocument: any): string {
		if (this.enrollSettings.documentCategory) {
			return this.enrollSettings.documentCategory;
		}

		const documentCategories = Object.keys(onboardSettingsDocument).filter((key) =>
			["useLicense", "usePassport", "useGovernmentID"].includes(key)
		);

		if (documentCategories.length === 1) {
			switch (documentCategories[0]) {
				case "useLicense":
					return "driver-license";
				case "usePassport":
					return "passport";
				case "useGovernmentID":
					return "id";
			}
		}

		return "";
	}

	private _getPromptTemplate(): PromptTemplate | null {
		return this.enrollSettings.promptTemplate || null;
	}

	private _prepareQrCode(): void {
		const canvas = this.qrCodeCanvas.nativeElement;

		this._generateQRCode(canvas, window.location.href);
	}

	private _setFormSubscriptions() {
		this.methodSelectionForm.get("documentMethod")?.valueChanges.pipe(takeUntil(this._unsubscriber$)).subscribe(this._handleDocumentMethodChange);

		this.methodSelectionForm.get("country")?.valueChanges.pipe(takeUntil(this._unsubscriber$)).subscribe(this._handleCountryChange);

		this.methodSelectionForm
			.get("documentCategory")
			?.valueChanges.pipe(takeUntil(this._unsubscriber$))
			.subscribe(this._handleDocumentCategoryChange);
	}

	private _handleDocumentMethodChange = (documentMethodValue: string): void => {
		const countryControl = this.methodSelectionForm.get("country");
		const documentCategoryControl = this.methodSelectionForm.get("documentCategory");
		const promptTemplateControl = this.methodSelectionForm.get("promptTemplate");

		// If no method selected, clear and disable all subsequent fields
		if (!documentMethodValue) {
			countryControl?.setValue("", { emitEvent: false });
			countryControl?.disable({ emitEvent: false });

			documentCategoryControl?.setValue("", { emitEvent: false });
			documentCategoryControl?.disable({ emitEvent: false });

			promptTemplateControl?.setValue(null, { emitEvent: false });
			promptTemplateControl?.disable({ emitEvent: false });

			return;
		}

		// If method is selected, enable country (next field)
		countryControl?.enable({ emitEvent: false });

		// Clear and disable fields 3 and 4 until country is selected
		if (!countryControl?.value) {
			documentCategoryControl?.setValue("", { emitEvent: false });
			documentCategoryControl?.disable({ emitEvent: false });

			promptTemplateControl?.setValue(null, { emitEvent: false });
			promptTemplateControl?.disable({ emitEvent: false });
		}
	};

	private _handleCountryChange = (countryValue: string): void => {
		const documentMethodControl = this.methodSelectionForm.get("documentMethod");
		const documentCategoryControl = this.methodSelectionForm.get("documentCategory");
		const promptTemplateControl = this.methodSelectionForm.get("promptTemplate");

		// If no country selected, clear and disable subsequent fields
		if (!countryValue) {
			documentCategoryControl?.setValue("", { emitEvent: false });
			documentCategoryControl?.disable({ emitEvent: false });

			promptTemplateControl?.setValue(null, { emitEvent: false });
			promptTemplateControl?.disable({ emitEvent: false });

			return;
		}

		// Only enable documentCategory if documentMethod is also selected
		if (documentMethodControl?.value) {
			documentCategoryControl?.enable({ emitEvent: false });

			// Update available categories based on country
			if (!this.projectFlow?.documentCategories) {
				console.warn("ProjectFlow or documentCategories method not available");
				return;
			}

			const documentCategories = this.projectFlow.documentCategories(countryValue);

			// Auto-select if only one option available
			if (documentCategories && documentCategories.length === 1) {
				documentCategoryControl?.setValue(documentCategories[0], { emitEvent: true });
			} else {
				// Clear the selection if multiple options or none
				documentCategoryControl?.setValue("", { emitEvent: false });
			}
		}

		// Clear and disable promptTemplate until documentCategory is selected
		if (!documentCategoryControl?.value) {
			promptTemplateControl?.setValue(null, { emitEvent: false });
			promptTemplateControl?.disable({ emitEvent: false });
		}
	};

	private _handleDocumentCategoryChange = (documentCategoryValue: string): void => {
		const documentMethodControl = this.methodSelectionForm.get("documentMethod");
		const countryControl = this.methodSelectionForm.get("country");
		const promptTemplateControl = this.methodSelectionForm.get("promptTemplate");

		// If no category selected, clear and disable promptTemplate
		if (!documentCategoryValue) {
			promptTemplateControl?.setValue(null, { emitEvent: false });
			promptTemplateControl?.disable({ emitEvent: false });

			return;
		}

		// Only enable promptTemplate if documentMethod, country, AND documentCategory are all selected
		if (documentMethodControl?.value && countryControl?.value) {
			promptTemplateControl?.enable({ emitEvent: false });

			// Auto-select if only one prompt template available
			const promptTemplates = this.getPromptTemplates(countryControl.value, documentCategoryValue);

			if (promptTemplates && promptTemplates.length === 1) {
				promptTemplateControl?.setValue(promptTemplates[0], { emitEvent: false });
			} else {
				promptTemplateControl?.setValue(null, { emitEvent: false });
			}
		}
	};

	private _onEnrollSettingsChange(settings: EnrollSettings) {
		if (!this.methodSelectionForm) {
			this.formSubmitted = false;
			return;
		}

		const { documentMethod, documentCategory, country } = settings;
		const currentDocumentMethod = this.methodSelectionForm.get("documentMethod")?.value;

		// Only reset formSubmitted if documentMethod is being cleared
		// Don't reset if we're already in the upload flow (formSubmitted = true)
		if (!documentMethod && currentDocumentMethod) {
			this.formSubmitted = false;
		}

		if (documentMethod && currentDocumentMethod !== documentMethod) {
			this.methodSelectionForm.patchValue({ documentMethod }, { emitEvent: false });
			// Only reset formSubmitted when documentMethod actually changes to a different value
			if (currentDocumentMethod) {
				this.formSubmitted = false;
			}
		}

		if (country && this.methodSelectionForm.get("country")?.value !== country) {
			this.methodSelectionForm.patchValue({ country }, { emitEvent: false });
		}

		if (documentCategory && this.methodSelectionForm.get("documentCategory")?.value !== documentCategory) {
			this.methodSelectionForm.patchValue({ documentCategory }, { emitEvent: false });
		}
	}

	comparePromptTemplates(option: PromptTemplate, value: PromptTemplate): boolean {
		if (!option || !value) return false;

		return option._id === value._id;
	}

	trackByPromptTemplate(index: number, item: PromptTemplate): any {
		return item?._id || index;
	}

	trackByCountry(index: number, item: CountryOption): any {
		return item?.country || index;
	}

	getPromptTemplates(country: string, documentCategory: string): PromptTemplate[] {
		if (!this.projectFlow || !country || !documentCategory) {
			return [];
		}

		try {
			const templates = this.projectFlow.promptTemplates(country, documentCategory);
			return templates ? templates.filter((template) => template != null) : [];
		} catch (error) {
			console.warn("Error getting prompt templates:", error);
			return [];
		}
	}

	disableSubmitButton(): boolean {
		if (this.project.demoMode) {
			return (
				this.demoModeChoice === "" ||
				(this.demoModeChoice === "demo" && !this.methodSelectionForm.get("documentMethod")?.value) ||
				(this.demoModeChoice === "own" && !this.methodSelectionForm.valid)
			);
		}

		return !this.methodSelectionForm.valid;
	}

	getBackgroundGradient() {
		if (!this.project.branding.buttonColor) return `linear-gradient(34deg, rgba(0,0,0,0) 25%, rgba(0,0,0,0.2) 120%`;

		return `linear-gradient(34deg, rgba(0,0,0,0) 25%, ${this.project.branding.buttonColor} 230%)`;
	}

	onImageScan(imageScan: ImageScan): void {
		const body = {
			backImage: undefined,
			category: this.enrollSettings.documentCategory,
			country: this.enrollSettings.country,
			documentFace: undefined,
			force: imageScan.force,
			image: undefined,
			inputMethod: imageScan.inputMethod,
			promptTemplate: this.enrollSettings.promptTemplate,
		};

		if (imageScan.front) {
			body.documentFace = imageScan.face;
			body.image = `${imageScan.base64Image}`;
		} else {
			body.backImage = `${imageScan.base64Image}`;
		}

		this._createDocumentValidation(body);
	}

	onGoBackToMethodSelection(): void {
		this.formSubmitted = false;
	}

	onSkipStep() {
		if (this.projectFlow.onboardingSettings.steps.document === "mandatory") return;

		// Always record that the user skipped the document step (e.g. when re-entering from "Complete document verification").
		this._smartEnrollService.setSkippedDocument(true);

		if (this.projectFlow.onboardingSettings.steps.liveness !== "skip" && !this._smartEnrollService.wasSkippedBiometric()) {
			this._smartEnrollService.skipToStep("biometric");
		} else {
			this._smartEnrollService.setSkippedBiometric(true);
			this._smartEnrollService.skipToStep("result");
		}
	}

	retry() {
		this.errorResult = false;
		this.errorContent = { message: "" };
	}

	onDemoModeSelected(choice: "own" | "demo" | ""): void {
		this.demoModeChoice = choice;
		this.useDemoData = choice === "demo";

		if (this.useDemoData) {
			this.methodSelectionForm.get("documentMethod")?.setValue("");
			this.methodSelectionForm.get("documentCategory")?.setValue("");
			this.methodSelectionForm.get("country")?.setValue("");
			this.methodSelectionForm.get("promptTemplate")?.setValue(null);
		}

		this._demoService.setDemoModeChoice(choice);
	}

	submitMethodSelectionForm() {
		if (this.disableSubmitButton()) return;

		this.enrollSettings.documentMethod = this.methodSelectionForm.value.documentMethod;
		this.enrollSettings.documentCategory = this.methodSelectionForm.value.documentCategory;
		this.enrollSettings.country = this.methodSelectionForm.value.country;
		this.enrollSettings.promptTemplate = this.methodSelectionForm.value.promptTemplate;

		this.updateDocumentMethod(this.methodSelectionForm.value.documentMethod);
		this.updateDocumentCategory(this.methodSelectionForm.value.documentCategory);
		this.updateCountry(this.methodSelectionForm.value.country);
		this.updatePromptTemplate(this.methodSelectionForm.value.promptTemplate);

		this.formSubmitted = true;
	}

	updateDocumentMethod(method: EnrollDocumentMethod) {
		this._smartEnrollService.setCurrentStep("document");
		this._smartEnrollService.setDocumentMethod(method);
	}

	updateDocumentCategory(category: DocumentCategory) {
		this._smartEnrollService.setDocumentCategory(category);
	}

	updateCountry(country: keyof CountryOption) {
		this._smartEnrollService.setCountry(country);
	}

	updatePromptTemplate(promptTemplate: PromptTemplate) {
		this._smartEnrollService.setPromptTemplate(promptTemplate);
	}

	getDocumentDisplayName(template: PromptTemplate): string {
		if (!template) return "";

		if (typeof template.documentType === "object" && template.documentType !== null) {
			const docType = template.documentType as any;
			const name = template.name || docType.name || "";
			const version = docType.version || "current";

			return `${name} (${version})`;
		}

		return template.name || "Unknown Template";
	}

	openReferenceDialog(template: PromptTemplate, ref: TemplateRef<any>): void {
		if (!template || !template.documentType || typeof template.documentType !== "object") return;

		this.selectedReferenceDoc = template.documentType;

		this._matDialog.open(ref, {
			data: template.documentType,
		});
	}
}
