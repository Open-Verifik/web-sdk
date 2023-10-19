import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { DemoService } from "../demo.service";

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
	failedToDetectDocument: boolean;
	attempts: number;
	attemptsLimit: number;

	constructor(private _demoService: DemoService) {
		this.attempts = 0;
		this.attemptsLimit = 3;
		this.loadingCamera = false;
		this.hasCameraPermissions = false;
		this.failedToDetectDocument = false;
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
					this.attempts++;

					setTimeout(() => {
						this.videoElement.nativeElement.srcObject = stream;
						this.videoElement.nativeElement.play();
					}, 1000);

					setTimeout(() => {
						this.failedToDetectDocument = true;
					}, 4000);
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

	tryAgain(): void {
		this.attempts++;
		// logic todo here
	}

	restartDemo(): void {
		// go to step 3 for now
		this._demoService.setDemoDocument({
			documentType: "CC",
			status: "ACTIVE_BUT_UNVERIFIED",
			imageValidated: false,
			validationMethod: "SCAN_PROMPT",
			type: "ocr",
			_id: "6530568940e03c18db76f5cc",
			deleted: false,
			documentNumber: "73.180.434",
			url: "https://cdn.verifik.co/ocr/samples/_cc22.png",
			OCRExtraction: {
				firstName: "JOSE ANTONIO",
				lastName: "GUZMAN VELASQUEZ",
				fullName: "JOSE ANTONIO GUZMAN VELASQUEZ",
				documentNumber: "73.180.434",
			},
			updatedAt: "2023-10-18T22:04:57.377Z",
			createdAt: "2023-10-18T22:04:57.377Z",
			__v: 0,
		});

		this._demoService.moveToStep(3);
	}
}
