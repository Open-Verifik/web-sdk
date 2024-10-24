import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
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
import { environment } from "environments/environment";
import { catchError, forkJoin, map, of } from "rxjs";

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
	completed: boolean;

	constructor(
		private _demoService: DemoService,
		private dialog: MatDialog,
		private _KYCService: KYCService,
		private _changeDetectorRef: ChangeDetectorRef
	) {
		this.completed = false;

		this.demoData = this._demoService.getDemoData();

		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		this.navigation = this._KYCService.getNavigation();

		this.selectOption = "";

		this.extractedData = [];

		this.sendDocumentValidationAndNameValidation();
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
		if (this.projectFlow.onboardingSettings.steps.liveness === "skip") {
			this._KYCService.navigateTo("end");
			return;
		}
		this._KYCService.navigateTo("next");
	}

	scanAgain(): void {
		this.appRegistration.documentValidation = null;

		this.appRegistration.forceUpload = true;

		this._KYCService.navigateTo("document");
	}

	sendDocumentValidationAndNameValidation(): void {
		const settings = this.projectFlow.onboardingSettings.document;
		const observables = [];

		if (settings.verifyNames) {
			const payload = {
				_id: this.appRegistration.documentValidation._id,
				force: true,
			};

			observables.push(
				this._KYCService.updateDocumentValidationNameValidation(payload).pipe(
					map((result) => ({ status: "fulfilled", value: result })),
					catchError((error) => of({ status: "rejected", reason: error }))
				)
			);
		}

		if (settings.verifyCriminalHistory) {
			const payload = {
				_id: this.appRegistration.informationValidation._id,
				force: environment.production,
			};

			observables.push(
				this._KYCService.updateInformationValidationWithCriminalRecords(payload).pipe(
					map((result) => ({ status: "fulfilled", value: result })),
					catchError((error) => of({ status: "rejected", reason: error }))
				)
			);
		}
		if (observables.length === 0) {
			this.completed = true;
			this._changeDetectorRef.markForCheck();
			return;
		}
		forkJoin(observables).subscribe(
			(results) => {
				results.forEach((result) => {
					if (result.status === "fulfilled") {
						console.log("Observable fulfilled:", { result });
					} else {
						console.error("Observable rejected:", { result });
					}
				});

				this.completed = true;
				this._changeDetectorRef.markForCheck();
			},
			(error) => {
				console.error("Unexpected error occurred:", error);
			}
		);
	}
}
