import { CommonModule, NgIf } from "@angular/common";
import { Component, ElementRef, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from '@angular/material/card';
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { AppRegistration, Project, ProjectFlow } from "../../project";
import { KYCService } from "../../kyc.service";
import { SmartEnrollService } from "../smart-enroll.service";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";

@Component({
	selector: "smart-documents-review",
	templateUrl: "./smart-documents-review.component.html",
	styleUrls: ["../smart-enroll.component.scss", "../../sign-up/sign-up.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		LanguagesComponent,
		MatButtonModule,
		NgIf,
		ReactiveFormsModule,
		TranslocoModule,
		SmartStepperComponent,
        MatCardModule,
        MatIconModule,
	],
})
export class SmartDocumentsReviewComponent {
	@ViewChild("faceCardCanvas") faceCardCanvas: ElementRef<HTMLCanvasElement>;

	appRegistration: AppRegistration;
	project: Project;
	projectFlow: ProjectFlow;

    constructor(
		private translocoService: TranslocoService,
		private _smartEnrollService: SmartEnrollService,
		private _KYCService: KYCService,
	) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

		this._cleanOCR(this.appRegistration.documentValidation?.OCRExtraction);
	}

    private _cleanOCR(OCRExtraction: any) {
        if (!OCRExtraction) return;

        Object.keys(OCRExtraction).forEach((key) => {
            const translationKey = `extracted_information.${key}`;

            if (!OCRExtraction[key] || this.translocoService.translate(translationKey) === translationKey) {
                delete OCRExtraction[key];
            }
        });
    }

	onNextStep(): void {
		this._smartEnrollService.goToNextStep();
	}

	onTryAgain(): void {
		this._smartEnrollService.subtractAttempt('document');
		this._smartEnrollService.goToPreviousStep();
	}

	onPreviousStep(): void {
		this._smartEnrollService.setDocumentMethod('');
		this._smartEnrollService.goToPreviousStep();
	}
}
