import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog } from "@angular/material/dialog";
import { RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { KYCService } from "app/modules/auth/kyc.service";
import { Project, ProjectFlow } from "app/modules/auth/project";
import { DemoService } from "app/modules/demo/demo.service";
import { IdScanningIOSComponent } from "app/modules/demo/id-scanning-ios/id-scanning-ios.component";
import { IdScanningComponent } from "app/modules/demo/id-scanning/id-scanning.component";
import { StepperComponent } from "app/modules/demo/stepper/stepper.component";
import { KycStepperComponent } from "../kyc-stepper/kyc-stepper.component";

@Component({
	selector: "kyc-document-liveness-review",
	templateUrl: "./kyc-document-liveness-review.component.html",
	styleUrls: ["./kyc-document-liveness-review.component.scss"],
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
		KycStepperComponent,
	],
})
export class KycDocumentLivenessReviewComponent implements OnInit {
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
	face: string;
	documentFace: string;
	compareMinScore: number;
	livenessMinScore: number;
	basicInformation: any;

	constructor(private _demoService: DemoService, private _translocoService: TranslocoService, private _KYCService: KYCService) {
		this.demoData = this._demoService.getDemoData();

		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		this.compareMinScore = this.projectFlow.onboardingSettings.document.compareMinScore;

		this.livenessMinScore = this.projectFlow.onboardingSettings.liveness.livenessMinScore;

		this.navigation = this._KYCService.getNavigation();

		this.selectOption = "";

		this.extractedData = [];
	}

	ngOnInit(): void {
		this._demoService.getAddress();

		this._extractBasicInformation();

		this._setExtractedData();

		this._requestIdentityImages();
	}

	_extractBasicInformation(): void {
		if (!this.appRegistration.informationValidation?._id) {
			return;
		}

		this.basicInformation = [];

		if (this.appRegistration.informationValidation.fullName) {
			this.basicInformation.push({
				key: "extracted_information.fullName",
				value: this.appRegistration.informationValidation.fullName,
			});
		} else {
			this.basicInformation.push({
				key: "extracted_information.firstName",
				value: this.appRegistration.informationValidation.firstName,
			});

			this.basicInformation.push({
				key: "extracted_information.lastName",
				value: this.appRegistration.informationValidation.lastName,
			});
		}

		if (this.appRegistration.emailValidation?._id) {
			this.basicInformation.push({
				key: "login.email",
				value: this.appRegistration.emailValidation.email,
			});
		}

		if (this.appRegistration.phoneValidation?._id) {
			this.basicInformation.push({
				key: "login.phone",
				value: `${this.appRegistration.phoneValidation.countryCode} ${this.appRegistration.phoneValidation.phone}`,
			});
		}

		if (this.appRegistration.informationValidation?.company) {
			this.basicInformation.push({
				key: "signup.company",
				value: `${this.appRegistration.informationValidation.company}`,
			});
		}

		if (this.appRegistration.informationValidation?.role) {
			this.basicInformation.push({
				key: "signup.role",
				value: this._translocoService.translate(`signup.roles.${this.appRegistration.informationValidation.role}`),
			});
		}
	}

	_setExtractedData(): void {
		if (!this.appRegistration.documentValidation?.OCRExtraction) return;

		for (const key in this.appRegistration.documentValidation.OCRExtraction) {
			if (!Object.prototype.hasOwnProperty.call(this.appRegistration.documentValidation.OCRExtraction, key)) this.continue;

			const value = this.appRegistration.documentValidation.OCRExtraction[key];

			if (value === null || value === undefined || value === "") continue;

			this.extractedData.push({ key, value });
		}

		this.documentFrontSideUrl = this.appRegistration.documentValidation.url;
	}

	_requestIdentityImages(): void {
		const identityImages = [];

		if (this.appRegistration.face) {
			identityImages.push(this.appRegistration.face);
		}

		if (this.appRegistration.documentFace) {
			identityImages.push(this.appRegistration.documentFace);
		}

		if (identityImages.length) {
			this._extractFaces(identityImages);

			this._compareFaces();

			return;
		}

		this._KYCService.getIdentityImages({}).subscribe({
			next: (response) => {
				this._extractFaces(response.data);

				this._compareFaces();
			},
			error: (exception) => {
				console.error({ exception });
			},
			complete: () => {},
		});
	}

	/**
	 * Extract faces
	 * @param arrayOfImages
	 * @author Miguel Trevino
	 */
	_extractFaces(arrayOfImages): void {
		for (let index = 0; index < arrayOfImages.length; index++) {
			const identityImage = arrayOfImages[index];

			if (identityImage.category === "face" || this.appRegistration.face?._id === identityImage._id) {
				this.face = identityImage;
				this.face["base64"] = `data:image/jpeg;base64,${identityImage.base64}`;
				console.log(this.face);
				const splittedString = this.face["base64"].split("data:image/jpeg;base64,");
				if (splittedString.length === 3) {
					this.face["base64"] = identityImage.base64.replace("data:image/jpeg;base64,", "");
				}
				console.log(this.face);
				this.appRegistration.face = this.face;
			}

			if (identityImage.category === "documentFace" || this.appRegistration.documentFace?._id === identityImage._id) {
				this.documentFace = identityImage;

				this.appRegistration.documentFace = this.documentFace;
			}
		}
	}

	/**
	 * compare faces
	 * @returns mixed
	 * @author Miguel Trevino
	 */
	_compareFaces(): void {
		if (this.appRegistration.compareFaceVerification || !this.appRegistration.documentValidation) return;

		this._KYCService.compareFaces().subscribe({
			next: (response) => {
				//TODO @miguel
				this.appRegistration.compareFaceVerification = response.data.compareFaceVerification;

				console.info("Verifik: comparison completed");
			},
			error: (exception) => {},
			complete: () => {},
		});
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

	doLivenessAgain(): void {
		this._KYCService.restartKYC().subscribe({
			next: (response) => {
				this.appRegistration.biometricValidation = null;

				this.appRegistration.person = null;

				this.appRegistration.documentValidation = null;
			},
			error: (exception) => {
				console.error({ exception });
			},
			complete: () => {
				this._KYCService.navigateTo("document");
			},
		});
	}
}
