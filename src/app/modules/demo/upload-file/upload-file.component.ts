import { Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { MatIconModule } from "@angular/material/icon";
import { DemoService } from "../demo.service";
import { MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";
import { Subject, takeUntil } from "rxjs";
import * as faceapi from "@vladmandic/face-api";

@Component({
	selector: "app-upload-file",
	standalone: true,
	imports: [CommonModule, FlexLayoutModule, TranslocoModule, MatIconModule, MatButtonModule],
	templateUrl: "./upload-file.component.html",
	styleUrls: ["./upload-file.component.scss"],
})
export class UploadFileComponent implements OnDestroy {
	@ViewChild("cardIdFace", { static: false }) cardIdFaceRef: ElementRef;

	demoData: any;
	base64Image: any;
	errorResult: boolean;
	attempts: number;
	attemptsLimit: number;
	phoneMode: boolean;
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	faceIdCard: string;

	constructor(
		private _demoService: DemoService,
		private dialogRef: MatDialogRef<UploadFileComponent>,
		private _splashScreenService: FuseSplashScreenService,
		private _translocoService: TranslocoService,
		private mediaService: FuseMediaWatcherService
	) {
		this.demoData = this._demoService.getDemoData();
		this.attempts = 0;
		this.attemptsLimit = 1;
		this.mediaService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
			result.matchingAliases;
			this.phoneMode = Boolean(
				!result.matchingAliases.includes("lg") && !result.matchingAliases.includes("md") && !result.matchingAliases.includes("sm")
			);
			// console.log(this.phoneMode);
		});
	}

	ngOnDestroy(): void {
		// Unsubscribe from all subscriptions
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

		fileReader.onload = (event: any) => {
			const img = new Image();

			img.src = event.target.result;

			img.onload = async () => {
				try {
					const faces = await this.detectFace(img);

					if (!faces) {
						alert(this._translocoService.translate("id_scanning.face_not_found"));
						return;
					}

					this.base64Image = event.target.result;

					const faceBiggest = this._demoService.getBiggestFace(faces);
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
		this.demoData.loading = true;
		this._splashScreenService.show();

		const body = {
			image: this.base64Image.replace(/^data:image\/.*;base64,/, ""),
		};

		https: this._demoService.sendDocument(body).subscribe(
			(response) => {
				const data = response.data;

				const documentId = data.studio ? data.studio._id : data.prompt._id;

				this._demoService.setDemoDocument(data);

				localStorage.setItem("idCardFaceImage", this.faceIdCard);

				localStorage.setItem("documentId", documentId);

				this._demoService.moveToStep(3);

				this.demoData.loading = false;
				this._splashScreenService.hide();

				this.dialogRef.close();
			},
			(err) => {
				this.errorResult = true;
				this.demoData.loading = false;
				this._splashScreenService.hide();
			}
		);
	}
}
