import { CommonModule, NgIf } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from '@angular/material/card';
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { AppRegistration, Project, ProjectFlow } from "../../project";
import { SmartUploadComponent } from "./smart-upload/smart-upload.component";

@Component({
	selector: "smart-documents",
	templateUrl: "./smart-documents.component.html",
	styleUrls: ["../smart-enroll-app.component.scss", "../../sign-up/sign-up.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		LanguagesComponent,
		MatButtonModule,
		NgIf,
		ReactiveFormsModule,
		SmartUploadComponent,
		TranslocoModule,
        MatCardModule,
        MatIconModule,
	],
})
export class SmartDocumentsComponent {
    @Input('appRegistration') appRegistration: AppRegistration;
    @Input('project') project: Project;
    @Input('projectFlow') projectFlow: ProjectFlow;

    selectedMethod: string = '';

    constructor() {}

    getBackgroundGradient() {
        if (!this.project.branding.buttonColor) return `linear-gradient(34deg, rgba(0,0,0,0) 25%, rgba(0,0,0,0.2) 120%`;

        return `linear-gradient(34deg, rgba(0,0,0,0) 25%, ${this.project.branding.buttonColor} 230%)`;
    }
}
