import { CommonModule, NgIf } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Project, ProjectFlow } from "../../project";
import { KYCService } from "../../kyc.service";

@Component({
	selector: "smart-enroll-stepper",
	templateUrl: "./smart-enroll-stepper.component.html",
	styleUrls: ["../smart-enroll-app.component.scss", "../../sign-up/sign-up.component.scss"],
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
export class SmartDocumentsComponent {
    @Input('stepIndex') stepIndex: number;
    @Input('method') method: ''|'upload'|'scan';

    project: Project;
    projectFlow: ProjectFlow;

    constructor(
        private _KYCService: KYCService,
    ) {
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;
    }

    isActiveStep(step: number): boolean {
        return step === this.stepIndex;
    }
}
