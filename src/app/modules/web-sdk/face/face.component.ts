import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as faceapi from "@vladmandic/face-api";
import { Subject } from "rxjs";
import { FormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { WebSdkService } from "../web-sdk.service";
import { MatDialogModule } from "@angular/material/dialog";
import { TranslocoModule } from "@ngneat/transloco";
import { MatButtonModule } from "@angular/material/button";
import { FlexLayoutModule } from "@angular/flex-layout";

@Component({
	selector: "app-face",
	standalone: true,
	imports: [CommonModule, FormsModule, MatDialogModule, TranslocoModule, MatButtonModule, FlexLayoutModule],
	templateUrl: "./face.component.html",
	styleUrls: ["./face.component.scss"],
})
export class FaceComponent implements OnInit, OnDestroy {
	@ViewChild("video", { static: false }) public video: ElementRef;
	@ViewChild("canvas", { static: false }) public canvasRef: ElementRef;

	loadingResults = false;
	loading = false;
	loadingStream = false;
	stream: any;
	detection: any;
	private _unsubscribeAll: Subject<any> = new Subject<any>();

	// resizedDetections: any;
	canvas: any;
	canvasEl: any;
	displaySize: any;
	videoInput: HTMLVideoElement; // Explicitly type videoInput as HTMLVideoElement
	base64Images: any[];

	//SIZE OF CANVAS
	WIDTH = 720;
	HEIGHT = 1280;
	videoCenterX = this.WIDTH / 2;
	videoCenterY = this.HEIGHT / 2;
	marginX = 10;
	marginY = 10;

	faceError: {
		title: string;
		subtitle: string;
	} | null;
	detectFaceInterval: any;
	saveImageBase64Intent: any;

	personForm: FormGroup;

	//ACTIVE DEBUG GRAPHIC MODE
	isActiveDebug: Boolean;
	debugIndex: number;
	debugText: string = "debug";

	osInfo: string;

	//RESULTS
	result: any;
	errorResult: {};
	loadingModel: boolean;
	livenessScore: any;

	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		private _sdkService: WebSdkService,
		private _formBuilder: FormBuilder // private dialogRef: MatDialogRef<SDK>
	) {
		this.debugIndex = 0;
		this.isActiveDebug = Boolean(localStorage.getItem("isActiveDebug"));
		this.osInfo = this.detectOS();
		this.loadingModel = true;

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

		this._changeDetectorRef.markForCheck();
	}

	initFormPerson() {
		this.personForm = this._formBuilder.group({
			name: ["", Validators.required],
			nationality: [""],
			date_of_birth: ["", Validators.required],
			gender: ["", Validators.required],
			notes: [""],
		});
	}

	stopRecord(): void {
		clearInterval(this.detectFaceInterval);

		this.stream.getTracks().forEach((track) => track.stop());
	}

	async ngOnInit(): Promise<void> {
		await this.loadModels();

		await this.restart();
	}

	async restart(): Promise<void> {
		this.base64Images = [];
		this.faceError = null;

		await this.startAsyncVideo();
	}

	async loadModels(): Promise<void> {
		await faceapi.nets.ssdMobilenetv1.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.faceLandmark68Net.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.faceRecognitionNet.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.faceExpressionNet.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.ageGenderNet.loadFromUri("https://cdn.verifik.co/web-sdk/models");
	}

	async startAsyncVideo() {
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
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
			console.log("SHOW ERROR");
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
				this.faceError = null;

				this.drawFaceAndCenter(detection, context);
				this.isFaceCentered(detection[0].landmarks.getNose()[3]);
				this.isFaceClose(detection[0].landmarks);
				// console.log(this.faceError)
				this.drawStatusOval(context, !this.faceError?.title);

				if (!this.faceError) {
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
		this.canvas = await faceapi.createCanvasFromMedia(this.videoInput);
		this.canvasEl = this.canvasRef.nativeElement;
		this.canvasEl.appendChild(this.canvas);
		this.canvas.setAttribute("id", "canvas");
		faceapi.matchDimensions(this.canvas, this.displaySize);
		const ctx = this.canvas.getContext("2d");
		this.drawOvalCenterAndMask(ctx);
	}

	drawFaceAndCenter(detection, ctx): void {
		const resizedDetections = faceapi.resizeResults(detection, this.displaySize);

		this.drawOvalCenterAndMask(ctx);

		// Restablece la operación de composición

		if (this.isActiveDebug) {
			ctx.strokeStyle = "red";
			ctx.lineWidth = 4;
			ctx.strokeRect(this.videoCenterX - this.marginX, this.videoCenterY + this.marginY, this.marginX * 2, this.marginY * 3);
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
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Color de la máscara
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.globalCompositeOperation = "destination-out";

		ctx.fillStyle = "rgba(255, 255, 255, 1)";

		const radiusX = 160; // Radio horizontal
		const radiusY = 200; // Radio vertical

		ctx.beginPath();
		ctx.ellipse(this.videoCenterX, this.videoCenterY, radiusX, radiusY, 0, 0, 2 * Math.PI);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "red"; // Color de los contornos del óvalo
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		ctx.globalCompositeOperation = "source-over";
	}

	drawStatusOval(ctx, isOk?): void {
		const radiusX = 160; // Radio horizontal
		const radiusY = 200; // Radio vertical

		ctx.beginPath();
		ctx.ellipse(this.videoCenterX, this.videoCenterY, radiusX, radiusY, 0, 0, 2 * Math.PI);
		ctx.lineWidth = 5;
		ctx.strokeStyle = isOk ? "green" : "red"; // Color de los contornos del óvalo
		ctx.stroke();
		ctx.closePath();
	}

	isFaceCentered(nose): void {
		const faceCenterX = nose.x;
		const faceCenterY = nose.y;

		const isFaceCentered =
			faceCenterX > this.videoCenterX - this.marginX &&
			faceCenterX < this.videoCenterX + this.marginX &&
			faceCenterY > this.videoCenterY + this.marginY &&
			faceCenterY < this.videoCenterY + this.marginY * 3;

		if (!isFaceCentered) {
			this.faceError = {
				title: "Centra tu rostro en la pantalla",
				subtitle: "Por favor, asegúrate de que tu rostro esté centrado.",
			};
		}
	}

	isFaceClose(landmarks: faceapi.FaceLandmarks68): void {
		const totalFaceArea = landmarks.imageHeight * landmarks.imageWidth;
		const totalImageArea = this.videoInput.width * this.videoInput.height;

		const faceProportion = totalFaceArea / totalImageArea;

		const threshold = 0.4;

		if (faceProportion < threshold) {
			this.faceError = {
				title: "Acerca tu rostro",
				subtitle: "Por favor, acércate un poco más para una mejor detección facial.",
			};
		}
	}

	captureBase64Image(): void {
		if (this.saveImageBase64Intent) {
			return;
		}
		console.log("saveImageBase64Intent", !this.faceError);

		this.saveImageBase64Intent = setTimeout(() => {
			if (this.faceError) {
				this.saveImageBase64Intent = clearTimeout(this.saveImageBase64Intent);
				return console.log("================================", !this.faceError);
			}
			this.takePicture();
		}, 1500);
	}

	takePicture() {
		const context = this.canvas.getContext("2d");

		context.drawImage(this.videoInput, 0, 0, this.WIDTH, this.HEIGHT);

		const base64Image = this.canvas.toDataURL("image/jpeg").replace(/^data:.*;base64,/, "");

		this.base64Images.push(base64Image);

		this.stopRecord();

		this.liveness();
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

		const payload: any = {
			image: this.base64Images[0],
			os: this.osInfo,
		};

		this.loadingResults = true;

		this._sdkService.livenessDemo(payload).subscribe(
			(liveness) => {
				this.livenessScore = liveness.data.liveness_score;
				this.errorResult = null;
				this.loadingResults = false;

				console.log({ livenessScore: this.livenessScore });

				// this.completeResults();
			},
			(error) => {
				this.errorResult = {
					status: error.error?.code,
					message: error.error?.message,
				};
				this.loadingResults = false;
				console.error("sdkService.liveness");
				this.completeResults();
			}
		);
	}

	completeResults() {
		this.faceError = null;
		this.loadingResults = false;
		this.base64Images = [];

		if (!this.errorResult) {
			this.stopRecord();
		}

		this._changeDetectorRef.markForCheck();
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
		this.loadingStream = false;
		this.loadingResults = false;
		this.video = undefined;
		if (this.detectFaceInterval) {
			this.stopRecord();
		}
	}
}
