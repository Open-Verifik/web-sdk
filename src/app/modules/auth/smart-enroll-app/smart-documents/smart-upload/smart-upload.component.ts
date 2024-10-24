import { Subject } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import * as faceapi from "@vladmandic/face-api";

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { DragAndDropModule } from "app/modules/auth/drag-and-drop/drag-and-drop.module";
import { DemoService } from "app/modules/demo/demo.service";

import { AppRegistration, DocumentScan, Project, ProjectFlow, Prompt } from "../../../project";
import { IdScanningIOSComponent } from "../../../../demo/id-scanning-ios/id-scanning-ios.component";
import { IdScanningComponent } from "app/modules/demo/id-scanning/id-scanning.component";
import { SmartDocumentsComponent } from "../../smart-enroll-stepper/smart-enroll-stepper.component";
import { OCRService } from "app/modules/ocr/ocr.service";

const MAX_FILE_SIZE = 10485760;

@Component({
	selector: "smart-upload",
	templateUrl: "./smart-upload.component.html",
	styleUrls: ["../../smart-enroll-app.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
        CommonModule,
        DragAndDropModule,
        FlexLayoutModule,
        FormsModule,
        IdScanningComponent,
        IdScanningIOSComponent,
        LanguagesComponent,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        NgIf,
        ReactiveFormsModule,
        SmartDocumentsComponent,
        TranslocoModule,
    ],
})
export class SmartUploadComponent implements OnInit, OnDestroy {
    @ViewChild("fileInput") fileInput: ElementRef;
	@ViewChild("cardIdFace") cardIdFaceRef: ElementRef;

    @Input('appRegistration') appRegistration: AppRegistration;
    @Input('method') method: ''|'scan'|'upload';
    @Input('project') project: Project;
    @Input('projectFlow') projectFlow: ProjectFlow;

    @Output('back') backEmit: EventEmitter<void> = new EventEmitter<void>();

	private _unsubscribeAll: Subject<any> = new Subject<any>();

    base64Image: any;
    demoData: any;
    documentResponse: Prompt;
    errorContent: any;
    errorResult: boolean;
    faceIdCard: string;
    file: File;
    fileDataMap: Map<number, { file: File, faceIdCard: string, base64Image: string, response: Prompt }> = new Map();
    fileProgress: number;
    isExtracting: boolean = false;
    stepIndex: number = 1;
    requiresBack: boolean = false;

    constructor(
        private translocoService: TranslocoService,
        private _demoService: DemoService,
        private _ocrService: OCRService,
    ) {}

	ngOnInit(): void {
		this.demoData = this._demoService.getDemoData();
    }

	ngOnDestroy(): void {
		this._unsubscribeAll.complete();
	}

    private _getFileData(mapIndex: number) {
        if (!this.fileDataMap.has(mapIndex)) {
            this.base64Image = '';
            this.file = null;
            this.fileProgress = 0;
            this.documentResponse = null;

            return;
        };

        const fileData = this.fileDataMap.get(mapIndex);

        this.base64Image = fileData.base64Image;
        this.file = fileData.file;
        this.fileProgress = 100;
        this.documentResponse = fileData.response;
    };

	private _calculateAverageColor(image: HTMLCanvasElement) {
		const ctx = image.getContext("2d");
		const imgData = ctx.getImageData(0, 0, image.width, image.height);
		const pixels = imgData.data;

		let r = 0;
        let g = 0;
        let b = 0;

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

	private _compareColorConsistency(faceImage: HTMLCanvasElement, backgroundImage: HTMLCanvasElement) {
		const faceAverageColor = this._calculateAverageColor(faceImage);
		const backgroundAverageColor = this._calculateAverageColor(backgroundImage);

		const colorDifference = Math.sqrt(
			Math.pow(faceAverageColor.r - backgroundAverageColor.r, 2) +
				Math.pow(faceAverageColor.g - backgroundAverageColor.g, 2) +
				Math.pow(faceAverageColor.b - backgroundAverageColor.b, 2)
		);

		const threshold = 50;

		return colorDifference < threshold;
	}

	private async _detectFace(image: HTMLImageElement) {
		try {
			const faces = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (!faces.length) return;

            const faceBoxes = faces.map((face) => face.detection.box);
            const progressStep = (50 / faces.length);

            for (let box of faceBoxes) {
                const margin = 10; // Adjust as needed
                const { faceImage, backgroundImage } = this._extractRegions(image, box, margin);

                const edgesFound = this._demoService.detectEdges(faceImage);
                const blurAnalysis = this._demoService.analyzeBlurNoise(faceImage);
                const idBackground = this._demoService.extractBackgroundImage(image, box);
                
                const colorConsistency = this._compareColorConsistency(faceImage, backgroundImage);
                const lightConsistency = this._demoService.checkLightingConsistency(faceImage, idBackground);

                this.fileProgress += progressStep;
            }

            return faceBoxes;
		} catch (error) {
			alert(error.message);
		}
	}

	private _extractRegions(image: HTMLImageElement, box, margin) {
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
			backgroundImage: canvasBackground,
			faceImage: canvasFace,
		};
	}

    private async _fileOnLoad(event: ProgressEvent<FileReader>, img: HTMLImageElement) {
        try {
            const thisStep = this.stepIndex;
            const mapIndex = thisStep % 2;

            this.fileProgress += 10;

            if (this.stepIndex === 1) {
                const faces = await this._detectFace(img);

                if (!faces) {
                    this.fileProgress = 0;
                    this.errorResult = true;
                    this.errorContent = { message: "face_not_found" };

                    return;
                }

                const documentFace = this._demoService.getBiggestFace(faces);

                this.faceIdCard = this._demoService.cutFaceIdCard(img, documentFace, this.cardIdFaceRef.nativeElement);
            }

            this.base64Image = event.target.result;

            this._setFileData(mapIndex, this.file, this.base64Image, this.faceIdCard, {});

            const body = {
                image: this.base64Image.replace(/^data:image\/.*;base64,/, ""),
            };

            this.isExtracting = true;

            if (this.projectFlow.onboardingSettings.document.validationMethod === 'SCAN_PROMPT') {
                this._ocrService
                    .scanPrompt(body)
                    .subscribe({
                        next: (response) => {
                            const data = response.data as Prompt;
                            const documentId = data._id;

                            Object.keys(data.OCRExtraction).forEach((key) => {
                                if (!data.OCRExtraction[key] || this.translocoService
                                    .translate(`extracted_information.${key}`) === `extracted_information.${key}`)
                                    {
                                        delete data.OCRExtraction[key];
                                    }
                            });

                            localStorage.setItem("idCardFaceImage", this.faceIdCard);
                            localStorage.setItem("documentId", documentId);

                            this._setFileData(mapIndex, this.file, this.base64Image, this.faceIdCard, data);
                            this.documentResponse = data;
                        },
                        error: () => {
                            this.errorResult = true;
                            this.errorContent = { message: "failed_to_read" };
                            this.fileProgress = 100;
                            this.isExtracting = false;
                        },
                        complete: () => {
                            this.fileProgress = 100;
                            this.isExtracting = false;
                        }
                    });

                return;
            }
        } catch (error) {
            this.errorResult = true;
            this.errorContent = { message: "failed_to_handle_file" };
            this.fileProgress = 100;
            this.isExtracting = false;
        }
    }

    private _prepareFilesList(files: Array<File>) {
        if (this.file) return;

        this.file = files[0];
        this.fileInput.nativeElement.value = "";

        if (this.file.size > MAX_FILE_SIZE) {
            this.fileProgress = 0;
            this.errorResult = true;
            this.errorContent = { message: "file_too_big" };

            return;
        }

		const fileReader = new FileReader();
        this.fileProgress = 25;

		fileReader.onload = (event: any) => {
			const img = new Image();

			img.src = event.target.result;

			img.onload = async () => await this._fileOnLoad(event, img);
		};

		fileReader.readAsDataURL(this.file);
    }

    private _setFileData(mapIndex: number, file: File, base64Image: string, faceIdCard: string, data?: any) {
        this.fileDataMap.set(mapIndex, {file, base64Image, faceIdCard, response: data });
    };

  
    fileBrowseHandler(files: Array<File>) {
        this._prepareFilesList(files);
    }

    formatBytes(bytes: number, decimals = 2) {
      if (bytes === 0) {
        return "0 Bytes";
      }

      const k = 1024;
      const dm = decimals <= 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }

    goNext(): void {
        // Skip second/fourth steps if rear document not required
        if (!this.requiresBack && (this.stepIndex % 2 === 1 && this.stepIndex + 1 < 5)) {
            this.stepIndex++;
        }

        this.stepIndex++;

        this._getFileData(this.stepIndex % 2);
    }

    goPrevious(): void {
        if (this.stepIndex <= 1) return this.backEmit.next();

        // Skip second/fourth steps if rear document not required
        if (!this.requiresBack && (this.stepIndex % 2 === 1 && this.stepIndex - 1 < 5)) {
            this.stepIndex--;
        }

        this.stepIndex--;

        this._getFileData(this.stepIndex % 2)
    }

    goToStep(stepIndex: number): void {
        this.stepIndex = stepIndex;
    }

    isActiveStep(step: number): boolean {
        return step === this.stepIndex;
    }

    isContinueActive(): boolean {
        return this.file && this.fileProgress === 100;
    }

    onFileDropped($event: Array<File>) {
        this._prepareFilesList($event);
    }

    resetFileUpload(): void {
        this.base64Image = '';
        this.documentResponse = null;
        this.errorContent = null;
        this.errorResult = false;
        this.file = null;
        this.fileProgress = 0;
        this.isExtracting = false;
    }
}