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

@Component({
    selector: 'app-tutorial-demo-step',
    templateUrl: './tutorial-demo-step.component.html',
    styleUrls: ['./tutorial-demo-step.component.scss']
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
                this.errorLogin(error);
                this.biometricsReady = false;
                this._biometric.startSession();
            });

        const success = (response) => {
            localStorage.setItem(this.tutorial.route, JSON.stringify(response, null, 2))
            this._tutorialService.navData.currentStep = 3
        }

        this._biometric.onboardingBiometric$
            .pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe(success);

        this._biometric.onboardingScan$
            .pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe(success);

        this._biometric.liveness$
            .pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe(success);

        this._biometric.auth$
            .pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe(success);
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
    }

    async _getTutorial(): Promise < any > {
        const routeParams = await this._route.params['_value'];

        this.tutorial = this._tutorialService.getTutorial(routeParams.id);
    }

    startBiometrics(): void {
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

        }
    }

    errorLogin(error: string) {
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