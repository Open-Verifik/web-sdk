import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject } from "rxjs";
import { WebSdkService } from "../web-sdk.service";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { MatButtonModule } from "@angular/material/button";
import { DemoService } from "app/modules/demo/demo.service";
import { FuseConfirmationDialogComponent } from "@fuse/services/confirmation/dialog/dialog.component";

import * as faceapi from "@vladmandic/face-api";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";

@Component({
	selector: "app-face",
	standalone: true,
	imports: [CommonModule, MatDialogModule, TranslocoModule, MatButtonModule, MatProgressBarModule, MatProgressSpinnerModule],
	templateUrl: "./face.component.html",
	styleUrls: ["./face.component.scss"],
})
export class FaceComponent implements OnInit, OnDestroy {
	private _matDialog: MatDialog = inject(MatDialog);

	//ACTIVE DEBUG GRAPHIC MODE
	isActiveDebug: Boolean;
	debugIndex: number;
	debugText: string = "debug";

	@ViewChild("video", { static: false }) public video: ElementRef;
	@ViewChild("canvas", { static: false }) public canvasRef: ElementRef;
	@ViewChild("result", { static: false }) public canvasResultRef: ElementRef;
	@ViewChild("credentialCanvas", { static: false }) credentialRef: ElementRef;
	//
	canvasEl: any;
	canvas: any;
	canvasResult: any;
	displaySize: any;
	videoInput: HTMLVideoElement;
	base64Images: any[];

	//SIZE OF CANVAS
	WIDTH = 720;
	HEIGHT = 720;
	videoCenterX;
	videoCenterY;
	marginX;
	marginY;
	//SIZE OVAL
	OVAL: any = {};

	detectFaceInterval: any;
	saveImageBase64Intent: any;

	osInfo: string;
	stream: any;
	loadingResults: boolean = false;
	loadingModel: boolean = false;
	lastFace: faceapi.WithAge<
		faceapi.WithGender<faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>>>
	>;
	demoData: any;

	//RESULTS
	result: any;
	errorResult: {};
	errorFace: {
		title: string;
		subtitle: string;
		canvas?: string;
	} | null;

	private _unsubscribeAll: Subject<any> = new Subject<any>();
	idCardImage: string;
	faceIdCard: any;
	left: HTMLImageElement;
	right: HTMLImageElement;
	up: HTMLImageElement;
	down: HTMLImageElement;

	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		private _sdkService: WebSdkService,
		private _demoService: DemoService,
		private _translocoService: TranslocoService,
		private _splashScreenService: FuseSplashScreenService
	) {
		this.loadingModel = true;

		this.debugIndex = 0;

		this.osInfo = this.detectOS();

		this.demoData = this._demoService.getDemoData();

		this._splashScreenService.show();

		this.listenModeDebug();

		this._changeDetectorRef.markForCheck();
	}

	listenModeDebug(): void {
		this.isActiveDebug = Boolean(localStorage.getItem("isActiveDebug"));

		document.addEventListener("keydown", (event) => {
			if (this.debugText.charAt(this.debugIndex) === event.key.toLowerCase()) {
				if (this.debugIndex === 3) {
					this.isActiveDebug = !this.isActiveDebug;

					localStorage.setItem("isActiveDebug", this.isActiveDebug ? "true" : "");

					this._changeDetectorRef.markForCheck();
				}
				return this.debugIndex++;
			}
			this.debugIndex = 0;
		});
	}

	stopRecord(): void {
		if (this.detectFaceInterval) {
			clearInterval(this.detectFaceInterval);
		}

		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
		}
	}

	async ngOnInit(): Promise<void> {
		this.idCardImage = localStorage.getItem("idCard");

		await this.loadModels();

		this.base64Images = [];

		this.errorFace = null;

		await this.startAsyncVideo();

		this._splashScreenService.hide();

		this.demoData.loading = false;
	}

	async restart(): Promise<void> {
		this.completeResults();
		await this.startAsyncVideo();
	}

	async loadModels(): Promise<void> {
		this.left = new Image();
		this.left.crossOrigin = "anonymous";
		this.left.src = "https://cdn.verifik.co/web-sdk/images/left.png";
		this.right = new Image();
		this.right.crossOrigin = "anonymous";
		this.right.src = "https://cdn.verifik.co/web-sdk/images/right.png";
		this.up = new Image();
		this.up.crossOrigin = "anonymous";
		this.up.src = "https://cdn.verifik.co/web-sdk/images/up.png";
		this.down = new Image();
		this.down.crossOrigin = "anonymous";
		this.down.src = "https://cdn.verifik.co/web-sdk/images/down.png";

		await faceapi.nets.ssdMobilenetv1.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.faceLandmark68Net.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.faceRecognitionNet.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.faceExpressionNet.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.ageGenderNet.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await this.detectFaceBiggest();
	}

	async detectFaceBiggest() {
		const credentialImage: HTMLImageElement = document.getElementById("credential") as HTMLImageElement;

		const detections = await faceapi
			.detectAllFaces(credentialImage, new faceapi.TinyFaceDetectorOptions())
			.withFaceLandmarks()
			.withFaceExpressions();

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

		if (!faceBigest) {
			return;
		}

		const position = faceBigest.box; // Object with x, y, width, height
		const width = Math.ceil(position.width) * 1.2;
		const height = Math.ceil(position.height) * 1.4;
		const sx = Math.floor(position.x);
		const sy = Math.floor(position.y) - (height - position.height);

		const credentialCanvas: HTMLCanvasElement = this.credentialRef.nativeElement;
		const ctx: CanvasRenderingContext2D = credentialCanvas.getContext("2d");

		credentialCanvas.height = height;
		credentialCanvas.width = width;

		ctx.drawImage(credentialImage, sx, sy, width, height, 0, 0, width, height);

		this.faceIdCard = credentialCanvas.toDataURL("image/jpeg").replace(/^data:.*;base64,/, "");
	}

	loadImage(url: string, canvas) {
		return new Promise((resolve) => {
			const image = new Image();
			image.onload = () => {
				const context = canvas.getContext("2d");
				canvas.height = image.height;
				canvas.width = image.width;

				context.drawImage(image, 0, 0); // Dibuja la imagen en el canvas
				resolve("Done");
			};
			image.src = url;
		});
	}
	async startAsyncVideo() {
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: { height: 720 },
				audio: false,
			});

			this.loadingModel = false;

			setTimeout(() => {
				if (!this.video && !this.canvas) {
					this.stopRecord();
					return;
				}

				const videoTrack = this.stream.getVideoTracks()[0];
				const settings = videoTrack.getSettings();

				// Access the width and height properties
				const { width, height } = settings;
				this.HEIGHT = height;
				this.WIDTH = width;

				this.videoCenterX = this.WIDTH / 2;
				this.videoCenterY = this.HEIGHT / 2;

				this.marginY = this.HEIGHT * 0.04;
				this.marginX = this.marginY * 0.8;

				this.OVAL.radiusY = (this.HEIGHT * 0.85) / 2;
				this.OVAL.radiusX = this.OVAL.radiusY * 0.75;

				this.videoInput = this.video.nativeElement as HTMLVideoElement;

				this.videoInput.srcObject = this.stream;

				this.displaySize = {
					width: this.WIDTH,
					height: this.HEIGHT,
				};

				this.videoInput.addEventListener("play", async () => {
					this.detectFaces();
				});

				this._changeDetectorRef.markForCheck();
			}, 300);
		} catch (error) {
			alert(`${error.message}`);
			console.error("SHOW ERROR");
		}
	}

	async detectFaces() {
		await this.setConfigCanvas();

		this.detectFaceInterval = setInterval(async () => {
			const detection = await faceapi
				.detectAllFaces(this.videoInput, new faceapi.TinyFaceDetectorOptions())
				.withFaceLandmarks()
				.withFaceExpressions()
				.withAgeAndGender();

			const context = this.canvas.getContext("2d");

			if (detection.length > 0) {
				this.lastFace = detection[0];
				this.errorFace = null;

				this.drawFaceAndCenter(detection, context);
				this.isFaceCentered(this.lastFace.landmarks.getNose()[3]);
				this.isFaceClose(this.lastFace.landmarks);

				this.drawStatusOval(context, !this.errorFace?.title);

				if (!this.errorFace) {
					this.captureBase64Image();
				}
			}

			this._changeDetectorRef.markForCheck();
		}, 100);
	}

	manualCapture(): void {
		this.takePicture();
	}

	async setConfigCanvas(): Promise<void> {
		if (!this.canvas) {
			this.canvas = await faceapi.createCanvasFromMedia(this.videoInput);

			this.canvasEl = this.canvasRef.nativeElement;
			this.canvasEl.appendChild(this.canvas);
			this.canvas.setAttribute("id", "canvas");

			faceapi.matchDimensions(this.canvas, this.displaySize);
		}

		const ctx = this.canvas.getContext("2d");
		this.drawOvalCenterAndMask(ctx);
	}

	drawFaceAndCenter(detection, ctx): void {
		const resizedDetections = faceapi.resizeResults(detection, this.displaySize);

		this.drawOvalCenterAndMask(ctx);

		if (this.isActiveDebug) {
			ctx.strokeStyle = "red";
			ctx.lineWidth = 4;
			ctx.strokeRect(this.videoCenterX - this.marginX, this.videoCenterY, this.marginX * 2, this.marginY * 2);
			// faceapi.draw.drawDetections(this.canvas, resizedDetections);
			faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetections);
			faceapi.draw.drawFaceExpressions(this.canvas, resizedDetections);

			const box = detection[0].detection.box;
			const drawBox = new faceapi.draw.DrawBox(box, {
				label: `${detection[0].gender.toUpperCase()} | ${Math.round(detection[0].age)} years old`,
			});
			drawBox.draw(this.canvas);
		}
	}

	drawOvalCenterAndMask(ctx): void {
		//CLEAR CANVAS
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		//OPACITY OUTSIDE THE ELLIPSE
		ctx.fillStyle = "rgba(255, 255, 255, 0.75)"; // Color de la máscara
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.globalCompositeOperation = "destination-out";

		//DRAW ELIPSE CON RELLENO VACIO
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.beginPath();
		ctx.ellipse(this.videoCenterX, this.videoCenterY, this.OVAL.radiusX, this.OVAL.radiusY, 0, 0, 2 * Math.PI);
		ctx.fill();
		ctx.closePath();
		ctx.globalCompositeOperation = "source-over";
	}

	drawText(ctx, text, x, y): void {
		ctx.font = "30px Arial";
		ctx.textAlign = "center";

		const medidasTexto = ctx.measureText(text);

		const padding = 10;
		ctx.fillStyle = "black";

		ctx.fillRect(x - medidasTexto.width / 2, y - 30 - padding, medidasTexto.width + 2, 40 + 2 * padding);

		ctx.fillStyle = "white";
		ctx.fillText(text, x, y);
	}

	drawStatusOval(ctx, isOk?): void {
		ctx.beginPath();
		ctx.ellipse(this.videoCenterX, this.videoCenterY, this.OVAL.radiusX, this.OVAL.radiusY, 0, 0, 2 * Math.PI);
		ctx.lineWidth = 5;
		ctx.strokeStyle = isOk ? "green" : "red";
		ctx.stroke();
		ctx.closePath();

		if (!isOk) {
			// let positionError = {
			// 	x: this.videoCenterX,
			// 	y: this.videoCenterY - this.OVAL.radiusY - 10,
			// };

			// this.drawText(ctx, this.errorFace.title, positionError.x, positionError.y);

			if (this.errorFace.canvas?.includes("↑")) {
				const startX = this.videoCenterX - 20;
				const startY = this.videoCenterY - this.OVAL.radiusY + 10;
				ctx.drawImage(this.up, startX, startY, 40, 40);
			}

			if (this.errorFace.canvas?.includes("↓")) {
				const startX = this.videoCenterX - 20;
				const startY = this.videoCenterY + this.OVAL.radiusY - 50;
				ctx.drawImage(this.down, startX, startY, 40, 40);
			}

			if (this.errorFace.canvas?.includes("→")) {
				const startX = this.videoCenterX + this.OVAL.radiusX - 50;
				const startY = this.videoCenterY - 20;
				ctx.drawImage(this.right, startX, startY, 40, 40);
			}

			if (this.errorFace.canvas?.includes("←")) {
				const startX = this.videoCenterX - this.OVAL.radiusX + 10;
				const startY = this.videoCenterY - 20;
				ctx.drawImage(this.left, startX, startY, 40, 40);
			}
		}
		this._changeDetectorRef.markForCheck();
	}

	isFaceCentered(nose): void {
		const faceCenterX = nose.x;
		const faceCenterY = nose.y;

		const isFaceCentered =
			faceCenterX > this.videoCenterX - this.marginX &&
			faceCenterX < this.videoCenterX + this.marginX &&
			faceCenterY > this.videoCenterY &&
			faceCenterY < this.videoCenterY + this.marginY * 2;

		if (!isFaceCentered) {
			let direction = "";

			if (faceCenterX < this.videoCenterX - this.marginX || faceCenterX > this.videoCenterX + this.marginX)
				direction += ` ${faceCenterX < this.videoCenterX - this.marginX ? "→" : "←"} `;

			if (faceCenterY < this.videoCenterY || faceCenterY > this.videoCenterY + this.marginY * 2)
				direction += ` ${faceCenterY < this.videoCenterY ? "↑" : "↓"}  `;

			this.errorFace = {
				title: this._translocoService.translate("liveness.center_yor_face"),
				subtitle: this._translocoService.translate("liveness.center_your_face_subtitle"),
				canvas: direction,
			};
		}
	}

	isFaceClose(landmarks: faceapi.FaceLandmarks68): void {
		const totalFaceArea = landmarks.imageHeight * landmarks.imageWidth;
		const totalImageArea = 4 * this.OVAL.radiusX * this.videoInput.height;
		const faceProportion = totalFaceArea / totalImageArea;

		const threshold = 0.25;

		if (faceProportion < threshold) {
			this.errorFace = {
				title: this._translocoService.translate("liveness.get_closer"),
				subtitle: this._translocoService.translate("liveness.get_closer_subtitle"),
			};
		}
	}

	captureBase64Image(): void {
		if (this.saveImageBase64Intent) {
			return;
		}

		this.saveImageBase64Intent = setTimeout(() => {
			if (this.errorFace) {
				this.saveImageBase64Intent = clearTimeout(this.saveImageBase64Intent);
			}

			this.takePicture();
		}, 1500);
	}

	async takePicture() {
		this.stopRecord();

		const startX = this.videoCenterX - 1.4 * this.OVAL.radiusX;
		const widthCut = 2.8 * this.OVAL.radiusX;

		if (!this.canvasResult) {
			this.canvasResult = document.createElement("canvas");
			this.canvasResult.width = widthCut;
			this.canvasResult.height = this.HEIGHT;
			this.canvasResult.style.marginLeft = `${startX}px`;
			this.canvasResultRef.nativeElement.appendChild(this.canvasResult);
		}

		const context = this.canvasResult.getContext("2d");

		context.drawImage(this.videoInput, startX, 0, widthCut, this.HEIGHT, 0, 0, widthCut, this.HEIGHT);

		const base64Image = this.canvasResult.toDataURL("image/jpeg").replace(/^data:.*;base64,/, "");

		this.base64Images.push(base64Image);

		await this.liveness();
	}

	detectOS() {
		const userAgent = window.navigator.userAgent.toLowerCase();

		if (/android/.test(userAgent)) {
			return "ANDROID";
		} else if (/iphone|ipad|ipod/.test(userAgent)) {
			return "IOS";
		}

		return "DESKTOP";
	}

	liveness() {
		if (this.loadingResults) return;

		this.demoData.loading = true;

		this._splashScreenService.show();

		this.loadingResults = true;

		const payload: any = {
			image: this.base64Images[0],
			os: this.osInfo,
		};

		this._sdkService.livenessDemo(payload).subscribe(
			(liveness) => {
				this.errorResult = null;

				this._demoService.setDemoLiveness(liveness.data);

				this._compareWithDocument({
					search_mode: "FAST",
					gallery: [this.faceIdCard || this.demoData.document.url],
					probe: [this.demoData.liveness.images[0]],
				});
			},
			(error) => {
				this._splashScreenService.hide();
				this.retryLivenessModal(error.error?.message);
			}
		);
	}

	_compareWithDocument(data) {
		this._demoService.compareDocumentWithSelfie(data).subscribe(
			(compareResponse) => {
				this.completeResults();

				this._demoService.setDemoCompare(compareResponse.data);

				this._demoService.moveToStep(5);

				this.demoData.loading = false;

				this._splashScreenService.hide();
			},
			(error) => {}
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
					return this.restart();
				}

				this._demoService.moveToStep(1);
				// pantalla de error
			});
	}
	completeResults() {
		this.errorFace = null;
		this.loadingResults = false;
		this.base64Images = [];

		if (!this.errorResult) {
			this.stopRecord();
		}

		this._changeDetectorRef.markForCheck();
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
		this.loadingResults = false;
		this.video = undefined;
		if (this.detectFaceInterval) {
			this.stopRecord();
		}
	}
}
