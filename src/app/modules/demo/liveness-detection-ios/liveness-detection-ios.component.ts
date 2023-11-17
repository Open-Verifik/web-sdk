import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Observable, Subject } from "rxjs";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { MatButtonModule } from "@angular/material/button";
import { DemoService } from "app/modules/demo/demo.service";
import { FuseConfirmationDialogComponent } from "@fuse/services/confirmation/dialog/dialog.component";

import * as faceapi from "@vladmandic/face-api";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { FlexLayoutModule } from "@angular/flex-layout";
import { WebcamImage, WebcamInitError, WebcamModule } from "ngx-webcam";
import {
	Attemps,
	CameraData,
	ErrorFace,
	FaceData,
	FacingMode,
	IdCard,
	Intervals,
	OvalData,
	ResponseData,
	directionImage,
} from "../models/sdk.models";

@Component({
	selector: "app-liveness-detection-ios",
	standalone: true,
	imports: [
		FlexLayoutModule,
		CommonModule,
		MatDialogModule,
		TranslocoModule,
		MatButtonModule,
		MatProgressBarModule,
		MatProgressSpinnerModule,
		WebcamModule,
	],
	templateUrl: "./liveness-detection-ios.component.html",
	styleUrls: ["./liveness-detection-ios.component.scss"],
})
export class LivenessDetectionIOSComponent implements OnInit {
	private _matDialog: MatDialog = inject(MatDialog);

	@ViewChild("maskResult", { static: false }) public maskResultCanvasRef: ElementRef;
	@ViewChild("toSend", { static: false }) public ToSendCanvasRef: ElementRef;
	@ViewChild("credentialCanvas", { static: false }) credentialRef: ElementRef;

	demoData: any;
	attempts: Attemps;
	camera: CameraData;
	response: ResponseData;
	face: FaceData;

	interval: Intervals;

	aspectRatio = 0.75;

	marginX;
	marginY;

	lastFace: any;

	errorFace: ErrorFace | null;
	idCard: IdCard;
	direction: directionImage;

	private _unsubscribeAll: Subject<any> = new Subject<any>();
	private takePicture: Subject<void> = new Subject<void>();

	public get takePicture$(): Observable<void> {
		return this.takePicture.asObservable();
	}

	setDefaultFace = () => {
		this.face = {
			successPosition: 0,
			minPixels: 240,
			minHeight: 600,
			threshold: 0.25,
		};
	};

	setDefaultIdCard = () => {
		this.idCard = {
			image: localStorage.getItem("idCard"),
		};
	};

	setDefaultDirections = () => {
		this.direction = {
			left: new Image(),
			right: new Image(),
			up: new Image(),
			down: new Image(),
		};
		this.direction.right.crossOrigin = "anonymous";
		this.direction.up.crossOrigin = "anonymous";
		this.direction.down.crossOrigin = "anonymous";
		this.direction.left.crossOrigin = "anonymous";

		this.direction.left.src = "https://cdn.verifik.co/web-sdk/images/left.png";
		this.direction.right.src = "https://cdn.verifik.co/web-sdk/images/right.png";
		this.direction.up.src = "https://cdn.verifik.co/web-sdk/images/up.png";
		this.direction.down.src = "https://cdn.verifik.co/web-sdk/images/down.png";
	};

	setDefaultAttempts = () => {
		this.attempts = {
			current: 0,
			limit: 3,
		};
	};

	setDefaultCamera = () => {
		let key = this.demoData.isMobile ? "width" : "height";

		this.camera = {
			hasPermissions: false,
			isLoading: false,
			isLowQuality: false,
			configuration: {
				frameRate: { ideal: 30, max: 30 },
				[key]: { ideal: 1080 },
				facingMode: FacingMode.USER,
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

	setDefaultResponse = () => {
		this.response = {
			isLoading: false,
			isFailed: false,
		};
	};

	setDefaultInterval = () => {
		this.interval = {};
	};

	constructor(
		private _dom: ElementRef,
		private _changeDetectorRef: ChangeDetectorRef,
		private _demoService: DemoService,
		private _translocoService: TranslocoService,
		private _splashScreenService: FuseSplashScreenService,
		private renderer: Renderer2
	) {
		this.demoData = this._demoService.getDemoData();

		this.startDefaultValues();
		this.setDefaultAttempts();
		this.setDefaultDirections();
		this.setDefaultFace();
		this.setDefaultIdCard();
		this.setDefaultInterval();

		this.renderer.listen("window", "resize", () => {
			this.interval.checkNgxVideo = setInterval(() => {
				this.setMaxVideoDimensions();
				this.setVideoNgxCameraData();
			}, this.demoData.time);
		});

		this._changeDetectorRef.markForCheck();
	}

	ngOnInit(): void {
		this.startDefaultValues();

		this.camera.hasPermissions = true;

		this.loading({ start: true });

		this._demoService.faceapi$.subscribe(async (isLoaded) => {
			this.camera.isLoading = !isLoaded;

			if (isLoaded) {
				this.detectFaceBiggest(0.9);
			}
		});

		this.interval.checkNgxVideo = setInterval(() => {
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

		this.interval.checkNgxVideo = clearInterval(this.interval.checkNgxVideo);

		this.setVideoDimensions(videoNgx);
		this.drawOvalCenterAndMask();

		videoNgx.addEventListener("playing", () => {
			this.setVideoDimensions(videoNgx);
			this.drawOvalCenterAndMask();

			this.interval.detectFace = setInterval(() => {
				this.takePicture.next();
			}, this.demoData.time);

			this.loading({ isLoading: false, start: true });
		});
	};

	setVideoDimensions(videoNgx) {
		this.camera.dimensions.video.height = videoNgx.clientHeight;
		this.camera.dimensions.video.width = videoNgx.clientWidth;

		this.camera.dimensions.result = { height: 0, width: 0, offsetX: 0, offsetY: 0 };
		this.setResultDimensions("result", videoNgx.clientHeight, videoNgx.clientWidth);

		this.face.video = this.getCenterAndRadius(videoNgx.clientHeight, videoNgx.clientWidth);

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

	drawOvalCenterAndMask(): void {
		const videoDim = this.camera.dimensions.video;
		const maskResultCanvas = this.maskResultCanvasRef.nativeElement;
		maskResultCanvas.height = videoDim.height;
		maskResultCanvas.width = videoDim.width;

		const ctx: CanvasRenderingContext2D = maskResultCanvas.getContext("2d");

		//CLEAR CANVAS
		ctx.clearRect(0, 0, videoDim.width, videoDim.height);

		//OPACITY OUTSIDE THE ELLIPSE
		ctx.fillStyle = "rgba(255, 255, 255, 0.75)"; // Color de la máscara
		ctx.fillRect(0, 0, videoDim.width, videoDim.height);
		ctx.globalCompositeOperation = "destination-out";

		//DRAW ELIPSE CON RELLENO VACIO
		const { center, radius } = this.face.video;

		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.beginPath();
		ctx.ellipse(center.x, center.y, radius.x, radius.y, 0, 0, 2 * Math.PI);
		ctx.fill();
		ctx.closePath();
		ctx.globalCompositeOperation = "source-over";
	}

	setResultDimensions(key, height, width) {
		const { center, radius } = (this.face[key] = this.getCenterAndRadius(height, width));

		this.camera.dimensions[key].height = height;
		this.camera.dimensions[key].offsetY = 0;

		this.camera.dimensions[key].width = Math.min(2.8 * radius.x, width);
		this.camera.dimensions[key].offsetX = center.x - this.camera.dimensions[key].width / 2;
	}

	getCenterAndRadius = (height, width) => {
		const data: OvalData = {
			center: {
				x: width / 2,
				y: height / 2,
			},
			radius: {
				x: 0,
				y: 0,
			},
			margin: {
				y: height * 0.05,
				x: 0,
			},
		};

		data.margin.x = data.margin.y * 0.8;

		data.radius.y = height * 0.42;
		data.radius.x = data.radius.y * this.aspectRatio;

		if (data.radius.x * 2 >= width) {
			data.radius.x = width * 0.48;
			data.radius.y = data.radius.x / this.aspectRatio;
		}

		return data;
	};

	loading = ({ isLoading = true, start = undefined, result = undefined }) => {
		const key = (start && "camera") || (result && "response");

		if (key) {
			this[key].isLoading = isLoading;
		}

		const functionName = isLoading ? "show" : "hide";
		// this.demoData.loading = isLoading;
		this._splashScreenService[functionName]();
	};

	cameraError(error: WebcamInitError): void {
		if (error.mediaStreamError && error.mediaStreamError.name === "NotAllowedError") {
			this.loading({ isLoading: false, start: true });
			this.camera.hasPermissions = false;
		}
	}

	proccessImage(webcamImage: WebcamImage): void {
		const img = new Image();

		img.src = webcamImage.imageAsDataUrl;

		img.onload = async () => {
			if(img.height < this.face.minHeight){
				this.camera.isLowQuality = true
			}
			if(this.response.base64Image){
				return
			}
			try {
				this.camera.dimensions.real = { height: 0, width: 0, offsetX: 0, offsetY: 0 };
				this.setResultDimensions("real", img.height, img.width);
				this.face.real = this.getCenterAndRadius(img.height, img.width);

				const detection = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

				const context = this.maskResultCanvasRef.nativeElement.getContext("2d");

				if (detection.length > 0) {
					this.lastFace = detection[0];
					this.errorFace = null;

					this.drawOvalCenterAndMask();
					this.isFaceCentered(this.lastFace.landmarks.getNose()[3]);
					this.isFaceClose(this.lastFace.landmarks);

					this.drawStatusOval(context, !this.errorFace?.title);

					if (!this.errorFace && ++this.face.successPosition && this.face.successPosition > 3) {
						this.face.successPosition = 0;
						this.takePictureLiveness(img);
					}
				}

				this._changeDetectorRef.markForCheck();
			} catch (error) {
				alert(error.message);
			}
		};
	}

	takePictureLiveness(img) {
		const maskResultCanvas = this.maskResultCanvasRef.nativeElement;
		this.setImageOnCanvas(maskResultCanvas, img, this.camera.dimensions.real, this.camera.dimensions.result);

		const toSendCanvas = this.ToSendCanvasRef.nativeElement;
		this.setImageOnCanvas(toSendCanvas, img, this.camera.dimensions.real, this.camera.dimensions.real);

		this.response.base64Image = toSendCanvas.toDataURL("image/jpeg");

		this.liveness();
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

	async detectFaceBiggest(minConfidence) {
		const credentialImage: HTMLImageElement = document.getElementById("credential") as HTMLImageElement;

		const detections = await faceapi.detectAllFaces(credentialImage, new faceapi.SsdMobilenetv1Options({ minConfidence })).withFaceLandmarks();

		if (minConfidence <= 0.1) {
			return;
		}

		if (!detections.length) {
			return this.detectFaceBiggest(minConfidence - 0.1);
		}

		let maxArea = 0;
		let faceBigest;
		for (const detection of detections) {
			const position = detection.detection.box;
			const tempArea = position.width * position.height;
			if (tempArea > maxArea) {
				faceBigest = detection.detection;
				maxArea = tempArea;
			}
		}

		const position = faceBigest.box; // Object with x, y, width, height
		let width = Math.ceil(position.width * 3);
		let height = Math.ceil(position.height * 3);
		let sx = Math.floor(position.x) - position.width;
		let sy = Math.floor(position.y) - position.height;

		if (width > credentialImage.naturalWidth) {
			width = credentialImage.naturalWidth;
			height = credentialImage.naturalHeight;
			sx = 0;
			sy = 0;
		}

		const credentialCanvas: HTMLCanvasElement = this.credentialRef.nativeElement;
		const ctx: CanvasRenderingContext2D = credentialCanvas.getContext("2d");

		credentialCanvas.height = height;
		credentialCanvas.width = width;

		ctx.drawImage(credentialImage, sx, sy, width, height, 0, 0, width, height);

		this.idCard.face = credentialCanvas.toDataURL("image/jpeg"); //.replace(/^data:.*;base64,/, "");
	}

	drawStatusOval(ctx, isOk?): void {
		const { center, radius } = this.face.video;

		ctx.beginPath();
		ctx.ellipse(center.x, center.y, radius.x, radius.y, 0, 0, 2 * Math.PI);
		ctx.lineWidth = 5;
		ctx.strokeStyle = isOk ? "green" : "red";
		ctx.stroke();
		ctx.closePath();

		if (!isOk) {
			if (this.errorFace.canvas?.includes("↑")) {
				const startX = center.x - 20;
				const startY = center.y - radius.y + 10;
				ctx.drawImage(this.direction.up, startX, startY, 40, 40);
			}

			if (this.errorFace.canvas?.includes("↓")) {
				const startX = center.x - 20;
				const startY = center.y + radius.y - 50;
				ctx.drawImage(this.direction.down, startX, startY, 40, 40);
			}

			if (this.errorFace.canvas?.includes("→")) {
				const startX = center.x + radius.x - 50;
				const startY = center.y - 20;
				ctx.drawImage(this.direction.right, startX, startY, 40, 40);
			}

			if (this.errorFace.canvas?.includes("←")) {
				const startX = center.x - radius.x + 10;
				const startY = center.y - 20;
				ctx.drawImage(this.direction.left, startX, startY, 40, 40);
			}
		}
		this._changeDetectorRef.markForCheck();
	}

	inRange(value, min, max) {
		return value >= min && value <= max;
	}

	isFaceCentered(nose): void {
		const faceCenterX = nose.x;
		const faceCenterY = nose.y;

		const { center, margin } = this.face.real;

		const inRangeX = this.inRange(faceCenterX, center.x - margin.x, center.x + margin.x);
		const inRangeY = this.inRange(faceCenterY, center.y, center.y + margin.y * 2.5);

		const isFaceCentered = inRangeX && inRangeY;

		if (!isFaceCentered) {
			let direction = "";

			if (!inRangeX) direction += `${faceCenterX < center.x - margin.x - this.marginX ? "→" : "←"}`;

			if (!inRangeY) direction += `${faceCenterY < center.y ? "↓" : "↑"}`;

			this.errorFace = {
				title: this._translocoService.translate("liveness.center_yor_face"),
				subtitle: this._translocoService.translate("liveness.center_your_face_subtitle"),
				canvas: direction,
			};
		}
	}

	isFaceClose(landmarks: faceapi.FaceLandmarks68): void {
		const realDim = this.camera.dimensions.real;
		const totalFaceArea = landmarks.imageHeight * landmarks.imageWidth;
		const totalImageArea = Math.floor(realDim.height * (realDim.width - realDim.offsetX));
		const faceProportion = totalFaceArea / totalImageArea;

		if (faceProportion < this.face.threshold || landmarks.imageHeight < this.face.minPixels || landmarks.imageWidth < this.face.minPixels) {
			this.errorFace = {
				title: this._translocoService.translate("liveness.get_closer"),
				subtitle: this._translocoService.translate("liveness.get_closer_subtitle"),
			};
		}
	}

	liveness() {
		if (this.response.isLoading) return;

		this.loading({ result: true });

		const payload: any = {
			image: this.response.base64Image.replace(/^data:.*;base64,/, ""),
			os: this.demoData.OS,
		};

		this._demoService.sendSelfie(payload).subscribe(
			(liveness) => {
				this.response.error = null;

				this._demoService.setDemoLiveness(liveness.data);

				this._compareWithDocument({
					search_mode: "ACCURATE",
					gallery: [this.idCard.face?.replace(/^data:.*;base64,/, "") || this.demoData.document.url],
					probe: [payload.image],
				});
			},
			(error) => {
				this.loading({ isLoading: false, result: true });

				this.retryLivenessModal(error.error?.message);
			}
		);
	}

	_compareWithDocument(data) {
		this._demoService.compareDocumentWithSelfie(data).subscribe(
			(compareResponse) => {
				this.loading({ isLoading: false, result: true });

				this._demoService.setDemoCompare(compareResponse.data);

				this._demoService.moveToStep(5);
			},
			(error) => {
				this.loading({ isLoading: false, result: true });

				alert(`_compareWithDocument: ${JSON.stringify(error)}`);
			}
		);
	}

	retryLivenessModal(error) {
		const data = {
			title: this._translocoService.translate("liveness.liveness_failed"),
			message: this._translocoService.translate("liveness.liveness_error_message", { error }),
			icon: {
				show: true,
				name: "heroicons_outline:exclamation-triangle",
				color: "warn",
			},
			actions: {
				confirm: {
					show: true,
					label: this._translocoService.translate("confirm"),
					color: "primary",
				},
				cancel: {
					show: true,
					label: this._translocoService.translate("cancel"),
				},
			},
			dismissible: false,
		};

		this._matDialog
			.open(FuseConfirmationDialogComponent, {
				autoFocus: false,
				disableClose: true,
				panelClass: "fuse-confirmation-dialog-panel",
				data,
			})
			.afterClosed()
			.subscribe((result) => {
				if (result === "confirmed") {
					this.setDefaultInterval();
					this.setDefaultFace();
					return this.ngOnInit();
				}

				this._demoService.restart();
				// pantalla de error
			});
	}
}
