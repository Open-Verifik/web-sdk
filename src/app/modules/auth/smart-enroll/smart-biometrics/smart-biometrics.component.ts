import { Subject } from 'rxjs';

import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';

import { fuseAnimations } from '@fuse/animations';

import { TranslocoModule } from '@ngneat/transloco';

import { DemoService } from 'app/modules/demo/demo.service';
import { KYCService } from '../../kyc.service';
import { EnrollSettings, SmartEnrollService } from '../smart-enroll.service';
import {
    AppRegistration,
    BiometricValidation,
    ImageScan,
    Project,
    ProjectFlow,
} from '../../project';

import { SmartScannerComponent } from '../smart-scanner/smart-scanner.component';
import { SmartStepperComponent } from '../smart-enroll-stepper/smart-stepper.component';

import { SmartErrorDisplayComponent } from '../smart-error-display/smart-error-display.component';
import { SmartScannerIosComponent } from '../smart-scanner/smart-scanner-ios.component';

@Component({
    selector: 'smart-biometrics',
    templateUrl: './smart-biometrics.component.html',
    styleUrls: ['../smart-enroll.component.scss'],
    animations: fuseAnimations,
    standalone: true,
    imports: [
        CommonModule,
        FlexLayoutModule,
        SmartScannerComponent,
        SmartScannerIosComponent,
        SmartStepperComponent,
        SmartErrorDisplayComponent,
        TranslocoModule,
    ],
})
export class SmartBiometricsComponent implements OnDestroy {
    @ViewChild('faceCardCanvas', { static: true })
    faceCardCanvas: ElementRef<HTMLCanvasElement>;

    appRegistration: AppRegistration;
    demoData: any;
    enrollSettings: EnrollSettings;
    faceIdCard: string;
    project: Project;
    projectFlow: ProjectFlow;
    errorResult: boolean;
    errorContent: { message: string };
    successfulUploadSubject: Subject<void> = new Subject<void>();

    constructor(
        private _demoService: DemoService,
        private _KYCService: KYCService,
        private _smartEnrollService: SmartEnrollService
    ) {
        this.enrollSettings = this._smartEnrollService.enrollSettings;
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

        this.errorResult =
            this._smartEnrollService.store.biometric.remaining === 0;
        this.errorContent = { message: '' };

        this.demoData = this._demoService.getDemoData();
    }

    ngOnDestroy() {
        this.successfulUploadSubject.complete();
    }

    private _createBiometricValidation(body: any) {
        this._smartEnrollService.setSkippedBiometric(false);

        this._KYCService.createBiometricValidation(body).subscribe({
            next: (response) => {
                this.appRegistration.biometricValidation = response.data
                    .biometricValidation as BiometricValidation;
                this.appRegistration.person = response.data.person;
                this.appRegistration.face = null;

                this._smartEnrollService.setLivenessScore(
                    response.data.biometricValidation.livenessScore
                );

                if (
                    this.appRegistration.documentValidation &&
                    this.appRegistration.biometricValidation
                ) {
                    this._KYCService.compareFaces().subscribe({
                        next: (response) => {
                            this.appRegistration.compareFaceVerification =
                                response.data.compareFaceVerification;

                            this._smartEnrollService.setCompareScore(
                                response.data.compareFaceVerification.result
                                    .score
                            );

                            this._syncAppRegistration('liveness', 'ONGOING');
                        },
                        error: (error) => this._handleError(error),
                        complete: () => {
                            this.successfulUploadSubject.next();
                            this._smartEnrollService.goToNextStep();
                        },
                    });

                    return;
                }

                this._syncAppRegistration('liveness', 'ONGOING');
                this._smartEnrollService.goToNextStep();
                this.successfulUploadSubject.next();
            },
            error: (error) => this._handleError(error),
        });
    }

    private _handleError(exception: any): void {
        if (exception?.error?.code === 'PaymentRequired') {
            this._smartEnrollService.insufficientCreditsTrigger();
            return;
        }

        this._smartEnrollService.subtractAttempt('biometric');
        this.errorContent = { message: exception?.error?.message || '' };

        const str = this.errorContent.message.split('@');

        if (str.length > 1) {
            this._smartEnrollService.setLivenessScore(parseFloat(str[1]) || 0);
            this._smartEnrollService.goToNextStep();

            return;
        }

        this.errorResult = true;
        this.errorContent.message = new RegExp(
            /^[a-z]+(?:_{0,2}[a-z]+)*$/
        ).test(str[0])
            ? str[0]
            : 'liveness_failed';
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
            complete: () => {},
        });
    }

    onImageScan(imageScan: ImageScan) {
        const body: any = {
            image: imageScan.face,
            os: this.demoData.OS,
            force: !!this.appRegistration.biometricValidation,
        };

        this._createBiometricValidation(body);
    }

    retry() {
        this.errorResult = false;
        this.errorContent = { message: '' };
    }
}
