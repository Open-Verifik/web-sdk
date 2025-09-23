import { CommonModule, NgIf } from "@angular/common";
import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { AuthService } from "app/core/auth/auth.service";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { KYCService } from "../../kyc.service";
import { AppRegistration } from "../../project";
import { SmartEnrollService } from "../smart-enroll.service";
import { PasswordlessService } from "../../passwordless.service";

@Component({
    animations: fuseAnimations,
    imports: [CommonModule, FlexLayoutModule, MatButtonModule, MatIconModule, NgIf, MatCardModule, TranslocoModule],
    selector: "smart-documents-review",
    standalone: true,
    styleUrls: ["../smart-enroll.component.scss", "../../sign-up/sign-up.component.scss"],
    templateUrl: "./smart-documents-review.component.html",
})
export class SmartDocumentsReviewComponent {
    appRegistration: AppRegistration;
    errors: any = {};
    project: Project;
    projectFlow: ProjectFlow;
    showErrors: boolean = false;
    ocrKeys: Array<string> = [];

    ORDER_OCR_BY: { [key: string]: number } = {
        Address: 15,
        Age: 13,
        "Date Of Birth": 12,
        "Document Number": 17,
        "Document Type": 16,
        "First Last Name MRZ": 22,
        "First Name": 27,
        "First Name MRZ": 26,
        "Full Name": 90,
        "Last Name": 24,
        "Middle Name": 25,
        "Name 1": 31,
        "Name 2": 30,
        "Name 3": 29,
        "Second Last Name": 23,
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

        if (!this.appRegistration.documentValidation) {
            this.onPreviousStep();

            return;
        }

        this._cleanOCR(this.appRegistration.documentValidation.OCRExtraction);
        this._setErrors();
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
            return (this.ORDER_OCR_BY[b] || 1) - (this.ORDER_OCR_BY[a] || 1);
        });
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

        if (this.projectFlow.onboardingSettings.document.verifyNames && docValidation?.infoValidationSupported && !docValidation?.namesMatch) {
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
        return this._smartEnrollService.isDocumentValidAndComplete(this.projectFlow, this.appRegistration);
    }

    onNextStep(): void {
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
