import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';
import {
    Subject
} from 'rxjs';
import {
    KycService
} from '../kyc.service';
import {
    FuseMediaWatcherService
} from '@fuse/services/media-watcher';
import {
    ActivatedRoute,
    Router
} from '@angular/router';
import {
    FuseConfirmationService
} from '@fuse/services/confirmation';
import {
    TranslocoService
} from '@ngneat/transloco';
import {
    takeUntil
} from 'rxjs/operators';
import {
    MatTabGroup
} from '@angular/material/tabs';
import {
    ProjectModel,
    ProjectFlowModel,
    AppRegistrationModel
} from 'app/modules/models';

@Component({
    selector: 'app-kyc-project',
    templateUrl: './kyc-project.component.html',
    styleUrls: ['./kyc-project.component.scss']
})
export class KycProjectComponent implements OnInit, OnDestroy {
    @ViewChild('projectSteps', {
        static: true
    }) projectSteps: MatTabGroup;

    project: ProjectModel;

    projectFlow: ProjectFlowModel;

    appRegistration: AppRegistrationModel;

    sideMenuSteps = [{
            order: 0,
            title: 'kyc.steps.title_1',
            subtitle: 'kyc.steps.description_1',
        }, {
            order: 1,
            title: 'kyc.steps.title_2',
            subtitle: 'kyc.steps.description_2',
        },
        {
            order: 2,
            title: 'kyc.steps.title_3',
            subtitle: 'kyc.steps.description_3',
        }
    ];

    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    categories = [];
    currentStep: number = 0;
    navData: any;

    private _unsubscribeAll: Subject < any > = new Subject < any > ();

    constructor(private _changeDetectorRef: ChangeDetectorRef,
        private _KycService: KycService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _fuseConfirmationService: FuseConfirmationService,
        private translocoService: TranslocoService
    ) {
        this.navData = this._KycService.navData;
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
    }

    ngOnInit(): void {
        this._ObserveProject();

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({
                matchingAliases
            }) => {
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                } else {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    _ObserveProject(): void {
        this._KycService.currentAppRegistration$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((appRegistration: AppRegistrationModel) => {
                this.appRegistration = appRegistration;

                this.project = appRegistration.project;

                this.projectFlow = appRegistration.projectFlow;

                if (this.project) {
                    this._initNavTab();
                    this._changeDetectorRef.markForCheck();
                }

            });
    }

    _initNavTab(): void {
        if (!this.project) {
            return;
        }
        if(!this.projectFlow.onboardingSettings.form){
        //    delete this.sideMenuSteps.find(step => step.order == 2);
            this.sideMenuSteps.pop()
            this._changeDetectorRef.markForCheck();
        }
    }

    goToNextStep(): void {
        if (this._KycService.navData.currentStep > this.sideMenuSteps.length - 1) {
            return;
        };

        this.goToStep(this._KycService.navData.currentStep + 1);
    }

    goToPreviousStep(): void {
        if (this._KycService.navData.currentStep === 0) return;

        this.goToStep(this._KycService.navData.currentStep - 1);
    }

    goToStep(step): void {
        if (step === undefined || this._KycService.navData.currentStep === step) return;

        this._KycService.navigationChange({
            projectSteps: this.projectSteps,
            stepToGo: step,
        });

        this._changeDetectorRef.markForCheck();
    }

    trackByFn(element): void {}

    tempFunction(): void {}
}