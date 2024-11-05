import { CommonModule, NgIf } from "@angular/common";
import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from '@angular/material/card';
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { AppRegistration, Project, ProjectFlow, ServiceType } from "../../project";
import { SmartUploadComponent } from "./smart-upload/smart-upload.component";
import { Subject } from "rxjs";
import { KYCService } from "../../kyc.service";

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
export class SmartDocumentsComponent implements OnChanges {
	@Input('service') service: ServiceType;

	appRegistration: AppRegistration;
	project: Project;
	projectFlow: ProjectFlow;
	stepRedirection: Subject<number> = new Subject<number>();
    selectedMethod: string = '';

    constructor(private _KYCService: KYCService) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.service?.currentValue) {
			if (this.projectFlow.onboardingSettings.document.scanDocumentAllowed && this.projectFlow.onboardingSettings.document.uploadDocumentAllowed) {
				this.selectedMethod = changes.service?.currentValue === 'document' ? '' : 'scan';
			} else if (this.projectFlow.onboardingSettings.document.scanDocumentAllowed) {
				this.selectedMethod = 'scan';
			} else if (this.projectFlow.onboardingSettings.document.uploadDocumentAllowed) {
				this.selectedMethod = 'upload';
			}

			setTimeout(() => {
				this.stepRedirection.next(changes.service?.currentValue === 'document' ? 1 : 5);
			}, 0);
		}
	}

    getBackgroundGradient() {
        if (!this.project.branding.buttonColor) return `linear-gradient(34deg, rgba(0,0,0,0) 25%, rgba(0,0,0,0.2) 120%`;

        return `linear-gradient(34deg, rgba(0,0,0,0) 25%, ${this.project.branding.buttonColor} 230%)`;
    }
}
