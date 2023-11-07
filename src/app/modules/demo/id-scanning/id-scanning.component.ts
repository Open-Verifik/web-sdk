import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { DemoService } from "../demo.service";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "id-scanning",
	templateUrl: "./id-scanning.component.html",
	styleUrls: ["./id-scanning.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, MatCheckboxModule, MatButtonModule, CommonModule, MatProgressSpinnerModule, TranslocoModule],
})
export class IdScanningComponent implements OnInit {
	@ViewChild("videoElement") videoElement: ElementRef;
	@ViewChild("canvas", { static: false }) public canvasRef: ElementRef;
	@ViewChild("result", { static: false }) public canvasResultRef: ElementRef;

	hasCameraPermissions: boolean;
	loadingCamera: boolean;
	failedToDetectDocument: boolean;
	attempts: number;
	attemptsLimit: number;
	demoData: any;
	idToSend: any;
	stream: MediaStream;
	HEIGHT: number;
	WIDTH: number;
	aspectRatio = 85.6 / 53.98;
	y: number;
	x: number;
	rectHeight: number;
	rectWidth: number;
	base64Images: any;

	constructor(
		private _demoService: DemoService,
		private _splashScreenService: FuseSplashScreenService,
		private _changeDetectorRef: ChangeDetectorRef
	) {
		this.attempts = 0;

		this.attemptsLimit = 3;

		this.loadingCamera = false;

		this.hasCameraPermissions = false;

		this.failedToDetectDocument = false;

		this.base64Images = undefined;
	}

	ngOnInit(): void {
		this.demoData = this._demoService.getDemoData();

		this.startCamera();
	}

	startCamera() {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			this.loadingCamera = true;
			
			this.demoData.loading = true;
			this._splashScreenService.show();

			navigator.mediaDevices
				.getUserMedia({
					video: { height: 720 },
					audio: false,
				})
				.then((stream) => {
					this.stream = stream;
					this.hasCameraPermissions = true;
					this.loadingCamera = false;

					const videoTrack = this.stream.getVideoTracks()[0];
					const settings = videoTrack.getSettings();

					// Access the width and height properties
					const { width, height } = settings;
					this.HEIGHT = height;
					this.WIDTH = width;

					setTimeout(() => {
						const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;
						canvas.height = this.HEIGHT;
						canvas.width = this.WIDTH;

						this.videoElement.nativeElement.srcObject = stream;

						this.drawRect(canvas.getContext("2d"));
						this.demoData.loading = false;
						this._splashScreenService.hide();
					}, 1000);
				})
				.catch((error) => {
					console.error("Error accessing the camera:", error);
					this.loadingCamera = false;
					this.hasCameraPermissions = false;
					this.demoData.loading = false;
					this._splashScreenService.hide();
				});
		} else {
			console.error("Browser does not support getUserMedia API.");
			this.hasCameraPermissions = false;
		}
	}

	tryAgain(plusAttempts = false): void {
		if (plusAttempts) this.attempts++;
		console.log(plusAttempts, this.attempts);
		this.base64Images = undefined;
		this.failedToDetectDocument = false;
		this.startCamera();
		// logic todo here
	}

	restartDemo(): void {
		this._demoService.moveToStep(1);
	}

	continue(): void {
		this.idToSend = {
			image: this.base64Images,
		};

		this.demoData.loading = true;
		this._splashScreenService.show();

		https: this._demoService.sendDocument({ image: this.idToSend.image }).subscribe(
			(response) => {
				this._demoService.setDemoDocument(response.data);

				localStorage.setItem("documentId", response.data._id);

				const canvasResult = this.canvasResultRef.nativeElement;

				localStorage.setItem("idCard", canvasResult.toDataURL("image/jpeg"));
				
				this.demoData.loading = false;
				this._splashScreenService.hide();

				this._demoService.moveToStep(3);

			},
			(err) => {
				this.failedToDetectDocument = true;
				this.demoData.loading = false;
				this._splashScreenService.hide();
			}
		);
	}

	drawRect(ctx: CanvasRenderingContext2D): void {
		//CLEAR CANVAS
		ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

		//OPACITY OUTSIDE THE ELLIPSE
		ctx.fillStyle = "rgba(255, 255, 255, 0.75)"; // Color de la máscara
		ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
		ctx.globalCompositeOperation = "destination-out";

		this.y = Math.floor(this.HEIGHT * 0.1);
		this.rectHeight = Math.floor(this.HEIGHT * 0.8);
		this.rectWidth = Math.floor(this.aspectRatio * this.rectHeight);
		this.x = Math.floor((this.WIDTH - this.rectWidth) / 2);

		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(this.x, this.y, this.rectWidth, this.rectHeight);
		ctx.globalCompositeOperation = "source-over";
	}

	stopRecord(): void {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
		}
	}

	async takePicture() {
		const canvasResult = this.canvasResultRef.nativeElement;
		const context = canvasResult.getContext("2d");

		canvasResult.width = this.rectWidth;
		canvasResult.height = this.rectHeight;
		canvasResult.style.marginLeft = `${this.x}px`;
		canvasResult.style.marginTop = `${this.y}px`;

		context.drawImage(this.videoElement.nativeElement, this.x, this.y, this.rectWidth, this.rectHeight, 0, 0, this.rectWidth, this.rectHeight);

		const base64Image = canvasResult.toDataURL("image/jpeg").replace(/^data:.*;base64,/, "");

		this.base64Images = base64Image;

		this._changeDetectorRef.markForCheck();

		this.stopRecord();
	}
}
