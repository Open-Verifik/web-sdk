import { CommonModule, NgIf } from "@angular/common";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { distinctUntilChanged, Subject, takeUntil } from "rxjs";

import { AuthService } from "app/core/auth/auth.service";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { KYCService } from "../kyc.service";
import { PasswordlessService } from "../passwordless.service";
import { AppRegistration } from "../project";
import { SmartBiometricsComponent } from "./smart-biometrics/smart-biometrics.component";
import { SmartDocumentsReviewComponent } from "./smart-documents-review/smart-documents-review.component";
import { SmartDocumentsComponent } from "./smart-documents/smart-documents.component";
import { EnrollDocumentMethod, EnrollSettings, EnrollStep, SmartEnrollService } from "./smart-enroll.service";
import { SmartResultsComponent } from "./smart-results/smart-results.component";

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	selector: "smart-enroll",
	standalone: true,
	styleUrls: ["smart-enroll.component.scss"],
	templateUrl: "./smart-enroll.component.html",
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
export class SmartEnrollComponent implements AfterViewInit, OnDestroy {
	@ViewChild("appContent") appContent: ElementRef<HTMLElement>;

	private _unsubscriber$ = new Subject<void>();

	appRegistration: AppRegistration;
	currentStep: EnrollStep;
	enrollSettings: EnrollSettings;
	project: Project;
	projectFlow: ProjectFlow;
	steps: EnrollStep[];
	showQrCode: boolean = false;
	method: EnrollDocumentMethod;
	year: number = new Date().getFullYear();

	constructor(
		private _authService: AuthService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _smartEnrollService: SmartEnrollService,
		private _KYCService: KYCService,
		private _passwordlessService: PasswordlessService
	) {
		this.appRegistration = this._KYCService.appRegistration;
		this.enrollSettings = this._smartEnrollService.enrollSettings;
		this.project = this._passwordlessService.currentProject;
		this.projectFlow = this._passwordlessService.currentProjectFlow;

		this._smartEnrollService.enrollSettings$
			.pipe(
				distinctUntilChanged((prev, curr) => prev.currentStep === curr.currentStep && prev.documentMethod === curr.documentMethod),
				takeUntil(this._unsubscriber$)
			)
			.subscribe({
				next: (enrollSettings) => {
					Promise.resolve().then(() => {
						this.onSettingsChange(enrollSettings);
						this._changeDetectorRef.markForCheck();
					});
				},
			});

		const settings = this._smartEnrollService.enrollSettings;

		this.currentStep = settings.currentStep;
		this.method = settings.documentMethod;

		this._prepareEnroll();
	}

	ngAfterViewInit(): void {
		Promise.resolve().then(() => {
			this.setCurrentStepBasedOnAppRegistrationProgress();
		});
	}

	ngOnDestroy() {
		this._unsubscriber$.next();
		this._unsubscriber$.complete();
	}

	private _prepareEnroll(): void {
		const steps = this.projectFlow.onboardingSettings.steps;

		this.steps = [];

		if (steps.document !== "skip") {
			this.steps.push("document", "document-review");
		} else {
			this._smartEnrollService.setSkippedDocument(!this.appRegistration.documentValidation);
		}

		if (steps.liveness !== "skip") {
			this.steps.push("biometric");
		} else {
			this._smartEnrollService.setSkippedBiometric(!this.appRegistration.biometricValidation);
		}

		this.steps.push("result");

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

		this._smartEnrollService.setAttempts("biometric", remainingBiometricAttempts, biometricAttemptsLimit);
		this._smartEnrollService.setAttempts("document", remainingDocumentAttempts, documentAttemptsLimit);
	}

	private _syncAppRegistration(step: string, status?: string, action?: string) {
		let _response: any = null;

		this._KYCService.syncAppRegistration(step, status).subscribe({
			next: (response) => {
				_response = response.data;
			},
			error: () => {},
			complete: () => {
				if (status === "COMPLETED_WITHOUT_KYC" && action === "redirect") {
					this._authService.handleRedirect(this.projectFlow, this.project._id, _response.token, "onboarding");
					return;
				}

				this.appRegistration.currentStep = step;
			},
		});
	}

	changeStep(step: EnrollStep) {
		this._smartEnrollService.setCurrentStep(step);
	}

	onSettingsChange(settings: EnrollSettings) {
		this.currentStep = settings.currentStep;
		this.method = settings.documentMethod;

		if (!this.appContent?.nativeElement) return;

		this.appContent.nativeElement.scrollTop = 0;
	}

	setCurrentStepBasedOnAppRegistrationProgress(): void {
		let enrollStep: EnrollStep = "document";

		if (
			this.appRegistration.status === "COMPLETED" ||
			this.appRegistration.status === "FAILED" ||
			((this._smartEnrollService.wasSkippedBiometric() || this.appRegistration.biometricValidation) &&
				(this._smartEnrollService.wasSkippedDocument() ||
					this._smartEnrollService.isDocumentValidAndComplete(this.projectFlow, this.appRegistration)))
		) {
			// We will update the status of the app regsistration in the `smart-enroll-results` component
			enrollStep = "result";
		} else if (
			(this.appRegistration.documentValidation &&
				this._smartEnrollService.isDocumentValidAndComplete(this.projectFlow, this.appRegistration) &&
				this.appRegistration.currentStep === "liveness" &&
				!this.appRegistration.biometricValidation) ||
			this._smartEnrollService.wasSkippedDocument()
		) {
			// If they have already passed the document validation, we will just move them to the biometric step
			this._syncAppRegistration("liveness", "ONGOING");

			enrollStep = "biometric";
		} else if (this.appRegistration.documentValidation) {
			// If they have partially completed the document validation, we will move them to the document review step to notify them of what is missing.
			this._syncAppRegistration("document", "ONGOING");

			enrollStep = "document-review";
		}

		this._smartEnrollService.setCurrentStep(enrollStep);
	}
}
