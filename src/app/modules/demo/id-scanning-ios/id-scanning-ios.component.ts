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
import { CameraData, FacingMode, ResponseData } from "../models/sdk.models";
@Component({
	selector: "id-scanning-ios",
	templateUrl: "./id-scanning-ios.component.html",
	styleUrls: ["./id-scanning-ios.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, MatCheckboxModule, MatButtonModule, CommonModule, MatProgressSpinnerModule, TranslocoModule, WebcamModule],
})
export class IdScanningIOSComponent implements OnInit {
	@ViewChild("maskResult", { static: false }) public maskResultCanvasRef: ElementRef;
	@ViewChild("toSend", { static: false }) public ToSendCanvasRef: ElementRef;

	attempts: any;
	demoData: any;
	camera: CameraData;
	response: ResponseData;
	intervalCheckNgxVideo: any;

	aspectRatio = 85.6 / 53.98;

	private takePicture: Subject<void> = new Subject<void>();

	public get takePicture$(): Observable<void> {
		return this.takePicture.asObservable();
	}

	setDefaultCamera = () => {
		let key = this.demoData.isMobile ? "width" : "height";

		this.camera = {
			hasPermissions: false,
			isLoading: false,
			configuration: {
				frameRate: { ideal: 30, max: 30 },
				[key]: { ideal: 1080 },
				facingMode: FacingMode[this.demoData.isMobile],
			},
			dimensions: {
				video: {
					max: {
						height: Math.ceil(window.innerHeight * 0.7),
						width: Math.ceil(window.innerWidth * 0.9),
					},
				},
			},
		};
	};

	setDefaultAttempts = () => {
		this.attempts = {
			current: 0,
			limit: 3,
		};
	};

	setDefaultResponse = () => {
		this.response = {
			isLoading: false,
			isFailed: false,
		};
	};

	constructor(
		private _dom: ElementRef,
		private _demoService: DemoService,
		private _splashScreenService: FuseSplashScreenService,
		private renderer: Renderer2
	) {
		this.demoData = this._demoService.getDemoData();

		this.startDefaultValues();
		this.setDefaultAttempts();

		this.renderer.listen("window", "resize", () => {
			this.intervalCheckNgxVideo = setInterval(() => {
				this.setVideoNgxCameraData();
			}, this.demoData.time);
		});
	}

	ngOnInit(): void {
		this.startDefaultValues();

		this.camera.hasPermissions = true;

		this.loading({ start: true });

		this.intervalCheckNgxVideo = setInterval(() => {
			this.setMaxVideoDimensions();
			this.setVideoNgxCameraData();
		}, this.demoData.time);
	}

	startDefaultValues() {
		this.setDefaultResponse();
		this.setDefaultCamera();
		this.setMaxVideoDimensions();
	}

	setVideoNgxCameraData = () => {
		const videoNgx = this._dom.nativeElement.querySelector("video");
		if (!videoNgx) return;

		this.intervalCheckNgxVideo = clearInterval(this.intervalCheckNgxVideo);

		this.setVideoDimensions(videoNgx);
		this.drawRect();

		videoNgx.addEventListener("loadeddata", () => {
			this.setVideoDimensions(videoNgx);
			this.drawRect();

			this.loading({ isLoading: false, start: true });
		});
	};

	setVideoDimensions(videoNgx) {
		this.camera.dimensions.video.height = videoNgx.clientHeight;
		this.camera.dimensions.video.width = videoNgx.clientWidth;

		const maskResultCanvas = this.maskResultCanvasRef.nativeElement;
		maskResultCanvas.style.marginLeft = `0px`;
		maskResultCanvas.style.marginTop = `0px`;
	}

	setMaxVideoDimensions(): void {
		this.camera.dimensions.video = {
			max: {
				height: Math.ceil(window.innerHeight * 0.7),
				width: Math.ceil(window.innerWidth * 0.9),
			},
		};
		this.camera.dimensions.result = undefined;
	}

	setResultDimensions(data, height, width) {
		const isHorizontal = height < width;

		if (isHorizontal) {
			data.offsetY = Math.floor(height * 0.1);
			data.height = Math.floor(height * 0.8);
			data.width = Math.floor(this.aspectRatio * data.height);
			data.offsetX = Math.floor((width - data.width) / 2);
		} else {
			data.offsetX = Math.floor(width * 0.1);
			data.width = Math.floor(width * 0.8);
			data.height = Math.floor(this.aspectRatio * data.width);
			data.offsetY = Math.floor((height - data.height) / 2);
		}
	}

	loading = ({ isLoading = true, start = undefined, result = undefined }) => {
		const key = (start && "camera") || (result && "response");

		if (key) {
			this[key].isLoading = isLoading;
		}

		const functionName = isLoading ? "show" : "hide";
		this.demoData.loading = isLoading;
		this._splashScreenService[functionName]();
	};

	drawRect(): void {
		this.camera.dimensions.result = { height: 0, width: 0, offsetX: 0, offsetY: 0 };
		this.setResultDimensions(this.camera.dimensions.result, this.camera.dimensions.video.height, this.camera.dimensions.video.width);

		const maskResultCanvas = this.maskResultCanvasRef.nativeElement;

		const videoDim = this.camera.dimensions.video;
		const resultDim = this.camera.dimensions.result;

		maskResultCanvas.height = videoDim.height;
		maskResultCanvas.width = videoDim.width;

		const ctx: CanvasRenderingContext2D = maskResultCanvas.getContext("2d");

		//CLEAR CANVAS
		ctx.clearRect(0, 0, videoDim.width, videoDim.height);

		//OPACITY OUTSIDE THE ELLIPSE
		ctx.fillStyle = "rgba(255, 255, 255, 0.75)"; // Color de la máscara
		ctx.fillRect(0, 0, videoDim.width, videoDim.height);
		ctx.globalCompositeOperation = "destination-out";

		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(resultDim.offsetX, resultDim.offsetY, resultDim.width, resultDim.height);
		ctx.globalCompositeOperation = "source-over";
	}

	cameraError(error: WebcamInitError): void {
		if (error.mediaStreamError && error.mediaStreamError.name === "NotAllowedError") {
			this.loading({ isLoading: false, start: true });
			this.camera.hasPermissions = false;
		}
	}

	proccessImage(webcamImage: WebcamImage): void {
		const img = new Image();

		img.src = webcamImage.imageAsDataUrl;

		img.onload = () => {
			this.camera.dimensions.real = { height: 0, width: 0, offsetX: 0, offsetY: 0 };
			this.setResultDimensions(this.camera.dimensions.real, img.height, img.width);

			const maskResultCanvas = this.maskResultCanvasRef.nativeElement;
			this.setImageOnCanvas(maskResultCanvas, img, this.camera.dimensions.real, this.camera.dimensions.result);

			const toSendCanvas = this.ToSendCanvasRef.nativeElement;
			this.setImageOnCanvas(toSendCanvas, img, this.camera.dimensions.real, this.camera.dimensions.real);

			this.response.base64Image = toSendCanvas.toDataURL("image/jpeg");
		};
	}

	setImageOnCanvas = (canvas, inputImg, originalDim, resizeDim) => {
		canvas.width = resizeDim.width;
		canvas.height = resizeDim.height;
		canvas.style.marginLeft = `${resizeDim.offsetX || 0}px`;
		canvas.style.marginTop = `${resizeDim.offsetY || 0}px`;

		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, originalDim.width, originalDim.height);

		ctx.drawImage(
			inputImg,
			originalDim.offsetX,
			originalDim.offsetY,
			originalDim.width,
			originalDim.height,
			0,
			0,
			resizeDim.width,
			resizeDim.height
		);
	};

	takePictureSnapshot(): void {
		this.takePicture.next();
	}

	continue(): void {
		const dataToSend = {
			image: this.response.base64Image.replace("data:image/jpeg;base64", ""),
		};

		this.loading({ result: true });

		https: this._demoService.sendDocument(dataToSend).subscribe(
			(response) => {
				this._demoService.setDemoDocument(response.data);

				localStorage.setItem("idCard", this.response.base64Image);
				localStorage.setItem("documentId", response.data._id);

				this.loading({ isLoading: false });

				this._demoService.moveToStep(3);
			},
			(err) => {
				this.response.isFailed = true;
				this.loading({ isLoading: false });
			}
		);
	}

	tryAgain(): void {
		this.attempts.current++;
		this.ngOnInit();
	}

	restartDemo(): void {
		this._demoService.restart();
	}
}
