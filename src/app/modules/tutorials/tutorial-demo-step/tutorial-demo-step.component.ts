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
    Biometric
} from 'app/modules/biometrics/biometric.module';

import {
    skip,
    takeUntil
} from 'rxjs/operators';
import {
    Subject
} from 'rxjs';
import {
    fuseAnimations
} from '@fuse/animations';
import {
    BiometricService
} from 'app/modules/biometrics/biometric.service';

@Component({
    selector: 'app-tutorial-demo-step',
    templateUrl: './tutorial-demo-step.component.html',
    styleUrls: ['./tutorial-demo-step.component.scss'],
    animations: fuseAnimations
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
    externalId: any;
    group: string;
    constructor(
        private _BiometricService: BiometricService,
        private _tutorialService: TutorialsService,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _biometric: Biometric,
    ) {}

    ngOnInit(): void {
        this.navData = this._tutorialService.navData;

        this.biometricsReady = this._biometric.getStatus()

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

        this._biometric.isReady$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
        .subscribe((isSuccess) => {
            this.biometricsReady = isSuccess;
        });


        this._biometric.error$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
        .subscribe((error) => {
            this.errorDemo(error);
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
            case 'liveness-3d':
                this._biometric.startLiveness();

                break;
            case 'enrollment-3d':
                this._biometric.startEnrollmentBiometrics(this.externalId, this.group);

                break;
            case 'match-3d-3d':
                this._biometric.startAuth(this.externalId)

                break;
            case 'match-3d-2d-idscan':
                this._biometric.startEnrollmentDocument(this.externalId)

                break;
            case 'idscan-only':
                this._biometric.startIdScan(this.externalId)
                break;

            case 'match-3d-2d-profile-pic':
            case 'match-3d-2d-face-portrait':
            case 'match-3d-2d-3rdparty-idphoto':
            case 'match-3d-2d-3rdparty-idphoto-low-quality':
                parameters = {
                    externalDatabaseRefID: this.externalId,
                    image: localStorage.getItem('image'),
                    minMatchLevel: localStorage.getItem('minMatchLevel')
                };

                this._BiometricService.match3d2d(parameters, this.tutorial.route).subscribe(response => {
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err.error.message);
                });
                break;

            case 'match-2d-2d':
                parameters = {
                    image0: localStorage.getItem('image0'),
                    image1: localStorage.getItem('image1'),
                    minMatchLevel: localStorage.getItem('minMatchLevel')
                };

                this._BiometricService.match2d2d(parameters).subscribe(response => {
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err.error.message);
                });
                break;
            case 'liveness-2d':
                parameters = {
                    image: localStorage.getItem('image')
                };

                this._BiometricService.liveness2d(parameters).subscribe(response => {
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err.error.message);
                });
                break;

            case 'estimate-age-2d':
                parameters = {
                    image: localStorage.getItem('image')
                };

                this._BiometricService.estimatedAge2d(parameters).subscribe(response => {
                    console.log(response.data)
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err.error.message);
                });
                break;

            case 'estimate-age-3d':
                parameters = {
                    externalDatabaseRefID: this.externalId,
                };

                this._BiometricService.estimatedAge3d(parameters).subscribe(response => {
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err.error.message);
                });
                break;
            case 'check-age-2d':
                parameters = {
                    image: localStorage.getItem('image'),
                    age: localStorage.getItem('age'),
                };

                this._BiometricService.checkAge2d(parameters).subscribe(response => {
                    console.log(response.data)
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err.error.message);
                });
                break;

            case 'check-age-3d':
                parameters = {
                    externalDatabaseRefID: this.externalId,
                    age: localStorage.getItem('age'),
                };

                this._BiometricService.checkAge3d(parameters).subscribe(response => {
                    this.successDemo(response.data)
                }, (err) => {
                    this.errorDemo(err.error.message);
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