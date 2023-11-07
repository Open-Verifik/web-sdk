import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslocoModule } from "@ngneat/transloco";
import { MatIconModule } from "@angular/material/icon";
import { DemoService } from "../demo.service";
import { MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";

@Component({
	selector: "app-upload-file",
	standalone: true,
	imports: [CommonModule, FlexLayoutModule, TranslocoModule, MatIconModule, MatButtonModule],
	templateUrl: "./upload-file.component.html",
	styleUrls: ["./upload-file.component.scss"],
})
export class UploadFileComponent {
	demoData: any;
	base64Image: any;
	errorResult: boolean;
	attempts: number;
	attemptsLimit: number;

	constructor(
		private _demoService: DemoService,
		private dialogRef: MatDialogRef<UploadFileComponent>,
		private _splashScreenService: FuseSplashScreenService
	) {
		this.demoData = this._demoService.getDemoData();
		this.attempts = 0;
		this.attemptsLimit = 1;
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
				localStorage.setItem("idCard", this.base64Image);

				this._demoService.setDemoDocument(response.data);

				localStorage.setItem("documentId", response.data._id);

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
