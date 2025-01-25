import * as faceapi from "@vladmandic/face-api";
// import jscanify, { Contour } from "libs/jscanify";
import { Contour } from "libs/jscanify";
import QRCode from "qrcode";

import { debounce, DebouncedFunc } from "lodash";
import { Observable, Subject, takeUntil } from "rxjs";

import { CommonModule } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { fuseAnimations } from "@fuse/animations";

import { KYCService } from "app/modules/auth/kyc.service";
import { AppRegistration, ImageScan, Project, ProjectFlow } from "app/modules/auth/project";
import { DemoService } from "app/modules/demo/demo.service";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";
import { Corrections, SmartEnrollService } from "../smart-enroll.service";
import { SmartScannerCorrectionsComponent } from "./smart-scanner-corrections/smart-scanner-corrections.component";
import { environment } from "environments/environment";

// const JSScanify = new jscanify();

interface MediaTrackSupportedConstraintsExtended extends MediaTrackSupportedConstraints {
	zoom?: boolean;
}

interface MediaTrackConstraintSetExtended extends MediaTrackConstraintSet {
	zoom?: ConstrainULong;
}

@Component({
	animations: fuseAnimations,
	selector: "smart-scanner",
	standalone: true,
	styleUrls: ["./smart-scanner.component.scss"],
	templateUrl: "./smart-scanner.component.html",
	imports: [
		CommonModule,
		FlexLayoutModule,
		MatButtonModule,
		MatCheckboxModule,
		MatIconModule,
		MatProgressSpinnerModule,
		SmartScannerCorrectionsComponent,
		SmartStepperComponent,
		TranslocoModule,
	],
})
export class SmartScannerComponent implements OnInit, OnDestroy {
	@ViewChild("canvasContainer") canvasContainer: ElementRef<HTMLDivElement>;
	@ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;

	@ViewChild("qrCodeCanvas") public qrCodeCanvas: ElementRef<HTMLCanvasElement>;

	@ViewChild("maskCanvas") public maskCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("resultCanvas") public resultCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("toSendCanvas") public toSendCanvas: ElementRef<HTMLCanvasElement>;

	@ViewChild("videoCanvas") public videoCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("videoElement") videoElement: ElementRef<HTMLVideoElement>;

	@Input("source") source: "document" | "face";

	@Output("onImageScan") onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();

	@Input() successfulUpload: Observable<void>;

	private unsubscriber$: Subject<void> = new Subject<void>();

	private _checkFaceTimeout: any;
	private _debouncedTakePicture: DebouncedFunc<() => void>;
	private _debouncedWindowResize: DebouncedFunc<() => void>;
	private _detectionInterval: ReturnType<typeof setInterval>;
	private _rectCredential: any;
	// private _scanner: jscanify;

	DEBUG_MODE: boolean = !environment.production && false;

	appRegistration: AppRegistration;
	aspectRatio = 85.6 / 53.98;
	base64Image: any;
	calculating: boolean = false;
	cameraConstraintsInvalid: boolean = false;
	demoData: any;
	documentContours: string;
	documentIsValid: boolean;
	errorFace: any;
	faceIdCard: string;
	faceIsValid: boolean;
	hasCameraPermissions: boolean;
	hideTip: boolean = false;
	isLandscape: boolean = true;
	loading: any;
	loadingCamera: boolean;
	loadingQRCode: boolean = true;
	project: Project;
	projectFlow: ProjectFlow;
	requiresBack: boolean = false;
	revealQRCode: boolean = false;
	side: "back" | "front" = "front";
	stream: MediaStream;
	test: string;
	unsupported: boolean = false;
	uploading: boolean = false;
	video: any;

	BOUNDS: { face: any, document: any } = { face: {}, document: {} };
	HEIGHT: number;
	WIDTH: number;

	videoOptions: any = {
		frameRate: { ideal: 30, max: 30 },
	};

	corrections: Corrections = {
		angle: { pitch: "", roll: "", yaw: "" },
		bounds: { x: "", y: "" },
		document: { x: "", y: "" },
		documentResolution: { height: "", width: "" },
		resolution: { height: "", width: "" },
	};

	documentDetection: {
		x: number;
		y: number;
		height: number;
		width: number;
		contours?: Contour;
	};

	faceDetection: faceapi.WithFaceLandmarks<
		{
			detection: faceapi.FaceDetection;
		},
		faceapi.FaceLandmarks68
	>;

	constructor(
		private _demoService: DemoService,
		private _KYCService: KYCService,
		private _renderer: Renderer2,
		private _smartEnrollService: SmartEnrollService,
		private _translocoService: TranslocoService
	) {
		this.isLandscape = window.matchMedia("(orientation: landscape)").matches;

		this._resetVariables();

		this._debouncedWindowResize = debounce(() => {
			if (!this.videoElement) return;

			this._stopRecord();
			this._resetVariables();

			setTimeout(() => this._startCamera());
		}, 300);
	}

	ngOnInit(): void {
		this._renderer.listen("window", "resize", this._debouncedWindowResize);

		this.successfulUpload
			.pipe(takeUntil(this.unsubscriber$))
			.subscribe(() => {
				this.uploading = false;
				this.requiresBack = this.appRegistration.documentValidation?.requiresBackSide || !!this.appRegistration.documentValidation?.backUrl;
			});

		this._demoService.faceapi$.pipe(takeUntil(this.unsubscriber$)).subscribe((isLoaded) => {
			if (!isLoaded || this.stream) return;

			setTimeout(() => this._startCamera());
		});
	}

	ngOnDestroy(): void {
		this._debouncedTakePicture?.cancel();
		this._debouncedWindowResize?.cancel();

		this.unsubscriber$.next();
		this.unsubscriber$.complete();

		this._stopRecord();
	}

	// private _detectDocument(video: HTMLVideoElement, videoCanvas: HTMLCanvasElement, videoCanvasCtx: CanvasRenderingContext2D) {
	// 	this._startAutoCapture();
	// 	this._paintMaskCanvas();

	// 	try {
	// 		const vRatio = (videoCanvas.height / video.videoHeight) * video.videoWidth;
	// 		videoCanvasCtx.drawImage(video, 0, 0, vRatio, videoCanvas.height);

	// 		try {
	// 			const img = cv.imread(videoCanvas);

	// 			cv.imshow(videoCanvas, img);

	// 			const maxContour = this._scanner.findPaperContour(img);

	// 			if (maxContour) {
	// 				const contours = this._scanner.getCornerPoints(maxContour);

	// 				const {
	// 					bounds,
	// 					detection,
	// 					isValid,
	// 					resolution,
	// 				}= this._smartEnrollService.evaluateDocumentContours(this.BOUNDS, contours);

	// 				this.corrections.document = bounds;
	// 				this.corrections.documentResolution = resolution;
	// 				this.documentDetection = detection;
	// 				this.documentIsValid = isValid;
	// 			}

	// 			img.delete();
	// 		} catch (er) {}
	// 	} catch (e) {}
	// }

	async _detectFace(image: faceapi.TNetInput) {
		if (this.source === 'face') {
			this._startAutoCapture();
			this._paintMaskCanvas();
		}

		try {
			const detection = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (detection.length) {
				this.faceDetection = this._demoService.findBiggestFace(detection);

				this.errorFace = null;
				this._checkFaceTimeout = clearTimeout(this._checkFaceTimeout);

				const {
					angle,
					bounds,
					isValid,
					resolution,
				}= this._smartEnrollService.evaluateFaceDetection(this.BOUNDS, this.faceDetection, this.source);

				this.corrections.angle = angle;
				this.corrections.bounds = bounds;
				this.corrections.resolution = resolution;
				this.faceIsValid = isValid;

				return detection;
			} else if (!this._checkFaceTimeout) {
				this._checkFaceTimeout = setTimeout(() => this._detectFaceError(), 3 * this.demoData.time);
			}
		} catch (e) {}
	}

	private _detectFaceError(): void {
		this.faceIsValid = false;

		if (this.source === 'document') {
			this.errorFace = {
				title: this._translocoService.translate("id_scanning.face_not_found"),
				subtitle: this._translocoService.translate("id_scanning.face_not_found_details"),
			};
		} else {
			this.errorFace = {
				title: this._translocoService.translate("liveness.face_not_found_title"),
				subtitle: this._translocoService.translate("liveness.face_not_found_subtitle"),
			};
		}
	}

	private _drawFaceMask(ctx: CanvasRenderingContext2D): void {
		const height = this.HEIGHT;
		const width = this.WIDTH;

        const originalDrawingSize = this.isLandscape ? 180 : 140;
        const scale = Math.min(width / originalDrawingSize, height / originalDrawingSize);

        const centerX = width / 2;
        const centerY = height / 2;

        const centerAdjustment = -(originalDrawingSize / 2);

		ctx.beginPath();
		ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
		ctx.fillRect(0, 0, width, height);
		ctx.closePath();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(centerAdjustment, centerAdjustment);

        ctx.beginPath();
        ctx.globalCompositeOperation = 'destination-atop';

        const adjustX = this.isLandscape ? 0 : 19.5;
        const adjustY = this.isLandscape ? 15 : 40;

        // Arc
        ctx.arc(
            90 - adjustX, // Arc center x
            90 - adjustY, // Arc center y
            60, // Radius
            Math.PI * 0.9, // Start angle
            Math.PI * 0.1 // End angle
        );

        // First bezier curve
        ctx.bezierCurveTo(
            150 - adjustX, // Start x
            100 - adjustY, // Start y
            130 - adjustX, // Bezier x
            180 - adjustY, // Bezier y
            90 - adjustX, // End x
            180 - adjustY // End y
        );

        // Second bezier curve
        ctx.bezierCurveTo(
            90 - adjustX, // Start x
            180 - adjustY, // Start y
            50 - adjustX, // Bezier x
            180 - adjustY, // Bezier y
            32 - adjustX, // End x
            105 - adjustY // End y
        );

        ctx.clip();
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = 6;
        ctx.globalCompositeOperation = 'source-over';

        // Arc
        ctx.arc(
            90 - adjustX, // Arc center x
            90 - adjustY, // Arc center y
            60, // Radius
            Math.PI * 0.9, // Start angle
            Math.PI * 0.1 // End angle
        );

        // First bezier curve
        ctx.bezierCurveTo(
            150 - adjustX, // Start x
            100 - adjustY, // Start y
            130 - adjustX, // Bezier x
            180 - adjustY, // Bezier y
            90 - adjustX, // End x
            180 - adjustY // End y
        );

        // Second bezier curve
        ctx.bezierCurveTo(
            90 - adjustX, // Start x
            180 - adjustY, // Start y
            50 - adjustX, // Bezier x
            180 - adjustY, // Bezier y
            32 - adjustX, // End x
            105 - adjustY // End y
        );

        ctx.clip();
		ctx.strokeStyle = this._isCaptureValid() ? "#3bf65f" : "#FF5638";
        ctx.stroke();
        ctx.closePath();
	}

	private _drawIdMask(ctx: CanvasRenderingContext2D): void {
		const height = this.HEIGHT;
		const width = this.WIDTH;

		ctx.beginPath();
		ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
		ctx.fillRect(0, 0, width, height);
		ctx.closePath();

		const rectDimensions = this._calculateMaxDimensions({width: 16, height: 9}, {width, height})

		rectDimensions.height = Math.floor(rectDimensions.height * (this.isLandscape ? 0.6 : 0.8));
		rectDimensions.width = Math.floor(rectDimensions.width * (this.isLandscape ? 0.6 : 0.8));

		const center = {
			x: (width / 2) - (rectDimensions.width / 2),
			y: (height / 2) - (rectDimensions.height / 2),
		};

		ctx.beginPath();
		ctx.clearRect(center.x, center.y, rectDimensions.width, rectDimensions.height);
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.roundRect(center.x, center.y, rectDimensions.width, rectDimensions.height, 8);
		ctx.strokeStyle = this._isCaptureValid() ? "#3bf65f" : "#FF5638";
		ctx.lineWidth = Math.max(Math.floor(Math.max(width, height) / 100), 4);
		ctx.stroke();
		ctx.closePath();
	}

	private _drawMask(ctx: CanvasRenderingContext2D): void {
		ctx.strokeStyle = "rgba(0,0,0,0)";
		ctx.miterLimit = 4;
		ctx.fillStyle = "rgba(0,0,0,0)";
		ctx.scale(1, 1);

		ctx.save();

		if (this.source === "face") {
			this._drawFaceMask(ctx);
		} else {
			this._drawIdMask(ctx);
		}

		this._setDimensions(this.video.height, this.video.width, this._rectCredential);
		this._setDimensions(this.video.height, this.video.width, this.video);
	}

	private async _generateQRCode(canvas: HTMLCanvasElement, text: string) {
		try {
			await QRCode.toCanvas(canvas, text, { errorCorrectionLevel: "L" });

			this.loadingQRCode = false;
		} catch (e) {}
	}

	private _isCaptureValid(): boolean {
		return this.source === "document"
			? this.documentIsValid && ((this.side === "front" && this.faceIsValid) || this.side === "back")
			: this.faceIsValid;
	}

	private _startAutoCapture(): void {
		if (!this._isCaptureValid()) {
			if (this._debouncedTakePicture) this._debouncedTakePicture.cancel();
			this._debouncedTakePicture = null;

			return;
		}

		if (this._debouncedTakePicture) return;

		let debounceWait = 500;
		if (this.source === "document") debounceWait = 800;

		this._debouncedTakePicture = debounce(() => this.takePicture(), debounceWait);
		this._debouncedTakePicture();
	}

	private _resetVariables() {
		this.appRegistration = this._KYCService.appRegistration;
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;
		this.requiresBack = this.appRegistration.documentValidation?.requiresBackSide || !!this.appRegistration.documentValidation?.backUrl;

		this._rectCredential = {};
		// this._scanner = JSScanify;

		this.demoData = this._demoService.getDemoData();
		this.isLandscape = window.matchMedia("(orientation: landscape)").matches || window.innerHeight < window.innerWidth;

		this.hideTip = false;
		this.base64Image = undefined;
		this.hasCameraPermissions = false;
		this.loading = false;
		this.loadingCamera = false;

		this.cameraConstraintsInvalid = false;
		this.revealQRCode = false;
		this.loadingQRCode = true;
		this.documentIsValid = false;
		this.errorFace = {};
		this.faceIsValid = false;

		const IDEAL_A = 1920;
		const IDEAL_B = 1080;

		const settings = (
			this.isLandscape ? {
				aspectRatio: { ideal: IDEAL_A / IDEAL_B },
				frameRate: { min: 15, ideal: 30, max: 60 },
				height: { min: 480, ideal: IDEAL_B, max: IDEAL_B },
				width: { min: 854, ideal: IDEAL_A, max: IDEAL_A },
			} : {
				aspectRatio: { ideal: IDEAL_B / IDEAL_A },
				frameRate: { min: 15, ideal: 30, max: 60 },
				height: { min: 854, ideal: IDEAL_A, max: IDEAL_A },
				width: { min: 480, ideal: IDEAL_B, max: IDEAL_B },
			}
		) as MediaTrackConstraintSetExtended;

		const { facingMode, zoom } = navigator.mediaDevices.getSupportedConstraints() as MediaTrackSupportedConstraintsExtended;

		if (facingMode) settings.facingMode = this.source === "face" ? "user" : "environment";
		if (zoom) settings.zoom = { ideal: 0 };

		this.video = {};
		this.videoOptions = {
			...this.videoOptions,
			...settings,
		};
	}

	private _calculateMaxDimensions(
		container: {height: number, width: number},
		containerToFit: {height: number, width: number}
	) {
		const scaleFactorWidth = containerToFit.width / container.width;
		const scaleFactorHeight = containerToFit.height / container.height;
	
		const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
	
		const scaledWidth = Math.floor(container.width * scaleFactor);
		const scaledHeight = Math.floor(container.height * scaleFactor);
	
		return { width: scaledWidth, height: scaledHeight };
	}

	private _setCanvasDimensions = () => {
		const canvasContainer = this.canvasContainer.nativeElement;

		const containerHeight = canvasContainer.clientHeight;
		const containerWidth = canvasContainer.clientWidth;

		const containerToFit = {
			height: Math.min(containerHeight, this.video.height),
			width: Math.min(containerWidth, this.video.width)
		};

		const rescaledProportions = this._calculateMaxDimensions(this.video, containerToFit);

		this.HEIGHT = rescaledProportions.height;
		this.WIDTH = rescaledProportions.width;
	};

	private _paintMaskCanvas() {
		const maskCanvas: HTMLCanvasElement = this.maskCanvas.nativeElement;

		maskCanvas.height = this.HEIGHT;
		maskCanvas.width = this.WIDTH;

		const canvasCtx = maskCanvas.getContext("2d");
		this._drawMask(canvasCtx);
	}

	private _setDimensions(height: number, width: number, data: any) {
		if (this.source === 'document') {
			if (this.isLandscape) {
				data.rectHeight = Math.floor(height * 0.8);
				data.y = Math.floor(height * 0.1);
				data.rectWidth = Math.floor(width * 0.75);
				data.x = Math.floor(width * 0.125);
			} else {
				data.rectHeight = Math.floor(height * 0.4);
				data.y = Math.floor(height * 0.3);
				data.rectWidth = width;
				data.x = 0;
			}
		}

		if (this.source === 'face') {
			if (this.isLandscape) {
				data.rectHeight = height;
				data.y = 0;
				data.rectWidth = Math.floor(width * 0.4);
				data.x = Math.floor(width * 0.3);
			} else {
				data.rectHeight = Math.floor(height * 0.8);
				data.y = Math.floor(height * 0.1);
				data.rectWidth = width;
				data.x = 0;
			}
		}
	}

	private _startCamera() {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			console.error("Browser does not support getUserMedia API.");

			this.hasCameraPermissions = false;
			this.loadingCamera = false;

			return;
		}

		if (this.stream) this._stopRecord();

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

				this.isLandscape = this.video.height < this.video.width;

				this._setBounds();

				setTimeout(() => {
					const video: HTMLVideoElement = this.videoElement.nativeElement;

					video.srcObject = stream;

					video.removeEventListener("loadedmetadata", this._onVideoLoaded, true);
					video.addEventListener("loadedmetadata", this._onVideoLoaded, true);
				});
			})
			.catch((error) => {
				if (error instanceof OverconstrainedError) {
					this.cameraConstraintsInvalid = true;
					this.loadingCamera = false;
					this.hasCameraPermissions = false;
				} else {
					console.error("Error accessing the camera:", error);

					this.loadingCamera = false;
					this.hasCameraPermissions = false;
				}
			});
	}

	private _setBounds() {
		const currentArea = (this.video.width + this.video.height) / 2;
		const idealArea = (1080 + 1920) / 2;

		const areaDiffPercent = currentArea / idealArea;
		const rescale = areaDiffPercent === 1 ? 1 : 1 - areaDiffPercent;

		const __rescaleCalc = (val: number) => {
			return rescale === 1 ? val : Math.floor(val * rescale);
		}

		const FACE_H_ANGLE_LIMIT = {
			PITCH_HIGH: 15,
			PITCH_LOW: -15,
			ROLL_HIGH: 15,
			ROLL_LOW: -15,
			YAW_HIGH: 20,
			YAW_LOW: -20,
		};
		const FACE_V_ANGLE_LIMIT = {
			PITCH_HIGH: 15,
			PITCH_LOW: -15,
			ROLL_HIGH: 15,
			ROLL_LOW: -15,
			YAW_HIGH: 20,
			YAW_LOW: -20,
		};

		const FACE_H_RESOLUTION_LIMIT = {
			WIDTH_HIGH: __rescaleCalc(750),
			WIDTH_LOW: __rescaleCalc(500),
			HEIGHT_HIGH: __rescaleCalc(750),
			HEIGHT_LOW: __rescaleCalc(500),
		};
		const FACE_V_RESOLUTION_LIMIT = {
			WIDTH_HIGH: __rescaleCalc(950),
			WIDTH_LOW: __rescaleCalc(800),
			HEIGHT_HIGH: __rescaleCalc(1000),
			HEIGHT_LOW: __rescaleCalc(850),
		};
		const DOCUMENT_FACE_H_RESOLUTION_LIMIT = {
			WIDTH_HIGH: __rescaleCalc(500),
			WIDTH_LOW: __rescaleCalc(150),
			HEIGHT_HIGH: __rescaleCalc(500),
			HEIGHT_LOW: __rescaleCalc(150),
		};
		const DOCUMENT_FACE_V_RESOLUTION_LIMIT = {
			WIDTH_HIGH: __rescaleCalc(350),
			WIDTH_LOW: __rescaleCalc(100),
			HEIGHT_HIGH: __rescaleCalc(325),
			HEIGHT_LOW: __rescaleCalc(100),
		};

		const FACE_H_BOUNDS_LIMIT = {
			X_HIGH: __rescaleCalc(900),
			X_LOW: __rescaleCalc(500),
			Y_HIGH: __rescaleCalc(400),
			Y_LOW: __rescaleCalc(225),
		};
		const FACE_V_BOUNDS_LIMIT = {
			X_HIGH: __rescaleCalc(170),
			X_LOW: 0,
			Y_HIGH: __rescaleCalc(620),
			Y_LOW: __rescaleCalc(430),
		};
		const DOCUMENT_FACE_H_BOUNDS_LIMIT = {
			X_HIGH: __rescaleCalc(1500),
			X_LOW: __rescaleCalc(200),
			Y_HIGH: __rescaleCalc(600),
			Y_LOW: __rescaleCalc(200),
		};
		const DOCUMENT_FACE_V_BOUNDS_LIMIT = {
			X_HIGH: __rescaleCalc(800),
			X_LOW: __rescaleCalc(75),
			Y_HIGH: __rescaleCalc(1200),
			Y_LOW: __rescaleCalc(700),
		};

		// const DOCUMENT_H_ANGLE_LIMIT = {
		// 	PITCH_HIGH: 15,
		// 	PITCH_LOW: -15,
		// 	ROLL_HIGH: 15,
		// 	ROLL_LOW: -15,
		// };
		// const DOCUMENT_V_ANGLE_LIMIT = {
		// 	PITCH_HIGH: 15,
		// 	PITCH_LOW: -15,
		// 	ROLL_HIGH: 15,
		// 	ROLL_LOW: -15,
		// };
		// const DOCUMENT_H_RESOLUTION_LIMIT = {
		// 	WIDTH_HIGH: __rescaleCalc(1500),
		// 	WIDTH_LOW: __rescaleCalc(1000),
		// 	HEIGHT_HIGH: __rescaleCalc(825),
		// 	HEIGHT_LOW: __rescaleCalc(600),
		// };
		// const DOCUMENT_V_RESOLUTION_LIMIT = {
		// 	WIDTH_HIGH: __rescaleCalc(900),
		// 	WIDTH_LOW: __rescaleCalc(700),
		// 	HEIGHT_HIGH: __rescaleCalc(600),
		// 	HEIGHT_LOW: __rescaleCalc(200),
		// };
		// const DOCUMENT_H_BOUNDS_LIMIT = {
		// 	X_HIGH: __rescaleCalc(1200),
		// 	X_LOW: __rescaleCalc(450),
		// 	Y_HIGH: __rescaleCalc(700),
		// 	Y_LOW: __rescaleCalc(400),
		// };
		// const DOCUMENT_V_BOUNDS_LIMIT = {
		// 	X_HIGH: __rescaleCalc(700),
		// 	X_LOW: __rescaleCalc(400),
		// 	Y_HIGH: __rescaleCalc(1000),
		// 	Y_LOW: __rescaleCalc(600),
		// };

		if (this.source === 'face') {
			this.BOUNDS.face = this.isLandscape
				? {
						angle: { ...FACE_H_ANGLE_LIMIT },
						bounds: { ...FACE_H_BOUNDS_LIMIT },
						res: { ...FACE_H_RESOLUTION_LIMIT },
				}
				: {
						angle: { ...FACE_V_ANGLE_LIMIT },
						bounds: { ...FACE_V_BOUNDS_LIMIT },
						res: { ...FACE_V_RESOLUTION_LIMIT },
				};
		} else {
			this.BOUNDS.face = this.isLandscape
				? {
						bounds: { ...DOCUMENT_FACE_H_BOUNDS_LIMIT },
						res: { ...DOCUMENT_FACE_H_RESOLUTION_LIMIT },
				}
				: {
						bounds: { ...DOCUMENT_FACE_V_BOUNDS_LIMIT },
						res: { ...DOCUMENT_FACE_V_RESOLUTION_LIMIT },
				}
			
			// this.BOUNDS.document = this.isLandscape
			// 	? {
			// 			angle: { ...DOCUMENT_H_ANGLE_LIMIT },
			// 			bounds: { ...DOCUMENT_H_BOUNDS_LIMIT },
			// 			res: { ...DOCUMENT_H_RESOLUTION_LIMIT },
			// 	}
			// 	: {
			// 			angle: { ...DOCUMENT_V_ANGLE_LIMIT },
			// 			bounds: { ...DOCUMENT_V_BOUNDS_LIMIT },
			// 			res: { ...DOCUMENT_V_RESOLUTION_LIMIT },
			// 	}
		}
	}

	private _onVideoLoaded = () => {
		const video: HTMLVideoElement = this.videoElement.nativeElement;
		const videoCanvas: HTMLCanvasElement = this.videoCanvas.nativeElement;

		this._setCanvasDimensions();
		this._paintMaskCanvas();

		if (this.source === 'face') {
			video.style.transform = "scaleX(-1)";
		} else {
			video.style.transform = "";
		}

		// Delay detection calculations by a number of frames for performance.
		const detectionDelay = this.demoData === 'ANDROID' || this.source === 'face' ? 20 : 15;

		let frameCount = 0;

		this._detectionInterval = setInterval(() => {
			++frameCount;

			if (frameCount < detectionDelay) return;

			this._onIntervalDetect(video, videoCanvas)
				.catch((error) => {
					console.log(`file: smart-scanner.component.ts:821 ~ SmartScannerComponent ~ this._detectionInterval=setInterval ~ error:`, error)
				})
				.finally(() => {
					this.calculating = false;

					frameCount = 0;
				});
		}, Math.floor(1000 / 30));
	};

	private _onIntervalDetect = async (video: HTMLVideoElement, videoCanvas: HTMLCanvasElement): Promise<void> => {
		if (this.calculating) return Promise.resolve();

		// To limit processing multiple calculations at once (for devices that run a little slower)
		this.calculating = true;

		
		// Removing document scanner for the time being - Causes stutter/lag for mobile devices
		// if (this.source === "document") {
		// 	const videoCanvasCtx = videoCanvas.getContext("2d", { willReadFrequently: true });

		// 	this._detectDocument(video, videoCanvas, videoCanvasCtx);
		// }
		this.documentIsValid = true;

		if (this.side === "front" || this.source === "face") {
			await this._detectFace(video);
		}
	}

	private _stopRecord(): void {
		clearInterval(this._detectionInterval);

		this._detectionInterval = null;

		if (!this.stream) return;

		this.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
		this.stream = null;
	}

	exitApplication(): void {
		window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
	}

	goNext(): void {
		if (this.source === "face") {
			this._smartEnrollService.setSkippedBiometric(!this.appRegistration.biometricValidation);
			this._smartEnrollService.goToNextStep(); // result

			return;
		}

		if (this.requiresBack && this.side !== "back") {
			this.side = "back";
			this._resetVariables();
			this._startCamera();

			return;
		} else if (this.appRegistration.documentValidation && !this._smartEnrollService.wasSkippedDocument()) {
			this._smartEnrollService.goToNextStep(); // document-review

			return;
		}

		this.skipStep();
	}

	canGoPrevious(): boolean {
		const canGoBackToDocument = !!this.appRegistration.documentValidation || this.projectFlow.onboardingSettings.steps.document !== "skip" || !this._smartEnrollService.wasSkippedDocument();

		return (
			!this.uploading &&
			(this.source === "document" || (this.source === "face" && canGoBackToDocument))
		);
	}

	canSkip(): boolean {
        if (this.uploading) return false;

		const canSkipBiometric = this.source === "face" && (this.projectFlow.onboardingSettings.steps.liveness !== "mandatory" || !this.appRegistration.biometricValidation);
		const canSkipDocument = this.source === "document" && (
			this.projectFlow.onboardingSettings.steps.document !== "mandatory" && !this.appRegistration.documentValidation
		);

		return canSkipDocument || canSkipBiometric;
	}

	closeTip() {
		this.hideTip = true;
	}

	goPrevious(): void {
		if (this.source === "document") {
			if (this.requiresBack && this.side !== "front") {
				this.side = "front";
				this._resetVariables();
				this._startCamera();
			
				return;
			}

			this._smartEnrollService.setDocumentMethod("");
			this._smartEnrollService.skipToStep("document"); // document
		} else if (this.appRegistration.documentValidation) {
			this._smartEnrollService.goToPreviousStep(); // document-review
		} else {
			this._smartEnrollService.skipToStep("document"); // document
		}
	}

	loadQRCode(): void {
		this.revealQRCode = true;

		const qrCanvas = this.qrCodeCanvas.nativeElement;
		this._generateQRCode(qrCanvas, window.location.href);
	}

	setPictureInCanvas(canvas: HTMLCanvasElement, dimensions: any, dimensionsOriginals?: any) {
		const context = canvas.getContext("2d", { willReadFrequently: true });

		canvas.width = dimensions.rectWidth;
		canvas.height = dimensions.rectHeight;

		if (!dimensionsOriginals) {
			dimensionsOriginals = {
				x: dimensions.x,
				y: dimensions.y,
				rectWidth: dimensions.rectWidth,
				rectHeight: dimensions.rectHeight,
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

    showPassportColor(): boolean {
        return !this.appRegistration.documentValidation ||
			this.side === 'front' ||
			this.appRegistration.documentValidation?.documentCategory?.toLowerCase() === 'passport';
    }

    showLicenseColor(): boolean {
        return !this.appRegistration.documentValidation ||
			this.side === 'front' ||
			this.appRegistration.documentValidation?.documentCategory?.toLowerCase() === 'driverlicense';
    }

    showGovernmentIDColor(): boolean {
        return !this.appRegistration.documentValidation ||
			this.side === 'front' ||
			["id", "idv2"].includes(this.appRegistration.documentValidation?.documentCategory?.toLowerCase());
    }

	skipStep(): void {
        if (this.projectFlow.onboardingSettings.steps.liveness !== 'skip' && !this._smartEnrollService.wasSkippedBiometric()) {
			this._smartEnrollService.setSkippedDocument(!this.appRegistration.documentValidation);
            this._smartEnrollService.skipToStep('biometric');
        } else {
			this._smartEnrollService.setSkippedBiometric(!this.appRegistration.biometricValidation);
            this._smartEnrollService.skipToStep('result');
        }
	}

	async takePicture() {
		clearInterval(this._detectionInterval);
		this._detectionInterval = null;

		const canvasToSend = this.toSendCanvas.nativeElement;
		const canvasResult = this.resultCanvas.nativeElement;

		this.setPictureInCanvas(canvasResult, this._rectCredential, this.video);
		this.setPictureInCanvas(canvasToSend, this.video);

		const rawBase64Image = canvasToSend.toDataURL("image/jpeg");
		const isFront = this.side === "front";

		let base64Image = rawBase64Image;
		let face: string;
		let faceToUpload: string;

		if (isFront && this.source === 'document') {
			const img = new Image();
			img.src = rawBase64Image;

			const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();
			const face = this._demoService.findBiggestFace(detections);

			if (face) {
				this.faceIdCard = this._demoService.cutFaceIdCard(img, face.alignedRect.box, this.faceCardCanvas.nativeElement);
				faceToUpload = this.faceIdCard;
			} else {
				this._detectFaceError();
				this._stopRecord();
				this._startCamera();

				return;
			}
		}

		if (this.source === 'face') {
			face = rawBase64Image.replace(/^data:.*;base64,/, "");
		} else {
			base64Image = rawBase64Image.replace(/^data:.*;base64,/, "");
			face = faceToUpload?.replace(/^data:.*;base64,/, "");
		}

		this.onImageScan.next({
			base64Image,
			face,
			force: !isFront || !!this.appRegistration.documentValidation,
			front: isFront,
			inputMethod: 'CAMERA',
			rawImage: rawBase64Image,
			source: this.source,
		});

		this.base64Image = rawBase64Image;
		this.uploading = true;

		this._stopRecord();
	}
}
