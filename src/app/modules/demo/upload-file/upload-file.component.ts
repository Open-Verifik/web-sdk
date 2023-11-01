import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslocoModule } from "@ngneat/transloco";
import { MatIconModule } from "@angular/material/icon";
import { DemoService } from "../demo.service";
import { MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

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

	constructor(private _demoService: DemoService, private dialogRef: MatDialogRef<UploadFileComponent>) {
		this.demoData = this._demoService.getDemoData();
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

	continue(): void {
		const body = {
			image: this.base64Image.replace(/^data:image\/.*;base64,/, ""),
		};

		https: this._demoService.sendDocument(body).subscribe((response) => {
			localStorage.setItem("idCard", this.base64Image);

			this._demoService.setDemoDocument(response.data);

			localStorage.setItem("documentId", response.data._id);

			this._demoService.moveToStep(3);

			this.dialogRef.close();
		});
	}
}
