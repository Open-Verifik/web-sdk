import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";
import { DemoService } from "app/modules/demo/demo.service";

import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { RouterLink } from "@angular/router";
import { IdScanningIOSComponent } from "app/modules/demo/id-scanning-ios/id-scanning-ios.component";
import { IdScanningComponent } from "app/modules/demo/id-scanning/id-scanning.component";
import { StepperComponent } from "app/modules/demo/stepper/stepper.component";
import { UploadFileComponent } from "app/modules/demo/upload-file/upload-file.component";
import { MatDialog } from "@angular/material/dialog";
import { KycDocumentUploaderComponent } from "../kyc-document-uploader/kyc-document-uploader.component";
import { Project, ProjectFlow } from "app/modules/auth/project";
import { KYCService } from "app/modules/auth/kyc.service";

@Component({
	selector: "kyc-document",
	templateUrl: "./kyc-document.component.html",
	styleUrls: ["./kyc-document.component.scss"],
	animations: fuseAnimations,
	standalone: true,
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
		UploadFileComponent,
	],
})
export class KycDocumentComponent implements OnInit {
	demoData: any;
	selectOption: string;
	appRegistration: any;
	project: Project;
	projectFlow: ProjectFlow;
	navigation: any;
	uploadSteps: Array<string>;
	scanSteps: Array<string>;

	constructor(private _demoService: DemoService, private dialog: MatDialog, private _KYCService: KYCService) {
		this.demoData = this._demoService.getDemoData();

		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		this.navigation = this._KYCService.getNavigation();

		this.selectOption = "";

		this._initSteps();
	}

	_initSteps(): void {
		this.uploadSteps = ["open_your_files_or_drop_it", "select_allowed_document", "confirm_upload"];

		this.scanSteps = ["get_your_document_in_place", "open_your_camera", "place_your_document_properly", "confirm_upload"];
	}

	ngOnInit(): void {
		this._demoService.getAddress();
	}

	openUploadFile() {
		const dialogRef = this.dialog.open(KycDocumentUploaderComponent, {
			width: "900px",
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (!result) return;

			if (result.documentValidation) {
				// TODO: work on the logic for the documentValidations attempts
				this.appRegistration.documentValidation = result.documentValidation;

				this._KYCService.navigateTo("next");

				return;
			}

			this.appRegistration.failedDocumentValidations.push(1);
		});
	}

	openCamera() {
		const attempts = this.appRegistration?.failedDocumentValidations?.length || 0;

		const attemptsLimit = this.projectFlow.onboardingSettings.document?.maxAttempts || 3;

		if (attempts >= attemptsLimit) {
			this.openUploadFile();

			return;
		}

		this.selectOption = "idscan";
	}
}
