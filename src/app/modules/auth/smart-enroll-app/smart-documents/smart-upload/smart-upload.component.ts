import { catchError, forkJoin, map, Observable, of, Subject, Subscription } from "rxjs";

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

import { AppRegistration, BiometricValidation, DocumentValidation, ImageScan, Project, ProjectFlow } from "../../../project";
import { SmartDocumentsComponent } from "../../smart-enroll-stepper/smart-enroll-stepper.component";
import { KYCService } from "app/modules/auth/kyc.service";
import { SmartScannerComponent } from "../smart-scanner/smart-scanner.component";
import { environment } from "environments/environment";

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
        SmartScannerComponent,
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
	@ViewChild("faceCardCanvas") faceCardCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("fileInput") fileInput: ElementRef<HTMLInputElement>;

    @Input('method') method: ''|'scan'|'upload';
	@Input() stepRedirection: Observable<number>;

    @Output('back') backEmit: EventEmitter<void> = new EventEmitter<void>();

	private _unsubscribeAll: Subject<any> = new Subject<any>();
	private _onStepRedirection: Subscription;

    biometricAttempts: number;
    biometricAttemptsLimit: number;
    biometricsAttemptsRemaining: number;
    documentAttempts: number;
    documentAttemptsLimit: number;
    documentAttemptsRemaining: number;
    compareMinScore: number;
    livenessMinScore: number;

    appRegistration: AppRegistration;
    base64Image: any;
    demoData: any;
    errorContent: any;
    errorResult: boolean;
    faceIdCard: string;
    file: File;
    fileDataMap: Map<number, { file: File, faceIdCard: string, base64Image: string, response: DocumentValidation }> = new Map();
    fileProgress: number;
    isExtracting: boolean = false;
    livenessScore: number = 0;
    project: Project;
    projectFlow: ProjectFlow;
    requiresBack: boolean = false;
    stepIndex: number = 1;

    failedScanUploadSubject: Subject<{ message: string, livenessScore?: number }> = new Subject<{message: string, livenessScore: number}>();
    successfulScanUploadSubject: Subject<{livenessScore?: number}> = new Subject<{livenessScore?: number}>();

    constructor(
        private translocoService: TranslocoService,
        private _demoService: DemoService,
        private _KYCService: KYCService,
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

		this.biometricAttempts = this.appRegistration?.failedBiometricValidations?.length || 0;
		this.biometricAttemptsLimit = this.projectFlow.onboardingSettings.liveness.maxAttempts;
		this.documentAttempts = this.appRegistration?.failedDocumentValidations?.length || 0;
		this.documentAttemptsLimit = this.projectFlow.onboardingSettings.document.maxAttempts;

        this.documentAttemptsRemaining = Math.max(this.documentAttemptsLimit - this.documentAttempts, 0);
        this.biometricsAttemptsRemaining = Math.max(this.biometricAttemptsLimit - this.biometricAttempts, 0);

        this.compareMinScore = this.projectFlow.onboardingSettings.document.compareMinScore;
        this.livenessMinScore = this.projectFlow.onboardingSettings.liveness.livenessMinScore;

        this._checkStep();
    }

	ngOnInit(): void {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

		this._onStepRedirection = this.stepRedirection.subscribe((step) => {
            this.goToStep(step);
        });

		this.demoData = this._demoService.getDemoData();
    }

	ngOnDestroy(): void {
		this._unsubscribeAll.complete();
        this._onStepRedirection.unsubscribe();
	}

    private _checkStep(): void {
        let step = 1;

        if (this.appRegistration.documentValidation) {
            step = 5;

            this._setFileData(1, null, this.appRegistration.documentValidation.url, null);

            if (this.appRegistration.documentValidation.backUrl) {
                this._setFileData(0, null, this.appRegistration.documentValidation.backUrl, null);
            } else if (this.appRegistration.documentValidation.requiresBackSide) {
                this.requiresBack = this.appRegistration.documentValidation.requiresBackSide;
                step = 2;
            }
        }

        if (this.appRegistration.biometricValidation) {
            step = 6;
        }

        this.goToStep(step);
    }

    private _createBiometricValidation(body: any) {
        this._KYCService
            .createBiometricValidation(body)
            .subscribe({
                next: (response) => {
                    this.appRegistration.biometricValidation = response.data.biometricValidation as BiometricValidation;
                    this.appRegistration.person = response.data.person;

                    const livenessScore = Math.round(+(response.data.biometricValidation.livenessScore || 0) * 100);

                    this.successfulScanUploadSubject.next({livenessScore});
                    this.goNext();
                },
                error: (error) => {
                    this.errorResult = true;
                    this.errorContent = { message: error?.error?.message || '' };

                    const split = this.errorContent.message.split("@");

                    this.errorContent.message = (new RegExp(/^[a-z]+(?:_{0,2}[a-z]+)*$/)).test(split[0]) ? split[0] : 'failed_to_read';

                    const livenessScore = Math.round(+(split[1] || 0) * 100);

                    this.failedScanUploadSubject.next({message: this.errorContent.message, livenessScore});
                    this.biometricsAttemptsRemaining - 1;
                    this.goNext();
                },
                complete: () => {
                    this.fileProgress = 100;
                }
            });
    }

    private _createDocumentValidation(body: any, mapIndex: number) {
        this._KYCService
            .createDocumentValidation(body)
            .subscribe({
                next: (response) => {
                    const data = response.data.documentValidation as DocumentValidation;

                    Object.keys(data.OCRExtraction).forEach((key) => {
                        if (!data.OCRExtraction[key] || this.translocoService
                            .translate(`extracted_information.${key}`) === `extracted_information.${key}`)
                            {
                                delete data.OCRExtraction[key];
                            }
                    });

                    this.appRegistration.documentValidation = response.data.documentValidation as DocumentValidation;

                    let imageUrl: string;

                    if (body.image) {
                        this.requiresBack = response.data.documentValidation.requiresBackSide;
                        imageUrl = response.data.documentValidation.url;
                    } else {
                        imageUrl = response.data.documentValidation.backUrl;
                    }

                    this._setFileData(mapIndex, this.file, imageUrl, this.faceIdCard, data);
                    this._sendDocumentValidationAndNameValidation();
                },
                error: (error) => {
                    const message = (new RegExp(/^[a-z]+(?:_{0,2}[a-z]+)*$/)).test(error?.error?.message) ? error.error.message : 'failed_to_read';

                    this.errorResult = true;
                    this.errorContent = { message };
                    this.fileProgress = 100;
                    this.isExtracting = false;
                    this.documentAttemptsRemaining - 1;
                    this.failedScanUploadSubject.next({ message: this.errorContent.message });
                },
                complete: () => {
                    this.fileProgress = 100;
                    this.isExtracting = false;
                }
            });
    }

	private _sendDocumentValidationAndNameValidation(): void {
        if (!this.appRegistration.documentValidation._id) return;

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

        if (observables.length === 0) return;

		forkJoin([observables]).subscribe({
			next: (results) => {
				results.forEach((result) => {
					if (result.status === "fulfilled") {
						console.log("Observable fulfilled:", { result });
					} else {
						console.error("Observable rejected:", { result });
					}
				});
			},
			error: (error) => {
				console.error("Unexpected error occurred:", error);
			},
            complete: () => {
                this.successfulScanUploadSubject.next({});
            }
		});
	}

	private async _detectFace(image: HTMLImageElement) {
		try {
			const faces = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (!faces.length) return;

            return faces.map((face) => face.detection.box);
		} catch (error) {
			alert(error.message);
		}
	}

    private async _fileOnLoad(event: ProgressEvent<FileReader>, img: HTMLImageElement) {
        try {
            const thisStep = this.stepIndex;
            const mapIndex = thisStep % 2;

            this.fileProgress += 10;

            if (this.stepIndex === 1) await this._setFaceToCanvas(img);

            this.base64Image = event.target.result;
            const image = this.base64Image.replace(/^data:image\/.*;base64,/, "");

            const body = {
                image: undefined,
                backImage: undefined,
                force: undefined,
                inputMethod: "FILE_UPLOAD",
            };

            if (this.stepIndex > 1) {
                body.backImage = image;
                body.force = true;
            } else {
                body.image = image;
                body.force = !!this.appRegistration.documentValidation;
            }

            this.isExtracting = true;

            this._createDocumentValidation(body, mapIndex);
        } catch (error) {
            this.errorResult = true;
            this.errorContent = { message: "failed_to_handle_file" };
            this.fileProgress = 100;
            this.isExtracting = false;
        }
    }

    private _getFileData(mapIndex: number) {
        if (!this.fileDataMap.has(mapIndex)) {
            this.base64Image = '';
            this.file = null;
            this.fileProgress = 0;

            return;
        };

        const fileData = this.fileDataMap.get(mapIndex);

        this.base64Image = fileData.base64Image;
        this.file = fileData.file;
        this.fileProgress = 100;
    };

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

    private async _setFaceToCanvas(img: HTMLImageElement) {
        const faces = await this._detectFace(img);

        if (!faces) {
            this.fileProgress = 0;
            this.errorResult = true;
            this.errorContent = { message: "face_not_found" };

            return;
        }

        const documentFace = this._demoService.getBiggestFace(faces);

        this.faceIdCard = this._demoService.cutFaceIdCard(img, documentFace, this.faceCardCanvas.nativeElement);
    }

    private _setFileData(mapIndex: number, file: File, base64Image: string, faceIdCard: string, data?: any) {
        this.fileDataMap.set(mapIndex, {file, base64Image, faceIdCard, response: data });
    };

    backToBeginning(): void {
        this._KYCService.restartKYC().subscribe({
            next: () => {
                this.appRegistration.biometricValidation = null;
                this.appRegistration.person = null;
                this.appRegistration.documentValidation = null;
            },
            error: (exception) => {
                console.error({ exception });
            },
            complete: () => {
                this.resetFileUpload();
            },
        });
    }

	canSkipStep(): boolean {
		if (this.stepIndex < 5) {
			return this.projectFlow.onboardingSettings.steps.document === 'optional';
		}

        if (this.stepIndex === 5) {
            return this.projectFlow.onboardingSettings.steps.liveness === 'optional';
        }

        return false;
	}

    skipStep(): void {
        if (this.stepIndex < 5) {
            return this.goToStep(5);
        }

        if (this.stepIndex === 5) {
            return this.goToStep(6);
        }
    }
  
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
        if (this.stepIndex <= 4 && this.projectFlow.onboardingSettings.steps.document === 'skip') {
            return this.goToStep(5);
        }

        if (this.stepIndex < 5 && this.projectFlow.onboardingSettings.steps.liveness === 'skip') {
            return this.goToStep(6);
        }

        // Skip second/fourth steps if rear document not required
        if (!this.requiresBack && (this.stepIndex % 2 === 1 && this.stepIndex + 1 < 5)) {
            this.stepIndex++;
        }

        this.stepIndex++;

        this._getFileData(this.stepIndex % 2);
    }

    goPrevious(): void {
        if (this.stepIndex === 5 && this.projectFlow.onboardingSettings.steps.document === 'skip') {
            return this.backEmit.next();
        }

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
        return this.base64Image && this.fileProgress === 100;
    }

    onFileDropped($event: Array<File>) {
        this._prepareFilesList($event);
    }

    async onImageScan(imageScan: ImageScan) {
        if (imageScan.source === 'document') {
            const thisStep = this.stepIndex;
            const mapIndex = thisStep % 2;

            const body = {
                image: undefined,
                backImage: undefined,
                force: undefined,
                inputMethod: "FILE_UPLOAD",
            };

            if (this.stepIndex > 1) {
                body.backImage = `${imageScan.base64Image}`;
                body.force = true;
            } else {
                body.image = `${imageScan.base64Image}`;
                body.force = !!this.appRegistration.documentValidation;

                const img = new Image();
                img.src = imageScan.rawImage;
                this._setFaceToCanvas(img);
            }

            this.isExtracting = true;

            this._createDocumentValidation(body, mapIndex);
        } else {
            const body: any = {
                image: imageScan.base64Image,
                os: this.demoData.OS,
                force: !!this.appRegistration.biometricValidation,
            };

            this._createBiometricValidation(body);
        }
    }

    resetFileUpload(): void {
        this.base64Image = '';
        this.errorContent = null;
        this.errorResult = false;
        this.file = null;
        this.fileProgress = 0;
        this.isExtracting = false;
    }
}
