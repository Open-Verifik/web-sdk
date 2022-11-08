import {
    Biometric
} from './../../biometrics/biometric.module';
import {
    Component,
    OnInit,
    ChangeDetectorRef,
    OnDestroy
} from '@angular/core';
import {
    ProjectModel,
    ProjectFlowModel,
    Project
} from 'app/modules/models';
import {
    FuseAlertType
} from '@fuse/components/alert';
import {
    fuseAnimations
} from '@fuse/animations';
import {
    FormGroup,
    FormBuilder,
    Validators,
    FormControl
} from '@angular/forms';
import {
    PasswordlessService
} from '../passwordless.service';
import {
    Router
} from '@angular/router';
import {
    KycService
} from 'app/modules/kyc/kyc.service';
import {
    Subject
} from 'rxjs';
import moment from 'moment';
import {
    skip,
    takeUntil
} from 'rxjs/operators';
import {
    CoreService
} from 'app/shared/core.service';

@Component({
    selector: 'app-passwordless-login',
    templateUrl: './passwordless-login.component.html',
    styleUrls: ['./passwordless-login.component.scss'],
    animations: fuseAnimations
})
export class PasswordlessLoginComponent implements OnInit, OnDestroy {
    alert: {
        type: FuseAlertType;message: string
    } = {
        type: 'success',
        message: ''
    };
    project: ProjectModel;
    projectFlow: ProjectFlowModel;
    signInForm: FormGroup;
    showAlert: boolean = false;
    countries: Array < any > ;
    private _unsubscribeAll: Subject < any > = new Subject < any > ();
    emailSent: boolean;
    smsSent: boolean;
    emailValidation: any;
    phoneValidation: any;
    groupFields: any;
    typeLogin: string;
    activeSendOtp: boolean;
    biometricsReady: boolean;
    private _biometric: Biometric;
    secondFactorData: any;
    secondFactorForm: any;
    ipData: any;

    constructor(
        private _passwordlessService: PasswordlessService,
        private _kycService: KycService,
        private _formBuilder: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _CoreService: CoreService
    ) {
        this.countries = this._kycService.countryCodes;

        // this.secondFactorData = {
        //     secretKey: "CUIVI2R7LUYT4TZM",
        //     QRCode: "data:image/png;base64,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",
        //     message: "You are required to setup the Google Authenticator first.",
        // };
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
    }

    ngOnInit(): void {
        // console.log('*/*/*/*/*/*/*/');
        this._ObserveProject();

        this._initForm();

        this.checkIP();

        if (this._biometric) {
            return;
        }

        this.biometricsReady = false;

        this._biometric = new Biometric(this._kycService, (isBiometricLibReady) => {
            if (isBiometricLibReady) {
                this._biometric.startSession()
            }
        })

        this._biometric.session$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((isSuccess) => {
                this.biometricsReady = isSuccess
            });

        this._biometric.error$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((error) => {
                this.errorLogin(error)
                this.biometricsReady = false;
                this._biometric.startSession()

            });

        this._biometric.auth$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((token) => {
                this.successLogin(token)
                this.biometricsReady = false;
                this._biometric.startSession()
            });
    }

    checkIP(): void {
        this.ipData = localStorage.getItem('ipData');

        if (this.ipData) {
            this.ipData = JSON.parse(this.ipData);

            return;
        }

        this._CoreService.getGeoLocation().subscribe(response => {
            this.ipData = {
                ip: response.ip,
                ipCountry: response.country,
                ipCity: response.city,
                ipLatitude: response.latitude,
                ipLongitude: response.longitude,
            };

            localStorage.setItem('ipData', JSON.stringify(this.ipData));
        });
    }

    _ObserveProject(): void {
        this._kycService.currentProject$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((project: Project) => {
                this.project = project;

                this.projectFlow = project.currentProjectFlow;

                this._changeDetectorRef.markForCheck();
            });
    }

    _initForm(): void {
        this.typeLogin = this.projectFlow.email ? "email" : "phone"

        this.buttonSendOtp();

        this.setFieldRequiredInForm();

        this._init2FAForm();
    }

    _init2FAForm(): void {
        this.secondFactorForm = this._formBuilder.group({
            authenticatorOTP: ['', [Validators.required, Validators.minLength(6)]],
        });
    }


    sendOTP(event): void {
        event.preventDefault()
        switch (this.typeLogin) {
            case 'email':
                this._passwordlessService.sendEmailValidation(this.project._id, this.signInForm.value.email).subscribe(response => {
                    this.emailValidation = response.data;

                    this.emailSent = true;

                    this.startTimer(this.typeLogin);
                }, err => {
                    this.errorLogin(err.error.message)
                });
                break;

            case 'phone':
                this._passwordlessService.sendPhoneValidation(this.project._id, this.signInForm.value.countryCode, this.signInForm.value.phone).subscribe(response => {
                    this.phoneValidation = response.data;

                    this.smsSent = true;

                    this.startTimer(this.typeLogin);
                }, err => {
                    this.errorLogin(err.error.message)
                });
                break;
        }
    }

    startTimer(field): number {
        let interval;

        switch (field) {
            case 'email':
                if (!this.emailValidation) {
                    return 0;
                }

                this.emailValidation.diff = moment(this.emailValidation.expiresAt).diff(new Date(), 'seconds') - 780;

                interval = setInterval(() => {
                    if (this.emailValidation.diff > 0) {
                        this.emailValidation.diff--;
                    } else {
                        clearInterval(interval);

                        this.emailSent = false;

                        this.emailValidation = null;
                    }
                    this.buttonSendOtp()

                    this._changeDetectorRef.detectChanges();
                }, 1000);

                break;

            case 'phone':
                if (!this.phoneValidation) {
                    return 0;
                }

                this.phoneValidation.diff = moment(this.phoneValidation.expiresAt).diff(new Date(), 'seconds') - 780;

                interval = setInterval(() => {
                    if (this.phoneValidation.diff > 0) {
                        this.phoneValidation.diff--;
                    } else {
                        clearInterval(interval);

                        this.smsSent = false;

                        this.phoneValidation = null;
                    }
                    this.buttonSendOtp()

                    this._changeDetectorRef.detectChanges();
                }, 1000);

                break;
        }
    }

    signIn(): void {
        const dataForm = this.signInForm.value
        switch (this.typeLogin) {
            case 'email':
                this._passwordlessService.confirmEmailValidation(this.project._id, dataForm.email, dataForm.emailOTP, this.secondFactorForm.value.authenticatorOTP).subscribe(response => {

                    if (response.data.message) {
                        this.secondFactorData = response.data;

                        this.secondFactorData.emailOTP = dataForm.emailOTP;

                        return;
                    }

                    return this.successLogin(response.data);
                }, err => {
                    console.log({
                        err: err.error.message
                    });

                    this.errorLogin(err.error.message)
                });
                break;
            case 'phone':
                this._passwordlessService.confirmPhoneValidation(this.project._id, dataForm.countryCode, dataForm.phone, dataForm.phoneOTP, this.secondFactorForm.value.authenticatorOTP).subscribe(response => {
                    if (!response.data) {
                        return;
                    }

                    if (response.data.message) {
                        this.secondFactorData = response.data;

                        this.secondFactorData.phoneOTP = dataForm.phoneOTP;

                        return;
                    }

                    return this.successLogin(response.data);
                }, err => {
                    this.errorLogin(err.error.message)
                });
                break;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    isFormValid(): boolean {
        return Boolean(this.signInForm.valid);
    }

    startBiometric() {
        this._biometric.startAuth(this.project._id, this.signInForm.value.phone, this.signInForm.value.email)
    }

    errorLogin(error: string) {
        this.alert = {
            type: 'error',
            message: error
        };

        console.log({
            errorLogin: error,
        });

        this.showAlert = true;

        this._changeDetectorRef.detectChanges()

        setTimeout(() => {
            this.showAlert = false;

            this._changeDetectorRef.detectChanges();
        }, 10000)
    }

    successLogin(token: any) {
        window.location.href = `${this.projectFlow.redirectUrl}?type=login&token=${token}`;
    }

    buttonSendOtp() {
        this.activeSendOtp = this.typeLogin === 'email' ? this.projectFlow.email && !this.emailSent : this.projectFlow.phone && !this.smsSent
    }

    setFieldRequiredInForm() {
        this.groupFields = {
            'email': [, ],
            'emailOTP': [, ],

            'countryCode': [, ],
            'phone': [, ],
            'phoneOTP': [, ],
        };

        switch (this.typeLogin) {
            case 'email':
                this.groupFields['email'][1] = [Validators.required, Validators.email];
                this.groupFields['emailOTP'][1] = [Validators.required, Validators.minLength(6)];
                break;

            case 'phone':
                this.groupFields['countryCode'][1] = [Validators.required];
                this.groupFields['phone'][1] = [Validators.required];
                this.groupFields['phoneOTP'][1] = [Validators.required, Validators.minLength(6)];
                break;
        }

        this.signInForm = this._formBuilder.group(this.groupFields);
    }

    selectLogin(event) {
        this.groupFields = {};

        this.typeLogin = event.index ? "phone" : "email"

        this.setFieldRequiredInForm()

        this.buttonSendOtp()

        this._changeDetectorRef.markForCheck();
    }

    canUseBiometrics(): boolean {
        const isFormValid = this.typeLogin === 'email' ? Boolean(this.signInForm.value.email) : Boolean(this.signInForm.value.countryCode && this.signInForm.value.phone);

        return Boolean(this.biometricsReady && isFormValid);
    }
}