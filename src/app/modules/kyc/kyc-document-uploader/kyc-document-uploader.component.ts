import { Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule } from "@ngneat/transloco";
import { DemoService } from "app/modules/demo/demo.service";
import { UploadFileComponent } from "app/modules/demo/upload-file/upload-file.component";
import { Subject, takeUntil } from "rxjs";
import * as faceapi from "@vladmandic/face-api";
import { CommonModule } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { KYCService } from "app/modules/auth/kyc.service";
import { Project, ProjectFlow } from "app/modules/auth/project";
import { DocumentErrorsDisplayComponent } from "../document-errors-display/document-errors-display.component";

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

		this.attempts = this.appRegistration.failedDocumentValidations?.length || 0;

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

		console.log({
			appRegistration: this.appRegistration,
			projectFlow: this.projectFlow,
			attemptsLimit: this.attemptsLimit,
			attempts: this.attempts,
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

						this.errorContent = { message: "id_scanning.face_not_found" };

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
				return faces.map((face) => face.detection.box);
			}

			return undefined;
		} catch (error) {
			alert(error.message);
		}
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
			force: Boolean(this.appRegistration.forceUpload),
		};

		this._KYCService.createDocumentValidation(body).subscribe({
			next: (response) => {
				this.dialogRef.close(response.data);
			},
			error: (exception) => {
				this.errorContent = exception.error;

				console.log({
					errorContent: this.errorContent,
					appRegistration: this.appRegistration,
				});

				this.errorResult = true;

				this._splashScreenService.hide();
			},
			complete: () => {
				this.demoData.loading = false;

				this._splashScreenService.hide();
			},
		});
	}
}
