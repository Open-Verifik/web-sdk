import { Subscription } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";
import { Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";

import { KYCService } from "../kyc.service";
import { EnrollDocumentMethod, EnrollSettings, EnrollStep, SmartEnrollService } from "./smart-enroll.service";

import { AppRegistration, Project, ProjectFlow } from "../project";

import { SmartDocumentsComponent } from "./smart-documents/smart-documents.component";
import { SmartDocumentsReviewComponent } from "./smart-documents-review/smart-documents-review.component";
import { SmartBiometricsComponent } from "./smart-biometrics/smart-biometrics.component";
import { SmartResultsComponent } from "./smart-results/smart-results.component";

@Component({
	selector: "smart-enroll",
	templateUrl: "./smart-enroll.component.html",
	styleUrls: ["smart-enroll.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		MatButtonModule,
		MatIconModule,
		NgIf,
		ReactiveFormsModule,
		SmartBiometricsComponent,
		SmartDocumentsComponent,
		SmartDocumentsReviewComponent,
		SmartResultsComponent,
		TranslocoModule,
	],
})
export class SmartEnrollComponent implements OnDestroy {
	@ViewChild('appContent') appContent: ElementRef<HTMLElement>;

	private smartEnrollSettingsSubscription = new Subscription();

	appRegistration: AppRegistration;
	currentStep: EnrollStep;
	enrollSettings: EnrollSettings;
	project: Project;
	projectFlow: ProjectFlow;
	steps: EnrollStep[];
    method: EnrollDocumentMethod;
	year: number = new Date().getFullYear();

    constructor(
		private _smartEnrollService: SmartEnrollService,
		private _KYCService: KYCService,
	) {
		this.appRegistration = this._KYCService.appRegistration;
		this.enrollSettings = this._smartEnrollService.enrollSettings;
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;

		this.smartEnrollSettingsSubscription = this._smartEnrollService.enrollSettings$.subscribe({
			next: (enrollSettings) => this.onSettingsChange(enrollSettings)
		});
        
        const settings = this._smartEnrollService.enrollSettings;

        this.currentStep = settings.currentStep;
        this.method = settings.documentMethod;

		this._prepareEnroll();
	}

	ngOnDestroy() {
		this.smartEnrollSettingsSubscription.unsubscribe();
	}

	private _prepareEnroll(): void {
		const steps = this.projectFlow.onboardingSettings.steps;

		this.steps = [];

		if (steps.document !== 'skip') this.steps.push('document', 'document-review');
		if (steps.liveness !== 'skip') this.steps.push('biometric');

		this.steps.push('result');

		if (!this.currentStep) this.changeStep(this.steps[0]);

		const documentAttemptsLimit = this.projectFlow.onboardingSettings.document.maxAttempts;
		const biometricAttemptsLimit = this.projectFlow.onboardingSettings.liveness.maxAttempts;
		const compareMinScore = this.projectFlow.onboardingSettings.document.compareMinScore;
		const livenessMinScore = this.projectFlow.onboardingSettings.liveness.livenessMinScore;

		this._smartEnrollService.setAvailableSteps(this.steps);

		this._smartEnrollService.store.biometric.compareMinScore = compareMinScore;
		this._smartEnrollService.store.biometric.livenessMinScore = livenessMinScore;

		const remainingBiometricAttempts = biometricAttemptsLimit - (this.appRegistration?.failedBiometricValidations?.length || 0);
		const remainingDocumentAttempts = documentAttemptsLimit - (this.appRegistration?.failedDocumentValidations?.length || 0);

		this._smartEnrollService.setAttempts('biometric', remainingBiometricAttempts, biometricAttemptsLimit);
		this._smartEnrollService.setAttempts('document', remainingDocumentAttempts, documentAttemptsLimit);
	}

	changeStep(step: EnrollStep) {
		this._smartEnrollService.setCurrentStep(step);
	}

	onSettingsChange(settings: EnrollSettings) {
		this.currentStep = settings.currentStep;
		this.method = settings.documentMethod;
		this.appContent.nativeElement.scrollTop = 0;
	}
}
