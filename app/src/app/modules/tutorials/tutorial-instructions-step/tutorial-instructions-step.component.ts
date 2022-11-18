import {
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
        private translocoService: TranslocoService
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

        this.instructions = this.translocoService.translate(this.tutorial.instructions);

        switch (this.tutorial.route) {
            case 'liveness':
                this.livenessVariables = {
                    "faceScan": "...",
                    "auditTrailImage": "...",
                    "lowQualityAuditTrailImage": "..."
                };
                break;
            case 'enroll_face':
                this.enrollFaceVariables = {
                    "faceScan": "...",
                    "auditTrailImage": "...",
                    "lowQualityAuditTrailImage": "..."
                };
                break;
            case 'authenticate_face':
                this.authenticateVariables = {
                    "faceScan": "...",
                    "auditTrailImage": "...",
                    "lowQualityAuditTrailImage": "..."
                };

                break;
            case 'match_face_to_id': 
                this.matchFaceToIDVariables = {
                    "idScan": "...",
                    "idScanFrontImage": "...",
                    "idScanBackImage": "...",
                };
            case 'scan_ocr_id': 
                this.OCRVariables = {
                    "idScan": "...",
                    "idScanFrontImage": "...",
                    "idScanBackImage": "...",
                };
            break;
            default:
                break;
        }
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