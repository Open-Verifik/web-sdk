import {
    Component,
    OnInit,
    ViewChild,
    ChangeDetectorRef,
    OnDestroy,
} from '@angular/core';
import {
    Validators,
    FormGroup,
    FormBuilder
} from '@angular/forms';
import {
    FuseAlertType
} from '@fuse/components/alert';
import {
    KycService
} from '../kyc.service';
import {
    takeUntil
} from 'rxjs/operators';
import {
    Project,
    ProjectFlowModel
} from 'app/modules/models';
import {
    Subject
} from 'rxjs';
import moment from 'moment';
import {
    ActivatedRoute,
    Router
} from '@angular/router';
import {
    environment
} from 'environments/environment';
import {
    fuseAnimations
} from '@fuse/animations';

@Component({
    selector: 'app-kyc-account-creation-with-basic-information',
    templateUrl: './kyc-account-creation-with-basic-information.component.html',
    styleUrls: ['./kyc-account-creation-with-basic-information.component.scss'],
    animations: fuseAnimations,
})
export class KycAccountCreationWithBasicInformationComponent implements OnInit, OnDestroy {
    alert: {
        type: FuseAlertType;message: string
    } = {
        type: 'success',
        message: ''
    };

    project: Project;

    projectFlow: ProjectFlowModel;

    signUpForm: FormGroup;

    showAlert: boolean = false;

    groupFields: any;

    countries: Array < any > ;

    private _unsubscribeAll: Subject < any > = new Subject < any > ();

    emailSent: boolean;

    smsSent: boolean;

    emailValidation: any;

    phoneValidation: any;
    isDemo: boolean;
    codeError: any;

    /**
     * Constructor
     */
    constructor(
        private _KycService: KycService,
        private _formBuilder: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _activeRoute: ActivatedRoute
    ) {
        this.countries = this._KycService.countryCodes;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this._ObserveProject();
        this._initForm();
        this._activeRoute.queryParams.subscribe(params => {
            this.isDemo = Boolean(params.demo)
        });
    }

    _ObserveProject(): void {
        this._KycService.currentProject$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((project: Project) => {
                this.project = project;

                this.projectFlow = project.currentProjectFlow;

                this._changeDetectorRef.markForCheck();

            });
    }

    _initForm(): void {
        this.groupFields = {
            agreements: [false, [Validators.required]],
        };

        const isProduction = environment.production;

        const fakeData = {
            email: isProduction ? '' : 'jhon.doe@verifik.co',
            emailOTP: isProduction ? '' : 123456,
            countryCode: isProduction ? '+57' : '+57',
            phone: isProduction ? '' : '123456789',
            phoneOTP: isProduction ? '' : 123456,
            firstName: isProduction ? '' : 'Jhon',
            lastName: isProduction ? '' : 'Doe'
        }

        if (this.projectFlow.email) {
            this.groupFields['email'] = [fakeData.email, [Validators.required, Validators.email]];

            this.groupFields['emailOTP'] = [fakeData.emailOTP, [Validators.required, Validators.minLength(6)]];
        }

        if (this.projectFlow.phone) {
            this.groupFields['countryCode'] = [fakeData.countryCode, [Validators.required]];

            this.groupFields['phone'] = [fakeData.phone, [Validators.required]];

            this.groupFields['phoneOTP'] = [fakeData.phoneOTP, [Validators.required, Validators.minLength(6)]];
        }

        if (this.projectFlow.onboardingSettings.basicInformation.fullName) {
            this.groupFields['firstName'] = [fakeData.firstName, [Validators.required]];

            this.groupFields['lastName'] = [fakeData.lastName, [Validators.required]];
        }

        this.signUpForm = this._formBuilder.group(this.groupFields);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    isFormValid(): boolean {
        return Boolean(this.signUpForm.valid && this.signUpForm.value.agreements);
    }

    /**
     * Sign in
     */
    signUp(): void {
        if (!this.signUpForm.valid || !this.signUpForm.value.agreements) {
            return
        }

        this._KycService.createAccount(this.project._id, this.signUpForm.value).subscribe(response => {
            this.codeError = undefined;

            localStorage.setItem('accessToken', response.data.token);
            
            if (response.data.qr) {
                localStorage.setItem('qr', response.data.qr);
            }

            this._router.navigate(['/kyc/project', this.project._id]);
        }, exception => {
            this.codeError = undefined

            this.showAlert = true;

            this.alert.type = 'error';

            this.alert.message = exception.error.message;
        });

    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
    }

    sendOTP(field): void {
        switch (field) {
            case 'email':
                this._KycService.sendEmailValidation(this.signUpForm.value.email).subscribe(response => {
                    this.emailValidation = response.data;

                    this.emailSent = true;

                    this.startTimer(field);
                }, exception => {
                    this.codeError = undefined;

                    this.showAlert = true;
        
                    this.alert.type = 'error';
        
                    this.alert.message = exception.error.message;
                });
                break;

            case 'phone':
                this._KycService.sendPhoneValidation(this.signUpForm.value.countryCode, this.signUpForm.value.phone).subscribe(response => {
                    this.phoneValidation = response.data;

                    this.smsSent = true;

                    this.startTimer(field);
                }, exception => {
                    this.codeError = undefined;

                    this.showAlert = true;
        
                    this.alert.type = 'error';
        
                    this.alert.message = exception.error.message;
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

                    this._changeDetectorRef.detectChanges();
                }, 1000);

                break;
        }
    }

    openConditions(data: any): void {
        if (data == "tos") {
            window.open(`${this.project.termsAndConditionsUrl}`, "_blank");
            return;
        }
        window.open(`${this.project.privacyUrl}`, "_blank");
    }
}