import {
    Biometric
} from './../../biometrics/biometric.module';
import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    Inject
} from '@angular/core';
import {
    Subject
} from 'rxjs';
import {
    ProjectModel,
    ProjectFlowModel,
    AppRegistrationModel
} from 'app/modules/models';
import {
    KycService
} from '../kyc.service';
import {
    FormBuilder
} from '@angular/forms';
import {
    skip,
    takeUntil
} from 'rxjs/operators';

import {
    FuseAlertType
} from '@fuse/components/alert';
import {
    fuseAnimations
} from '@fuse/animations';
import {
    FuseMediaWatcherService
} from '@fuse/services/media-watcher';

import {
    MatDialog,
} from '@angular/material/dialog';

import {
    KycDocumentValidationQrComponent
} from './kyc-document-validation-qr.component'

import moment from 'moment';

@Component({
    selector: 'app-kyc-document-validation',
    templateUrl: './kyc-document-validation.component.html',
    styleUrls: ['./kyc-document-validation.component.scss'],
    animations: fuseAnimations
})
export class KycDocumentValidationComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject < any > = new Subject < any > ();

    private _sessionToken: string

    project: ProjectModel;

    projectFlow: ProjectFlowModel;

    appRegistration: AppRegistrationModel;

    documentsMapping = {
        useLicense: false,
        usePassport: false,
        useGovernmentID: false,
    };
    selectedDocument: string

    alert: {
        type: FuseAlertType;message: string
    } = {
        type: 'success',
        message: ''
    };

    allowedOptions: any;
    isIdentityValidated: boolean;
    ocrData: any;
    showAlert: boolean;

    tabletMode: boolean;
    laptopMode: boolean;
    phoneMode: boolean;
    bigScreenMode: boolean;
    qr: string;
    private _biometric: Biometric;
    biometricsReady: boolean;
    interval: any;
    dialogQRRef: any

    constructor(
        private _KycService: KycService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        public dialog: MatDialog,
    ) {}

    ngOnInit(): void {
        // tempFix
        this._observeNavigationChanges();

        this._ObserveProject();
    }

    errorLogin(error: string) {
        this.alert = {
            type: 'error',
            message: error
        };
        this.showAlert = true;
        this._changeDetectorRef.detectChanges()

        setTimeout(() => {
            this.showAlert = false
            this._changeDetectorRef.detectChanges()
        }, 10000)
    }

    isMobile() {
        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return width < 768;
    }

    validateBiometrics() {
        const bioRegistered = Boolean(this.appRegistration.biometricValidation)
        const scanRegistered = Boolean(this.appRegistration.documentValidation)

        if (this.projectFlow.onboardingSettings.documentValidation.includeOCR) {
            if (scanRegistered) {
                this.isIdentityValidated = true
                // throw new Error('Already_registed')
            }
            return this._biometric.startEnrollmentDocuments(bioRegistered, this.selectedDocument, this.appRegistration.phone, this.appRegistration.email)
            // return new PhotoIDProcessor(config, this._KycService);
        }
        if (bioRegistered) {
            this.isIdentityValidated = true
            // throw new Error('Already_registed')
        }

        this._biometric.startEnrollmentBiometrics(this.appRegistration.phone, this.appRegistration.email)

        // return new BiometricProcessor(config, this._KycService);
    }

    ngOnDestroy(): void {
        if (this.interval) {
            clearInterval(this.interval)
        }
        this._unsubscribeAll.next(null);
    }


    _ObserveProject(): void {
        this._KycService.currentAppRegistration$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((appRegistration: AppRegistrationModel) => {
                this._startTimer()

                this.appRegistration = appRegistration;

                this.project = appRegistration.project;

                this.projectFlow = appRegistration.projectFlow;

                this.allowedOptions = this.projectFlow.onboardingSettings.documentValidation;

                this.qr = localStorage.getItem('qr')

                if (this.qr && !this.isMobile()) {
                    this.dialogQRRef = this.dialog.open(KycDocumentValidationQrComponent, {
                        disableClose: true,
                        data: this.qr
                    });
                }

                this._syncBiometricsChecks();

                this._initFaceTecInLoop();

                this._changeDetectorRef.markForCheck();
            });
    }

    _initFaceTecInLoop(): any {
        let interval;

        interval = setInterval(() => {
            const response = this._initFaceTec();

            if (response === -1) clearInterval(interval);

            this._changeDetectorRef.detectChanges();
        }, 2000);
    }

    _initFaceTec(): any {
        if (this._biometric) {
            return -1;
        }

        this.biometricsReady = false;

        const _this = this;

        this._biometric = new Biometric(this._KycService, (isBiometricLibReady) => {
            if (isBiometricLibReady && _this._biometric) {
                _this._biometric.startSession()
            }
        });

        this._biometric.session$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((isSuccess) => {
                this.biometricsReady = isSuccess;
            });

        this._biometric.error$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((error) => {
                this.errorLogin(error);

                this.biometricsReady = false;

                this._biometric.startSession();

                this._resyncAppRegistrationObject();
            });

        this._biometric.onboardingBiometric$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.biometricsReady = false;

                this._biometric.startSession();

                this._resyncAppRegistrationObject();
            });

        this._biometric.onboardingScan$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.biometricsReady = false;

                this._biometric.startSession();

                this._resyncAppRegistrationObject();
            });
    }

    _syncBiometricsChecks(): void {
        const bioRegistered = Boolean(!this.projectFlow.onboardingSettings.documentValidation.includeOCR && this.appRegistration.biometricValidation && (this.projectFlow.onboardingSettings.documentValidation.useBasicLiveness || this.projectFlow.onboardingSettings.documentValidation.useProLiveness))

        const scanRegistered = Boolean(this.appRegistration.documentValidation && this.projectFlow.onboardingSettings.documentValidation.includeOCR)

        if (bioRegistered || scanRegistered) {

            clearInterval(this.interval)
            if (this.dialogQRRef) {
                this.dialogQRRef.close()
            }

            let rawOCR = this.appRegistration.documentValidation ? this.appRegistration.documentValidation.OCRExtraction : null;

            if (rawOCR) {
                rawOCR = rawOCR.userConfirmed ? rawOCR.userConfirmed : rawOCR.scanned
                this.ocrData = {
                    firstName: rawOCR.userInfo.firstName,
                    lastName: rawOCR.userInfo.lastName,
                    dateOfBirth: rawOCR.userInfo.dateOfBirth,
                    document: rawOCR.idInfo.idNumber,

                }
            }

            this.isIdentityValidated = true
            this._changeDetectorRef.markForCheck();
            return
        }
    }

    _startTimer() {
        if (this.interval) {
            return
        }

        this.interval = setInterval(() => {
            this._resyncAppRegistrationObject()
        }, 2000);

    }


    _resyncAppRegistrationObject(): void {
        this._KycService.resyncAppRegistrationObject().pipe(takeUntil(this._unsubscribeAll)).subscribe(response => {
            this.appRegistration = response.data;

            this._syncBiometricsChecks();

        }, error => {
            console.log({
                error
            });
        })
    }

    canEnableFaceTecButton(): boolean {
        const OCRValidation = this.projectFlow.onboardingSettings.documentValidation.includeOCR ? (this.selectedDocument) : true;

        return Boolean(this.biometricsReady && OCRValidation);
    }

    _observeNavigationChanges(): void {
        this._KycService.navigationHandler$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((changes: any) => {
                if (!changes) {
                    return;
                }

                if (this._KycService.navData.currentStep > changes.stepToGo) {
                    this._KycService.navData.currentStep = changes.stepToGo;

                    changes.projectSteps.selectedIndex = changes.stepToGo;

                    this._changeDetectorRef.markForCheck();

                    return;
                }

                const isValid = this._validateStep(changes);

                if (!isValid) {
                    return;
                }

                this._saveChanges(changes);
            });
    }

    _validateStep(changes: any): boolean {
        const _documentValidation = this.projectFlow && this.projectFlow.onboardingSettings.documentValidation.includeOCR ? (this.appRegistration.documentValidation) : true;

        return Boolean(changes && this.appRegistration && this.appRegistration.biometricValidation && this.appRegistration.biometricValidation.status === 'validated' && _documentValidation);
    }

    _saveChanges(changes: any): void {
        if (!changes) {
            return;
        }

        if (!this.projectFlow.onboardingSettings.form) {
            this._KycService.updateAppRegistration(this.appRegistration._id, {
                status: 'COMPLETED',
            }).subscribe(response => {
                localStorage.removeItem('xaccessToken')
                window.location.href = `${this.projectFlow.redirectUrl}?type=${this.projectFlow.type}&token=${response.data.token}`;
            });
            return;
        }

        this._KycService.navData.currentStep = changes.stepToGo;

        changes.projectSteps.selectedIndex = changes.stepToGo;
    }

    selectDocument(event: any, property: string): void {
        if (!event.checked) {
            this.selectedDocument = null
            return;
        }
        
        this.selectedDocument = property

        for (const key in this.documentsMapping) {
            let valueToSet = false;

            if (key === property) valueToSet = true;

            this.documentsMapping[key] = valueToSet;
        }
    }
}