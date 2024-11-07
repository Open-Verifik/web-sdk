import { CommonModule, NgIf } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Project, ProjectFlow } from "../../project";
import { KYCService } from "../../kyc.service";
import { EnrollDocumentMethod, EnrollSettings, EnrollStep, SmartEnrollService } from "../smart-enroll.service";
import { Subscription } from "rxjs";

@Component({
	selector: "smart-stepper",
	templateUrl: "./smart-stepper.component.html",
	styleUrls: ["../smart-enroll.component.scss", "../../sign-up/sign-up.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
        CommonModule,
        FlexLayoutModule,
        MatIconModule,
        NgIf,
        TranslocoModule,
	],
})
export class SmartStepperComponent {

	private _smartEnrollSettingsSubscription = new Subscription();

    currentStep: EnrollStep;
    method: EnrollDocumentMethod;
    project: Project;
    projectFlow: ProjectFlow;

    constructor(
		private _smartEnrollService: SmartEnrollService,
        private _KYCService: KYCService,
    ) {
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

        const settings = this._smartEnrollService.enrollSettings;

        this.currentStep = settings.currentStep;
        this.method = settings.documentMethod;

		this._smartEnrollSettingsSubscription = this._smartEnrollService.enrollSettings$.subscribe({
			next: (enrollSettings) => this.onSettingsChange(enrollSettings)
		});
    }

    ngOnDestroy() {
        this._smartEnrollSettingsSubscription.unsubscribe();
    }

	onSettingsChange(settings: EnrollSettings) {
        this.currentStep = settings.currentStep;
        this.method = settings.documentMethod;
	}
}
