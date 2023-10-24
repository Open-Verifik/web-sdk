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
	demoData: any;
	idToSend: any;

	constructor(private _demoService: DemoService) {
		this.attempts = 0;

		this.attemptsLimit = 3;

		this.loadingCamera = false;

		this.hasCameraPermissions = false;

		this.failedToDetectDocument = false;
	}

	ngOnInit(): void {
		this.demoData = this._demoService.getDemoData();

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
		this._demoService.moveToStep(1);
	}

	continue(): void {
		this.idToSend = {
			image: "https://cdn.verifik.co/ocr/samples/cc2.jpg",
		};

		https: this._demoService.sendDocument({ image: this.idToSend.image }).subscribe((response) => {
			this._demoService.setDemoDocument(response.data);

			localStorage.setItem("documentId", response.data._id);

			this._demoService.moveToStep(3);
		});
	}
}
