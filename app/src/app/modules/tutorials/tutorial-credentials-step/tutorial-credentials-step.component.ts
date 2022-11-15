import {
    Component,
    OnDestroy,
    OnInit
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators
} from '@angular/forms';
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
    takeUntil
} from 'rxjs/operators';
import {
    TutorialsService
} from '../tutorials.service';

@Component({
    selector: 'app-tutorial-credentials-step',
    templateUrl: './tutorial-credentials-step.component.html',
    styleUrls: ['./tutorial-credentials-step.component.scss']
})
export class TutorialCredentialsStepComponent implements OnInit, OnDestroy {
    navData: any;
    tutorial: any;
    instructions: any;
    groupFields: any;
    credentialsForm: FormGroup;
    step = 1;

    private _unsubscribeAll: Subject < any > = new Subject < any > ();

    constructor(
        private _route: ActivatedRoute,
        private _tutorialService: TutorialsService,
        private translocoService: TranslocoService,
        private _formBuilder: FormBuilder,
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

        this._initForm();
    }

    _initForm(): void {
        this.groupFields = {

        };

        for (let index = 0; index < this.tutorial.requiredFields.length; index++) {
            const requiredField = this.tutorial.requiredFields[index];

            this.groupFields[requiredField.key] = ['', Validators.required];
        }

        this.credentialsForm = this._formBuilder.group(this.groupFields);
    }

    _observeNavigationChanges(): void {
        this._tutorialService.navigationHandler$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((changes: any) => {
                if (!changes || this.navData.currentStep !== this.step || !this.credentialsForm ||  !this.credentialsForm.valid) return;

                const keys = Object.keys(this.credentialsForm.value);

                for (let index = 0; index < keys.length; index++) {
                    const key = keys[index];
                    
                    localStorage.setItem(key, this.credentialsForm.value[key]);
                }

                this.navData.currentStep += changes.variable;
            });
    }
}