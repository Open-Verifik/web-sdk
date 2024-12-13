import * as faceapi from "@vladmandic/face-api";
import jscanify, { Contour } from "libs/jscanify";
import { WebcamImage, WebcamModule } from "ngx-webcam";
import QRCode from "qrcode";
import { Observable, Subject, takeUntil } from "rxjs";

import {
	ErrorFace,
	FaceData,
	IdCard,
	OvalData,
	ResponseData,
} from "app/modules/demo/models/sdk.models";

import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { ImageScan, Project, ProjectFlow } from "app/modules/auth/project";
import { environment } from "environments/environment";

import { fuseAnimations } from "@fuse/animations";
import { KYCService } from "app/modules/auth/kyc.service";
import { DemoService } from "app/modules/demo/demo.service";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";
import { Corrections, IOSCameraData, MediaTrackConstraintSetExtended, SmartEnrollService } from "../smart-enroll.service";
import { Resolution, SmartCameraResolutionDetectionComponent } from "./smart-camera-resolution-detection/smart-camera-resolution-detection.component";
import { debounce, DebouncedFunc } from "lodash";
import { SmartScannerCorrectionsComponent } from "./smart-scanner-corrections/smart-scanner-corrections.component";

const JSScanify = new jscanify();

@Component({
	animations: fuseAnimations,
	selector: "smart-scanner-ios",
	templateUrl: "./smart-scanner-ios.component.html",
	styleUrls: ["./smart-scanner.component.scss"],
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		MatButtonModule,
		MatIconModule,
		MatProgressBarModule,
		MatProgressSpinnerModule,
		SmartStepperComponent,
		SmartScannerCorrectionsComponent,
		SmartCameraResolutionDetectionComponent,
		TranslocoModule,
		WebcamModule,
	],
})
export class SmartScannerIosComponent implements OnInit, OnDestroy {
	@ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("resultCanvas", { static: true }) public resultCanvas: ElementRef;
	@ViewChild("toSendCanvas", { static: true }) public toSendCanvas: ElementRef;

	@ViewChild("qrCodeCanvas") public qrCodeCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("maskCanvas") public maskCanvas: ElementRef;

	@Input("source") source: "document" | "face";
	@Input() successfulUpload: Observable<void>;

	@Output("onImageScan") onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();

	private unsubscriber$: Subject<void> = new Subject<void>();
	private takePicture: Subject<void> = new Subject<void>();
	private _debouncedTakePicture: DebouncedFunc<(img: HTMLImageElement) => void>;
	private _detectionInterval: ReturnType<typeof setInterval>;
	private _ngxVideoInterval: ReturnType<typeof setInterval>;
	private _scanner: jscanify;

	DEBUG_MODE: boolean = !environment.production && false;

	appRegistration: any;
	aspectRatio = 0.75;
	camera: IOSCameraData;
	demoData: any;
	documentIsValid: boolean;
	errorContent: any;
	errorFace: ErrorFace | null;
	face: FaceData;
	faceIsValid: boolean;
	hideTip: boolean = false;
	idCard: IdCard;
	isLandscape: boolean = false;
	killCamera: boolean = false;
	lastFace: any;
	loadingQRCode: boolean = false;
	marginX: string;
	marginY: string;
	project: Project;
	projectFlow: ProjectFlow;
	requiresBack: boolean = false;
	response: ResponseData;
	revealQRCode: boolean = false;
	showError: Boolean;
	side: "back" | "front" = "front";
	successPosition: number = 0;
	uploading: boolean = false;
	videoOptions: any;

	BOUNDS: { face: any, document: any } = { face: {}, document: {} };

	corrections: Corrections = {
		angle: { pitch: "", roll: "", yaw: "" },
		bounds: { x: "", y: "" },
		document: { x: "", y: "" },
		documentResolution: { height: "", width: "" },
		resolution: { height: "", width: "" },
	};

	documentDetection: {
		contours?: Contour;
		height: number;
		width: number;
		x: number;
		y: number;
	};

	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		private _demoService: DemoService,
		private _dom: ElementRef,
		private _KYCService: KYCService,
		private _smartEnrollService: SmartEnrollService,
		private _translocoService: TranslocoService,
	) {
		this._debouncedTakePicture = debounce((img: HTMLImageElement) => this._takePicture(img), 200);
		this._resetVariables();
	}

	ngOnInit(): void {
		this.camera.hasPermissions = true;
		this._setVideoOptionConfigs();
		this._loading({ start: true });

		this.successfulUpload
			.pipe(takeUntil(this.unsubscriber$))
			.subscribe(() => {
				this.uploading = false;
				this.requiresBack = this.appRegistration.documentValidation?.requiresBackSide || !!this.appRegistration.documentValidation?.backUrl;
			});

		this._demoService.faceapi$
            .pipe(takeUntil(this.unsubscriber$))
            .subscribe(async (isLoaded) => {
                this.camera.isLoading = !isLoaded;
            });
	}

	ngOnDestroy(): void {
		this._debouncedTakePicture?.cancel();
		this._stopRecording();

		this.unsubscriber$.next();
		this.unsubscriber$.complete();
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

	private _detectDocument(image: HTMLImageElement) {
		try {
			const img = cv.imread(image);
			const maxContour = this._scanner.findPaperContour(img);

			if (maxContour) {
				const contours = this._scanner.getCornerPoints(maxContour);

				const {
					bounds,
					detection,
					isValid,
					resolution,
				}= this._smartEnrollService.evaluateDocumentContours(this.BOUNDS, contours);

				this.corrections.document = bounds;
				this.corrections.documentResolution = resolution;

				this.documentDetection = detection;
				this.documentIsValid = isValid;
			}

			img.delete();
		} catch (e) {}
	}

	private async _detectFace(image: HTMLImageElement) {
		try {
			const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (!detections.length) throw Error('no_face');
			else {
				const faceDetection = this._demoService.findBiggestFace(detections);

				this.camera.dimensions.real = { height: 0, width: 0, offsetX: 0, offsetY: 0 };
				this._setResultDimensions("real", image.height, image.width);

				this.face.real = this._getCenterAndRadius(image.height, image.width);
				this.lastFace = faceDetection;
	
				const { angle, bounds, resolution, isValid } = this._smartEnrollService.evaluateFaceDetection(this.BOUNDS, faceDetection, this.source);

				this.corrections.angle = angle;
				this.corrections.bounds = bounds;
				this.corrections.resolution = resolution;

				this.faceIsValid = isValid;
				this.errorFace = isValid ? null : this.errorFace;
			}

			this._changeDetectorRef.markForCheck();
		} catch (e) {
			this._faceNotFoundError();
		}
	}

	private _drawFaceMask(ctx: CanvasRenderingContext2D): void {
		const height = this.camera.dimensions.video.height;
		const width = this.camera.dimensions.video.width;

        const originalDrawingSize = this.isLandscape ? 180 : 130;
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

        const adjustX = this.isLandscape ? 0 : 25;
        const adjustY = this.isLandscape ? 15 : 30;

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
		const height = this.camera.dimensions.video.height;
		const width = this.camera.dimensions.video.width;

		ctx.beginPath();
		ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
		ctx.fillRect(0, 0, width, height);
		ctx.closePath();

		const rectDimensions = this._getDetectionRectangleDimensions(width, height);

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

	private _drawMask(): void {
        const maskResultCanvas = this.maskCanvas?.nativeElement;

		if (!maskResultCanvas) return;

		const videoDim = this.camera.dimensions.video;
		const ctx: CanvasRenderingContext2D = maskResultCanvas.getContext("2d", { willReadFrequently: true });

        maskResultCanvas.height = videoDim.height;
		maskResultCanvas.width = videoDim.width;

		if (this.source === "face") {
			this._drawFaceMask(ctx);
		} else {
			this._drawIdMask(ctx);
		}
	}

	private _faceNotFoundError(): void {
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

	private _getCenterAndRadius = (height: number, width: number) => {
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

	private _getDetectionRectangleDimensions(videoWidth: number, videoHeight: number) {
		const rectDimensions = this._calculateMaxDimensions({width: 16, height: 9}, {width: videoWidth, height: videoHeight});

		rectDimensions.height = Math.floor(rectDimensions.height * 0.6);
		rectDimensions.width = Math.floor(rectDimensions.width * 0.6);

		return rectDimensions;
	}

	private async _generateQRCode(canvas: HTMLCanvasElement, text: string) {
		try {
			await QRCode.toCanvas(canvas, text, { errorCorrectionLevel: "L" });

			this.loadingQRCode = false;
		} catch (e) {}
	}

	private _initAppRegistrationData(): void {
		this.appRegistration = this._KYCService.appRegistration;
		this.demoData = this._demoService.getDemoData();
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;
	}

	private _isCaptureValid(): boolean {
		return this.source === "document"
			? this.documentIsValid && ((this.side === "front" && this.faceIsValid) || this.side === "back")
			: this.faceIsValid;
	}

	private _loading = ({ isLoading = true, start = undefined, result = undefined }) => {
		const key = (start && "camera") || (result && "response");

		if (key) this[key].isLoading = isLoading;
	}

	private _resetVariables() {
		clearInterval(this._detectionInterval);
		clearInterval(this._ngxVideoInterval);

		this._detectionInterval = null;
		this._ngxVideoInterval = null;

		this._initAppRegistrationData();
		this._scanner = JSScanify;
		this.successPosition = 0;

		this.demoData = this._demoService.getDemoData();
		this.errorContent = { message: "" };
		this.showError = false;
		this.isLandscape = window.matchMedia("(orientation: landscape)").matches || window.innerHeight < window.innerWidth;

		this._startDefaultValues();
		this._changeDetectorRef.markForCheck();
	}

	private _setBounds() {
		const height = this.camera.dimensions.video.height;
		const width = this.camera.dimensions.video.width;

		const center = {
			x: width / 2,
			y: height / 2,
		};

		if (this.source === 'document') {
			const rectDimensions = this._getDetectionRectangleDimensions(width, height);

			const angle = {
				PITCH_HIGH: 15,
				PITCH_LOW: -15,
				ROLL_HIGH: 15,
				ROLL_LOW: -15,
			}

			const bounds = {
				X_HIGH: Math.floor(center.x * 1.2),
				X_LOW: Math.floor(center.x * 0.5),
				Y_HIGH: Math.floor(center.y * 1.2),
				Y_LOW: Math.floor(center.y * 0.5),
			};

			const landscapeFaceResolution = {
				HEIGHT_HIGH: Math.floor(rectDimensions.height * 0.7),
				HEIGHT_LOW: Math.floor(rectDimensions.height * 0.1),
				WIDTH_HIGH: Math.floor(rectDimensions.width * 0.6),
				WIDTH_LOW: Math.floor(rectDimensions.width * 0.1),
			};
	
			const landscapeDocumentResolution = {
				HEIGHT_HIGH: Math.floor(rectDimensions.height * 1.1),
				HEIGHT_LOW: Math.floor(rectDimensions.height * 0.5),
				WIDTH_HIGH: Math.floor(rectDimensions.width * 1.1),
				WIDTH_LOW: Math.floor(rectDimensions.width * 0.5),
			};
	
			const portraitResolution = {
				HEIGHT_HIGH: Math.floor(rectDimensions.height * 1.1),
				HEIGHT_LOW: Math.floor(rectDimensions.height * 0.5),
				WIDTH_HIGH: Math.floor(rectDimensions.width * 1.1),
				WIDTH_LOW: Math.floor(rectDimensions.width * 0.5),
			};

			this.BOUNDS.face = this.isLandscape
				? {
					bounds: { ...bounds },
					res: { ...landscapeFaceResolution },
				}
				: {
					bounds: { ...bounds },
					res: { ...portraitResolution },
				};

			this.BOUNDS.document = this.isLandscape
				? {
					angle: { ...angle },
					bounds: { ...bounds },
					res: { ...landscapeDocumentResolution },
				} : {
					angle: { ...angle },
					bounds: { ...bounds },
					res: { ...portraitResolution },
				};
		} else {
			const angle = {
				PITCH_HIGH: 15,
				PITCH_LOW: -15,
				ROLL_HIGH: 15,
				ROLL_LOW: -15,
				YAW_HIGH: 20,
				YAW_LOW: -20,
			};

			const bounds = {
				X_HIGH: Math.floor(center.x * (this.isLandscape ? 0.7 : 0.3)),
				X_LOW: Math.floor(center.x * (this.isLandscape ? 0.4 : -0.3)),
				Y_HIGH: Math.floor(center.y * (this.isLandscape ? 0.7 : 0.5)),
				Y_LOW: Math.floor(center.y * (this.isLandscape ? 0.4 : 0.3)),
			};

			const landscapeResolution = {
				HEIGHT_HIGH: Math.max(Math.floor(height * 0.9), 240),
				HEIGHT_LOW: Math.max(Math.floor(height * 0.45), 240),
				WIDTH_HIGH: Math.max(Math.floor(width * 0.6), 240),
				WIDTH_LOW: Math.max(Math.floor(width * 0.25), 240),
			};
	
			const portraitResolution = {
				HEIGHT_HIGH: Math.max(Math.floor(height * 0.7), 240),
				HEIGHT_LOW: Math.max(Math.floor(height * 0.35), 240),
				WIDTH_HIGH: Math.max(Math.floor(width * 0.9), 240),
				WIDTH_LOW: Math.max(Math.floor(width * 0.45), 240),
			};

			this.BOUNDS.face = this.isLandscape
				? {
					angle: { ...angle },
					bounds: { ...bounds },
					res: { ...landscapeResolution },
				}
				: {
					angle: { ...angle },
					bounds: { ...bounds },
					res: { ...portraitResolution },
				};
		}
	}

	private _setDefaultFace = () => {
		this.face = {
			minPixels: 240,
			minHeight: 600,
			threshold: 0.25,
		};
	};

	private _setVideoOptionConfigs(): void {
		this.isLandscape = window.matchMedia("(orientation: landscape)").matches || window.innerHeight < window.innerWidth;

		const settings = (
			{
				...this.videoOptions,
				focusMode: "continuous",
				frameRate: { ideal: 60 },
				noiseSuppression: true,
				zoom: { ideal: 0 },
			}
		) as MediaTrackConstraintSetExtended;

		if (this.source) {
			settings.facingMode = this.source === 'document' ? "environment" : "user";
		}

		this.videoOptions = settings;
	}

	private _setDefaultCamera = () => {
		this.camera = {
			hasPermissions: false,
			isLoading: false,
			isLowQuality: false,
			dimensions: {
				video: {
					max: {
						height: window.innerHeight,
						width: window.innerWidth,
					},
				},
			},
		};

		this._setVideoOptionConfigs();
	};

	private _setDefaultResponse = () => {
		this.response = {
			isLoading: false,
			isFailed: false,
			base64Image: undefined,
		};
	};

	private _setImageOnCanvas = (canvas: HTMLCanvasElement, inputImg: HTMLImageElement, originalDim: any, resizeDim: any) => {
		canvas.width = resizeDim.width;
		canvas.height = resizeDim.height;
		canvas.style.marginLeft = `${resizeDim.offsetX || 0}px`;
		canvas.style.marginTop = `${resizeDim.offsetY || 0}px`;

		const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

	private _setMaxVideoDimensions(): void {
		this.camera = {
			...this.camera,
			dimensions: {
				...this.camera.dimensions,
				result: undefined,
				video: {
					max: {
						height: window.innerHeight,
						width: window.innerWidth,
					},
				},
			},
		};
	}

	private _setResultDimensions(key: string, height: number, width: number) {
		const { center, radius } = (this.face[key] = this._getCenterAndRadius(height, width));

		if (this.source === 'document') {
			if (this.isLandscape) {
				this.camera.dimensions[key].height = height * 0.8;
				this.camera.dimensions[key].offsetY = height * 0.1;

				this.camera.dimensions[key].width = width * 0.75;
				this.camera.dimensions[key].offsetX = width * 0.125;
			} else {
				this.camera.dimensions[key].height = height * 0.4;
				this.camera.dimensions[key].offsetY = height * 0.3;

				this.camera.dimensions[key].width = width;
				this.camera.dimensions[key].offsetX = 0;
			}
		}

		if (this.source === 'face') {
			if (this.isLandscape) {
				this.camera.dimensions[key].height = height;
				this.camera.dimensions[key].offsetY = 0;
		
				this.camera.dimensions[key].width = Math.min(2.8 * radius.x, width);
				this.camera.dimensions[key].offsetX = center.x - this.camera.dimensions[key].width / 2;
			} else {
				this.camera.dimensions[key].height = height * 0.9;
				this.camera.dimensions[key].offsetY = height * 0.1;

				this.camera.dimensions[key].width = Math.min(2 * radius.x, width);
				this.camera.dimensions[key].offsetX = Math.min(center.x - this.camera.dimensions[key].width / 2, 0);
			}
		}
	}

	private _setVideoDimensions(videoNgx: any) {
        this.isLandscape = window.matchMedia("(orientation: landscape)").matches || window.innerHeight < window.innerWidth;

		this.camera.dimensions.video.height = videoNgx.clientHeight;
		this.camera.dimensions.video.width = videoNgx.clientWidth;

		this.camera.dimensions.result = { height: 0, width: 0, offsetX: 0, offsetY: 0 };
		this._setResultDimensions("result", videoNgx.clientHeight, videoNgx.clientWidth);

		this.face.video = this._getCenterAndRadius(videoNgx.clientHeight, videoNgx.clientWidth);

		this._setBounds();
	}

	private _setVideoNgxCameraData = () => {
		const videoNgx = this._dom.nativeElement.querySelector("video");

		if (!videoNgx) return;

		this._setVideoDimensions(videoNgx);
		this._loading({ isLoading: false, start: true });

		setTimeout(() => this._drawMask());

		if (this._detectionInterval) return;

		this._detectionInterval = setInterval(() => {
			this.takePicture.next();
		}, 300);
	}

	private _startDefaultValues() {
		this._setDefaultResponse();
		this._setDefaultCamera();
		this._setDefaultFace();
		this._setMaxVideoDimensions();
	}

    private _startRecording(): void {
        this._setMaxVideoDimensions();

		if (this._ngxVideoInterval) return;

		this._ngxVideoInterval = setInterval(() => {
			this._setVideoNgxCameraData();
		}, 100);
    }

	private _stopRecording(): void {
		this.faceIsValid = false;
		this.documentIsValid = false;

		clearInterval(this._detectionInterval);
		clearInterval(this._ngxVideoInterval);

		this._detectionInterval = null;
		this._ngxVideoInterval = null;
	}

	private _takePicture(img: HTMLImageElement) {
		const canvasResult = this.resultCanvas.nativeElement;
		const canvasToSend = this.toSendCanvas.nativeElement;

        this._setImageOnCanvas(canvasResult, img, this.camera.dimensions.real, this.camera.dimensions.result);
		this._setImageOnCanvas(canvasToSend, img, this.camera.dimensions.real, this.camera.dimensions.real);

		const rawBase64Image = canvasToSend.toDataURL("image/jpeg");

		let base64Image : string;
		let face: string;
		let faceToUpload: string;

		const isFront = this.side === "front";

		if (isFront && this.source === 'document') {
			const img = new Image();
			img.src = rawBase64Image;

			const promise = faceapi
				.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
				.withFaceLandmarks();

			promise.then((detections) => {
				const detection = this._demoService.findBiggestFace(detections);

				if (detection) {
					this.errorContent = null;
					this.errorFace = null;
					this.showError = false;

					faceToUpload = this._demoService.cutFaceIdCard(img, detection.alignedRect.box, this.faceCardCanvas.nativeElement);

					base64Image = rawBase64Image.replace(/^data:.*;base64,/, "");
					face = faceToUpload?.replace(/^data:.*;base64,/, "");

					this.onImageScan.next({
						base64Image,
						face,
						force: !isFront || !!this.appRegistration.documentValidation,
						front: isFront,
						inputMethod: 'CAMERA',
						rawImage: rawBase64Image,
						source: this.source,
					});
			
					this.response.base64Image = base64Image;
					this.uploading = true;
			
					this._stopRecording();
				} else throw Error('face_not_found');

				return detections;
			}).catch((error) => {
				console.error(error);
				this._faceNotFoundError();
			});

			return;
		}

		if (this.source === 'face') {
			face = rawBase64Image.replace(/^data:.*;base64,/, "");
		} else {
			base64Image = rawBase64Image.replace(/^data:.*;base64,/, "");
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

		this.response.base64Image = this.source === 'face' ? face : base64Image;
		this.uploading = true;

		this._stopRecording();
	}

	public get takePicture$(): Observable<void> {
		return this.takePicture.asObservable();
	}

	cameraError(): void {
		this._loading({ isLoading: false, start: true });
		this.camera.hasPermissions = false;
		this.camera.isLowQuality = true;
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

	captureManually(): void {
		const ngxVideo = this._dom.nativeElement.querySelector('video');
		const canvas = document.createElement('canvas') as HTMLCanvasElement;

		canvas.height = ngxVideo.clientHeight;
		canvas.width = ngxVideo.clientWidth;

		const ctx = canvas.getContext("2d");

		ctx.drawImage(ngxVideo, 0, 0, canvas.width, canvas.height);

		const img = new Image();

		img.src = canvas.toDataURL('image/jpeg');

		this._takePicture(img);
	}

	closeTip() {
		this.hideTip = true;
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
			this.response.base64Image = '';
			this._startRecording();

			return;
		} else if (this.appRegistration.documentValidation && !this._smartEnrollService.wasSkippedDocument()) {
			this._smartEnrollService.goToNextStep(); // document-review

			return;
		}

		this.skipStep();
	}

	goPrevious(): void {
		if (this.source === "document") {
			if (this.requiresBack && this.side !== "front") {
				this.side = "front";
				this.response.base64Image = '';
				this._startRecording();
			
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

	handleResolutionDetection(resolution: Resolution) {
		this.videoOptions.aspectRatio = { exact: resolution.aspectRatio };
		this.videoOptions.height = { exact: resolution.height };
		this.videoOptions.width = { exact: resolution.width };
		this.videoOptions.deviceId = { exact: resolution.deviceId };

		this.restartCamera();
	}

	processImage(webcamImage: WebcamImage): void {
		if (this.response.base64Image) return;

		const img = new Image();
		img.src = webcamImage.imageAsDataUrl;

		img.onload = async () => {
			try {
				const findFace = (this.source === 'document' && this.side === 'front') || this.source === 'face';
				const findDocument = this.source === 'document';

				if (findFace) await this._detectFace(img);
				if (findDocument) this._detectDocument(img);

				const documentFrontIsValid = this.source === 'document' && this.side === 'front' && this.faceIsValid && this.documentIsValid;
				const documentBackIsValid = this.source === 'document' && this.side !== 'front' && this.documentIsValid;
				const livenessIsValid = this.source === 'face' && this.faceIsValid;

				this.successPosition = (documentFrontIsValid || documentBackIsValid || livenessIsValid) ? ++this.successPosition : 0;

				if (this.successPosition > 3) {
					this.successPosition = 0;
					this.errorContent = null;

					this._takePicture(img);
				}

				this._changeDetectorRef.markForCheck();
			} catch (error) {
				console.error(error.message);
			}
		};
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
	
	restartCamera(): void {
		this._stopRecording();
		this._setVideoOptionConfigs();
		this._loading({isLoading: false, start: true });

		this.killCamera = true;

		this.showError = false;
		this.errorContent = null;
		this.response.base64Image = undefined;
		this.successPosition = 0;

		setTimeout(() => {
			this.killCamera = false;
			this._startRecording();
		}, 300);
	}

	loadQRCode(): void {
		this.revealQRCode = true;

		const qrCanvas = this.qrCodeCanvas.nativeElement;
		this._generateQRCode(qrCanvas, window.location.href);
	}
}
