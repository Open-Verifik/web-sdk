import { Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { DemoService } from "app/modules/demo/demo.service";
import { UploadFileComponent } from "app/modules/demo/upload-file/upload-file.component";
import { Subject, takeUntil } from "rxjs";
import * as faceapi from "@vladmandic/face-api";
import { CommonModule } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { KYCService } from "app/modules/auth/kyc.service";

@Component({
	selector: "kyc-document-uploader",
	standalone: true,
	templateUrl: "./kyc-document-uploader.component.html",
	styleUrls: ["./kyc-document-uploader.component.scss"],
	imports: [CommonModule, FlexLayoutModule, TranslocoModule, MatIconModule, MatButtonModule],
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

	constructor(
		private _demoService: DemoService,
		private dialogRef: MatDialogRef<UploadFileComponent>,
		private _splashScreenService: FuseSplashScreenService,
		private mediaService: FuseMediaWatcherService,
		private _KYCService: KYCService
	) {
		this.demoData = this._demoService.getDemoData();

		this.attempts = 0;

		this.attemptsLimit = 1;

		this.errorContent = {
			message: "",
		};

		this.mediaService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
			result.matchingAliases;

			this.phoneMode = Boolean(
				!result.matchingAliases.includes("lg") && !result.matchingAliases.includes("md") && !result.matchingAliases.includes("sm")
			);
		});
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

					const faceBiggest = this._demoService.getBiggestFace(faces);

					console.log({ faces, faceBiggest });

					this.faceIdCard = this._demoService.cutFaceIdCard(img, faceBiggest, this.cardIdFaceRef.nativeElement);
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
		};

		this._KYCService.createDocumentValidation(body).subscribe({
			next: (response) => {
				console.log({ response: response.data });
			},
			error: (exception) => {
				this.errorContent = exception.error;

				this.errorResult = true;

				console.log({ exception, errorContent: this.errorContent });
			},
			complete: () => {
				this.demoData.loading = false;
			},
		});
	}
}
