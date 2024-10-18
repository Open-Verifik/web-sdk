import { CommonModule, NgIf } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { AppRegistration, Project } from "../../../project";

@Component({
	selector: "smart-scan",
	templateUrl: "./smart-scan.component.html",
	styleUrls: ["../../smart-enroll-app.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		LanguagesComponent,
		MatButtonModule,
		MatIconModule,
		NgIf,
		ReactiveFormsModule,
		TranslocoModule,
	],
})
export class SmartScanComponent {
    @Input('appRegistration') appRegistration: AppRegistration;
    @Input('project') project: Project;

    constructor() {}
}
