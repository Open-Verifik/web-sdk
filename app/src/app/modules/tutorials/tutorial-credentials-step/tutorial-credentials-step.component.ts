import {
    ChangeDetectorRef,
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
    skip,
    takeUntil
} from 'rxjs/operators';
import {
    TutorialsService
} from '../tutorials.service';
import { errorHandlerComponent } from '../error-handler.component';

import {
    v4 as uuidv4
} from 'uuid';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    
    previewImg: boolean;

    images: any[] = [];

    constructor(
        private _route: ActivatedRoute,
        private _tutorialService: TutorialsService,
        private translocoService: TranslocoService,
        private _formBuilder: FormBuilder,
        private _snackBar: MatSnackBar,
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

    errorHandler(message, type, timer = 2000): void {
        this._snackBar.openFromComponent(errorHandlerComponent, {
            data: message,
            duration: timer,
            panelClass: [type === 'error' ? 'redError' : 'blueSuccess']
        });
    }

    async _getTutorial(): Promise < any > {
        const routeParams = await this._route.params['_value'];

        this.tutorial = this._tutorialService.getTutorial(routeParams.id);

        this._initForm();
    }

    _initForm(): void {
        this.groupFields = {};
        
        const needsGetLocalstorageData = !['enrollment-3d','match-3d-2d-idscan'].includes(this.tutorial.route);

        for (let index = 0; index < this.tutorial.fields.length; index++) {
            const field = this.tutorial.fields[index];
        
            const dataFromStorage = needsGetLocalstorageData || field.key === 'clientToken' ? localStorage.getItem(field.key) : undefined;

            this.groupFields[field.key] = [ dataFromStorage, field.required ? Validators.required : null];
        }   

        for (let index = 0; index < this.tutorial.images?.length; index++) {
            const image = this.tutorial.images[index];

            this.groupFields[image.key] = [, image.required ? Validators.required : null];

            this.images[image.key] = './assets/images/camera.png';
        }

        this.credentialsForm = this._formBuilder.group(this.groupFields);
    }

    generateUID(): void {
        this.credentialsForm.controls.externalDatabaseRefId.setValue(uuidv4());
    }

    _observeNavigationChanges(): void {
        this._tutorialService.navigationHandler$
            .pipe(takeUntil(this._unsubscribeAll))
            .pipe(skip(1))
            .subscribe((changes: any) => {
                if (!changes || this.navData.currentStep !== this.step || !this.credentialsForm || (!this.credentialsForm.valid && changes.variable === 1)){
                    this.errorHandler(this.translocoService.translate(`error.credentials`, {}), 'error', 5000);
                    return;
                } 

                const keys = Object.keys(this.credentialsForm.value);

                for (let index = 0; index < keys.length; index++) {
                    const key = keys[index];
                    if( this.credentialsForm.value[key] &&  !['undefined', 'null', null, undefined].includes(this.credentialsForm.value[key]) ){
                        try {
                            localStorage.setItem(key, this.credentialsForm.value[key]);
                        } catch (error) {
                            this.errorHandler(this.translocoService.translate(`errors.imageToBig`, {}), 'error', 5000)
                            return
                        }
                    }else{
                        localStorage.removeItem(key);
                    }
                }

                this.navData.currentStep += changes.variable;
            });
    }

    fileChange(file, key): void {
        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onloadend = (e) => {
            let data = reader.result.toString();

            this.images[key] = data

            this.credentialsForm.controls[key].setValue(data.split('base64,')[1])

            this._changeDetectorRef.markForCheck();
        };
    }

    click(key): void {
        document.getElementById(key).click()
    }
}