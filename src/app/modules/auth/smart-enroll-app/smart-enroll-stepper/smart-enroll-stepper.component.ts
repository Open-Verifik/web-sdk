import { CommonModule, NgIf } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Project } from "../../project";

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
    @Input('project') project: Project;
    @Input('stepIndex') stepIndex: number;

    isActiveStep(step: number): boolean {
        return step === this.stepIndex;
    }
}
