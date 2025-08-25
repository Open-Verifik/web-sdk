import { catchError, forkJoin, map, of, Subject, takeUntil } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";

import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";

import { environment } from "environments/environment";
import { AppRegistration, CriminalValidation, DocumentValidation, FaceVerification, ImageScan, Project, ProjectFlow } from "../../project";

import { CountryOption, CountryService } from "app/core/services/country.service";
import { DemoService } from "app/modules/demo/demo.service";
import { KYCService } from "../../kyc.service";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";
import { DocumentCategory, EnrollDocumentMethod, EnrollSettings, SmartEnrollService } from "../smart-enroll.service";
import { SmartErrorDisplayComponent } from "../smart-error-display/smart-error-display.component";
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
    selector: "smart-documents",
    templateUrl: "./smart-documents.component.html",
    styleUrls: ["../smart-enroll.component.scss", "../../sign-up/sign-up.component.scss"],
    animations: fuseAnimations,
    standalone: true,
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatRadioModule,
        MatSelectModule,
        NgIf,
        ReactiveFormsModule,
        SmartErrorDisplayComponent,
        SmartScannerComponent,
        SmartScannerMobileComponent,
        SmartStepperComponent,
        SmartUploadComponent,
        TranslocoModule,
    ],
})
export class SmartDocumentsComponent implements OnDestroy {
    @ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;

    private _unsubscriber$ = new Subject<void>();

    appRegistration: AppRegistration;
    countries: CountryOption[];
    demoData: any;
    enrollSettings: EnrollSettings;
    errorContent: { message: string };
    errorResult: boolean;
    faceIdCard: string;
    formSubmitted: boolean = false;
    methodSelectionForm: FormGroup;
    project: Project;
    projectFlow: ProjectFlow;
    successfulUploadSubject: Subject<void> = new Subject<void>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _countryService: CountryService,
        private _demoService: DemoService,
        private _formBuilder: FormBuilder,
        private _KYCService: KYCService,
        private _smartEnrollService: SmartEnrollService
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.enrollSettings = this._smartEnrollService.enrollSettings;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

        this.countries = this._countryService.findAllowedCountryOptions(this.project.allowedCountries);

        this._initForm();

        this.errorResult = this._smartEnrollService.store.document.remaining === 0;
        this.errorContent = { message: "" };

        this.demoData = this._demoService.getDemoData();

        this._smartEnrollService.enrollSettings$.pipe(takeUntil(this._unsubscriber$)).subscribe({
            next: (enrollSettings) => this._onEnrollSettingsChange(enrollSettings),
        });
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
            country: ["", Validators.required],
            documentCategory: ["", Validators.required],
            documentMethod: ["", Validators.required],
        });

        const onboardSettingsDocument = this.projectFlow.onboardingSettings.document;

        let country = "";
        let documentMethod = "";
        let documentCategory = "";

        if (this.enrollSettings.country) {
            country = this.enrollSettings.country;
        }

        if (this.enrollSettings.documentMethod) {
            documentMethod = this.enrollSettings.documentMethod;
        } else {
            const documentMethods = Object.keys(onboardSettingsDocument).filter((key) =>
                ["uploadDocumentAllowed", "scanDocumentAllowed"].includes(key)
            );

            if (documentMethods.length === 1) {
                switch (documentMethods[0]) {
                    case "uploadDocumentAllowed":
                        documentMethod = "upload";
                        break;
                    case "scanDocumentAllowed":
                        documentMethod = "scan";
                        break;
                }
            }
        }

        if (this.enrollSettings.documentCategory) {
            documentCategory = this.enrollSettings.documentCategory;
        } else {
            const documentCategorys = Object.keys(onboardSettingsDocument).filter((key) =>
                ["useLicense", "usePassport", "useGovernmentID", "useTaxInformation"].includes(key)
            );

            if (documentCategorys.length === 1) {
                switch (documentCategorys[0]) {
                    case "useLicense":
                        documentCategory = "driver-license";
                        break;
                    case "usePassport":
                        documentCategory = "passport";
                        break;
                    case "useGovernmentID":
                        documentCategory = "id";
                        break;
                }
            }
        }

        this.methodSelectionForm.patchValue({
            country,
            documentMethod,
            documentCategory,
        });

        this._changeDetectorRef.markForCheck();
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
            criminalValidation: null,
            nameValidation: null,
            compareValidation: null,
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
        };

        if (imageScan.front) {
            body.documentFace = imageScan.face;
            body.image = `${imageScan.base64Image}`;
        } else {
            body.backImage = `${imageScan.base64Image}`;
        }

        this._createDocumentValidation(body);
    }

    retry() {
        this.errorResult = false;
        this.errorContent = { message: "" };
    }

    submitMethodSelectionForm() {
        if (!this.methodSelectionForm.valid) return;

        this.enrollSettings.documentMethod = this.methodSelectionForm.value.documentMethod;
        this.enrollSettings.documentCategory = this.methodSelectionForm.value.documentCategory;
        this.enrollSettings.country = this.methodSelectionForm.value.country;

        this.updateDocumentMethod(this.methodSelectionForm.value.documentMethod);
        this.updateDocumentCategory(this.methodSelectionForm.value.documentCategory);
        this.updateCountry(this.methodSelectionForm.value.country);

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
}
