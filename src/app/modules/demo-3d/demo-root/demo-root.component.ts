import {
    Component,
    ChangeDetectorRef,
    OnInit
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators
} from '@angular/forms';
import {
    CountriesService
} from 'app/modules/countries/countries.service';
import {
    FuseMediaWatcherService
} from '@fuse/services/media-watcher';
import {
    Subject
} from 'rxjs';
import {
    skip,
    takeUntil
} from 'rxjs/operators';
import {
    DemoService
} from '../demo.service';

import {
    BiometricService
} from 'app/modules/biometrics/biometric.service';
import {
    DemoBiometric
} from 'app/modules/biometrics/demo-biometric.module';
@Component({
    selector: 'app-demo-root',
    templateUrl: './demo-root.component.html',
    styleUrls: ['./demo-root.component.scss']
})
export class DemoRootComponent implements OnInit {
    private _unsubscribeAll: Subject < any > = new Subject < any > ();
    biometricLoaded: Boolean;

    contactForm: FormGroup;
    countries: any;
    isScreenSmall: boolean;
    lgScreen: boolean;
    tabletMode: boolean;
    laptopMode: boolean;
    phoneMode: boolean;
    bigScreenMode: boolean;
    selectedFeature: any = 'liveness';
    currentStep: any = 'start';
    // currentStep: any = 'result';
    baseColor: any = '#0036E7'
    mapSteps: any = [
        'start',
        'form',
        'select',
        'instructions',
        'facetec',
        'result',
    ]

    constructor(
        private _formBuilder: FormBuilder,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _countries: CountriesService,
        // private _service: BiometricService,
        private _biometric: DemoBiometric,
        private _demoService: DemoService,
    ) {
        
        this._biometric.isReady$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
        .subscribe((isSuccess) => {
            if (isSuccess) {
                this._biometric.startSession()
            }
        });

        this._biometric.session$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((isSuccess) => {
                this.biometricLoaded = isSuccess
                this._changeDetectorRef.detectChanges()

            });

        this._biometric.error$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((error) => {
                // this.errorLogin(error)
                this.biometricLoaded = false;
                this._biometric.startSession()

            });

        this._biometric.onboardingScan$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                if (response.success) {

                    //COMPLETED ALL SERVICES
                    console.log("COMPLETED ALL SERVICES")
                    // this.screenStatus = 'ending'
                    // this.step = 'finish'
                    this._changeDetectorRef.markForCheck()

                }

                this.biometricLoaded = false;
                this._biometric.startSession()
            });

        this._biometric.auth$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                if (response.success) {

                    //COMPLETED ALL SERVICES
                    console.log("COMPLETED ALL SERVICES")
                    // this.screenStatus = 'ending'
                    // this.step = 'finish'
                    this._changeDetectorRef.markForCheck()

                }

                this.biometricLoaded = false;
                this._biometric.startSession()
            });


        this.countries = this._countries.countryCodes;
        this.initForm()
    }

    ngOnInit(): void {

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({
                matchingAliases
            }) => {


                this.isScreenSmall = Boolean(!matchingAliases.includes('lg') && matchingAliases.includes('md'));
                this.lgScreen = matchingAliases.includes('lg');
                this.phoneMode = Boolean(!matchingAliases.includes('lg') && !matchingAliases.includes('md') && !matchingAliases.includes('sm'));
                this.tabletMode = Boolean(!matchingAliases.includes('lg') && !matchingAliases.includes('md') && matchingAliases.includes('sm'));
                this.laptopMode = Boolean(!matchingAliases.includes('lg') && matchingAliases.includes('md') && matchingAliases.includes('sm'));
                this.bigScreenMode = Boolean(matchingAliases.includes('lg') && matchingAliases.includes('md') && matchingAliases.includes('sm'));

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

    }

    startBiometric(): void {
        console.log(this.selectedFeature)
        if (this.selectedFeature == 'liveness') {
            this._biometric.startAuth()
            return
        }
        console.log('enrollmentDocument');
        this._biometric.startEnrollmentDocument()
    }


    initForm(): void {
        this.contactForm = this._formBuilder.group({
            'companyName': [, [Validators.required]],
            'name': [, [Validators.required]],
            'website': [, [Validators.required]],
            'jobFunction': [, [Validators.required]],
            'email': [, [Validators.required, Validators.email]],
            'countryCode': [, [Validators.required]],
            'phone': [, [Validators.required]],
        });
    }

    changeSelection(data): void {
        this.selectedFeature = data;
        this._changeDetectorRef.markForCheck();
    }

    changeStep(data): void {
        if (this.currentStep === 'form') {
            this.reviewForm();
            // return;
        }

        this.currentStep = data;
        this._changeDetectorRef.markForCheck();
    }

    reviewForm(): Boolean {
        if (!this.contactForm.valid) {
            return false;
        }
        this._demoService.postForm(this.contactForm.value).subscribe(
            result => {
                console.log(result);
                localStorage.setItem('accessToken', result.data.token)
                localStorage.setItem('expiresAt', result.data.tokenExpiresAt)
                // const token = result.data.token
            }
        )
    }

}