import {
    Component,
    OnInit,
    ViewChild,
    ChangeDetectorRef,
    OnDestroy
} from '@angular/core';
import {
    MatTabGroup
} from '@angular/material/tabs';
import {
    Project
} from 'app/modules/models';
import {
    Subject
} from 'rxjs';
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
    TutorialsService
} from '../tutorials.service';

@Component({
    selector: 'app-tutorial',
    templateUrl: './tutorial.component.html',
    styleUrls: ['./tutorial.component.scss']
})
export class TutorialComponent implements OnInit, OnDestroy {
    @ViewChild('projectSteps', {
        static: true
    }) projectSteps: MatTabGroup;

    project: Project;

    sideMenuSteps: Array < any > ;

    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    categories = [];
    currentStep: number = 0;
    navData: any;
    tutorial: any;

    private _unsubscribeAll: Subject < any > = new Subject < any > ();

    constructor(
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _route: ActivatedRoute,
        private _tutorialService: TutorialsService,
        private _router: Router,
        private _fuseConfirmationService: FuseConfirmationService,
        private translocoService: TranslocoService
    ) {
        this.navData = this._tutorialService.navData;
        
        this.navData.currentStep = 0;
    }

    ngOnInit(): void {
        this._getTutorial();

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

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        
        this._tutorialService.navData = {
            currentStep: 0
        };

        this._tutorialService.undefineNavigation();
    }


    async _getTutorial(): Promise < any > {
        const routeParams = await this._route.params['_value'];

        this.tutorial = this._tutorialService.getTutorial(routeParams.id);

        if(!this.tutorial){
            return
        }

        this.sideMenuSteps = this.tutorial.sideMenuSteps;
    }

    goToNextStep(): void {
        if (this.navData.currentStep < this.tutorial.sideMenuSteps.length -1) this._tutorialService.navigationChange({
            variable: +1,
        });
    }

    goToPreviousStep(): void {        
        if (this.navData.currentStep > 0) this._tutorialService.navigationChange({
            variable: -1,
        });
    }

    trackByFn(): void {}

    deleteProject(): void {}
}