import { CommonModule, NgIf } from "@angular/common";
import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { catchError, forkJoin, map, of } from "rxjs";

import { AuthService } from "app/core/auth/auth.service";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { VerifikMediaDisplayComponent } from "app/shared/components/verifik-media-display";
import { environment } from "environments/environment";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration, CriminalValidation, DocumentValidation, FaceVerification } from "../../project";
import { SmartEnrollService } from "../smart-enroll.service";

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
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        NgIf,
        MatCardModule,
        TranslocoModule,
        VerifikMediaDisplayComponent,
    ],
    selector: "smart-documents-review",
    standalone: true,
    styleUrls: ["../smart-enroll.component.scss", "../../sign-up/sign-up.component.scss"],
    templateUrl: "./smart-documents-review.component.html",
})
export class SmartDocumentsReviewComponent {
    appRegistration: AppRegistration;
    errors: any = {};
    isVerifikProject: boolean = false;
    project: Project;
    projectFlow: ProjectFlow;
    showErrors: boolean = false;
    ocrKeys: Array<string> = [];

    ORDER_OCR_BY: { [key: string]: number } = {
        address: 15,
        age: 13,
        "date of birth": 12,
        "document number": 17,
        "document type": 16,
        "first last name mrz": 22,
        "first name": 27,
        "first name mrz": 26,
        "full name": 90,
        "last name": 24,
        "middle name": 25,
        "name 1": 31,
        "name 2": 30,
        "name 3": 29,
        "second last name": 23,
    };

    loading: { [key: string]: boolean } = {
        compareValidation: true,
        criminalValidation: true,
        nameValidation: true,
    };

    constructor(
        private _authService: AuthService,
        private _KYCService: KYCService,
        private _smartEnrollService: SmartEnrollService,
        private _translocoService: TranslocoService,
        private _passwordlessService: PasswordlessService
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._passwordlessService.currentProject;
        this.projectFlow = this._passwordlessService.currentProjectFlow;
        this.isVerifikProject = this._passwordlessService.isVerifikProject;

        if (!this.appRegistration.documentValidation) {
            this.onPreviousStep();

            return;
        }

        this._cleanOCR(this.appRegistration.documentValidation.OCRExtraction);
        this._setErrors();
        this._sendDocumentValidationAndNameValidation();
    }

    get validationsInProgress(): boolean {
        return Object.values(this.loading).includes(true);
    }

    get verifyNamesEnabled(): boolean {
        return Boolean(this.projectFlow?.onboardingSettings?.document?.verifyNames);
    }

    get verifyCriminalHistoryEnabled(): boolean {
        return Boolean(this.projectFlow?.onboardingSettings?.document?.verifyCriminalHistory);
    }

    private _cleanOCR(OCRExtraction: any) {
        if (!OCRExtraction) return {};

        if (OCRExtraction["confidenceScore"]) delete OCRExtraction["confidenceScore"];

        Object.keys(OCRExtraction).forEach((key) => {
            let fieldKey = "";

            if (["documentType", "country", "documentNumber"].includes(key)) {
                fieldKey = this._translocoService.translate(`extracted_information.${key}`);
            } else {
                fieldKey = key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
            }

            if (OCRExtraction[key]) OCRExtraction[fieldKey] = OCRExtraction[key];

            delete OCRExtraction[key];
        });

        this.ocrKeys = Object.keys(OCRExtraction).sort((a, b) => {
            const lowerA = a.toLowerCase();
            const lowerB = b.toLowerCase();
            const orderA = this.ORDER_OCR_BY[lowerA] ?? Infinity;
            const orderB = this.ORDER_OCR_BY[lowerB] ?? Infinity;

            return orderA - orderB;
        });
    }

    private _sendDocumentValidationAndNameValidation(): void {
        if (this.errors && Object.keys(this.errors).length > 0) return;

        const observables$ = {
            compareValidation: null,
            criminalValidation: null,
            nameValidation: null,
        };

        if (this.verifyNamesEnabled) {
            this.loading.nameValidation = true;

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
            this.loading.nameValidation = false;

            observables$.nameValidation = Promise.resolve({
                status: "NA",
                data: {},
            });
        }

        if (this.verifyCriminalHistoryEnabled && !this.appRegistration?.informationValidation?.criminalData) {
            this.loading.criminalValidation = true;

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
            this.loading.criminalValidation = false;

            observables$.criminalValidation = Promise.resolve({
                status: "NA",
                data: {},
            });
        }

        if (this.appRegistration.biometricValidation) {
            this.loading.compareValidation = true;

            const observable$ = this._KYCService.compareFaces().pipe(
                map((result) => ({ status: "fulfilled", data: result.data })),
                catchError((error) => of({ status: "rejected", reason: error }))
            );

            observables$.compareValidation = observable$;
        } else {
            this.loading.compareValidation = false;

            observables$.compareValidation = Promise.resolve({
                status: "NA",
                data: {},
            });
        }

        forkJoin(observables$).subscribe({
            next: (results: CombinedValidationResponse) => {
                this.loading.compareValidation = false;
                this.loading.criminalValidation = false;
                this.loading.nameValidation = false;

                if (results.criminalValidation?.status === "fulfilled") {
                    this.appRegistration.informationValidation.criminalData = results.criminalValidation.data;
                } else if (results.criminalValidation?.status === "rejected") {
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
        });
    }

    private _handleError(exception: any): void {
        this.loading.compareValidation = false;
        this.loading.criminalValidation = false;
        this.loading.nameValidation = false;

        if (exception?.error?.code === "PaymentRequired") {
            this._smartEnrollService.insufficientCreditsTrigger();

            return;
        }

        this._setErrors();
    }

    private _setErrors() {
        if (this.canContinue()) {
            this.errors = {};
            this.showErrors = false;

            return;
        }

        const docValidation = this.appRegistration?.documentValidation;

        if (!docValidation && this.projectFlow.onboardingSettings.steps.document === "mandatory") {
            this.errors.mandatory = true;

            return;
        }

        if (this.appRegistration?.documentValidation?.OCRExtraction?.error) {
            this.errors.extractionError = this.appRegistration?.documentValidation?.OCRExtraction?.error;

            return;
        }

        if (docValidation?.requiresBackSide && !docValidation?.backUrl) {
            this.errors.requiresBack = true;
        }

        if (this.verifyNamesEnabled && !this.loading.nameValidation) {
            this.errors.namesDoNotMatch = true;
        }

        this.showErrors = Object.keys(this.errors).length > 0;
    }

    private _syncAppRegistration(step: string, status?: string, action?: string) {
        let _response: any = null;

        this._KYCService.syncAppRegistration(step, status).subscribe({
            next: (response) => {
                _response = response.data;
            },
            error: () => {},
            complete: () => {
                if (status !== "COMPLETED_WITHOUT_KYC" && action !== "redirect") return;

                this._authService.handleRedirect(this.projectFlow, this.project._id, _response.token, "onboarding");
            },
        });
    }

    canContinue(): boolean {
        return this._smartEnrollService.isDocumentValidAndComplete(this.projectFlow, this.appRegistration) && !this.validationsInProgress;
    }

    shouldShowValidationSection(): boolean {
        return (
            this.verifyNamesEnabled ||
            this.verifyCriminalHistoryEnabled ||
            Boolean(this.appRegistration?.biometricValidation && this.appRegistration?.documentValidation)
        );
    }

    onNextStep(): void {
        if (this.appRegistration.biometricValidation) {
            this._smartEnrollService.skipToStep("result");

            return;
        }

        this._syncAppRegistration("liveness", "ONGOING");

        this._smartEnrollService.goToNextStep();
    }

    onTryAgain(): void {
        this._syncAppRegistration("document", "ONGOING");

        this.onPreviousStep();
    }

    onPreviousStep(): void {
        this._smartEnrollService.goToPreviousStep();
    }
}
