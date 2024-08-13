import { Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule } from "@ngneat/transloco";
import { DemoService } from "app/modules/demo/demo.service";
import { UploadFileComponent } from "app/modules/demo/upload-file/upload-file.component";
import { Subject, catchError, forkJoin, of, takeUntil, throwError } from "rxjs";
import * as faceapi from "@vladmandic/face-api";
import { CommonModule } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { KYCService } from "app/modules/auth/kyc.service";
import { Project, ProjectFlow } from "app/modules/auth/project";
import { DocumentErrorsDisplayComponent } from "../document-errors-display/document-errors-display.component";
import { result } from "lodash";

@Component({
	selector: "kyc-document-uploader",
	standalone: true,
	templateUrl: "./kyc-document-uploader.component.html",
	styleUrls: ["./kyc-document-uploader.component.scss"],
	imports: [CommonModule, FlexLayoutModule, TranslocoModule, MatIconModule, MatButtonModule, DocumentErrorsDisplayComponent],
})
export class KycDocumentUploaderComponent implements OnDestroy {
	@ViewChild("cardIdFace", { static: false }) cardIdFaceRef: ElementRef;

	demoData: any;
	base64Image: any;
	errorResult: boolean;
	errorContent: any;
	attempts: number;
	attemptsLimit: number;
	phoneMode: boolean;
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	faceIdCard: string;
	appRegistration: any;
	project: Project;
	projectFlow: ProjectFlow;
	responseData: any;

	constructor(
		private _demoService: DemoService,
		public dialogRef: MatDialogRef<UploadFileComponent>,
		private _splashScreenService: FuseSplashScreenService,
		private mediaService: FuseMediaWatcherService,
		private _KYCService: KYCService
	) {
		this.demoData = this._demoService.getDemoData();

		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		this.attempts = this.appRegistration?.failedDocumentValidations?.length || 0;

		this.attemptsLimit = this.projectFlow.onboardingSettings.document.maxAttempts;

		this.errorContent = {
			message: "",
		};

		this.mediaService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
			result.matchingAliases;

			this.phoneMode = Boolean(
				!result.matchingAliases.includes("lg") && !result.matchingAliases.includes("md") && !result.matchingAliases.includes("sm")
			);
		});

		if (this.attempts >= this.attemptsLimit) {
			this.errorResult = true;
			this.errorContent = { message: "attempts_limit_reached" };
		}
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.complete();
	}

	onFileDropped($event) {
		this.prepareFilesList($event);
	}

	fileBrowseHandler(files) {
		this.prepareFilesList(files);
	}

	prepareFilesList(files: Array<any>) {
		const fileReader = new FileReader();

		this._splashScreenService.show();

		fileReader.onload = (event: any) => {
			const img = new Image();

			img.src = event.target.result;

			img.onload = async () => {
				try {
					const faces = await this.detectFace(img);

					this.demoData.loading = false;

					this._splashScreenService.hide();

					if (!faces) {
						this.errorResult = true;

						this.errorContent = { message: "face_not_found" };

						return;
					}

					this.base64Image = event.target.result;

					const documentFace = this._demoService.getBiggestFace(faces);

					this.faceIdCard = this._demoService.cutFaceIdCard(img, documentFace, this.cardIdFaceRef.nativeElement);
				} catch (error) {
					alert(error.message);
				}
			};
		};

		fileReader.readAsDataURL(files[0]);
	}

	async detectFace(image) {
		try {
			const faces = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (faces.length) {
				const faceBoxes = faces.map((face) => face.detection.box);

				for (let box of faceBoxes) {
					const margin = 10; // Adjust as needed
					const { faceImage, backgroundImage } = this.extractRegions(image, box, margin);

					// const faceImage = this.extractFaceImage(image, face);

					const edgesFound = this._demoService.detectEdges(faceImage);

					const blurAnalysis = this._demoService.analyzeBlurNoise(faceImage);

					const idBackground = this._demoService.extractBackgroundImage(image, box);

					const colorConsistency = this.compareColorConsistency(faceImage, backgroundImage);

					const lightConsistency = this._demoService.checkLightingConsistency(faceImage, idBackground);

					console.log({ colorConsistency });
				}

				return faceBoxes;
			}

			return undefined;
		} catch (error) {
			alert(error.message);
		}
	}

	compareColorConsistency(faceImage, backgroundImage) {
		const faceAverageColor = this.calculateAverageColor(faceImage);
		const backgroundAverageColor = this.calculateAverageColor(backgroundImage);

		const colorDifference = Math.sqrt(
			Math.pow(faceAverageColor.r - backgroundAverageColor.r, 2) +
				Math.pow(faceAverageColor.g - backgroundAverageColor.g, 2) +
				Math.pow(faceAverageColor.b - backgroundAverageColor.b, 2)
		);

		// Define a threshold for acceptable color difference
		const threshold = 50;
		return colorDifference < threshold;
	}

	calculateAverageColor(image) {
		const ctx = image.getContext("2d");
		const imgData = ctx.getImageData(0, 0, image.width, image.height);
		const pixels = imgData.data;

		let r = 0,
			g = 0,
			b = 0;
		const numPixels = pixels.length / 4;

		for (let i = 0; i < pixels.length; i += 4) {
			r += pixels[i];
			g += pixels[i + 1];
			b += pixels[i + 2];
		}

		return {
			r: r / numPixels,
			g: g / numPixels,
			b: b / numPixels,
		};
	}

	extractRegions(image, box, margin) {
		const canvasFace = document.createElement("canvas");
		const ctxFace = canvasFace.getContext("2d");
		const canvasBackground = document.createElement("canvas");
		const ctxBackground = canvasBackground.getContext("2d");

		// Calculate the region for the face/photo
		const faceX = Math.max(0, box.x - margin);
		const faceY = Math.max(0, box.y - margin);
		const faceWidth = Math.min(image.width, box.width + 2 * margin);
		const faceHeight = Math.min(image.height, box.height + 2 * margin);

		// Crop the face/photo region
		canvasFace.width = faceWidth;
		canvasFace.height = faceHeight;
		ctxFace.drawImage(image, faceX, faceY, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);

		// Create a mask to exclude the face/photo region from the background
		canvasBackground.width = image.width;
		canvasBackground.height = image.height;
		ctxBackground.drawImage(image, 0, 0);

		// Clear the area of the face/photo in the background canvas
		ctxBackground.clearRect(faceX, faceY, faceWidth, faceHeight);

		return {
			faceImage: canvasFace,
			backgroundImage: canvasBackground,
		};
	}

	// start of light

	// end of light

	extractFaceImage(image, box) {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		canvas.width = box.width;
		canvas.height = box.height;
		ctx.drawImage(image, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
		return canvas;
	}

	cancelUpload() {
		this.dialogRef.close();
	}

	tryAgain() {
		this.errorResult = false;

		this.base64Image = null;

		this.attempts++;
	}

	restartDemo(): void {
		this._demoService.moveToStep(1);

		this.dialogRef.close();
	}

	continue(): void {
		if (this.demoData.loading) return;

		this.demoData.loading = true;

		this._splashScreenService.show();

		const body = {
			image: this.base64Image.replace(/^data:image\/.*;base64,/, ""),
			documentFace: this.faceIdCard,
			force: Boolean(this.appRegistration?.forceUpload),
		};
		let responseData = undefined;
		this._KYCService.createDocumentValidation(body).subscribe({
			next: (response) => {
				this.responseData = response.data;

				this.dialogRef.close(response.data);
			},
			error: (exception) => {
				this.errorContent = exception.error;

				this.errorResult = true;

				this._splashScreenService.hide();
			},
			complete: () => {
				if (this.responseData && this.responseData.appRegistration && this.responseData.appRegistration.informationValidation) {
					forkJoin([
						this._KYCService.updateDocumentValidationNameValidation({ _id: this.responseData.documentValidation._id }),
						this._KYCService.updateInformationValidationWithCriminalRecords({
							_id: this.responseData.appRegistration.informationValidation._id,
						}),
					])
						.pipe(
							catchError((error) => {
								console.error("Error occurred:", error);
								return of(error);
							})
						)
						.subscribe((result) => {});
				}

				this.demoData.loading = false;

				this._splashScreenService.hide();
			},
		});
	}
}
