import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild } from "@angular/core";
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
	@ViewChild("toSend", { static: false }) public canvasToSendRef: ElementRef;

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
	rectCredential: any;
	base64Images: any;
	video: any;
	videoOptions: any = {
		frameRate: { ideal: 30, max: 30 },
	};

	constructor(
		private _demoService: DemoService,
		private _splashScreenService: FuseSplashScreenService,
		private _changeDetectorRef: ChangeDetectorRef,
		private renderer: Renderer2
	) {
		this.attempts = 0;

		this.attemptsLimit = 3;

		this.loadingCamera = false;

		this.hasCameraPermissions = false;

		this.failedToDetectDocument = false;

		this.base64Images = undefined;

		this.demoData = this._demoService.getDemoData();

		let key = this.demoData.isMobile ? "heigth" : "width";
		this.videoOptions[key] = { ideal: 1024 };
		this.videoOptions.facingMode = this.demoData.isMobile ? "environment" : "user"

		this.video = {};

		this.rectCredential = {};

		this.renderer.listen("window", "resize", () => {
			if (this.videoElement) {
				this.setCanvasDimensions();
			}
		});
	}

	ngOnInit(): void {
		this.startCamera();
	}

	startCamera() {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			this.loadingCamera = true;
			this._splashScreenService.show();

			navigator.mediaDevices
				.getUserMedia({
					video: this.videoOptions,
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

					this.video.height = height;
					this.video.width = width;

					setTimeout(() => {
						this.videoElement.nativeElement.srcObject = stream;
						this.videoElement.nativeElement.addEventListener("loadedmetadata", () => {
							if (!this.demoData.isMobile) {
								this.videoElement.nativeElement.style.transform = "scaleX(-1)";
							}

							// setTimeout(() => {
							this.setCanvasDimensions();
							this.demoData.loading = false;
							this._splashScreenService.hide();
							// }, 300);
						});
					}, 300);
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

	setCanvasDimensions = () => {
		this.HEIGHT = this.videoElement.nativeElement.clientHeight;
		this.WIDTH = this.videoElement.nativeElement.clientWidth;

		const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;
		canvas.height = this.HEIGHT;
		canvas.width = this.WIDTH;

		this.drawRect(canvas.getContext("2d"));
	};

	tryAgain(plusAttempts = false): void {
		if (plusAttempts) this.attempts++;

		this.base64Images = undefined;

		this.failedToDetectDocument = false;

		this.startCamera();
	}

	restartDemo(): void {
		this._demoService.restart();
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

		const isHorizontal = this.video.height < this.video.width;

		this.setDimensions(isHorizontal, this.HEIGHT, this.WIDTH, this.rectCredential);
		this.setDimensions(isHorizontal, this.video.height, this.video.width, this.video);

		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(this.rectCredential.x, this.rectCredential.y, this.rectCredential.rectWidth, this.rectCredential.rectHeight);
		ctx.globalCompositeOperation = "source-over";
	}

	setDimensions(isHorizontal, height, width, data) {
		if (isHorizontal) {
			data.y = Math.floor(height * 0.1);
			data.rectHeight = Math.floor(height * 0.8);
			data.rectWidth = Math.floor(this.aspectRatio * data.rectHeight);
			data.x = Math.floor((width - data.rectWidth) / 2);
		} else {
			data.x = Math.floor(width * 0.1);
			data.rectWidth = Math.floor(width * 0.8);
			data.rectHeight = Math.floor(this.aspectRatio * data.rectWidth);
			data.y = Math.floor((height - data.rectHeight) / 2);
		}
	}

	stopRecord(): void {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
		}
	}

	async takePicture() {
		const canvasToSend = this.canvasToSendRef.nativeElement;
		const canvasResult = this.canvasResultRef.nativeElement;

		this.setPictureInCavas(canvasResult, this.rectCredential, this.video);
		this.setPictureInCavas(canvasToSend, this.video);

		const base64Image = canvasToSend.toDataURL("image/jpeg").replace(/^data:.*;base64,/, "");

		this.base64Images = base64Image;

		this._changeDetectorRef.markForCheck();

		this.stopRecord();
	}

	setPictureInCavas(canvas, dimensions, dimensionsOriginals?) {
		const context = canvas.getContext("2d");

		canvas.width = dimensions.rectWidth;
		canvas.height = dimensions.rectHeight;
		canvas.style.marginLeft = `${dimensions.x}px`;
		canvas.style.marginTop = `${dimensions.y}px`;

		if (!dimensionsOriginals) {
			dimensionsOriginals = { x: dimensions.x, y: dimensions.y, rectWidth: dimensions.rectWidth, rectHeight: dimensions.rectHeight };
		}

		context.drawImage(
			this.videoElement.nativeElement,
			dimensionsOriginals.x,
			dimensionsOriginals.y,
			dimensionsOriginals.rectWidth,
			dimensionsOriginals.rectHeight,
			0,
			0,
			dimensions.rectWidth,
			dimensions.rectHeight
		);
	}
}
