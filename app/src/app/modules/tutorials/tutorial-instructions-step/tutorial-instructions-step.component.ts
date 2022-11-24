import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit
} from '@angular/core';
import {
    ActivatedRoute
} from '@angular/router';
import {
    TranslocoService
} from '@ngneat/transloco';
import {
    Subject
} from 'rxjs';
import {
    skip,
    takeUntil
} from 'rxjs/operators';
import {
    TutorialsService
} from '../tutorials.service';

@Component({
    selector: 'app-tutorial-instructions-step',
    templateUrl: './tutorial-instructions-step.component.html',
    styleUrls: ['./tutorial-instructions-step.component.scss']
})
export class TutorialInstructionsStepComponent implements OnInit, OnDestroy {
    navData: any;
    step = 0;
    tutorial: any;
    instructions: any;
    private _unsubscribeAll: Subject < any > = new Subject < any > ();
    livenessVariables: any;
    enrollFaceVariables: any;
    authenticateVariables: any;
    matchFaceToIDVariables: any;
    OCRVariables: any;

    constructor(
        private _route: ActivatedRoute,
        private _tutorialService: TutorialsService,
        private translocoService: TranslocoService,
        private _changeDetectorRef: ChangeDetectorRef,

    ) {
        this.navData = this._tutorialService.navData;
    }

    ngOnInit(): void {
        this._observeNavigationChanges();

        this._getTutorial();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
    }

    async _getTutorial(): Promise < any > {
        const routeParams = await this._route.params['_value'];

        this.tutorial = this._tutorialService.getTutorial(routeParams.id);

        this.instructions = this.translocoService.translateObject(`tutorials.${this.tutorial.route}.instructions`);
        
    }

    _observeNavigationChanges(): void {
        this._tutorialService.navigationHandler$
            .pipe(takeUntil(this._unsubscribeAll))
            .pipe(skip(1))
            .subscribe((changes: any) => {
                if (!changes || this.navData.currentStep !== this.step || changes.variable === -1) return;

                this.navData.currentStep += changes.variable;
            });
    }
}