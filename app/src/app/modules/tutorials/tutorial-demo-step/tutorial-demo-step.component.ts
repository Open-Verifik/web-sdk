import {
    TutorialsService
} from './../tutorials.service';
import {
    ChangeDetectorRef,
    Component,
    OnInit
} from '@angular/core';
import {
    ActivatedRoute,
    Router
} from '@angular/router';
import {
    BiometricV2
} from 'app/modules/biometrics/biometricV2.module';
import {
    KycService
} from 'app/modules/kyc/kyc.service';
import {
    skip,
    takeUntil
} from 'rxjs/operators';
import {
    Subject
} from 'rxjs';
import { fuseAnimations } from '@fuse/animations';

@Component({
    selector: 'app-tutorial-demo-step',
    templateUrl: './tutorial-demo-step.component.html',
    styleUrls: ['./tutorial-demo-step.component.scss'],
    animations   : fuseAnimations
})
export class TutorialDemoStepComponent implements OnInit {
    private _unsubscribeAll: Subject < any > = new Subject < any > ();

    navData: any;
    step = 2
    token: string;
    biometricsReady: boolean
    tutorial: any;
    alert: {
        type: string;message: string;
    };
    showAlert: boolean;
    private _biometric: BiometricV2;
    externalId: any;
    group: string;
    constructor(
        private _KycService: KycService,
        private _tutorialService: TutorialsService,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.navData = this._tutorialService.navData;

        this.biometricsReady = false

        this.token = localStorage.getItem('clientToken')

        this.externalId = localStorage.getItem('externalDatabaseRefId');

        this.group = localStorage.getItem('group');

        if (!this.token) {
            this._tutorialService.navData.currentStep = 1;
            return
        }

        this._getTutorial()

        this._observeNavigationChanges()
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
    }

    successDemo(response) {
        localStorage.setItem(this.tutorial.route, JSON.stringify(response, null, 2))
        this._tutorialService.navData.currentStep = 3
    }

    async _getTutorial(): Promise < any > {
        const routeParams = await this._route.params['_value'];

        this.tutorial = this._tutorialService.getTutorial(routeParams.id);

        if (this.tutorial.onlyEndpoint) {
            this.biometricsReady = true;
            return
        }

        this._biometric = new BiometricV2(this._KycService, (isBiometricLibReady) => {
            if (isBiometricLibReady && this._biometric) {
                this._biometric.startSession()
            }
        });

        this._biometric.session$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
        .subscribe((isSuccess) => {
            this.biometricsReady = isSuccess;
        });

        this._biometric.error$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
        .subscribe((error) => {
            this.errorDemo(error);
            this.biometricsReady = false;
            this._biometric.startSession();
        });

        this._biometric.onboardingBiometric$
        .pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
        .subscribe(response => {
            this.successDemo(response)
        });

        this._biometric.onboardingScan$
        .pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
        .subscribe(response => {
            this.successDemo(response)
        });

        this._biometric.liveness$
        .pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
        .subscribe(response => {
            this.successDemo(response)
        });

        this._biometric.auth$
        .pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
        .subscribe(response => {
            this.successDemo(response)
        });
    }

    startBiometrics(): void {
        let parameters: any = {}
        switch (this.tutorial.route) {
            case 'liveness':
                this._biometric.startLiveness();

                break;
            case 'enroll_face':
                this._biometric.startEnrollmentBiometrics(this.externalId, this.group);

                break;
            case 'authenticate_face':
                this._biometric.startAuth(this.externalId)

                break;
            case 'match_face_to_id':
                this._biometric.startEnrollmentDocument(this.externalId)

                break;
            case 'scan_ocr_id':
                this._biometric.startIdScan()
                break;

            case 'match_image':
                parameters = {
                    externalDatabaseRefID: this.externalId,
                    image: localStorage.getItem('image'),
                    minMatchLevel: localStorage.getItem('minMatchLevel')
                };

                this._KycService.matchImage(parameters).subscribe(response =>{
                    this.successDemo(response.data)
                }, (err) => {
                    console.error(err)
                });
                break;

            case 'match_2_image':
                parameters = {
                    image0: localStorage.getItem('image0'),
                    image1: localStorage.getItem('image1'),
                    minMatchLevel: localStorage.getItem('minMatchLevel')
                };

                this._KycService.match2Image(parameters).subscribe(response =>{
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err);
                });
                break;
            case 'liveness_image':
                parameters = {
                    image: localStorage.getItem('image')
                };

                this._KycService.livenessImage(parameters).subscribe(response =>{
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err);
                });
                break;

            case 'estimate_age_image':
                parameters = {
                    image: localStorage.getItem('image')
                };

                this._KycService.estimatedAgeImage(parameters).subscribe(response =>{
                    console.log(response.data)
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err);
                });
                break;

            case 'estimate_age':
                parameters = {
                    externalDatabaseRefID: this.externalId,
                };

                this._KycService.estimatedAge(parameters).subscribe(response =>{
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err);
                });
                break;

        }
    }

    errorDemo(error: string) {
        this.alert = {
            type: 'error',
            message: error,
        };

        this.showAlert = true;

        this._changeDetectorRef.detectChanges();

        setTimeout(() => {
            this.showAlert = false;

            this._changeDetectorRef.detectChanges();
        }, 10000);
    }

    _observeNavigationChanges(): void {
        this._tutorialService.navigationHandler$
            .pipe(takeUntil(this._unsubscribeAll))
            .pipe(skip(1))
            .subscribe((changes: any) => {
                if (!changes || this.navData.currentStep !== this.step) return;

                this.navData.currentStep += changes.variable;
            });
    }

}