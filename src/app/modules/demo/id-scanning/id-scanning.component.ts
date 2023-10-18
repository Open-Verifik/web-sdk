import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
	selector: "id-scanning",
	templateUrl: "./id-scanning.component.html",
	styleUrls: ["./id-scanning.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, MatCheckboxModule, MatButtonModule, CommonModule, MatProgressSpinnerModule],
})
export class IdScanningComponent implements OnInit {
	@ViewChild("videoElement") videoElement: ElementRef;
	hasCameraPermissions: boolean;
	loadingCamera: boolean;

	constructor() {
		this.loadingCamera = true;

		this.hasCameraPermissions = false;
	}

	ngOnInit(): void {
		this.startCamera();
	}

	startCamera() {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			this.loadingCamera = true;

			navigator.mediaDevices
				.getUserMedia({ video: true })
				.then((stream) => {
					this.loadingCamera = false;
					this.hasCameraPermissions = true;

					setTimeout(() => {
						this.videoElement.nativeElement.srcObject = stream;
						this.videoElement.nativeElement.play();
					}, 500);
				})
				.catch((error) => {
					console.error("Error accessing the camera:", error);
					this.loadingCamera = false;
					this.hasCameraPermissions = false;
				});
		} else {
			console.error("Browser does not support getUserMedia API.");
			this.hasCameraPermissions = false;
		}
	}
}
