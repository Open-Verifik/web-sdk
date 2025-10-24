import { CommonModule, NgIf } from "@angular/common";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import QRCode from "qrcode";
import { catchError, forkJoin, map, of, Subject, takeUntil } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { VerifikRadioGroupComponent } from "app/core/components/verifik-radio-group/verifik-radio-group.component";
import { VerifikRadioItemComponent } from "app/core/components/verifik-radio-item/verifik-radio-item.component";
import { VerifikMediaDisplayComponent } from "app/shared/components/verifik-media-display";
import { PromptTemplate } from "app/core/models/prompt-template.model";
import { CountryOption, CountryService } from "app/core/services/country.service";
import { CoreValidators } from "app/core/validators/validators";
import { DemoService } from "app/modules/demo/demo.service";
import { environment } from "environments/environment";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration, CriminalValidation, DocumentValidation, FaceVerification, ImageScan } from "../../project";
import { DocumentCategory, EnrollDocumentMethod, EnrollSettings, SmartEnrollService } from "../smart-enroll.service";
import { SmartErrorDisplayComponent } from "../smart-error-display/smart-error-display.component";
import { SmartScannerDemoComponent } from "../smart-scanner/smart-scanner-demo.component";
import { SmartScannerMobileComponent } from "../smart-scanner/smart-scanner-mobile.component";
import { SmartScannerComponent } from "../smart-scanner/smart-scanner.component";
import { SmartUploadComponent } from "../smart-upload/smart-upload.component";

type CombinedValidationResponse = {
    criminalValidation: CriminalValidationResponse;
    compareValidation: CompareFaceVerificationResponse;
    nameValidation: NameValidationResponse;
};

type CompareFaceVerificationResponse = {
    data: FaceVerification;
    error: any;
    reason: any;
    status: "fulfilled" | "rejected" | "NA";
};

type CriminalValidationResponse = {
    data: CriminalValidation;
    error: any;
    reason: any;
    status: "fulfilled" | "rejected" | "NA";
};

type NameValidationResponse = {
    data: DocumentValidation;
    error: any;
    reason: any;
    status: "fulfilled" | "rejected" | "NA";
};

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
        MatButtonModule,
        MatCardModule,
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
        TranslocoModule,
        VerifikMediaDisplayComponent,
        VerifikRadioGroupComponent,
        VerifikRadioItemComponent,
    ],
})
export class SmartDocumentsComponent implements AfterViewInit, OnDestroy {
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
    methodSelectionForm: FormGroup;
    project: Project;
    projectFlow: ProjectFlow;
    successfulUploadSubject: Subject<void> = new Subject<void>();
    useDemoData: boolean = false;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _countryService: CountryService,
        private _demoService: DemoService,
        private _formBuilder: FormBuilder,
        private _KYCService: KYCService,
        private _passwordlessService: PasswordlessService,
        private _smartEnrollService: SmartEnrollService
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.enrollSettings = this._smartEnrollService.enrollSettings;
        this.project = this._passwordlessService.currentProject;
        this.projectFlow = this._passwordlessService.currentProjectFlow;
        this.isVerifikProject = this._passwordlessService.isVerifikProject;

        this.countries = this._countryService.findAllowedCountryOptions(this.projectFlow.allowedCountries());

        this._initForm();

        this.errorResult = this._smartEnrollService.store.document.remaining === 0;
        this.errorContent = { message: "" };

        this.demoData = this._demoService.getDemoData();
        this.demoModeChoice = this._demoService.demoModeChoice;
        this.useDemoData = this.demoModeChoice === "demo";

        this._smartEnrollService.enrollSettings$.pipe(takeUntil(this._unsubscriber$)).subscribe({
            next: (enrollSettings) => this._onEnrollSettingsChange(enrollSettings),
        });
    }

    ngAfterViewInit(): void {
        this._prepareQrCode();
    }

    ngOnDestroy(): void {
        this.successfulUploadSubject.complete();

        this._unsubscriber$.next();
        this._unsubscriber$.complete();
    }

    private _createDocumentValidation(body: any) {
        this._smartEnrollService.setSkippedDocument(false);

        this._KYCService.createDocumentValidation(body).subscribe({
            next: (response) => {
                this.appRegistration.documentValidation = response.data.documentValidation as DocumentValidation;
                this._smartEnrollService.setDocumentMethodFromInputMethod(this.appRegistration?.documentValidation?.inputMethod);

                if (body.backImage) {
                    this.successfulUploadSubject.next();

                    return;
                }

                this._sendDocumentValidationAndNameValidation();
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
        console.error("error", exception);

        if (exception?.error?.code === "PaymentRequired") {
            this._smartEnrollService.insufficientCreditsTrigger();

            return;
        }

        this._smartEnrollService.subtractAttempt("document");

        this.errorResult = true;

        if (exception?.error?.details?.error) {
            this.errorContent = { message: exception?.error?.details?.error || "failed_to_read" };
        } else {
            this.errorContent = { message: exception?.error?.message || "" };

            const split = this.errorContent.message.split("@");

            this.errorContent.message = new RegExp(/^[a-z]+(?:_{0,2}[a-z]+)*$/).test(split[0]) ? split[0] : "failed_to_read";
        }
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

        // Step 1: Set documentMethod
        const documentMethod = this._getDocumentMethod(onboardSettingsDocument);
        this.methodSelectionForm.patchValue({ documentMethod });
        this._handleDocumentMethodChange(documentMethod);

        const country = this._getCountry();

        this.methodSelectionForm.patchValue({ country });
        this._handleCountryChange(country);

        // Step 2: Set documentCategory (only if country is set)
        if (!country) return;

        const documentCategory = this._getDocumentCategory(onboardSettingsDocument);
        this.methodSelectionForm.patchValue({ documentCategory });
        this._handleDocumentCategoryChange(documentCategory);

        // Step 3: Set promptTemplate (only if documentCategory is set)
        if (!documentCategory) return;

        const promptTemplate = this._getPromptTemplate();
        this.methodSelectionForm.patchValue({ promptTemplate });
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
        this.methodSelectionForm
            .get("country")
            ?.valueChanges.pipe(takeUntil(this._unsubscriber$))
            .subscribe((value) => {
                this._handleCountryChange(value);
            });

        this.methodSelectionForm
            .get("documentCategory")
            ?.valueChanges.pipe(takeUntil(this._unsubscriber$))
            .subscribe((value) => {
                this._handleDocumentCategoryChange(value);
            });
    }

    private _handleDocumentMethodChange(value: string): void {
        if (!value) {
            this.methodSelectionForm.get("documentCategory")?.disable();
            this.methodSelectionForm.get("promptTemplate")?.disable();
            return;
        }

        this.methodSelectionForm.get("country")?.enable();
    }

    private _handleCountryChange(value: string): void {
        this.methodSelectionForm.get("documentCategory")?.setValue("");
        this.methodSelectionForm.get("promptTemplate")?.setValue(null);

        if (!value) {
            this.methodSelectionForm.get("documentCategory")?.disable();
            this.methodSelectionForm.get("promptTemplate")?.disable();

            return;
        }

        this.methodSelectionForm.get("documentCategory")?.enable();

        const documentCategories = this.projectFlow.documentCategories(value);

        if (documentCategories.length === 1) this.methodSelectionForm.get("documentCategory")?.setValue(documentCategories[0]);
        else this.methodSelectionForm.get("documentCategory")?.setValue("");
    }

    private _handleDocumentCategoryChange(value: string): void {
        this.methodSelectionForm.get("promptTemplate")?.setValue(null);

        if (!value) {
            this.methodSelectionForm.get("promptTemplate")?.disable();

            return;
        }

        this.methodSelectionForm.get("promptTemplate")?.enable();

        const promptTemplates = this.projectFlow.promptTemplates(this.methodSelectionForm.get("country")?.value, value);

        if (promptTemplates.length === 1) this.methodSelectionForm.get("promptTemplate")?.setValue(promptTemplates[0]);
        else this.methodSelectionForm.get("promptTemplate")?.setValue(null);
    }

    private _onEnrollSettingsChange(settings: EnrollSettings) {
        if (!this.methodSelectionForm || !settings.documentMethod) this.formSubmitted = false;

        if (settings.documentMethod && this.methodSelectionForm?.value.documentMethod !== settings.documentMethod) {
            this.methodSelectionForm.setValue({ documentMethod: settings.documentMethod });
        }

        if (settings.documentCategory && this.methodSelectionForm?.value.documentCategory !== settings.documentCategory) {
            this.methodSelectionForm.setValue({ documentCategory: settings.documentCategory });
        }

        if (settings.country && this.methodSelectionForm?.value.country !== settings.country) {
            this.methodSelectionForm.setValue({ country: settings.country });
        }
    }

    private _sendDocumentValidationAndNameValidation(): void {
        if (!this.appRegistration.documentValidation._id) {
            this.successfulUploadSubject.next();

            return;
        }

        const settings = this.projectFlow.onboardingSettings.document;

        const observables$ = {
            compareValidation: null,
            criminalValidation: null,
            nameValidation: null,
        };

        if (settings.verifyNames) {
            const payload = {
                _id: this.appRegistration.documentValidation._id,
                force: true,
            };

            const observable$ = this._KYCService.updateDocumentValidationNameValidation(payload).pipe(
                map((result) => ({
                    status: "fulfilled",
                    data: result.data,
                })),
                catchError((error) => of({ status: "rejected", reason: error }))
            );

            observables$.nameValidation = observable$;
        } else {
            observables$.nameValidation = Promise.resolve({
                status: "NA",
                data: {},
            });
        }

        if (settings.verifyCriminalHistory) {
            const payload = {
                _id:
                    typeof this.appRegistration.informationValidation === "string"
                        ? this.appRegistration.informationValidation
                        : this.appRegistration.informationValidation._id,
                force: environment.production,
            };

            const observable$ = this._KYCService.updateInformationValidationWithCriminalRecords(payload).pipe(
                map((result) => ({
                    status: "fulfilled",
                    data: result.data,
                })),
                catchError((error) => of({ status: "rejected", reason: error }))
            );

            observables$.criminalValidation = observable$;
        } else {
            observables$.criminalValidation = Promise.resolve({
                status: "NA",
                data: {},
            });
        }

        if (this.appRegistration.biometricValidation) {
            const observable$ = this._KYCService.compareFaces().pipe(
                map((result) => ({ status: "fulfilled", data: result.data })),
                catchError((error) => of({ status: "rejected", reason: error }))
            );

            observables$.compareValidation = observable$;
        } else {
            observables$.compareValidation = Promise.resolve({
                status: "NA",
                data: {},
            });
        }

        forkJoin(observables$).subscribe({
            next: (results: CombinedValidationResponse) => {
                if (results.criminalValidation?.status === "rejected") {
                    if (results.criminalValidation?.error?.code === "PaymentRequired") {
                        this._smartEnrollService.insufficientCreditsTrigger();
                        return;
                    }

                    console.error("criminalValidation rejected:", {
                        criminalValidation: results.criminalValidation?.data,
                    });
                }

                if (results.nameValidation?.status === "fulfilled") {
                    if (!results.nameValidation?.data?.infoValidationSupported) {
                        this.appRegistration.documentValidation.infoValidationSupported = results.nameValidation?.data?.infoValidationSupported;
                        this.appRegistration.documentValidation.infoValidationSupportedReason =
                            results.nameValidation?.data?.infoValidationSupportedReason;

                        return;
                    }

                    this.appRegistration.documentValidation.namesMatch = results.nameValidation.data.namesMatch;
                    this.appRegistration.documentValidation.fullNameMatchPercentage = results.nameValidation.data.fullNameMatchPercentage;
                    this.appRegistration.documentValidation.firstNameMatchPercentage = results.nameValidation.data.firstNameMatchPercentage;
                    this.appRegistration.documentValidation.lastNameMatchPercentage = results.nameValidation.data.lastNameMatchPercentage;
                } else if (results.nameValidation?.status === "rejected") {
                    if (results.nameValidation?.error?.code === "PaymentRequired") {
                        this._smartEnrollService.insufficientCreditsTrigger();

                        return;
                    }

                    console.error("nameValidation rejected:", {
                        nameValidation: results.nameValidation?.reason,
                    });
                }

                if (results.compareValidation?.status === "fulfilled") {
                    this.appRegistration.compareFaceVerification = results.compareValidation.data;
                } else if (results.compareValidation?.status === "rejected") {
                    if (results.compareValidation?.error?.code === "PaymentRequired") {
                        this._smartEnrollService.insufficientCreditsTrigger();

                        return;
                    }

                    console.error("compareValidation rejected:", {
                        compareValidation: results.compareValidation?.reason,
                    });
                }
            },
            error: (error) => this._handleError(error),
            complete: () => {
                this.successfulUploadSubject.next();
            },
        });
    }

    comparePromptTemplates(option: PromptTemplate, value: PromptTemplate): boolean {
        if (!option || !value) return false;

        return option._id === value._id;
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

        if (this.projectFlow.onboardingSettings.steps.liveness !== "skip" && !this._smartEnrollService.wasSkippedBiometric()) {
            this._smartEnrollService.setSkippedDocument(true);
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

    onDemoModeSelected(choice: "own" | "demo"): void {
        this.demoModeChoice = choice;
        this.useDemoData = choice === "demo";
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
}
