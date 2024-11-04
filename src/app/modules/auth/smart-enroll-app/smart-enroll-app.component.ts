import { CommonModule, NgIf } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { AppRegistration, Project, ProjectFlow, ServiceType } from "../project";
import { SmartDocumentsComponent } from "./smart-documents/smart-documents.component";
import { KYCService } from "../kyc.service";

@Component({
	selector: "smart-enroll-app",
	templateUrl: "./smart-enroll-app.component.html",
	styleUrls: ["smart-enroll-app.component.scss"],
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
		SmartDocumentsComponent,
		TranslocoModule,
	],
})
export class SmartEnrollAppComponent {
	@Input('service') service: ServiceType;

	appRegistration: AppRegistration;
	project: Project;
	projectFlow: ProjectFlow;
    year: number = new Date().getFullYear();

    constructor(private _KYCService: KYCService) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;
	}
}
