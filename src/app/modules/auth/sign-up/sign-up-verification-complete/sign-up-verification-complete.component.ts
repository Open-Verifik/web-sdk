import { CommonModule, NgIf } from "@angular/common";
import { Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation } from "@angular/core";
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

import { AppRegistration, Project, ProjectFlow, ServiceType } from "../../project";
import { KYCService } from "../../kyc.service";

@Component({
	selector: "auth-sign-up-verification-complete",
	templateUrl: "./sign-up-verification-complete.component.html",
	styleUrls: ["../../sign-in/sign-in.scss"],
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
	
	@Output('onServiceChange') onServiceChange: EventEmitter<ServiceType> = new EventEmitter<ServiceType>()
	
	agreementForm: UntypedFormGroup;
	appRegistration: AppRegistration;
	project: Project;
	projectFlow: ProjectFlow;
	welcomeStyle: number = 0;

    constructor(
		private _formBuilder: UntypedFormBuilder,
		private _KYCService: KYCService,
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

		if (this.projectFlow.onboardingSettings.steps) {
			const steps = this.projectFlow.onboardingSettings.steps;

			if (steps.document === 'skip' && steps.liveness === 'skip') {
				this.welcomeStyle = 2;
			} else if (steps.document === 'skip') {
				this.welcomeStyle = 1;
			} else {
				this.welcomeStyle = 0;
			}
		}
	}

	ngOnInit(): void {
        this._initForm();
    }

	private _initForm(): void {
        this.agreementForm = this._formBuilder.group({ agreement: ["", Validators.requiredTrue] });
	}

	goToKYCApp(service: ServiceType): void {
		this.onServiceChange.next(service);
	}

	skipDocument(): void {
		this.welcomeStyle = 1;
	}

	skipBiometrics(): void {
		this.welcomeStyle = 2;
	}

	skipDocumentAndBiometrics(): void {
		this.onServiceChange.next('results');
	}
}