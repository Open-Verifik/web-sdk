import * as faceapi from "@vladmandic/face-api";
import jscanify, { Contour } from 'libs/jscanify';

import { debounce, DebouncedFunc } from "lodash";
import { Observable, Subject, Subscription, takeUntil } from "rxjs";

import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { MatIconModule } from "@angular/material/icon";

import { FuseMediaWatcherService } from "@fuse/services/media-watcher";

import { AppRegistration, ImageScan, Project, ProjectFlow } from "app/modules/auth/project";
import { KYCService } from "app/modules/auth/kyc.service";
import { DemoService } from "app/modules/demo/demo.service";
import { SmartEnrollService } from "../smart-enroll.service";
import { Corrections, SmartScannerCorrectionsComponent } from "./smart-scanner-corrections/smart-scanner-corrections.component";

const JSScanify = new jscanify();

const FACE_H_ANGLE_LIMIT = {
	PITCH_HIGH: 15,
	PITCH_LOW: -15,
	ROLL_HIGH: 15,
	ROLL_LOW: -15,
	YAW_HIGH: 20,
	YAW_LOW: -20,
};
const FACE_H_BOUNDS_LIMIT = {
	X_HIGH: 800,
	X_LOW: 500,
	Y_HIGH: 400,
	Y_LOW: 225,
};
const FACE_H_RESOLUTION_LIMIT = {
	WIDTH_HIGH: 800,
	WIDTH_LOW: 600,
	HEIGHT_HIGH: 800,
	HEIGHT_LOW: 600,
};



const FACE_V_ANGLE_LIMIT = {
	PITCH_HIGH: 15,
	PITCH_LOW: -15,
	ROLL_HIGH: 15,
	ROLL_LOW: -15,
	YAW_HIGH: 15,
	YAW_LOW: -15,
};
const FACE_V_BOUNDS_LIMIT = {
	X_HIGH: 170,
	X_LOW: 0,
	Y_HIGH: 620,
	Y_LOW: 430,
};
const FACE_V_RESOLUTION_LIMIT = {
	WIDTH_HIGH: 950,
	WIDTH_LOW: 800,
	HEIGHT_HIGH: 1000,
	HEIGHT_LOW: 850,
};



const DOCUMENT_H_ANGLE_LIMIT = {
	PITCH_HIGH: 15,
	PITCH_LOW: -15,
	ROLL_HIGH: 15,
	ROLL_LOW: -15,
};
const DOCUMENT_H_BOUNDS_LIMIT = {
	X_HIGH: 1000,
	X_LOW: 700,
	Y_HIGH: 550,
	Y_LOW: 400,
};
const DOCUMENT_H_RESOLUTION_LIMIT = {
	WIDTH_HIGH: 1400,
	WIDTH_LOW: 850,
	HEIGHT_HIGH: 700,
	HEIGHT_LOW: 500,
};
const DOCUMENT_FACE_H_RESOLUTION_LIMIT = {
	WIDTH_HIGH: 500,
	WIDTH_LOW: 150,
	HEIGHT_HIGH: 500,
	HEIGHT_LOW: 150,
};
const DOCUMENT_FACE_H_BOUNDS_LIMIT = {
	X_HIGH: 1500,
	X_LOW: 200,
	Y_HIGH: 600,
	Y_LOW: 200,
};



const DOCUMENT_V_ANGLE_LIMIT = {
	PITCH_HIGH: 15,
	PITCH_LOW: -15,
	ROLL_HIGH: 15,
	ROLL_LOW: -15,
};
const DOCUMENT_V_BOUNDS_LIMIT = {
	X_HIGH: 610,
	X_LOW: 400,
	Y_HIGH: 850,
	Y_LOW: 600,
};
const DOCUMENT_V_RESOLUTION_LIMIT = {
	WIDTH_HIGH: 500,
	WIDTH_LOW: 350,
	HEIGHT_HIGH: 280,
	HEIGHT_LOW: 200,
};
const DOCUMENT_FACE_V_RESOLUTION_LIMIT = {
	WIDTH_HIGH: 350,
	WIDTH_LOW: 100,
	HEIGHT_HIGH: 325,
	HEIGHT_LOW: 100,
};
const DOCUMENT_FACE_V_BOUNDS_LIMIT = {
	X_HIGH: 750,
	X_LOW: 75,
	Y_HIGH: 1200,
	Y_LOW: 750,
};


@Component({
	selector: "smart-scanner",
	templateUrl: "./smart-scanner.component.html",
	styleUrls: ["./smart-scanner.component.scss"],
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		MatButtonModule,
		MatCheckboxModule,
		MatIconModule,
		MatProgressSpinnerModule,
		SmartScannerCorrectionsComponent,
		TranslocoModule,
	],
})
export class SmartScannerComponent implements OnInit, OnDestroy {
	@ViewChild("canvasContainer") canvasContainer: ElementRef<HTMLDivElement>;
	@ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;

	@ViewChild("maskCanvas", { static: false }) public maskCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("resultCanvas", { static: false }) public resultCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("toSendCanvas", { static: false }) public toSendCanvas: ElementRef<HTMLCanvasElement>;

	@ViewChild("videoCanvas", { static: false }) public videoCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("videoElement") videoElement: ElementRef<HTMLVideoElement>;
	@ViewChild("videoResultCanvas", { static: false }) public videoResultCanvas: ElementRef<HTMLCanvasElement>;

	@Input('source') source: 'document' | 'face';
	
    @Output('onImageScan') onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();
	
	@Input() successfulUpload: Observable<void>;
	
	private _debouncedTakePicture: DebouncedFunc<() => void>
	private _detectDocumentInterval: ReturnType<typeof setInterval>;
	private _detectFaceInterval: ReturnType<typeof setInterval>;
	private _onSuccessfulUpload: Subscription;
	private _rectCredential: any;
	private _scanner: jscanify;
	private _unsubscribeAll: Subject<any> = new Subject<any>();

	appRegistration: AppRegistration;
	aspectRatio = 85.6 / 53.98;
	base64Image: any;
	checkFaceTimeout: any;
	demoData: any;
	documentContours: string;
	documentIsValid: boolean;
	errorFace: any;
	faceIdCard: string;
	faceIsValid: boolean;
	hasCameraPermissions: boolean;
	HEIGHT: number;
	isHorizontal: boolean = true;
	loading: any;
	loadingCamera: boolean;
	phoneMode: boolean;
	project: Project;
	projectFlow: ProjectFlow;
	requiresBack: boolean = false;
	side: 'back' | 'front' = 'front';
	stream: MediaStream;
	tabletMode: boolean;
	test: string;
	unsupported: boolean = false;
	uploading: boolean = false;
	video: any;
	WIDTH: number;

	videoOptions: any = {
		frameRate: { ideal: 30, max: 30 },
	};

	corrections: Corrections = {
		angle: { pitch: '', roll: '', yaw: '' },
		bounds: { x: '', y: '' },
		document: { x: '', y: ''},
		documentResolution: { height: '', width: '' },
		resolution: { height: '', width: '' },
	};

	documentDetection: {
		x: number,
		y: number,
		height: number,
		width: number,
		contours?: Contour,
	};

	faceDetection: faceapi.WithFaceLandmarks<{
		detection: faceapi.FaceDetection;
	}, faceapi.FaceLandmarks68>;

	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		private _demoService: DemoService,
		private _fuseMediaWatcherService: FuseMediaWatcherService,
		private _KYCService: KYCService,
		private _renderer: Renderer2,
		private _smartEnrollService: SmartEnrollService,
		private _translocoService: TranslocoService,
	) {
		this._resetVariables();

		this._renderer.listen("window", "resize", () => {
			if (!this.videoElement) return;

			this._stopRecord();
			this._startCamera();
		});
	}

	ngOnInit(): void {
		this._ObserveDomMedia();

		this._onSuccessfulUpload = this.successfulUpload.subscribe(() => {
			this.uploading = false;
            this.requiresBack = this.appRegistration.documentValidation?.requiresBackSide || !!this.appRegistration.documentValidation?.backUrl;
		});

		this._demoService.faceapi$.subscribe((isLoaded) => {
			if (!isLoaded || this.stream) return;

			this._startCamera();
		});
	}

	ngOnDestroy(): void {
		this._stopRecord();
		this._onSuccessfulUpload.unsubscribe();
		this._unsubscribeAll.complete();
	}

	private _detectDocument(
		video: HTMLVideoElement,
		videoCanvas: HTMLCanvasElement,
		videoCanvasCtx: CanvasRenderingContext2D,
		videoResultCanvasCtx: CanvasRenderingContext2D,
	) {
		try {
			const vRatio = (videoCanvas.height / video.videoHeight) * video.videoWidth;
			videoCanvasCtx.drawImage(video, 0, 0, vRatio, videoCanvas.height);

			const resultCanvas = this._scanner.highlightPaper(videoCanvas);
			videoResultCanvasCtx.drawImage(resultCanvas, 0, 0);

			try {
				const img = cv.imread(videoCanvas);

				cv.imshow(videoCanvas, img);

				const maxContour = this._scanner.findPaperContour(img);

				if (maxContour) {
					const contours = this._scanner.getCornerPoints(maxContour);
					this._evaluateDocumentContours(contours);
				}

				img.delete();
			} catch (er) {}
		} catch (e) {}
	}

	async _detectFace(image: faceapi.TNetInput) {
		try {
			const detection = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (detection.length) {
				this.faceDetection = this._demoService.findBiggestFace(detection);
				this.checkFaceTimeout = clearTimeout(this.checkFaceTimeout);
				this.errorFace = null;

				this._evaluateFaceData(this.faceDetection);

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
		} catch (e) {}
	}

	private _drawFaceMask(ctx: CanvasRenderingContext2D): void {
		let DRAWING_X = this.isHorizontal ? 1920 : 1080;
		let DRAWING_Y = this.isHorizontal ? 1080 : 1920;

		// Rectangle
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
		if (this.isHorizontal) {
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
		ctx.fillStyle = this._isCaptureValid() ? "#3bf65f" : "#FF5638";

		ctx.scale(scaleX, scaleY);
		ctx.beginPath();

		if (this.isHorizontal) {
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
	}

	private _drawIdMask(ctx: CanvasRenderingContext2D): void {
		let DRAWING_X = this.isHorizontal ? 1920 : 1080;
		let DRAWING_Y = this.isHorizontal ? 1080 : 1920;

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
		if (this.isHorizontal) {
			ctx.moveTo(259,894);
			ctx.bezierCurveTo(259,916.091,276.909,934,299,934);
			ctx.lineTo(1621,934);
			ctx.bezierCurveTo(1643.09,934,1661,916.091,1661,894);
			ctx.lineTo(1661,186);
			ctx.bezierCurveTo(1661,163.909,1643.09,146,1621,146);
			ctx.lineTo(299,146);
			ctx.bezierCurveTo(276.909,146,259,163.909,259,186);
			ctx.lineTo(259,894);
		} else {
			ctx.moveTo(68,1186);
			ctx.bezierCurveTo(68,1208.09,85.9086,1226,108,1226);
			ctx.lineTo(972,1226);
			ctx.bezierCurveTo(994.091,1226,1012,1208.09,1012,1186);
			ctx.lineTo(1012,734);
			ctx.bezierCurveTo(1012,711.909,994.091,694,972,694);
			ctx.lineTo(108,694);
			ctx.bezierCurveTo(85.9086,694,68,711.909,68,734);
			ctx.lineTo(68,1186);
		}

		ctx.closePath();
		ctx.fill("evenodd");
		ctx.stroke();
		ctx.restore();

		ctx.fillStyle = this._isCaptureValid() ? "#3bf65f" : "#FF5638";

		ctx.scale(scaleX, scaleY);
		ctx.beginPath();

		if (this.isHorizontal) {
			ctx.moveTo(291.859,189.778);
			ctx.lineTo(291.859,890.222);
			ctx.bezierCurveTo(291.859,896.267,296.763,901.167,302.812,901.167);
			ctx.lineTo(1617.19,901.167);
			ctx.bezierCurveTo(1623.24,901.167,1628.14,896.267,1628.14,890.222);
			ctx.lineTo(1628.14,189.778);
			ctx.bezierCurveTo(1628.14,183.733,1623.24,178.833,1617.19,178.833);
			ctx.lineTo(302.812,178.833);
			ctx.bezierCurveTo(296.763,178.833,291.859,183.733,291.859,189.778);
			ctx.closePath();

			ctx.moveTo(259,890.222);
			ctx.bezierCurveTo(259,914.4,278.616,934,302.812,934);
			ctx.lineTo(1617.19,934);
			ctx.bezierCurveTo(1641.38,934,1661,914.4,1661,890.222);
			ctx.lineTo(1661,189.778);
			ctx.bezierCurveTo(1661,165.6,1641.38,146,1617.19,146);
			ctx.lineTo(302.812,146);
			ctx.bezierCurveTo(278.615,146,259,165.6,259,189.778);
			ctx.lineTo(259,890.222);
		} else {
			ctx.moveTo(90.125,723.556);
			ctx.lineTo(90.125,1196.44);
			ctx.bezierCurveTo(90.125,1200.53,93.4269,1203.83,97.5,1203.83);
			ctx.lineTo(982.5,1203.83);
			ctx.bezierCurveTo(986.573,1203.83,989.875,1200.53,989.875,1196.44);
			ctx.lineTo(989.875,723.556);
			ctx.bezierCurveTo(989.875,719.475,986.573,716.167,982.5,716.167);
			ctx.lineTo(97.5,716.167);
			ctx.bezierCurveTo(93.4269,716.167,90.125,719.475,90.125,723.556);
			ctx.closePath();

			ctx.moveTo(68,1196.44);
			ctx.bezierCurveTo(68,1212.77,81.2076,1226,97.5,1226);
			ctx.lineTo(982.5,1226);
			ctx.bezierCurveTo(998.792,1226,1012,1212.77,1012,1196.44);
			ctx.lineTo(1012,723.556);
			ctx.bezierCurveTo(1012,707.233,998.792,694,982.5,694);
			ctx.lineTo(97.5,694);
			ctx.bezierCurveTo(81.2076,694,68,707.233,68,723.556);
			ctx.lineTo(68,1196.44);
		}

		ctx.closePath();
		ctx.fill("evenodd");
		ctx.stroke();
		ctx.restore();
		ctx.restore();
	}

	private _drawMask(ctx: CanvasRenderingContext2D): void {
		ctx.strokeStyle="rgba(0,0,0,0)";
		ctx.miterLimit=4;
		ctx.fillStyle="rgba(0,0,0,0)";
		ctx.scale(1, 1);

		ctx.save();

		if (this.source === 'face') {
			this._drawFaceMask(ctx);
		} else {
			this._drawIdMask(ctx);
		}

		this._setDimensions(this.video.height, this.video.width, this._rectCredential);
		this._setDimensions(this.video.height, this.video.width, this.video);
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
	private _evaluateFaceData(face: faceapi.WithFaceLandmarks<{
		detection: faceapi.FaceDetection;
	}, faceapi.FaceLandmarks68>) {
		this._setCanvasDimensions();
		this._evaluateFace(face);
		this._readyAutoCapture();
	}

	private _evaluateDocumentContours(contours: Contour): void {
		let BOUNDS = this.isHorizontal ? {
			angle: { ...DOCUMENT_H_ANGLE_LIMIT },
			bounds: { ...DOCUMENT_H_BOUNDS_LIMIT },
			res: { ...DOCUMENT_H_RESOLUTION_LIMIT },
		} : {
			angle: { ...DOCUMENT_V_ANGLE_LIMIT },
			bounds: { ...DOCUMENT_V_BOUNDS_LIMIT },
			res: { ...DOCUMENT_V_RESOLUTION_LIMIT },
		};

		const scaleRatioX = this.WIDTH / this.video.width;
		const scaleRatioY = this.HEIGHT / this.video.height;

		const shapeWidth = Math.floor(contours.bottomRightCorner.x - contours.bottomLeftCorner.x * scaleRatioX);
		const shapeHeight = Math.floor(contours.bottomLeftCorner.y - contours.topLeftCorner.y * scaleRatioY);

		const correctResolution = shapeHeight > BOUNDS.res.HEIGHT_LOW &&
			shapeHeight < BOUNDS.res.HEIGHT_HIGH &&
			shapeWidth > BOUNDS.res.WIDTH_LOW &&
			shapeWidth < BOUNDS.res.WIDTH_HIGH;

		const centerPoint = {
			x: Math.floor(((contours.bottomRightCorner.x + contours.bottomLeftCorner.x + contours.topLeftCorner.x + contours.topRightCorner.x) / 4) * scaleRatioX),
			y: Math.floor(((contours.bottomRightCorner.y + contours.bottomLeftCorner.y + contours.topLeftCorner.y + contours.topRightCorner.y) / 4) * scaleRatioY),
		}

		const fallsInBounds = centerPoint.x > BOUNDS.bounds.X_LOW &&
			centerPoint.x < BOUNDS.bounds.X_HIGH &&
			centerPoint.y > BOUNDS.bounds.Y_LOW &&
			centerPoint.y < BOUNDS.bounds.Y_HIGH;

		this.documentDetection = {
			...centerPoint,
			height: shapeHeight,
			width: shapeWidth,
			contours,
		};

		this.documentIsValid = correctResolution && fallsInBounds;

		this.corrections.document = {
			x: !fallsInBounds && centerPoint.x > BOUNDS.bounds.X_HIGH ?
				'left' : !fallsInBounds && centerPoint.x < BOUNDS.bounds.X_LOW ?
				'right' : '',
			y: !fallsInBounds && centerPoint.y > BOUNDS.bounds.Y_HIGH ?
				'up' : !fallsInBounds && centerPoint.y < BOUNDS.bounds.Y_LOW ?
				'down' : '',
		};

		this.corrections.documentResolution = {
			height: !correctResolution && shapeHeight > BOUNDS.res.HEIGHT_HIGH ?
				'back' : !correctResolution && shapeHeight < BOUNDS.res.HEIGHT_LOW ?
				'forward' : '',
			width: !correctResolution && shapeWidth > BOUNDS.res.WIDTH_HIGH ?
				'back' : !correctResolution && shapeWidth < BOUNDS.res.WIDTH_LOW ?
				'forward' : '',
		}
	}

	private _evaluateFace(face: faceapi.WithFaceLandmarks<{
		detection: faceapi.FaceDetection;
	}, faceapi.FaceLandmarks68>): void {
		let BOUNDS: any;
		let correctAngle: boolean = true;

		if (this.source === 'face') {
			BOUNDS = this.isHorizontal ? {
				angle: { ...FACE_H_ANGLE_LIMIT },
				bounds: { ...FACE_H_BOUNDS_LIMIT },
				res: { ...FACE_H_RESOLUTION_LIMIT },
			} : {
				angle: { ...FACE_V_ANGLE_LIMIT },
				bounds: { ...FACE_V_BOUNDS_LIMIT },
				res: { ...FACE_V_RESOLUTION_LIMIT },
			};
		} else {
			BOUNDS = this.isHorizontal ? {
				bounds: { ...DOCUMENT_FACE_H_BOUNDS_LIMIT },
				res: { ...DOCUMENT_FACE_H_RESOLUTION_LIMIT },
			} : {
				bounds: { ...DOCUMENT_FACE_V_BOUNDS_LIMIT },
				res: { ...DOCUMENT_FACE_V_RESOLUTION_LIMIT },
			};
		}

		const correctResolution = face.alignedRect.box.height > BOUNDS.res.HEIGHT_LOW &&
			face.alignedRect.box.height < BOUNDS.res.HEIGHT_HIGH &&
			face.alignedRect.box.width > BOUNDS.res.WIDTH_LOW &&
			face.alignedRect.box.width < BOUNDS.res.WIDTH_HIGH;

		const fallsInBounds = face.alignedRect.box.x > BOUNDS.bounds.X_LOW &&
			face.alignedRect.box.x < BOUNDS.bounds.X_HIGH &&
			face.alignedRect.box.y > BOUNDS.bounds.Y_LOW &&
			face.alignedRect.box.y < BOUNDS.bounds.Y_HIGH;

		if (this.source === 'face') {
			correctAngle = face.angle.pitch > BOUNDS.angle.PITCH_LOW &&
				face.angle.pitch < BOUNDS.angle.PITCH_HIGH &&
				face.angle.roll > BOUNDS.angle.ROLL_LOW &&
				face.angle.roll < BOUNDS.angle.ROLL_HIGH &&
				face.angle.yaw > BOUNDS.angle.YAW_LOW &&
				face.angle.yaw < BOUNDS.angle.YAW_HIGH;
		}

		this.faceIsValid = correctResolution && fallsInBounds && correctAngle;

		this.corrections.resolution = {
			width: !correctResolution && face.alignedRect.box.width > BOUNDS.res.WIDTH_HIGH ?
				'back' : !correctResolution && face.alignedRect.box.width < BOUNDS.res.WIDTH_LOW ?
				'forward' : '',
			height: !correctResolution && face.alignedRect.box.height > BOUNDS.res.HEIGHT_HIGH ?
				'back' : !correctResolution && face.alignedRect.box.height < BOUNDS.res.HEIGHT_LOW ?
				'forward' : '',
		};

		this.corrections.bounds = {
			x: !fallsInBounds && face.alignedRect.box.x > BOUNDS.bounds.X_HIGH ?
				'right' : !fallsInBounds && face.alignedRect.box.x < BOUNDS.bounds.X_LOW ?
				'left' : '',
			y: !fallsInBounds && face.alignedRect.box.y > BOUNDS.bounds.Y_HIGH ?
				'up' : !fallsInBounds && face.alignedRect.box.y < BOUNDS.bounds.Y_LOW ?
				'down' : '',
		};

		if (this.source === 'face') {
			this.corrections.angle = {
				pitch: !correctAngle && face.angle.pitch > BOUNDS.angle.PITCH_HIGH ?
					'down' : !correctAngle && face.angle.pitch < BOUNDS.angle.PITCH_LOW ?
					'up' : '',
				roll: !correctAngle && face.angle.roll > BOUNDS.angle.ROLL_HIGH ?
					'left' : !correctAngle && face.angle.roll < BOUNDS.angle.ROLL_LOW ?
					'right' : '',
				yaw: !correctAngle && face.angle.yaw > BOUNDS.angle.YAW_HIGH ?
					'left' : !correctAngle && face.angle.yaw < BOUNDS.angle.YAW_LOW ?
					'right' : '',
			}
		} else {
			this.corrections.angle = { pitch: '', roll: '', yaw: '' };
		}
	}

	private _isCaptureValid(): boolean {
		return this.source === 'document' ? this.documentIsValid && this.faceIsValid : this.faceIsValid;
	}

	private _ObserveDomMedia(): void {
		this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe(({ matchingAliases }) => {
			this.phoneMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && !matchingAliases.includes("sm"));
			this.tabletMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && matchingAliases.includes("sm"));

			this._changeDetectorRef.markForCheck();
		});
	}

	private _readyAutoCapture() {
		if (!this._isCaptureValid()) {
			if (this._debouncedTakePicture) this._debouncedTakePicture.cancel();
			this._debouncedTakePicture = null;

			return;
		}

		if (this._debouncedTakePicture) return;

		let debounceWait = 1000;

		if (this.source === 'document') debounceWait = 1500;

		this._debouncedTakePicture = debounce(() => this.takePicture(), debounceWait);
		this._debouncedTakePicture();
	}

	private _resetVariables() {
		this.appRegistration = this._KYCService.appRegistration;
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;
		this.requiresBack = this.appRegistration.documentValidation?.requiresBackSide || !!this.appRegistration.documentValidation?.backUrl;

		this._rectCredential = {};
		this._scanner = JSScanify;

		this.demoData = this._demoService.getDemoData();

		this.base64Image = undefined;
		this.hasCameraPermissions = false;
		this.loading = false;
		this.loadingCamera = false;

		this.errorFace = {};
		this.documentIsValid = false;
		this.faceIsValid = false;

		let key = this.demoData.isMobile ? "width" : "height";

		this.video = {};
		this.videoOptions[key] = { ideal: 1080 };
	}

	private _setCanvasDimensions = () => {
		const canvasContainer = this.canvasContainer.nativeElement;

		const appWindowHeight = canvasContainer.clientHeight;
		const appWindowWidth = canvasContainer.clientWidth;

		const maxHeight = Math.min(appWindowHeight, this.video.height);
		const maxWidth = Math.min(appWindowWidth, this.video.width);

		const scaleRatioX = maxWidth / this.video.width;
		const scaleRatioY = maxHeight / this.video.height;

		// rescale to maintain aspect ratio
		if (scaleRatioX < 1) this.HEIGHT = +(maxHeight * scaleRatioX).toFixed(0);
		else this.HEIGHT = +(maxHeight).toFixed(0);

		if (scaleRatioY < 1) this.WIDTH = +(maxWidth * scaleRatioY).toFixed(0);
		else this.WIDTH = +(maxWidth).toFixed(0);

		const maskCanvas: HTMLCanvasElement = this.maskCanvas.nativeElement;

		maskCanvas.height = this.HEIGHT;
		maskCanvas.width = this.WIDTH;

		const canvasCtx = maskCanvas.getContext("2d");
		this._drawMask(canvasCtx);
	};

	private _setDimensions(height: number, width: number, data: any) {
		if (this.isHorizontal) {
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

	private _startCamera() {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			console.error("Browser does not support getUserMedia API.");

			this.hasCameraPermissions = false;
			this.loadingCamera = false;

			return;
		}

		this.loadingCamera = true;

		const facingModeSupported = navigator.mediaDevices.getSupportedConstraints().facingMode;

		if (facingModeSupported) { // can be 'user' || 'environment' https://w3c.github.io/mediacapture-main/#dom-videofacingmodeenum
			this.videoOptions.facingMode = this.source === 'face' ? 'user' : 'environment';
		} else if (this.videoOptions.prototype.hasOwnProperty('facingMode')) {
			delete this.videoOptions.facingMode;
		}

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

				this.isHorizontal = this.video.height < this.video.width;

				setTimeout(() => {
					const video: HTMLVideoElement = this.videoElement.nativeElement;
					const videoCanvas: HTMLCanvasElement = this.videoCanvas.nativeElement;
					const videoResultCanvas: HTMLCanvasElement = this.videoResultCanvas.nativeElement;

					video.srcObject = stream;
					video.addEventListener('loadedmetadata', () => {
						this._setCanvasDimensions();

						if (!facingModeSupported || this.videoOptions.facingMode === 'user') {
							video.style.transform = "scaleX(-1)";
						}

						videoCanvas.height = this.HEIGHT;
						videoCanvas.width = this.WIDTH;
						videoResultCanvas.height = this.HEIGHT;
						videoResultCanvas.width = this.WIDTH;

						if (this.source === 'document') {
							const videoCanvasCtx = videoCanvas.getContext('2d');
							const videoResultCanvasCtx = videoResultCanvas.getContext('2d');

							this._detectDocumentInterval = setInterval(() => this._detectDocument(video, videoCanvas, videoCanvasCtx, videoResultCanvasCtx), 50);
						}

						this._detectFaceInterval = setInterval(() => this._detectFace(video), this.demoData.time);
					});
				});
			})
			.catch((error) => {
				console.error("Error accessing the camera:", error);

				this.loadingCamera = false;
				this.hasCameraPermissions = false;
			});
	}

	private _stopRecord(): void {
		if (!this.stream) return;

		clearInterval(this._detectDocumentInterval);
		clearInterval(this._detectFaceInterval);

		this._detectDocumentInterval = null;
		this._detectFaceInterval = null;

		this.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
	}

	exitApplication(): void {
		window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
	}

    goNext(): void {
		if (this.source === 'document') {
			if (this.requiresBack && this.side !== 'back') {
				this.side = 'back';
				this._resetVariables();
				this._startCamera();
			} else if (this.appRegistration.documentValidation) {
				this._smartEnrollService.goToNextStep(); // go to document-review
			} else if (this.projectFlow.onboardingSettings.steps.liveness !== 'skip') {
				this._smartEnrollService.skipToStep('biometric'); // go to liveness
			} else {
				this._smartEnrollService.skipToStep('result');
			}
		} else {
			this._smartEnrollService.goToNextStep();
		}
    }

	canGoPrevious(): boolean {
		return !this.uploading &&
			(
				this.source === 'document' ||
				(this.source === 'face' && this.projectFlow.onboardingSettings.steps.document !== 'skip')
			);
	}

	canSkip(): boolean {
		return !this.uploading && (
			(
				this.source === 'document' &&
				(this.projectFlow.onboardingSettings.steps.document !== 'mandatory' || !this.appRegistration.documentValidation)
			) ||
			(
				this.source === 'face' &&
				(this.projectFlow.onboardingSettings.steps.liveness !== 'mandatory' || !this.appRegistration.biometricValidation)
			)
		);
	}

    goPrevious(): void {
		if (this.source === 'document') {
			if (this.requiresBack && this.side !== 'front') {
				this.side = 'front';
				this._resetVariables();
				this._startCamera();
			} else {
				this._smartEnrollService.setDocumentMethod('');
				this._smartEnrollService.skipToStep('document');
			}
		} else if (this.appRegistration.documentValidation) {
			this._smartEnrollService.goToPreviousStep();
		} else {
			this._smartEnrollService.skipToStep('document');
		}
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

	async takePicture() {
		clearInterval(this._detectFaceInterval);
		clearInterval(this._detectDocumentInterval);

		this._detectFaceInterval = null;
		this._detectDocumentInterval = null;

		const canvasToSend = this.toSendCanvas.nativeElement;
		const canvasResult = this.resultCanvas.nativeElement;

		this.setPictureInCanvas(canvasResult, this._rectCredential, this.video);
		this.setPictureInCanvas(canvasToSend, this.video);

		this.base64Image = canvasToSend.toDataURL("image/jpeg");
		const base64Image = this.base64Image.replace(/^data:.*;base64,/, "");
		const isFront = this.side === 'front';

		if (this.source === 'document' && isFront) {
			const img = new Image();
			img.src = this.base64Image;

			const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();
			const faces = detections.map((face) => face.detection.box)

			if (faces.length) {
				const documentFace = this._demoService.getBiggestFace(faces);
	
				this.faceIdCard = this._demoService.cutFaceIdCard(img, documentFace, this.faceCardCanvas.nativeElement);
			}
		}

		this.uploading = true;

		this.onImageScan.next({
			base64Image,
			documentFace: this.faceIdCard,
			front: isFront,
			rawImage: this.base64Image,
			source: this.source,
		});

		this._stopRecord();
	}
}
