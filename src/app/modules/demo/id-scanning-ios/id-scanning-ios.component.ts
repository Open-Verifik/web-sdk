import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { DemoService } from "../demo.service";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule } from "@ngneat/transloco";
import { WebcamImage, WebcamInitError, WebcamModule } from "ngx-webcam";
import { Observable, Subject } from "rxjs";
@Component({
	selector: "id-scanning-ios",
	templateUrl: "./id-scanning-ios.component.html",
	styleUrls: ["./id-scanning-ios.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, MatCheckboxModule, MatButtonModule, CommonModule, MatProgressSpinnerModule, TranslocoModule, WebcamModule],
})
export class IdScanningIOSComponent implements OnInit {
	@ViewChild("videoElement") videoElement: ElementRef;
	@ViewChild("canvas", { static: false }) public canvasRef: ElementRef;
	@ViewChild("toSend", { static: false }) public canvasToSendRef: ElementRef;

	hasCameraPermissions: boolean;
	loadingCamera: boolean;
	private trigger: Subject<void> = new Subject<void>();
	videoOptions: any = {
		frameRate: { ideal: 30, max: 30 },
	};

	failedToDetectDocument: boolean;
	attempts: number;
	attemptsLimit: number;
	demoData: any;
	idToSend: any;
	stream: MediaStream;
	VideoDimensions: any = {};
	HEIGHT: number;
	WIDTH: number;
	aspectRatio = 85.6 / 53.98;
	rectCredential: any;
	base64Images: any;
	video: any;
	isVideoReady: any;

	constructor(
		private _dom: ElementRef,
		private _demoService: DemoService,
		private _splashScreenService: FuseSplashScreenService,
		private _changeDetectorRef: ChangeDetectorRef,
		private renderer: Renderer2
	) {
		this.attempts = 0;
		this.attemptsLimit = 3;

		this.loadingCamera = false;
		this.hasCameraPermissions = false;

		this.base64Images = undefined;
		this.failedToDetectDocument = false;

		this.video = {};
		this.rectCredential = {};

		this.demoData = this._demoService.getDemoData();

		let key = this.demoData.isMobile ? "heigth" : "width";

		this.videoOptions[key] = { ideal: 1024 };

		this.videoOptions.facingMode = this.demoData.isMobile ? "environment" : "user";

		this.VideoDimensions = {};

		this.setMaxDimensions();

		this.renderer.listen("window", "resize", () => {
			this.setMaxDimensions();

			const videoNgx = this._dom.nativeElement.querySelector("video");

			if (!videoNgx) return;

			this.setBasicDimensions(videoNgx);

			this.drawRect();
		});
	}

	ngOnInit(): void {
		this.hasCameraPermissions = true;
		this.loadingCamera = false;
		this._splashScreenService.show();

		this.VideoDimensions.resultWidth = undefined;
		this.VideoDimensions.resultHeight = undefined;

		this.isVideoReady = setInterval(() => {
			const ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext("2d");
			ctx.clearRect(0, 0, this.VideoDimensions.width, this.VideoDimensions.height);

			const videoNgx = this._dom.nativeElement.querySelector("video");

			if (!videoNgx) return;

			this.isVideoReady = clearInterval(this.isVideoReady);

			videoNgx.addEventListener("playing", () => {
				this.setBasicDimensions(videoNgx);

				this.drawRect();

				this.loadingCamera = false;
				this.hasCameraPermissions = true;
				this.demoData.loading = false;
				this._splashScreenService.hide();
			});
		}, 100);
	}

	setMaxDimensions(): void {
		this.VideoDimensions.maxHeight = Math.ceil(window.innerHeight * 0.7);
		this.VideoDimensions.maxWidth = Math.ceil(window.innerWidth * 0.9);
	}

	cameraError(error: WebcamInitError): void {
		if (error.mediaStreamError && error.mediaStreamError.name === "NotAllowedError") {
			this.loadingCamera = false;
			this.hasCameraPermissions = false;
			this.demoData.loading = false;
			this._splashScreenService.hide();
		}
	}

	public get trigger$(): Observable<void> {
		return this.trigger.asObservable();
	}

	public captureImage(webcamImage: WebcamImage): void {
		const img = new Image();

		img.src = webcamImage.imageAsDataUrl;

		img.onload = () => {
			const canvas = this.canvasRef.nativeElement;
			this.VideoDimensions.resultWidth = this.rectCredential.rectWidth;
			this.VideoDimensions.resultHeight = this.rectCredential.rectHeight;

			canvas.width = this.rectCredential.rectWidth;
			canvas.height = this.rectCredential.rectHeight;
			canvas.style.marginLeft = `${this.rectCredential.x}px`;
			canvas.style.marginTop = `${this.rectCredential.y}px`;

			const originalDimensions: any = {};

			const isHorizontal = this.VideoDimensions.height < this.VideoDimensions.width;

			this.setRectDimensions(isHorizontal, img.height, img.width, originalDimensions);

			const ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			ctx.drawImage(
				img,
				originalDimensions.x,
				originalDimensions.y,
				originalDimensions.rectWidth,
				originalDimensions.rectHeight,
				0,
				0,
				this.rectCredential.rectWidth,
				this.rectCredential.rectHeight
			);

			const canvasToSend = this.canvasToSendRef.nativeElement;

			canvasToSend.width = originalDimensions.rectWidth;
			canvasToSend.height = originalDimensions.rectHeight;

			const toSend = canvasToSend.getContext("2d");
			toSend.clearRect(0, 0, webcamImage.imageData.width, webcamImage.imageData.height);

			toSend.drawImage(
				img,
				originalDimensions.x,
				originalDimensions.y,
				originalDimensions.rectWidth,
				originalDimensions.rectHeight,
				0,
				0,
				originalDimensions.rectWidth,
				originalDimensions.rectHeight
			);

			this.base64Images = canvasToSend.toDataURL("image/jpeg");
		};
	}

	public triggerSnapshot(): void {
		this.trigger.next();
	}

	tryAgain(plusAttempts = false): void {
		if (plusAttempts) this.attempts++;

		this.base64Images = undefined;
		this.failedToDetectDocument = false;

		this.ngOnInit();
	}

	restartDemo(): void {
		this._demoService.restart();
	}

	continue(): void {
		this.idToSend = {
			image: this.base64Images.replace("data:image/jpeg;base64", ""),
		};

		this.demoData.loading = true;
		this._splashScreenService.show();

		https: this._demoService.sendDocument(this.idToSend).subscribe(
			(response) => {
				this._demoService.setDemoDocument(response.data);

				const canvasResult = this.canvasRef.nativeElement;

				localStorage.setItem("idCard", this.base64Images);
				localStorage.setItem("documentId", response.data._id);

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

	drawRect(): void {
		const ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext("2d");
		this.canvasRef.nativeElement.width = this.VideoDimensions.width;
		this.canvasRef.nativeElement.height = this.VideoDimensions.height;
		//CLEAR CANVAS
		ctx.clearRect(0, 0, this.VideoDimensions.width, this.VideoDimensions.height);

		//OPACITY OUTSIDE THE ELLIPSE
		ctx.fillStyle = "rgba(255, 255, 255, 0.75)"; // Color de la máscara
		ctx.fillRect(0, 0, this.VideoDimensions.width, this.VideoDimensions.height);
		ctx.globalCompositeOperation = "destination-out";

		const isHorizontal = this.VideoDimensions.height < this.VideoDimensions.width;

		this.setRectDimensions(isHorizontal, this.VideoDimensions.height, this.VideoDimensions.width, this.rectCredential);

		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(this.rectCredential.x, this.rectCredential.y, this.rectCredential.rectWidth, this.rectCredential.rectHeight);
		ctx.globalCompositeOperation = "source-over";
	}

	setRectDimensions(isHorizontal, height, width, data) {
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

	setBasicDimensions(videoNgx) {
		this.VideoDimensions.height = videoNgx.clientHeight;
		this.VideoDimensions.width = videoNgx.clientWidth;

		const canvas = this.canvasRef.nativeElement;
		canvas.style.marginLeft = `0px`;
		canvas.style.marginTop = `0px`;

		this.drawRect();
	}
}
