import {
    Component,
    OnInit,
    ChangeDetectorRef,
    OnDestroy
} from '@angular/core';
import {
    takeUntil
} from 'rxjs/operators';
import {
    KycService
} from '../kyc.service';
import {
    Subject
} from 'rxjs';
import {
    FormGroup,
    FormBuilder,
    Validators
} from '@angular/forms';
import {
    AppRegistrationModel,
    ProjectFlowModel,
    ProjectModel
} from 'app/modules/models';
import {
    Router
} from '@angular/router';

@Component({
    selector: 'app-kyc-basic-information',
    templateUrl: './kyc-basic-information.component.html',
    styleUrls: ['./kyc-basic-information.component.scss']
})
export class KycBasicInformationComponent implements OnInit, OnDestroy {
    countryCodes: any;

    private _unsubscribeAll: Subject < any > = new Subject < any > ();

    basicInformationForm: FormGroup;

    groupFields: any;

    project: ProjectModel;

    projectFlow: ProjectFlowModel;

    appRegistration: AppRegistrationModel;

    documentTypes: any;

    constructor(
        private _KycService: KycService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        private _router: Router,
    ) {
        this.countryCodes = this._KycService.countryCodes;

        this.documentTypes = [{
            code: 'CC',
            name: 'document_types.cc',
        }, {
            code: 'CCVE',
            name: 'document_types.ccve',
        }, {
            code: 'PA',
            name: 'document_types.passport',
        }];
    }

    ngOnInit(): void {
        this._observeNavigationChanges();

        this._ObserveProject();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
    }

    _ObserveProject(): void {
        this._KycService.currentAppRegistration$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((appRegistration: AppRegistrationModel) => {
                this.appRegistration = appRegistration;

                this.project = appRegistration.project;

                this.projectFlow = appRegistration.projectFlow;

                this._changeDetectorRef.markForCheck();

                this._initForm();
            });
    }

    _observeNavigationChanges(): void {
        this._KycService.navigationHandler$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((changes: any) => {
                const isValid = this._validateStep(changes);

                if (!isValid) {
                    return;
                }

                this._saveChanges(changes);
            });
    }

    _initForm(): void {
        this.groupFields = {};

        const {
            firstName,
            lastName,
            age,
            gender,
            address,
            city,
            postalCode,
            dateOfBirth,
            documentType,
            documentNumber,
        } = this.appRegistration.InformationValidation;

        if (this.projectFlow.onboardingSettings.basicInformation.fullName) {
            this.groupFields['firstName'] = [firstName || '', [Validators.required]];

            this.groupFields['lastName'] = [lastName || '', [Validators.required]];
        }

        if (this.projectFlow.onboardingSettings.basicInformation.age) {
            this.groupFields['age'] = [age || 0, [Validators.required]];
        }

        if (this.projectFlow.onboardingSettings.basicInformation.gender) {
            this.groupFields['gender'] = [gender || 'M', [Validators.required]];
        }

        if (this.projectFlow.onboardingSettings.basicInformation.dateOfBirth) {
            this.groupFields['dateOfBirth'] = [dateOfBirth || new Date(), [Validators.required]];
        }

        if (this.projectFlow.onboardingSettings.basicInformation.address) {
            this.groupFields['address'] = [address || '', [Validators.required]];

            this.groupFields['city'] = [city || '', [Validators.required]];
        }

        if (this.projectFlow.onboardingSettings.basicInformation.postalCode) {
            this.groupFields['postalCode'] = [postalCode || '', [Validators.required]];
        }

        if (this.projectFlow.onboardingSettings.basicInformation.legalDocument) {
            this.groupFields['documentType'] = [documentType || '', [Validators.required]];

            this.groupFields['documentNumber'] = [documentNumber || '', [Validators.required]];
        }

        this.basicInformationForm = this._formBuilder.group(this.groupFields);
    }

    _validateStep(changes: any = {}): boolean {
        if (!this.basicInformationForm) {
            return false;
        }

        return Boolean(this.basicInformationForm.valid);
    }

    _saveChanges(changes: any): void {
        if (!changes) {
            return;
        }

        this._KycService.updateAppRegistration(this.appRegistration._id, {
            ...this.appRegistration,
            informationValidation: this.basicInformationForm.value,
        }).subscribe(response => {
            const keys = Object.keys(response.data.informationValidation);

            for (const key of keys) {
                this.appRegistration.InformationValidation[key] = response.data.informationValidation[key];
            }

            this._KycService.navData.currentStep = changes.stepToGo;

            changes.projectSteps.selectedIndex = changes.stepToGo;

            this._changeDetectorRef.markForCheck();
        }, error => {
            console.error({
                error
            });

            this.kickOut();
        });
    }

    kickOut(): void {
        localStorage.removeItem('accessToken');

        this._router.navigate(['/kyc/start/', this.appRegistration.project._id]);
    }
}