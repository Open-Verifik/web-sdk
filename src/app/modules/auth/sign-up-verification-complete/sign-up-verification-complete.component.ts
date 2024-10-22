import { CommonModule, NgIf } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { RouterLink } from "@angular/router";
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";

import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";

import { AppRegistration, Project } from "../project";

@Component({
	selector: "auth-sign-up-verification-complete",
	templateUrl: "./sign-up-verification-complete.component.html",
	styleUrls: ["../sign-in/sign-in.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		MatButtonModule,
		MatCheckboxModule,
		MatChipsModule,
		MatFormFieldModule,
		MatIconModule,
		NgIf,
		ReactiveFormsModule,
		RouterLink,
		TranslocoModule,
	],
})
export class AuthSignUpVerificationCompleteComponent implements OnInit {
	@ViewChild("agreementNgForm") agreementNgForm: NgForm;

    @Input('project') project: Project;
    @Input('appRegistration') appRegistration: AppRegistration;

	@Output('onServiceChange') onServiceChange: EventEmitter<boolean> = new EventEmitter<boolean>()

    agreementForm: UntypedFormGroup;
    welcomeStyle: number = 0;

    constructor(
		private _formBuilder: UntypedFormBuilder,
    ) {}

	ngOnInit(): void {
        this._initForm();
    }

	_initForm(): void {
        this.agreementForm = this._formBuilder.group({ agreement: ["", Validators.requiredTrue] });
	}

	goToKYCApp(): void {
		this.onServiceChange.next(true);
	}

	skipDocumentUpload(): void {
		this.welcomeStyle = 1;
	}
}