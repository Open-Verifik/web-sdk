import { Component, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslocoModule } from "@ngneat/transloco";
import { MatIconModule } from "@angular/material/icon";
import { DemoService } from "../demo.service";
import { MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";
import { Subject, takeUntil } from "rxjs";
@Component({
	selector: "app-upload-file",
	standalone: true,
	imports: [CommonModule, FlexLayoutModule, TranslocoModule, MatIconModule, MatButtonModule],
	templateUrl: "./upload-file.component.html",
	styleUrls: ["./upload-file.component.scss"],
})
export class UploadFileComponent implements OnDestroy {
	demoData: any;
	base64Image: any;
	errorResult: boolean;
	attempts: number;
	attemptsLimit: number;
	phoneMode: boolean;
	private _unsubscribeAll: Subject<any> = new Subject<any>();

	constructor(
		private _demoService: DemoService,
		private dialogRef: MatDialogRef<UploadFileComponent>,
		private _splashScreenService: FuseSplashScreenService,
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
			this.base64Image = event.target.result;
			// this.continue();
		};

		fileReader.readAsDataURL(files[0]);
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

				localStorage.setItem("idCard", this.base64Image);

				this._demoService.setDemoDocument(data);

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
