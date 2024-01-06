import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Project, ProjectFlow } from "../../project";
import { KYCService } from "../../kyc.service";

@Component({
	selector: "kyc-instructions",
	templateUrl: "./kyc-instructions.component.html",
	styleUrls: ["./kyc-instructions.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [FlexLayoutModule, TranslocoModule, CommonModule, MatCheckboxModule, MatButtonModule],
})
export class KycInstructionsComponent implements OnInit, OnDestroy {
	appRegistration: any;
	project: Project;
	projectFlow: ProjectFlow;
	navigation: any;
	steps: any;

	constructor(private _KYCService: KYCService) {
		this.appRegistration = this._KYCService.appRegistration;
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;
		this.navigation = this._KYCService.getNavigation();
		this.steps = [];
	}

	ngOnInit(): void {
		console.log(this.appRegistration, this.project, this.projectFlow, this.navigation);

		this.defineStepsAndInstrutions();
	}

	defineStepsAndInstrutions(): void {
		if (this.appRegistration.documentValidation && this.navigation.map.document) {
			this._KYCService.navigateTo("document");
		}

		if (this.appRegistration.biometricValidation && this.navigation.map.liveness) {
			this._KYCService.navigateTo("liveness");
		}
	}

	ngOnDestroy(): void {}

	startKYC(): void {
		this._KYCService.navigateTo(this.navigation.displayableSteps[0].code);
	}
}
