import { catchError, forkJoin, map, of, Subject, Subscription } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";
import { Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from '@angular/material/card';

import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";

import { AppRegistration, Project, ProjectFlow, DocumentValidation, ImageScan } from "../../project";
import { KYCService } from "../../kyc.service";
import { EnrollDocumentMethod, SmartEnrollService } from "../smart-enroll.service";

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { SmartUploadComponent } from "../smart-upload/smart-upload.component";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";
import { SmartScannerComponent } from "../smart-scanner/smart-scanner.component";
import { environment } from "environments/environment";

@Component({
	selector: "smart-documents",
	templateUrl: "./smart-documents.component.html",
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
		SmartUploadComponent,
		SmartStepperComponent,
		SmartScannerComponent,
		TranslocoModule,
        MatCardModule,
        MatIconModule,
	],
})
export class SmartDocumentsComponent implements OnDestroy {
	@ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;

	private _smartEnrollSettingsSubscription = new Subscription();
	
	appRegistration: AppRegistration;
    faceIdCard: string;
	project: Project;
	projectFlow: ProjectFlow;
    selectedMethod: EnrollDocumentMethod = '';

    failedUploadSubject: Subject<{ message?: string, livenessScore?: number }> = new Subject<{message?: string, livenessScore: number}>();
    successfulUploadSubject: Subject<{livenessScore?: number}> = new Subject<{livenessScore?: number}>();

    constructor(
		private _smartEnrollService: SmartEnrollService,
		private _KYCService: KYCService,
	) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

        const settings = this._smartEnrollService.enrollSettings;
        this.selectedMethod = settings.documentMethod;

		this._smartEnrollSettingsSubscription = this._smartEnrollService.enrollSettings$.subscribe({
			next: (enrollSettings) => this.onDocumentMethodChange(enrollSettings.documentMethod)
		});
	}

	ngOnDestroy() {
		this._smartEnrollSettingsSubscription.unsubscribe();
        this.failedUploadSubject.unsubscribe();
        this.successfulUploadSubject.unsubscribe();
	}

    private _createDocumentValidation(body: any) {
        this._KYCService
            .createDocumentValidation(body)
            .subscribe({
                next: (response) => {
                    this.appRegistration.documentValidation = response.data.documentValidation as DocumentValidation;
                    this._sendDocumentValidationAndNameValidation();
                },
                error: (error) => {
                    const message = (new RegExp(/^[a-z]+(?:_{0,2}[a-z]+)*$/)).test(error?.error?.message) ? error.error.message : 'failed_to_read';

                    this._smartEnrollService.subtractAttempt('document');
					this.failedUploadSubject.next({ message });
                },
            });
    }

	private _sendDocumentValidationAndNameValidation(): void {
        if (!this.appRegistration.documentValidation._id) {
			this.successfulUploadSubject.next({});
            this._syncAppRegistration('document', "ONGOING");

            return;
        };

		const settings = this.projectFlow.onboardingSettings.document;
		const observables = [];

		if (settings.verifyNames) {
			const payload = {
				_id: this.appRegistration.documentValidation._id,
				force: true,
			};

			observables.push(
				this._KYCService.updateDocumentValidationNameValidation(payload).pipe(
					map((result) => ({ status: "fulfilled", value: result })),
					catchError((error) => of({ status: "rejected", reason: error }))
				)
			);
		}

		if (settings.verifyCriminalHistory) {
			const payload = {
				_id: this.appRegistration.informationValidation._id,
				force: environment.production,
			};

			observables.push(
				this._KYCService.updateInformationValidationWithCriminalRecords(payload).pipe(
					map((result) => ({ status: "fulfilled", value: result })),
					catchError((error) => of({ status: "rejected", reason: error }))
				)
			);
		}

        if (observables.length === 0) {
			this.successfulUploadSubject.next({});
            this._syncAppRegistration('document', "ONGOING");

            return;
        };

		forkJoin([observables]).subscribe({
			next: (results) => {
				results.forEach((result) => {
					if (result.status === "fulfilled") {
						console.log("Observable fulfilled:", { result });
					} else {
						console.error("Observable rejected:", { result });
					}
				});
			},
			error: (error) => {
				console.error("Unexpected error occurred:", error);
			},
            complete: () => {
				this.successfulUploadSubject.next({});
                this._syncAppRegistration('document', "ONGOING");
            }
		});
	}

	private _syncAppRegistration(step: string, status?: string, action?: string) {
		let _response: any = null;

		this._KYCService
			.syncAppRegistration(step, status)
			.subscribe({
				next: (response) => {
					_response = response.data;
				},
				error: () => {},
				complete: () => {
					if (status !== "COMPLETED_WITHOUT_KYC" && action !== "redirect") return;

                    let redirectUrl = this.projectFlow.redirectUrl;

                    if (environment.verifikProject === this.project._id) {
                        redirectUrl = `${environment.appUrl}/sign-in`;
                    } else if (environment.sandboxProject === this.project._id) {
                        redirectUrl = `${environment.sandboxUrl}/sign-in`;
                    }

                    window.location.href = `${redirectUrl}?type=onboarding&token=${_response.token}`;
				},
			}
		);
	}

    getBackgroundGradient() {
        if (!this.project.branding.buttonColor) return `linear-gradient(34deg, rgba(0,0,0,0) 25%, rgba(0,0,0,0.2) 120%`;

        return `linear-gradient(34deg, rgba(0,0,0,0) 25%, ${this.project.branding.buttonColor} 230%)`;
    }

	onDocumentMethodChange(method: EnrollDocumentMethod) {
		this.selectedMethod = method;

	}

	updateDocumentMethod(method: EnrollDocumentMethod) {
		if (this.appRegistration.documentValidation) {
			this._smartEnrollService.setCurrentStep('document-review');
		}

		this._smartEnrollService.setDocumentMethod(method);
	}

    async onImageScan(imageScan: ImageScan) {
		const body = {
			backImage: undefined,
			documentFace: undefined,
			force: undefined,
			image: undefined,
			inputMethod: "FILE_UPLOAD",
		};

		if (imageScan.front) {
			body.documentFace = imageScan.documentFace;
			body.force = !!this.appRegistration.documentValidation;
			body.image = `${imageScan.base64Image}`;
		} else {
			body.backImage = `${imageScan.base64Image}`;
			body.force = true;
		}

		this._createDocumentValidation(body);
    }
}
