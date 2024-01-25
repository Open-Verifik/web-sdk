import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog } from "@angular/material/dialog";
import { RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { KYCService } from "app/modules/auth/kyc.service";
import { Project, ProjectFlow } from "app/modules/auth/project";
import { DemoService } from "app/modules/demo/demo.service";
import { IdScanningIOSComponent } from "app/modules/demo/id-scanning-ios/id-scanning-ios.component";
import { IdScanningComponent } from "app/modules/demo/id-scanning/id-scanning.component";
import { StepperComponent } from "app/modules/demo/stepper/stepper.component";

@Component({
	selector: "kyc-document-review",
	templateUrl: "./kyc-document-review.component.html",
	styleUrls: ["./kyc-document-review.component.scss"],
	standalone: true,
	animations: fuseAnimations,
	imports: [
		FlexLayoutModule,
		RouterLink,
		MatCheckboxModule,
		MatButtonModule,
		StepperComponent,
		IdScanningIOSComponent,
		IdScanningComponent,
		CommonModule,
		TranslocoModule,
	],
})
export class KycDocumentReviewComponent implements OnInit {
	demoData: any;
	selectOption: string;
	appRegistration: any;
	project: Project;
	projectFlow: ProjectFlow;
	navigation: any;
	generalInfoLoaded: boolean;
	locationLoaded: boolean;
	locationLoading: boolean;
	extractedData: any;
	documentFrontSideUrl: string;

	constructor(private _demoService: DemoService, private dialog: MatDialog, private _KYCService: KYCService) {
		this.demoData = this._demoService.getDemoData();

		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		this.navigation = this._KYCService.getNavigation();

		this.selectOption = "";

		this.extractedData = [];
	}

	ngOnInit(): void {
		this._demoService.getAddress();

		this._setExtractedData();
	}

	_setExtractedData(): void {
		for (const key in this.appRegistration.documentValidation.OCRExtraction) {
			if (!Object.prototype.hasOwnProperty.call(this.appRegistration.documentValidation.OCRExtraction, key)) this.continue;

			const value = this.appRegistration.documentValidation.OCRExtraction[key];

			if (value === null || value === undefined || value === "") continue;

			this.extractedData.push({ key, value });
		}

		this.documentFrontSideUrl = this.appRegistration.documentValidation.url;
	}

	hasGeneralInformation(): boolean {
		if (this.generalInfoLoaded) return true;

		if (this.demoData.generalInformation.length) {
			this.generalInfoLoaded = true;

			return this.generalInfoLoaded;
		}
	}

	async hasLocation(): Promise<boolean> {
		if (this.locationLoaded && this.demoData.lat && this.demoData.lng) return true;

		if (this.locationLoading || !this.demoData.lat || !this.demoData.lng) {
			return false;
		}

		if (this.demoData.location.length) return true;

		this.locationLoading = true;

		const location = await this._demoService.getAddress();

		if (location) this.locationLoaded = true;
	}

	continue(): void {
		this._KYCService.navigateTo("next");
	}

	scanAgain(): void {
		this.appRegistration.documentValidation = null;

		this.appRegistration.forceUpload = true;

		this._KYCService.navigateTo("document");
	}
}
