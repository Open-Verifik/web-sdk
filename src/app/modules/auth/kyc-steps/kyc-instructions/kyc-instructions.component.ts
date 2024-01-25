import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Project, ProjectFlow } from "../../project";
import { KYCService } from "../../kyc.service";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

@Component({
	selector: "kyc-instructions",
	templateUrl: "./kyc-instructions.component.html",
	styleUrls: ["./kyc-instructions.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		FlexLayoutModule,
		TranslocoModule,
		CommonModule,
		MatCheckboxModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		ReactiveFormsModule,
		MatSelectModule,
	],
})
export class KycInstructionsComponent implements OnInit, OnDestroy {
	appRegistration: any;
	project: Project;
	projectFlow: ProjectFlow;
	navigation: any;
	steps: any;
	acceptanceForm: FormGroup;

	constructor(private _KYCService: KYCService, private _formBuilder: FormBuilder) {
		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		this.navigation = this._KYCService.getNavigation();

		this.steps = [];
	}

	ngOnInit(): void {
		this.defineStepsAndInstrutions();

		this.acceptanceForm = this._formBuilder.group({
			legalAgreement: [false],
		});

		console.log({ initForm: this.acceptanceForm });
	}

	defineStepsAndInstrutions(): void {
		if (this.appRegistration.person && this.appRegistration.biometricValidation && this.appRegistration.documentValidation) {
			this._KYCService.navigateTo("documentLivenessReview");
		} else if (this.appRegistration.documentValidation && this.navigation.map.document) {
			this._KYCService.navigateTo("documentReview");
		}
	}

	ngOnDestroy(): void {}

	startKYC(): void {
		this._KYCService.navigateTo(this.navigation.displayableSteps[0].code);
	}

	invalidForm(): boolean {
		return !Boolean(this.acceptanceForm.value.legalAgreement);
	}
}
