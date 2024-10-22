import * as faceapi from "@vladmandic/face-api";
import { debounce, DebouncedFunc } from "lodash";
import { Subject, takeUntil } from "rxjs";

import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, Renderer2, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { ActivatedRoute } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";

import { FuseMediaWatcherService } from "@fuse/services/media-watcher";

import { DocumentErrorsDisplayComponent } from "app/modules/kyc/document-errors-display/document-errors-display.component";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "app/modules/auth/project";
import { KYCService } from "app/modules/auth/kyc.service";
import { DemoService } from "../demo.service";
import { environment } from "environments/environment";

const ANGLE_LIMIT = {
	PITCH_HIGH: 15,
	PITCH_LOW: -15,
	ROLL_HIGH: 15,
	ROLL_LOW: -15,
	YAW_HIGH: 50,
	YAW_LOW: -50,
};
const BOUNDS_LIMIT = {
	X_HIGH: 800,
	X_LOW: 500,
	Y_HIGH: 400,
	Y_LOW: 225,
};
const RESOLUTION_LIMIT = {
	WIDTH_HIGH: 800,
	WIDTH_LOW: 600,
	HEIGHT_HIGH: 800,
	HEIGHT_LOW: 600,
};

type FaceCorrections = {
	angle: { pitch: string; roll: string; yaw: string },
	bounds: { x: string; y: string; },
	resolution: { height: string; width: string; },
}

@Component({
	selector: "id-scanning",
	templateUrl: "./id-scanning.component.html",
	styleUrls: ["./id-scanning.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [
		CommonModule,
		DocumentErrorsDisplayComponent,
		FlexLayoutModule,
		MatButtonModule,
		MatCheckboxModule,
		MatIconModule,
		MatProgressSpinnerModule,
		TranslocoModule,
	],
})
export class IdScanningComponent implements OnInit {
	@ViewChild("canvas", { static: false }) public canvasRef: ElementRef;
	@ViewChild("cardIdFace", { static: false }) cardIdFaceRef: ElementRef;
	@ViewChild("result", { static: false }) public canvasResultRef: ElementRef;
	@ViewChild("toSend", { static: false }) public canvasToSendRef: ElementRef;
	@ViewChild("videoElement") videoElement: ElementRef;

    @Output('onNext') onNext: EventEmitter<void> = new EventEmitter<void>();
    @Output('onPrevious') onPrevious: EventEmitter<void> = new EventEmitter<void>();
	
	private _detectFaceInterval: any;
	private _unsubscribeAll: Subject<any> = new Subject<any>();

	appRegistration: any;
	aspectRatio = 85.6 / 53.98;
	attempts: number;
	attemptsLimit: number;
	base64Images: any;
	checkFaceTimeout: any;
	demoData: any;
	errorContent: any;
	errorFace: any;
	errorResult: boolean;
	failedToDetectDocument: boolean;
	hasCameraPermissions: boolean;
	HEIGHT: number;
	idToSend: any;
	loading: any;
	loadingCamera: boolean;
	navigation: any;
	phoneMode: boolean;
	project: Project;
	projectFlow: ProjectFlow;
	rectCredential: any;
	stream: MediaStream;
	tabletMode: boolean;
	video: any;
	videoOptions: any = {
		frameRate: { ideal: 30, max: 30 },
	};
	view: string;
	WIDTH: number;

	faceIsValid: boolean;
	faceCorrections: FaceCorrections = {
		angle: { pitch: '', roll: '', yaw: '' },
		bounds: { x: '', y: '' },
		resolution: { height: '', width: '' },
	};

	faceDetection: faceapi.WithFaceLandmarks<{
		detection: faceapi.FaceDetection;
	}, faceapi.FaceLandmarks68>;

	debouncedTakePicture: DebouncedFunc<() => void>

	constructor(
		private _demoService: DemoService,
		private _activatedRoute: ActivatedRoute,
		private _changeDetectorRef: ChangeDetectorRef,
		private _translocoService: TranslocoService,
		private _fuseMediaWatcherService: FuseMediaWatcherService,
		private renderer: Renderer2,
		private _KYCService: KYCService
	) {
		this._ObserveDomMedia();

		this.attemptsLimit = 3;

		this.loadingCamera = false;
		this.loading = false;

		this.hasCameraPermissions = false;
		this.failedToDetectDocument = false;

		this.base64Images = undefined;
		this.errorFace = {};

		this.demoData = this._demoService.getDemoData();

		this.project = new ProjectModel({});
		this.projectFlow = new ProjectFlowModel({});

		this.errorContent = { message: "" };

		let key = this.demoData.isMobile ? "width" : "height";

		this.videoOptions[key] = { ideal: 1080 };
		this.videoOptions.facingMode = this.demoData.isMobile ? "environment" : "user";

		this.video = {};
		this.rectCredential = {};

		this.renderer.listen("window", "resize", () => {
			if (!this.videoElement) return;

			this._setCanvasDimensions();
		});
	}

	ngOnInit(): void {
		this._ObserveDomMedia();

		this._activatedRoute.params.subscribe((params) => {
			const isVerifikProject = Boolean(params.id === environment.verifikProject || params.id === environment.sandboxProject);
			this.view = isVerifikProject ? "kyc" : "demo";

			this._setProjectData()
		});

		this._demoService.faceapi$.subscribe((isLoaded) => {
			if (!isLoaded) return;

			this._startCamera();
		});
	}

	private _setProjectData(): void {
		if (this.view === 'kyc') return;

		this.appRegistration = this._KYCService.appRegistration;

		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;
		this.navigation = this._KYCService.getNavigation();

		this.attempts = this.appRegistration?.failedDocumentValidations?.length || 0;
		this.attemptsLimit = this.projectFlow.onboardingSettings.document.maxAttempts;
	}

	private _drawMask(ctx: CanvasRenderingContext2D): void {
		const isHorizontal = this.video.height < this.video.width;

		let DRAWING_X = isHorizontal ? 1920 : 1080;
		let DRAWING_Y = isHorizontal ? 1080 : 1920;

		ctx.strokeStyle="rgba(0,0,0,0)";
		ctx.miterLimit=4;
		ctx.fillStyle="rgba(0,0,0,0)";
		ctx.scale(1, 1);

		ctx.save();

		// Rectangle
		ctx.scale(1, 1);
		ctx.fillStyle="rgba(255,255,255,0.7)";
		ctx.beginPath();
		ctx.moveTo(this.WIDTH, 0);
		ctx.lineTo(0 ,0);
		ctx.lineTo(0, this.HEIGHT);
		ctx.lineTo(this.WIDTH, this.HEIGHT);
		ctx.lineTo(this.WIDTH, 0);
		ctx.closePath();

		const scaleX = Math.min(this.WIDTH, DRAWING_X) / Math.max(this.WIDTH, DRAWING_X);
		const scaleY = Math.min(this.HEIGHT, DRAWING_Y) / Math.max(this.HEIGHT, DRAWING_Y);

		ctx.scale(scaleX, scaleY);

		// Light Mask
		if (isHorizontal) {
			ctx.moveTo(959.988,102);
			ctx.bezierCurveTo(1153.06,102,1311.98,234.628,1319.68,419.92);
			ctx.lineTo(1319.7,419.92);
			ctx.lineTo(1320,419.92);
			ctx.lineTo(1320,434.023);
			ctx.bezierCurveTo(1320,527.891,1294.94,662.504,1238.35,774.132);
			ctx.bezierCurveTo(1181.94,885.431,1091.75,978,960.011,978);
			ctx.bezierCurveTo(828.274,978,738.105,885.431,681.672,774.132);
			ctx.bezierCurveTo(625.056,662.525,600,527.891,600,434.023);
			ctx.bezierCurveTo(600,241.393,766.917,102,959.988,102);
		} else {
			ctx.moveTo(539.985,361);
			ctx.bezierCurveTo(794.195,361,1003.44,535.718,1013.58,779.813);
			ctx.lineTo(1013.61,779.813);
			ctx.lineTo(1014,779.813);
			ctx.lineTo(1014,798.391);
			ctx.bezierCurveTo(1014,922.049,981.01,1099.38,906.494,1246.43);
			ctx.bezierCurveTo(832.222,1393.05,713.468,1515,540.015,1515);
			ctx.bezierCurveTo(366.561,1515,247.838,1393.05,173.534,1246.43);
			ctx.bezierCurveTo(98.9901,1099.41,66,922.049,66,798.391);
			ctx.bezierCurveTo(66,544.63,285.774,361,539.985,361);
		}

		ctx.closePath();
		ctx.fill("evenodd");
		ctx.stroke();
		ctx.restore();

		// Outline
		ctx.fillStyle = this.faceIsValid ? "#3bf65f" : "#FF5638";

		ctx.scale(scaleX, scaleY);
		ctx.beginPath();

		if (isHorizontal) {
			ctx.moveTo(959.988,130.183);
			ctx.bezierCurveTo(776.49,130.183,629.316,258.603,629.316,434);
			ctx.bezierCurveTo(629.316,524.146,653.593,654.46,708.01,761.748);
			ctx.bezierCurveTo(762.588,869.412,845.085,949.772,960.011,949.772);
			ctx.bezierCurveTo(1074.94,949.772,1157.43,869.412,1212.01,761.771);
			ctx.bezierCurveTo(1265.77,655.76,1290.11,527.318,1290.68,437.328);
			ctx.lineTo(1290.68,434);
			ctx.bezierCurveTo(1290.68,258.58,1143.51,130.183,960.011,130.183);
			ctx.lineTo(959.988,130.183);
			ctx.closePath();

			ctx.moveTo(1319.68,419.92);
			ctx.bezierCurveTo(1311.98,234.628,1153.06,102,959.988,102);
			ctx.bezierCurveTo(766.917,102,600,241.393,600,434.023);
			ctx.bezierCurveTo(600,527.892,625.056,662.525,681.672,774.132);
			ctx.bezierCurveTo(738.105,885.431,828.274,978,960.011,978);
			ctx.bezierCurveTo(1091.75,978,1181.94,885.431,1238.35,774.132);
			ctx.bezierCurveTo(1294.94,662.504,1320,527.892,1320,434.023);
			ctx.lineTo(1320,419.92);
			ctx.lineTo(1319.7,419.92);
			ctx.lineTo(1319.68,419.92);
		} else {
			ctx.moveTo(539.985,398.126);
			ctx.bezierCurveTo(298.378,398.126,104.599,567.301,104.599,798.361);
			ctx.bezierCurveTo(104.599,917.114,136.564,1088.78,208.213,1230.12);
			ctx.bezierCurveTo(280.074,1371.95,388.695,1477.81,540.015,1477.81);
			ctx.bezierCurveTo(691.334,1477.81,799.954,1371.95,871.815,1230.15);
			ctx.bezierCurveTo(942.591,1090.5,974.645,921.294,975.401,802.745);
			ctx.lineTo(975.401,798.361);
			ctx.bezierCurveTo(975.401,567.271,781.62,398.126,540.015,398.126);
			ctx.lineTo(539.985,398.126);
			ctx.closePath();

			ctx.moveTo(1013.58,779.813);
			ctx.bezierCurveTo(1003.44,535.718,794.195,361,539.985,361);
			ctx.bezierCurveTo(285.774,361,66,544.63,66,798.391);
			ctx.bezierCurveTo(66,922.049,98.9901,1099.41,173.535,1246.43);
			ctx.bezierCurveTo(247.838,1393.05,366.561,1515,540.015,1515);
			ctx.bezierCurveTo(713.468,1515,832.222,1393.05,906.494,1246.43);
			ctx.bezierCurveTo(981.01,1099.38,1014,922.049,1014,798.391);
			ctx.lineTo(1014,779.813);
			ctx.lineTo(1013.61,779.813);
			ctx.lineTo(1013.58,779.813);
		}

		ctx.closePath();
		ctx.fill("evenodd");
		ctx.stroke();
		ctx.restore();
		ctx.save();

		this.setDimensions(isHorizontal, this.video.height, this.video.width, this.rectCredential);
		this.setDimensions(isHorizontal, this.video.height, this.video.width, this.video);
	}

	private _ObserveDomMedia(): void {
		this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe(({ matchingAliases }) => {
			this.phoneMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && !matchingAliases.includes("sm"));
			this.tabletMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && matchingAliases.includes("sm"));

			this._changeDetectorRef.markForCheck();
		});
	}

	async _detectFace(image: faceapi.TNetInput) {
		try {
			const detection = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (detection.length) {
				this.checkFaceTimeout = clearTimeout(this.checkFaceTimeout);
				this.errorFace = null;

				this._evaluateFaceData(detection);

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
		} catch (error) {
			alert(error.message);
		}
	}

	/**
	 * @param detection 
		There should only be one main face on the image.
			It should be fully visible within a frame and fully open without any occlusions.
			No crop is allowed.
			Small faces in the background are not taken into account.
		The minimum size of a face box that can be processed is 224x224 pixels.
		The padding between the face box and the image's borders should be at least 25 pixels.
		The distance between the pupils on the face should be at least 80 pixels.
		The out-of-plane rotation angle (face pitch and yaw) should be no more than ±30 degrees.
		Fish-eye lenses and sunglass images are not supported.
	 */
	private _evaluateFaceData(detection: faceapi.WithFaceLandmarks<{
		detection: faceapi.FaceDetection;
	}, faceapi.FaceLandmarks68>[]) {
		const face = detection[0];

		this.faceDetection = face;

		const correctResolution = face.alignedRect.box.height > RESOLUTION_LIMIT.HEIGHT_LOW &&
			face.alignedRect.box.height < RESOLUTION_LIMIT.HEIGHT_HIGH &&
			face.alignedRect.box.width > RESOLUTION_LIMIT.WIDTH_LOW &&
			face.alignedRect.box.width < RESOLUTION_LIMIT.WIDTH_HIGH;

		const fallsInBounds = face.alignedRect.box.x > BOUNDS_LIMIT.X_LOW &&
			face.alignedRect.box.x < BOUNDS_LIMIT.X_HIGH &&
			face.alignedRect.box.y > BOUNDS_LIMIT.Y_LOW &&
			face.alignedRect.box.y < BOUNDS_LIMIT.Y_HIGH;

		const correctAngle = face.angle.pitch > ANGLE_LIMIT.PITCH_LOW &&
			face.angle.pitch < ANGLE_LIMIT.PITCH_HIGH &&
			face.angle.roll > ANGLE_LIMIT.ROLL_LOW &&
			face.angle.roll < ANGLE_LIMIT.ROLL_HIGH &&
			face.angle.yaw > ANGLE_LIMIT.YAW_LOW &&
			face.angle.yaw < ANGLE_LIMIT.YAW_HIGH

		this.faceIsValid = correctResolution && fallsInBounds && correctAngle;

		this.faceCorrections = {
			resolution: {
				width: !correctResolution && face.alignedRect.box.width > RESOLUTION_LIMIT.WIDTH_HIGH ?
					'back' : !correctResolution && face.alignedRect.box.width < RESOLUTION_LIMIT.WIDTH_LOW ?
					'forward' : '',
				height: !correctResolution && face.alignedRect.box.height > RESOLUTION_LIMIT.HEIGHT_HIGH ?
					'back' : !correctResolution && face.alignedRect.box.height < RESOLUTION_LIMIT.HEIGHT_LOW ?
					'forward' : '',
			},
			bounds: {
				x: !fallsInBounds && face.alignedRect.box.x > BOUNDS_LIMIT.X_HIGH ?
					'right' : !fallsInBounds && face.alignedRect.box.x < BOUNDS_LIMIT.X_LOW ?
					'left' : '',
				y: !fallsInBounds && face.alignedRect.box.y > BOUNDS_LIMIT.Y_HIGH ?
					'up' : !fallsInBounds && face.alignedRect.box.y < BOUNDS_LIMIT.Y_LOW ?
					'down' : '',
			},
			angle: {
				pitch: !correctAngle && face.angle.pitch > ANGLE_LIMIT.PITCH_HIGH ?
					'down' : !correctAngle && face.angle.pitch < ANGLE_LIMIT.PITCH_LOW ?
					'up' : '',
				roll: !correctAngle && face.angle.roll > ANGLE_LIMIT.ROLL_HIGH ?
					'left' : !correctAngle && face.angle.roll < ANGLE_LIMIT.ROLL_LOW ?
					'right' : '',
				yaw: !correctAngle && face.angle.yaw > ANGLE_LIMIT.YAW_HIGH ?
					'left' : !correctAngle && face.angle.yaw < ANGLE_LIMIT.YAW_LOW ?
					'right' : '',
			}
		};

		this._setCanvasDimensions();
		this._readyAutoCapture();
	}

	private _readyAutoCapture() {
		if (!this.faceIsValid) {
			if (this.debouncedTakePicture) this.debouncedTakePicture.cancel();
			this.debouncedTakePicture = null;

			return;
		}

		if (this.debouncedTakePicture) return;

		this.debouncedTakePicture = debounce(() => this.takePicture(), 1000);
		this.debouncedTakePicture();
	}

	private _setCanvasDimensions = () => {
		const appBody = document.body.querySelector('.app__content');

		const appWindowHeight = appBody.clientHeight;
		const appWindowWidth = appBody.clientWidth;

		const maxHeight = Math.min(appWindowHeight, this.video.height);
		const maxWidth = Math.min(appWindowWidth, this.video.width);

		const scaleRatioX = appWindowWidth / this.video.width;
		const scaleRatioY = appWindowHeight / this.video.height;

		// rescale to maintain aspect ratio
		if (scaleRatioX < 1) this.HEIGHT = maxHeight * scaleRatioX;
		else this.HEIGHT = maxHeight;
		if (scaleRatioY < 1) this.WIDTH = maxWidth * scaleRatioY;
		else this.WIDTH = maxWidth;
		
		const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;

		canvas.height = this.HEIGHT;
		canvas.width = this.WIDTH;

		this._drawMask(canvas.getContext("2d"));
	};

	private _startCamera() {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			console.error("Browser does not support getUserMedia API.");

			this.hasCameraPermissions = false;

			return;
		}

		this.loadingCamera = true;

		navigator.mediaDevices
			.getUserMedia({
				audio: false,
				video: this.videoOptions,
			})
			.then((stream) => {
				this.stream = stream;
				this.hasCameraPermissions = true;
				this.loadingCamera = false;

				const videoTrack = this.stream.getVideoTracks()[0];
				const settings = videoTrack.getSettings();

				const { width, height } = settings;

				this.video.height = height;
				this.video.width = width;

				setTimeout(() => {
					this.videoElement.nativeElement.srcObject = stream;
					this.videoElement.nativeElement.addEventListener("loadedmetadata", () => {
						if (!this.demoData.isMobile) {
							this.videoElement.nativeElement.style.transform = "scaleX(-1)";
						}

						this._setCanvasDimensions();

						this._detectFaceInterval = setInterval(() => this._detectFace(this.videoElement.nativeElement), this.demoData.time);
						this.demoData.loading = false;
					});
				}, 300);
			})
			.catch((error) => {
				console.error("Error accessing the camera:", error);

				this.loadingCamera = false;
				this.hasCameraPermissions = false;
				this.demoData.loading = false;
			});
	}

	private _stopRecord(): void {
		if (!this.stream) return;

		this.stream.getTracks().forEach((track) => track.stop());
	}

	async continue() {
		if (this.loading) return;

		this.loading = true;

		this.idToSend = {
			image: this.base64Images,
			force: this.appRegistration?.forceUpload || false,
		};

		const faces = await this._detectFace(this.canvasToSendRef.nativeElement);

		if (!faces.length) {
			this.errorResult = true;

			this.errorContent = {
				message: "face_not_found",
			};

			return this.tryAgain();
		}

		const faceBiggest = this._demoService.getBiggestFace(faces.map((face) => face.detection.box));
		const idCardFaceImage = this._demoService.cutFaceIdCard(this.canvasToSendRef.nativeElement, faceBiggest, this.cardIdFaceRef.nativeElement);

		this.demoData.loading = true;

		if (this.view === "kyc") {
			this._KYCService
				.createDocumentValidation({
					...this.idToSend,
					documentFace: idCardFaceImage,
				})
				.subscribe({
					next: (response) => {
						this.appRegistration.documentValidation = response.data.documentValidation;

						this._KYCService.navigateTo("next");
					},
					error: (exception) => {
						this.errorResult = true;
						this.errorContent = exception.error;
					},
					complete: () => {
						this.demoData.loading = false;
					},
				});

			return;
		}

		this._demoService.sendDocument({ image: this.idToSend.image }).subscribe(
			(response) => {
				this._demoService.setDemoDocument(response.data);

				localStorage.setItem("documentId", response.data._id);
				localStorage.setItem("idCardFaceImage", idCardFaceImage);

				this.demoData.loading = false;
				this._demoService.moveToStep(3);
			},
			(err) => {
				this.failedToDetectDocument = true;
				this.demoData.loading = false;
			}
		);
	}

	onErrorCallback() {
		window.location.reload();
	}

	restartDemo(): void {
		if (this.view === "kyc") this.appRegistration.documentValidation = null;

		this.ngOnInit();
	}

	setPictureInCanvas(canvas: HTMLCanvasElement, dimensions: any, dimensionsOriginals?: any) {
		const context = canvas.getContext("2d");

		canvas.width = dimensions.rectWidth;
		canvas.height = dimensions.rectHeight;

		if (!dimensionsOriginals) {
			dimensionsOriginals = {
				x: dimensions.x,
				y: dimensions.y,
				rectWidth: dimensions.rectWidth,
				rectHeight: dimensions.rectHeight
			};
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

	setDimensions(isHorizontal: boolean, height: number, width: number, data: any) {
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

	async takePicture() {
		this._detectFaceInterval = clearInterval(this._detectFaceInterval);

		const canvasToSend = this.canvasToSendRef.nativeElement;
		const canvasResult = this.canvasResultRef.nativeElement;

		this.setPictureInCanvas(canvasResult, this.rectCredential, this.video);
		this.setPictureInCanvas(canvasToSend, this.video);

		const base64Image = canvasToSend.toDataURL("image/jpeg").replace(/^data:.*;base64,/, "");
		this.base64Images = base64Image;

		this._changeDetectorRef.markForCheck();

		this._stopRecord();

		this.onNext.next();
	}

	tryAgain(plusAttempts = false): void {
		if (plusAttempts) this.attempts++;

		this.base64Images = undefined;
		this.failedToDetectDocument = false;

		this.errorFace = {};
		this.errorContent.message = null;
		this.errorResult = false;

		this.restartDemo();
		this.onPrevious.next();
	}
}
