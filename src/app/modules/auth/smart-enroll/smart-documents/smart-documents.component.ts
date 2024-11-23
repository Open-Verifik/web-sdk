import { catchError, forkJoin, map, of, Subject, Subscription } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";
import { Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from '@angular/material/card';

import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";

import { AppRegistration, Project, ProjectFlow, DocumentValidation, ImageScan } from "../../project";
import { KYCService } from "../../kyc.service";
import { EnrollDocumentMethod, SmartEnrollService } from "../smart-enroll.service";

import { SmartUploadComponent } from "../smart-upload/smart-upload.component";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";
import { SmartScannerComponent } from "../smart-scanner/smart-scanner.component";
import { environment } from "environments/environment";
import { SmartErrorDisplayComponent } from "../smart-error-display/smart-error-display.component";

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
		NgIf,
		SmartUploadComponent,
		SmartStepperComponent,
		SmartScannerComponent,
		SmartErrorDisplayComponent,
		TranslocoModule,
        MatCardModule,
        MatIconModule,
	],
})
export class SmartDocumentsComponent implements OnDestroy {
	@ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;

	private smartEnrollSettingsSubscription = new Subscription();
	
	appRegistration: AppRegistration;
	errorContent: { message: string };
	errorResult: boolean;
	faceIdCard: string;
	project: Project;
	projectFlow: ProjectFlow;
	selectedMethod: EnrollDocumentMethod = '';
	successfulUploadSubject: Subject<void> = new Subject<void>();

    constructor(
		private _smartEnrollService: SmartEnrollService,
		private _KYCService: KYCService,
	) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

        const settings = this._smartEnrollService.enrollSettings;

        this.selectedMethod = settings.documentMethod;
		this.errorResult = this._smartEnrollService.store.document.remaining === 0;
		this.errorContent = { message: '' };

		this.smartEnrollSettingsSubscription = this._smartEnrollService.enrollSettings$.subscribe({
			next: (enrollSettings) => this.onDocumentMethodChange(enrollSettings.documentMethod)
		});
	}

	ngOnDestroy() {
		this.smartEnrollSettingsSubscription.unsubscribe();
        this.successfulUploadSubject.complete();
	}

    private _createDocumentValidation(body: any) {
		this._smartEnrollService.subtractAttempt('document');

        this._KYCService
            .createDocumentValidation(body)
            .subscribe({
                next: (response) => {
                    this.appRegistration.documentValidation = response.data.documentValidation as DocumentValidation;
                    this._sendDocumentValidationAndNameValidation();
                },
                error: (error) => this._handleError(error),
            });
    }

	private _handleError(error: any): void {

		this.errorResult = true;
		this.errorContent = { message: error?.error?.message || '' };

		const split = this.errorContent.message.split("@");
		this.errorContent.message = (new RegExp(/^[a-z]+(?:_{0,2}[a-z]+)*$/)).test(split[0]) ? split[0] : 'failed_to_read';
	}

	private _sendDocumentValidationAndNameValidation(): void {
        if (!this.appRegistration.documentValidation._id) {
			this.successfulUploadSubject.next();
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
			this.successfulUploadSubject.next();
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
			error: (error) => this._handleError(error),
            complete: () => {
				this.successfulUploadSubject.next();
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

    onImageScan(imageScan: ImageScan) {
		const body = {
			backImage: undefined,
			documentFace: undefined,
			force: undefined,
			image: undefined,
			inputMethod: "FILE_UPLOAD",
		};

		if (imageScan.front) {
			body.documentFace = imageScan.face;
			body.force = !!this.appRegistration.documentValidation;
			body.image = `${imageScan.base64Image}`;
		} else {
			body.backImage = `${imageScan.base64Image}`;
			body.force = true;
		}

		this._createDocumentValidation(body);
    }

	retry() {
		this.errorResult = false;
		this.errorContent = { message: '' };
	}

	updateDocumentMethod(method: EnrollDocumentMethod) {
		if (this.appRegistration.documentValidation) {
			this._smartEnrollService.setCurrentStep('document-review');
		}

		this._smartEnrollService.setDocumentMethod(method);
	}
}
