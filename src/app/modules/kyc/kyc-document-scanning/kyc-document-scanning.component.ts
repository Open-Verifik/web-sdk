import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { fuseAnimations } from "@fuse/animations";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoService } from "@ngneat/transloco";
import { DemoService } from "app/modules/demo/demo.service";

@Component({
	selector: "kyc-document-scanning",
	templateUrl: "./kyc-document-scanning.component.html",
	styleUrls: ["./kyc-document-scanning.component.scss"],
	animations: fuseAnimations,
	standalone: true,
	imports: [FlexLayoutModule, CommonModule],
})
export class KycDocumentScanningComponent implements OnInit {
	@ViewChild("videoElement") videoElement: ElementRef;
	@ViewChild("canvas", { static: false }) public canvasRef: ElementRef;
	@ViewChild("result", { static: false }) public canvasResultRef: ElementRef;
	@ViewChild("toSend", { static: false }) public canvasToSendRef: ElementRef;
	@ViewChild("cardIdFace", { static: false }) cardIdFaceRef: ElementRef;

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
	checkFaceTimeout: any;
	detectFaceInterval: any;
	errorFace: any;

	constructor(
		private _demoService: DemoService,
		private _splashScreenService: FuseSplashScreenService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _translocoService: TranslocoService,
		private renderer: Renderer2
	) {
		this.attempts = 0;

		this.attemptsLimit = 3;

		this.loadingCamera = false;

		this.hasCameraPermissions = false;

		this.failedToDetectDocument = false;

		this.base64Images = undefined;

		this.errorFace = {};

		this.demoData = this._demoService.getDemoData();

		let key = this.demoData.isMobile ? "width" : "height";

		this.videoOptions[key] = { ideal: 1080 };

		this.videoOptions.facingMode = this.demoData.isMobile ? "environment" : "user";

		this.video = {};

		this.rectCredential = {};

		this.renderer.listen("window", "resize", () => {
			if (this.videoElement) {
				this.setCanvasDimensions();
			}
		});
	}

	ngOnInit(): void {
		this._demoService.faceapi$.subscribe((isLoaded) => {
			if (isLoaded) {
				this.startCamera();
			}
		});
	}

	async detectFace(image) {
		try {
			const detection = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (detection.length) {
				this.checkFaceTimeout = clearTimeout(this.checkFaceTimeout);
				this.errorFace = null;
				return detection;
			}

			if (!this.checkFaceTimeout) {
				this.checkFaceTimeout = setTimeout(() => {
					this.errorFace = {
						title: this._translocoService.translate("id_scanning.face_not_found"),
						subtitle: this._translocoService.translate("id_scanning.face_not_found_details"),
					};
				}, 3 * this.demoData.time);
			}
			return null;
		} catch (error) {
			alert(error.message);
		}
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
							this.detectFaceInterval = setInterval(() => this.detectFace(this.videoElement.nativeElement), this.demoData.time);

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
		this.errorFace = {};

		this.startCamera();
		// logic todo here
	}

	restartDemo(): void {
		this._demoService.restart();
	}

	async continue() {
		this.idToSend = {
			image: this.base64Images,
		};

		const faces = await this.detectFace(this.canvasToSendRef.nativeElement);

		if (!faces.length) {
			alert(this._translocoService.translate("id_scanning.face_not_found"));
			return this.tryAgain();
		}
		const faceBiggest = this._demoService.getBiggestFace(faces.map((face) => face.detection.box));
		const idCardFaceImage = this._demoService.cutFaceIdCard(this.canvasToSendRef.nativeElement, faceBiggest, this.cardIdFaceRef.nativeElement);

		this.demoData.loading = true;
		this._splashScreenService.show();

		https: this._demoService.sendDocument({ image: this.idToSend.image }).subscribe(
			(response) => {
				this._demoService.setDemoDocument(response.data);

				localStorage.setItem("documentId", response.data._id);

				localStorage.setItem("idCardFaceImage", idCardFaceImage);

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
		this.detectFaceInterval = clearInterval(this.detectFaceInterval);
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
