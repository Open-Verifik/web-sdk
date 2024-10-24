import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild, inject } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FuseConfirmationDialogComponent } from "@fuse/services/confirmation/dialog/dialog.component";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { Project, ProjectFlow } from "app/modules/auth/project";
import { DemoService } from "app/modules/demo/demo.service";
import { environment } from "environments/environment";
import { Subject } from "rxjs";
import * as faceapi from "@vladmandic/face-api";
import { KYCService } from "app/modules/auth/kyc.service";

@Component({
	selector: "kyc-liveness",
	templateUrl: "./kyc-liveness.component.html",
	styleUrls: ["./kyc-liveness.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, CommonModule, MatDialogModule, TranslocoModule, MatButtonModule, MatProgressBarModule, MatProgressSpinnerModule],
})
export class KycLivenessComponent implements OnInit, OnDestroy {
	private _matDialog: MatDialog = inject(MatDialog);

	//ACTIVE DEBUG GRAPHIC MODE
	isActiveDebug: Boolean;
	debugIndex: number;
	debugText: string = "debug";

	@ViewChild("video", { static: false }) public video: ElementRef;
	@ViewChild("canvas", { static: false }) public canvasRef: ElementRef;
	@ViewChild("result", { static: false }) public canvasResultRef: ElementRef;
	@ViewChild("toSend", { static: false }) public canvasToSendRef: ElementRef;
	@ViewChild("credentialCanvas", { static: false }) credentialRef: ElementRef;
	//
	canvasEl: any;
	canvas: any;
	canvasResult: any;
	displaySize: any;
	videoInput: HTMLVideoElement;
	base64Image: any;

	//SIZE OF CANVAS
	HEIGHT: number;
	WIDTH: number;
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
	lastFace: any;
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

	faceIdCard: any;
	left: HTMLImageElement;
	right: HTMLImageElement;
	up: HTMLImageElement;
	down: HTMLImageElement;
	videoDimensions: any;
	resizeDimensions: { rectHeight: number; rectWidth: number; y: number; x: number };
	originalDimensions: { rectHeight: any; rectWidth: number; y: number; x: number };
	minPixelFace: number = 234;
	videoOptions: any = {
		frameRate: { ideal: 30, max: 30 },
	};
	maxHeight: number;
	maxWidth: number;
	lowCamera: boolean;
	successPosition: any;
	appRegistration: any;
	project: Project;
	navigation: any;
	appLoginToken: string;
	showError: Boolean;
	errorContent: any;
	projectFlow: ProjectFlow;
	continueWithLiveness: boolean;

	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		private _demoService: DemoService,
		private _translocoService: TranslocoService,
		private _splashScreenService: FuseSplashScreenService,
		private renderer: Renderer2,
		private _KYCService: KYCService
	) {
		this.navigation = this._KYCService.getNavigation();

		this.continueWithLiveness = this._initAppRegistrationData();

		if (!this.continueWithLiveness) return;

		this.loadingModel = true;

		this.lowCamera = false;

		this.debugIndex = 0;

		this.successPosition = 0;

		this.showError = false;

		this.errorContent = {
			message: "",
		};

		let key = this.demoData.isMobile ? "width" : "height";

		this.videoOptions[key] = { ideal: 1080 };

		this.listenModeDebug();

		this.appLoginToken = localStorage.getItem("accessToken");
	}

	_initAppRegistrationData(): boolean {
		this.osInfo = this.detectOS();

		this.demoData = this._demoService.getDemoData();

		this.appRegistration = this._KYCService.appRegistration;

		this.appRegistration.forceUpload = Boolean(this.appRegistration.biometricValidation && !this.appRegistration.person);

		if (this.appRegistration.biometricValidation && this.appRegistration.person) {
			this._KYCService.navigateTo("next");

			return false;
		}

		this.project = this._KYCService.currentProject;

		this.projectFlow = this._KYCService.currentProjectFlow;

		return true;
	}

	async ngOnInit(): Promise<void> {
		if (!this.continueWithLiveness) return;

		this._splashScreenService.show();

		this.errorFace = null;

		this.loadingResults = false;

		this.base64Image = null;

		await this.loadImages();

		this.setMaxDimensions();

		this.renderer.listen("window", "resize", () => {
			this.setMaxDimensions();

			if (this.videoInput) {
				this.setCanvasDimension();

				this.setConfigCanvas();
			}
		});

		this._demoService.faceapi$.subscribe((isLoaded) => {
			this.loadingModel = !isLoaded;

			if (isLoaded) {
				this.startAsyncVideo();
			}
		});
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

	async restart(): Promise<void> {
		this.completeResults();

		await this.startAsyncVideo();
	}

	async loadImages(): Promise<void> {
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
	}

	async startAsyncVideo() {
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: this.videoOptions,
				audio: false,
			});

			this.videoInput = this.video.nativeElement as HTMLVideoElement;

			this.videoInput.srcObject = this.stream;

			this.videoInput.style.transform = "scaleX(-1)";
			this.canvasRef.nativeElement.style.transform = "scaleX(-1)";

			const videoTrack = this.stream.getVideoTracks()[0];
			const settings = videoTrack.getSettings();
			const { width, height } = settings;

			this.videoDimensions = { height, width };

			if (height < 600) {
				this.lowCamera = true;
				this.loadingModel = false;

				this._splashScreenService.hide();

				return;
			}

			this.videoInput.addEventListener("loadeddata", () => {
				if (!this.video && !this.canvas) {
					this.stopRecord();
					return;
				}
				// setTimeout(() => {
				this.setCanvasDimension();

				this._splashScreenService.hide();

				this.detectFaces();
				// }, 100);
			});
		} catch (error) {
			alert(`${error.message}`);

			console.error("SHOW ERROR", error);
		}
	}

	setMaxDimensions = () => {
		this.maxHeight = Math.floor(window.innerHeight * 0.7);
		this.maxWidth = Math.floor(window.innerWidth * 0.9);
	};

	setCanvasDimension = () => {
		this.HEIGHT = Math.min(this.videoInput.clientHeight, this.maxHeight);
		this.WIDTH = Math.min(this.videoInput.clientWidth, this.maxWidth);

		this.videoCenterX = this.WIDTH / 2;
		this.videoCenterY = this.HEIGHT / 2;

		this.marginY = this.HEIGHT * 0.04;
		this.marginX = this.marginY * 0.8;

		this.OVAL.radiusY = this.HEIGHT * 0.42;
		this.OVAL.radiusX = this.OVAL.radiusY * 0.75;

		if (this.OVAL.radiusX * 2 >= this.WIDTH) {
			this.OVAL.radiusX = this.WIDTH * 0.48;
			this.OVAL.radiusY = this.OVAL.radiusX / 0.75;
		}

		this.displaySize = {
			width: this.WIDTH,
			height: this.HEIGHT,
		};

		this.resizeDimensions = {
			rectHeight: this.HEIGHT,
			rectWidth: Math.min(2.8 * this.OVAL.radiusX, this.WIDTH),
			y: 0,
			x: this.videoCenterX - Math.min(2.8 * this.OVAL.radiusX, this.WIDTH) / 2,
		};

		this.originalDimensions = {
			rectHeight: this.videoDimensions.height,
			rectWidth: (this.resizeDimensions.rectWidth / this.WIDTH) * this.videoDimensions.width,
			y: 0,
			x: (this.resizeDimensions.x / this.WIDTH) * this.videoDimensions.width,
		};
	};

	async detectFaces() {
		await this.setConfigCanvas();

		this.detectFaceInterval = setInterval(
			async () => {
				try {
					const detection = await faceapi
						.detectAllFaces(this.videoInput, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
						.withFaceLandmarks();
					// .withFaceExpressions()
					// .withAgeAndGender();

					const context = this.canvas.getContext("2d");

					if (detection.length > 0) {
						this.lastFace = detection[0];
						this.errorFace = null;

						this.drawFaceAndCenter(detection, context);
						this.isFaceCentered(this.lastFace.landmarks.getNose()[3]);
						this.isFaceClose(this.lastFace.landmarks);

						this.drawStatusOval(context, !this.errorFace?.title);

						!this.errorFace ? ++this.successPosition : (this.successPosition = 0);

						if (!this.errorFace) {
							this.successPosition = 0;

							this.captureBase64Image();
						}
					}

					this._changeDetectorRef.markForCheck();
				} catch (error) {
					alert(error.message);
				}
			},
			this.demoData.isMobile ? 500 : 300
		);
	}

	async setConfigCanvas(): Promise<void> {
		if (!this.canvas) {
			this.canvas = await faceapi.createCanvasFromMedia(this.videoInput);

			this.canvasEl = this.canvasRef.nativeElement;
			this.canvasEl.appendChild(this.canvas);
			this.canvas.setAttribute("id", "canvas");
		}

		faceapi.matchDimensions(this.canvas, this.displaySize);

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
			if (this.errorFace.canvas?.includes("↑")) {
				const startX = this.videoCenterX - 20;
				const startY = this.videoCenterY + this.OVAL.radiusY - 50;
				ctx.drawImage(this.down, startX, startY, 40, 40);
			}

			if (this.errorFace.canvas?.includes("↓")) {
				const startX = this.videoCenterX - 20;
				const startY = this.videoCenterY - this.OVAL.radiusY + 10;
				ctx.drawImage(this.up, startX, startY, 40, 40);
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
		const faceCenterX = (nose.x / this.videoDimensions.width) * this.WIDTH;
		const faceCenterY = (nose.y / this.videoDimensions.height) * this.HEIGHT;

		const isFaceCentered =
			faceCenterX > this.videoCenterX - this.marginX &&
			faceCenterX < this.videoCenterX + this.marginX &&
			faceCenterY > this.videoCenterY &&
			faceCenterY < this.videoCenterY + this.marginY * 2.5;

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
		const totalImageArea = Math.floor(this.originalDimensions.rectHeight * this.originalDimensions.rectWidth);
		const faceProportion = totalFaceArea / totalImageArea;

		const threshold = 0.25;

		if (faceProportion < threshold || landmarks.imageHeight < this.minPixelFace || landmarks.imageWidth < this.minPixelFace) {
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
		const canvasToSend = this.canvasToSendRef.nativeElement;
		const canvasResult = this.canvasResultRef.nativeElement;

		this.setPictureInCavas(canvasResult, this.resizeDimensions, this.originalDimensions);
		this.setPictureInCavas(canvasToSend, this.originalDimensions);

		this.base64Image = canvasToSend.toDataURL("image/jpeg").replace(/^data:.*;base64,/, "");

		this.stopRecord();

		this.recordLiveness();
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
			this.video.nativeElement,
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

	detectOS() {
		const userAgent = window.navigator.userAgent.toLowerCase();

		if (/android/.test(userAgent)) {
			return "ANDROID";
		} else if (/iphone|ipad|ipod/.test(userAgent)) {
			return "IOS";
		}

		return "DESKTOP";
	}

	recordLiveness(force?: boolean): void {
		if (this.loadingResults) return;

		this.loadingResults = true;

		this._splashScreenService.show();

		const payload: any = {
			image: this.base64Image,
			os: this.osInfo,
			force: Boolean(force),
		};

		this._KYCService.createBiometricValidation(payload).subscribe({
			next: (response) => {
				this.appRegistration.person = response.data.person;

				this.appRegistration.biometricValidation = response.data.biometricValidation;
			},
			error: (err) => {
				this.showError = true;

				this.errorContent = err.error;

				const split = this.errorContent.message.split("@");

				this.errorContent.message = split[0];

				this.errorContent.livenessScore = Math.round(Number(split[1] * 100 || 0));

				this._splashScreenService.hide();

				this.loadingResults = false;
			},
			complete: () => {
				this._splashScreenService.hide();

				this.loadingResults = false;

				this._KYCService.navigateTo("next");
			},
		});
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
			});
	}

	completeResults() {
		this.errorFace = null;
		this.loadingResults = false;
		this.base64Image = null;

		if (!this.errorResult) {
			this.stopRecord();
		}

		if (this.saveImageBase64Intent) {
			this.saveImageBase64Intent = clearTimeout(this.saveImageBase64Intent);
		}

		this._splashScreenService.hide();

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

	continueRedirection(): void {
		if (this.showError && this.errorContent.message === "person_not_found") {
			window.location.reload();

			return;
		}

		const token = localStorage.getItem("accessToken");

		const redirectUrl = Boolean(environment.verifikProject === this.project._id) ? `${environment.appUrl}/sign-in` : this.projectFlow.redirectUrl;

		window.location.href = `${redirectUrl}?type=login&token=${token}`;
	}

	retry(): void {
		this._KYCService.navigateTo("instructions");
	}
	continue(): void {
		if (this.projectFlow.onboardingSettings.steps.liveness === "optional") {
			this._KYCService.navigateTo("end");
			return;
		}
	}
}
