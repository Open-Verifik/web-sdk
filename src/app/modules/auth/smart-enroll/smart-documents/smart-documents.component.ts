import { catchError, forkJoin, map, of, Subject, Subscription } from 'rxjs';

import { CommonModule, NgIf } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { fuseAnimations } from '@fuse/animations';
import { TranslocoModule } from '@ngneat/transloco';

import {
    AppRegistration,
    Project,
    ProjectFlow,
    DocumentValidation,
    ImageScan,
    CriminalValidation,
    FaceVerification,
} from '../../project';
import { KYCService } from '../../kyc.service';
import {
    EnrollDocumentMethod,
    SmartEnrollService,
} from '../smart-enroll.service';

import { SmartUploadComponent } from '../smart-upload/smart-upload.component';
import { SmartStepperComponent } from '../smart-enroll-stepper/smart-stepper.component';
import { SmartScannerComponent } from '../smart-scanner/smart-scanner.component';
import { environment } from 'environments/environment';
import { SmartErrorDisplayComponent } from '../smart-error-display/smart-error-display.component';
import { SmartScannerIosComponent } from '../smart-scanner/smart-scanner-ios.component';
import { DemoService } from 'app/modules/demo/demo.service';

type CombinedValidationResponse = {
    criminalValidation: CriminalValidationResponse;
    compareValidation: CompareFaceVerificationResponse;
    nameValidation: NameValidationResponse;
};

type CompareFaceVerificationResponse = {
    data: FaceVerification;
    error: any;
    reason: any;
    status: 'fulfilled' | 'rejected' | 'NA';
};

type CriminalValidationResponse = {
    data: CriminalValidation;
    error: any;
    reason: any;
    status: 'fulfilled' | 'rejected' | 'NA';
};

type NameValidationResponse = {
    data: DocumentValidation;
    error: any;
    reason: any;
    status: 'fulfilled' | 'rejected' | 'NA';
};

@Component({
    selector: 'smart-documents',
    templateUrl: './smart-documents.component.html',
    styleUrls: [
        '../smart-enroll.component.scss',
        '../../sign-up/sign-up.component.scss',
    ],
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
        SmartScannerIosComponent,
        SmartErrorDisplayComponent,
        TranslocoModule,
        MatCardModule,
        MatIconModule,
    ],
})
export class SmartDocumentsComponent implements OnDestroy {
    @ViewChild('faceCardCanvas', { static: true })
    faceCardCanvas: ElementRef<HTMLCanvasElement>;

    private smartEnrollSettingsSubscription = new Subscription();

    appRegistration: AppRegistration;
    demoData: any;
    errorContent: { message: string };
    errorResult: boolean;
    faceIdCard: string;
    project: Project;
    projectFlow: ProjectFlow;
    selectedMethod: EnrollDocumentMethod = '';
    successfulUploadSubject: Subject<void> = new Subject<void>();

    constructor(
        private _demoService: DemoService,
        private _smartEnrollService: SmartEnrollService,
        private _KYCService: KYCService
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

        const settings = this._smartEnrollService.enrollSettings;

        this.selectedMethod = settings.documentMethod;
        this.errorResult =
            this._smartEnrollService.store.document.remaining === 0;
        this.errorContent = { message: '' };

        this.demoData = this._demoService.getDemoData();

        this.smartEnrollSettingsSubscription =
            this._smartEnrollService.enrollSettings$.subscribe({
                next: (enrollSettings) =>
                    this.onDocumentMethodChange(enrollSettings.documentMethod),
            });
    }

    ngOnDestroy(): void {
        this.smartEnrollSettingsSubscription.unsubscribe();
        this.successfulUploadSubject.complete();
    }

    private _createDocumentValidation(body: any) {
        this._smartEnrollService.setSkippedDocument(false);

        this._KYCService.createDocumentValidation(body).subscribe({
            next: (response) => {
                this.appRegistration.documentValidation = response.data
                    .documentValidation as DocumentValidation;
                this._smartEnrollService.setDocumentMethodFromInputMethod(
                    this.appRegistration?.documentValidation?.inputMethod
                );

                if (body.backImage) {
                    this.successfulUploadSubject.next();
                    this._syncAppRegistration('document', 'ONGOING');

                    return;
                }

                this._sendDocumentValidationAndNameValidation();
            },
            error: (error) => this._handleError(error),
        });
    }

    private _handleError(exception: any): void {
        if (exception?.error?.code === 'PaymentRequired') {
            this._smartEnrollService.insufficientCreditsTrigger();
            return;
        }

        this._smartEnrollService.subtractAttempt('document');

        this.errorResult = true;
        this.errorContent = { message: exception?.error?.message || '' };

        const split = this.errorContent.message.split('@');
        this.errorContent.message = new RegExp(
            /^[a-z]+(?:_{0,2}[a-z]+)*$/
        ).test(split[0])
            ? split[0]
            : 'failed_to_read';
    }

    private _sendDocumentValidationAndNameValidation(): void {
        if (!this.appRegistration.documentValidation._id) {
            this.successfulUploadSubject.next();

            if (this.appRegistration.biometricValidation) return;

            this._syncAppRegistration('document', 'ONGOING');

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

            const observable$ = this._KYCService
                .updateDocumentValidationNameValidation(payload)
                .pipe(
                    map((result) => ({
                        status: 'fulfilled',
                        data: result.data,
                    })),
                    catchError((error) =>
                        of({ status: 'rejected', reason: error })
                    )
                );

            observables$.nameValidation = observable$;
        } else {
            observables$.nameValidation = Promise.resolve({
                status: 'NA',
                data: {},
            });
        }

        if (settings.verifyCriminalHistory) {
            const payload = {
                _id:
                    typeof this.appRegistration.informationValidation ===
                    'string'
                        ? this.appRegistration.informationValidation
                        : this.appRegistration.informationValidation._id,
                force: environment.production,
            };

            const observable$ = this._KYCService
                .updateInformationValidationWithCriminalRecords(payload)
                .pipe(
                    map((result) => ({
                        status: 'fulfilled',
                        data: result.data,
                    })),
                    catchError((error) =>
                        of({ status: 'rejected', reason: error })
                    )
                );

            observables$.criminalValidation = observable$;
        } else {
            observables$.criminalValidation = Promise.resolve({
                status: 'NA',
                data: {},
            });
        }

        if (this.appRegistration.biometricValidation) {
            const observable$ = this._KYCService.compareFaces().pipe(
                map((result) => ({ status: 'fulfilled', data: result.data })),
                catchError((error) => of({ status: 'rejected', reason: error }))
            );

            observables$.compareValidation = observable$;
        } else {
            observables$.compareValidation = Promise.resolve({
                status: 'NA',
                data: {},
            });
        }

        forkJoin(observables$).subscribe({
            next: (results: CombinedValidationResponse) => {
                if (results.criminalValidation?.status === 'rejected') {
                    if (
                        results.criminalValidation?.error?.code ===
                        'PaymentRequired'
                    ) {
                        this._smartEnrollService.insufficientCreditsTrigger();
                        return;
                    }

                    console.error('criminalValidation rejected:', {
                        criminalValidation: results.criminalValidation?.data,
                    });
                }

                if (results.nameValidation?.status === 'fulfilled') {
                    if (
                        !results.nameValidation?.data?.infoValidationSupported
                    ) {
                        this.appRegistration.documentValidation.infoValidationSupported =
                            results.nameValidation?.data?.infoValidationSupported;
                        this.appRegistration.documentValidation.infoValidationSupportedReason =
                            results.nameValidation?.data?.infoValidationSupportedReason;

                        return;
                    }

                    this.appRegistration.documentValidation.namesMatch =
                        results.nameValidation.data.namesMatch;
                    this.appRegistration.documentValidation.fullNameMatchPercentage =
                        results.nameValidation.data.fullNameMatchPercentage;
                    this.appRegistration.documentValidation.firstNameMatchPercentage =
                        results.nameValidation.data.firstNameMatchPercentage;
                    this.appRegistration.documentValidation.lastNameMatchPercentage =
                        results.nameValidation.data.lastNameMatchPercentage;
                } else if (results.nameValidation?.status === 'rejected') {
                    if (
                        results.nameValidation?.error?.code ===
                        'PaymentRequired'
                    ) {
                        this._smartEnrollService.insufficientCreditsTrigger();
                        return;
                    }

                    console.error('nameValidation rejected:', {
                        nameValidation: results.nameValidation?.reason,
                    });
                }

                if (results.compareValidation?.status === 'fulfilled') {
                    this.appRegistration.compareFaceVerification =
                        results.compareValidation.data;
                } else if (results.compareValidation?.status === 'rejected') {
                    if (
                        results.compareValidation?.error?.code ===
                        'PaymentRequired'
                    ) {
                        this._smartEnrollService.insufficientCreditsTrigger();
                        return;
                    }

                    console.error('compareValidation rejected:', {
                        compareValidation: results.compareValidation?.reason,
                    });
                }
            },
            error: (error) => this._handleError(error),
            complete: () => {
                this.successfulUploadSubject.next();

                if (this.appRegistration.biometricValidation) return;

                this._syncAppRegistration('document', 'ONGOING');
            },
        });
    }

    private _syncAppRegistration(
        step: string,
        status?: string,
        action?: string
    ) {
        let _response: any = null;

        this._KYCService.syncAppRegistration(step, status).subscribe({
            next: (response) => {
                _response = response.data;
            },
            error: () => {},
            complete: () => {
                if (status !== 'COMPLETED_WITHOUT_KYC' && action !== 'redirect')
                    return;

                let redirectUrl = this.projectFlow.redirectUrl;

                if (environment.verifikProject === this.project._id) {
                    redirectUrl = `${environment.appUrl}/sign-in`;
                } else if (environment.sandboxProject === this.project._id) {
                    redirectUrl = `${environment.sandboxUrl}/sign-in`;
                }

                window.location.href = `${redirectUrl}?type=onboarding&token=${_response.token}`;
            },
        });
    }

    getBackgroundGradient() {
        if (!this.project.branding.buttonColor)
            return `linear-gradient(34deg, rgba(0,0,0,0) 25%, rgba(0,0,0,0.2) 120%`;

        return `linear-gradient(34deg, rgba(0,0,0,0) 25%, ${this.project.branding.buttonColor} 230%)`;
    }

    onDocumentMethodChange(method: EnrollDocumentMethod) {
        this.selectedMethod = method;
    }

    onImageScan(imageScan: ImageScan): void {
        const body = {
            backImage: undefined,
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
        this.errorContent = { message: '' };
    }

    updateDocumentMethod(method: EnrollDocumentMethod) {
        this._smartEnrollService.setCurrentStep('document');
        this._smartEnrollService.setDocumentMethod(method);
    }
}
