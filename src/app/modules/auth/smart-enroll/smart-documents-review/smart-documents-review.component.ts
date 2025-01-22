import { CommonModule, NgIf } from "@angular/common";
import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { AppRegistration, Project, ProjectFlow } from "../../project";
import { KYCService } from "../../kyc.service";
import { SmartEnrollService } from "../smart-enroll.service";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";
import { MatCardModule } from "@angular/material/card";

@Component({
	selector: "smart-documents-review",
	templateUrl: "./smart-documents-review.component.html",
	styleUrls: ["../smart-enroll.component.scss", "../../sign-up/sign-up.component.scss"],
	animations: fuseAnimations,
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		MatButtonModule,
		MatIconModule,
		NgIf,
		SmartStepperComponent,
        MatCardModule,
		TranslocoModule,
	],
})
export class SmartDocumentsReviewComponent {
	appRegistration: AppRegistration;
	errors: any = {};
	project: Project;
	projectFlow: ProjectFlow;
	showErrors: boolean = false;
	ocrKeys: Array<string> = [];

	ORDER_OCR_BY: { [key: string]: number } = {
		'fullName': 90,
		'name1': 31,
		'name2': 30,
		'name3': 29,
		'firstName': 27,
		'firstNameMRZ': 26,
		'middleName': 25,
		'lastName': 24,
		'firstLastNameMRZ': 22,
		'secondLastName': 23,
		'documentNumber': 17,
		'documentType': 16,
		'address': 15,
		'age': 13,
		'dateOfBirth': 12,
	};

    constructor(
		private translocoService: TranslocoService,
		private _smartEnrollService: SmartEnrollService,
		private _KYCService: KYCService,
	) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

		if (!this.appRegistration.documentValidation) {
			this.onPreviousStep();

			return;
		}

		this._cleanOCR(this.appRegistration.documentValidation.OCRExtraction);
		this._setErrors();
	}

    private _cleanOCR(OCRExtraction: any) {
        if (!OCRExtraction) return {};

        Object.keys(OCRExtraction).forEach((key) => {
            const translationKey = `extracted_information.${key}`;

            if (!OCRExtraction[key] || this.translocoService.translate(translationKey) === translationKey) {
                delete OCRExtraction[key];
            }
        });

		this.ocrKeys = Object.keys(OCRExtraction).sort((a, b) => {return (this.ORDER_OCR_BY[b] || 1) - (this.ORDER_OCR_BY[a] || 1)});
    }

	private _setErrors() {
		if (this.canContinue()) {
			this.errors = {};
			this.showErrors = false;

			return;
		}

		const docValidation = this.appRegistration?.documentValidation;

		if (!docValidation && this.projectFlow.onboardingSettings.steps.document === 'mandatory') {
			this.errors.mandatory = true;
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

	canContinue(): boolean {
		return this._smartEnrollService.isDocumentValidAndComplete(this.projectFlow, this.appRegistration);
	}

	onNextStep(): void {
		this._smartEnrollService.goToNextStep();
	}

	onTryAgain(): void {
		this._smartEnrollService.goToPreviousStep();
	}

	onPreviousStep(): void {
		this._smartEnrollService.setDocumentMethod('');
		this._smartEnrollService.goToPreviousStep();
	}
}
