import * as faceapi from "@vladmandic/face-api";
import jscanify, { Contour } from "libs/jscanify";
import { WebcamImage, WebcamInitError, WebcamModule } from "ngx-webcam";
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

import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { ImageScan, Project, ProjectFlow } from "app/modules/auth/project";
import { environment } from "environments/environment";

import { KYCService } from "app/modules/auth/kyc.service";
import { DemoService } from "app/modules/demo/demo.service";
import { Corrections, IOSCameraData, MediaTrackConstraintSetExtended, MediaTrackSupportedConstraintsExtended, SmartEnrollService } from "../smart-enroll.service";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";
import { fuseAnimations } from "@fuse/animations";
import { Resolution, SmartCameraResolutionDetectionComponent } from "./smart-camera-resolution-detection/smart-camera-resolution-detection.component";

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
		SmartCameraResolutionDetectionComponent,
		TranslocoModule,
		WebcamModule,
	],
})
export class SmartScannerIosComponent implements OnInit, OnDestroy {
	@ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;
	@ViewChild("toSendCanvas", { static: true }) public toSendCanvas: ElementRef;
	@ViewChild("resultCanvas", { static: true }) public resultCanvas: ElementRef;

    @ViewChild("maskCanvas", { static: false }) public maskCanvas: ElementRef;

	@Input("source") source: "document" | "face";
	@Input() successfulUpload: Observable<void>;

	@Output("onImageScan") onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();

	private unsubscriber$: Subject<void> = new Subject<void>();
	private takePicture: Subject<void> = new Subject<void>();
	private _detectionInterval: ReturnType<typeof setInterval>;
	private _ngxVideoInterval: ReturnType<typeof setInterval>;
	private _scanner: jscanify;

	DEBUG_MODE: boolean = false;

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
	lastFace: any;
	marginX: string;
	marginY: string;
	project: Project;
	projectFlow: ProjectFlow;
	requiresBack: boolean = false;
	response: ResponseData;
	showError: Boolean;
	side: "back" | "front" = "front";
	toSave: ImageScan = null;
	uploading: boolean = false;
	killCamera: boolean = false;
	videoOptions: MediaTrackConstraintSetExtended;

	BOUNDS: { face: any, document: any } = { face: {}, document: {} };
    HEIGHT: number;
    WIDTH: number;

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
		private _splashScreenService: FuseSplashScreenService,
		private _translocoService: TranslocoService,
	) {
		this._resetVariables();
	}

	ngOnInit(): void {
		this.camera.hasPermissions = true;
		this._loading({ start: true });

		this.successfulUpload
			.pipe(takeUntil(this.unsubscriber$))
			.subscribe(() => {
				this.uploading = false;
				this.response.base64Image = this.toSave.base64Image;
				this.requiresBack = this.appRegistration.documentValidation?.requiresBackSide || !!this.appRegistration.documentValidation?.backUrl;
				this.toSave = null;
			});

		this._demoService.faceapi$
            .pipe(takeUntil(this.unsubscriber$))
            .subscribe(async (isLoaded) => {
                this.camera.isLoading = !isLoaded;
            });
	}

	ngOnDestroy(): void {
		clearInterval(this._detectionInterval);
		clearInterval(this._ngxVideoInterval);

		this._detectionInterval = null;
		this._ngxVideoInterval = null;

		this.unsubscriber$.next();
		this.unsubscriber$.complete();
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
			const detection = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (!detection.length) throw Error('no_face');
			else {
				const faceDetection = this._demoService.findBiggestFace(detection);

				this.camera.dimensions.real = { height: 0, width: 0, offsetX: 0, offsetY: 0 };
				this._setResultDimensions("real", image.height, image.width);

				this.face.real = this._getCenterAndRadius(image.height, image.width);
				this.lastFace = faceDetection;

				this.errorFace = null;
	
				if (this.source === 'document') {
					const { isValid } = this._smartEnrollService.evaluateFaceDetection(this.BOUNDS, faceDetection, this.source);

					this.faceIsValid = isValid;
				} else {
					this._isFaceCentered(this.lastFace.landmarks.getNose()[3]);
					this._isFaceClose(this.lastFace.landmarks);

					!this.errorFace ? ++this.face.successPosition : (this.face.successPosition = 0);

					if (!this.errorFace && this.face.successPosition > 3) {
						this.faceIsValid = true;
						this.face.successPosition = 0;
					}
				}
			}

			this._changeDetectorRef.markForCheck();
		} catch (e) {
			this._faceNotFoundError();
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

	private _drawFaceMask(ctx: CanvasRenderingContext2D): void {
		let DRAWING_X = this.isLandscape ? 1920 : 1080;
		let DRAWING_Y = this.isLandscape ? 1080 : 1920;

		// Rectangle
		ctx.fillStyle = "rgba(255,255,255,0.7)";
		ctx.beginPath();
		ctx.moveTo(this.WIDTH, 0);
		ctx.lineTo(0, 0);
		ctx.lineTo(0, this.HEIGHT);
		ctx.lineTo(this.WIDTH, this.HEIGHT);
		ctx.lineTo(this.WIDTH, 0);
		ctx.closePath();

		const scaleX = Math.min(this.WIDTH, DRAWING_X) / Math.max(this.WIDTH, DRAWING_X);
		const scaleY = Math.min(this.HEIGHT, DRAWING_Y) / Math.max(this.HEIGHT, DRAWING_Y);

		ctx.scale(scaleX, scaleY);

		// Light Mask
		if (this.isLandscape) {
			ctx.moveTo(959.988, 102);
			ctx.bezierCurveTo(1153.06, 102, 1311.98, 234.628, 1319.68, 419.92);
			ctx.lineTo(1319.7, 419.92);
			ctx.lineTo(1320, 419.92);
			ctx.lineTo(1320, 434.023);
			ctx.bezierCurveTo(1320, 527.891, 1294.94, 662.504, 1238.35, 774.132);
			ctx.bezierCurveTo(1181.94, 885.431, 1091.75, 978, 960.011, 978);
			ctx.bezierCurveTo(828.274, 978, 738.105, 885.431, 681.672, 774.132);
			ctx.bezierCurveTo(625.056, 662.525, 600, 527.891, 600, 434.023);
			ctx.bezierCurveTo(600, 241.393, 766.917, 102, 959.988, 102);
		} else {
			ctx.moveTo(539.985, 361);
			ctx.bezierCurveTo(794.195, 361, 1003.44, 535.718, 1013.58, 779.813);
			ctx.lineTo(1013.61, 779.813);
			ctx.lineTo(1014, 779.813);
			ctx.lineTo(1014, 798.391);
			ctx.bezierCurveTo(1014, 922.049, 981.01, 1099.38, 906.494, 1246.43);
			ctx.bezierCurveTo(832.222, 1393.05, 713.468, 1515, 540.015, 1515);
			ctx.bezierCurveTo(366.561, 1515, 247.838, 1393.05, 173.534, 1246.43);
			ctx.bezierCurveTo(98.9901, 1099.41, 66, 922.049, 66, 798.391);
			ctx.bezierCurveTo(66, 544.63, 285.774, 361, 539.985, 361);
		}

		ctx.closePath();
		ctx.fill("evenodd");
		ctx.stroke();
		ctx.restore();

		// Outline
		ctx.fillStyle = this._isCaptureValid() ? "#3bf65f" : "#FF5638";

		ctx.scale(scaleX, scaleY);
		ctx.beginPath();

		if (this.isLandscape) {
			ctx.moveTo(959.988, 130.183);
			ctx.bezierCurveTo(776.49, 130.183, 629.316, 258.603, 629.316, 434);
			ctx.bezierCurveTo(629.316, 524.146, 653.593, 654.46, 708.01, 761.748);
			ctx.bezierCurveTo(762.588, 869.412, 845.085, 949.772, 960.011, 949.772);
			ctx.bezierCurveTo(1074.94, 949.772, 1157.43, 869.412, 1212.01, 761.771);
			ctx.bezierCurveTo(1265.77, 655.76, 1290.11, 527.318, 1290.68, 437.328);
			ctx.lineTo(1290.68, 434);
			ctx.bezierCurveTo(1290.68, 258.58, 1143.51, 130.183, 960.011, 130.183);
			ctx.lineTo(959.988, 130.183);
			ctx.closePath();

			ctx.moveTo(1319.68, 419.92);
			ctx.bezierCurveTo(1311.98, 234.628, 1153.06, 102, 959.988, 102);
			ctx.bezierCurveTo(766.917, 102, 600, 241.393, 600, 434.023);
			ctx.bezierCurveTo(600, 527.892, 625.056, 662.525, 681.672, 774.132);
			ctx.bezierCurveTo(738.105, 885.431, 828.274, 978, 960.011, 978);
			ctx.bezierCurveTo(1091.75, 978, 1181.94, 885.431, 1238.35, 774.132);
			ctx.bezierCurveTo(1294.94, 662.504, 1320, 527.892, 1320, 434.023);
			ctx.lineTo(1320, 419.92);
			ctx.lineTo(1319.7, 419.92);
			ctx.lineTo(1319.68, 419.92);
		} else {
			ctx.moveTo(539.985, 398.126);
			ctx.bezierCurveTo(298.378, 398.126, 104.599, 567.301, 104.599, 798.361);
			ctx.bezierCurveTo(104.599, 917.114, 136.564, 1088.78, 208.213, 1230.12);
			ctx.bezierCurveTo(280.074, 1371.95, 388.695, 1477.81, 540.015, 1477.81);
			ctx.bezierCurveTo(691.334, 1477.81, 799.954, 1371.95, 871.815, 1230.15);
			ctx.bezierCurveTo(942.591, 1090.5, 974.645, 921.294, 975.401, 802.745);
			ctx.lineTo(975.401, 798.361);
			ctx.bezierCurveTo(975.401, 567.271, 781.62, 398.126, 540.015, 398.126);
			ctx.lineTo(539.985, 398.126);
			ctx.closePath();

			ctx.moveTo(1013.58, 779.813);
			ctx.bezierCurveTo(1003.44, 535.718, 794.195, 361, 539.985, 361);
			ctx.bezierCurveTo(285.774, 361, 66, 544.63, 66, 798.391);
			ctx.bezierCurveTo(66, 922.049, 98.9901, 1099.41, 173.535, 1246.43);
			ctx.bezierCurveTo(247.838, 1393.05, 366.561, 1515, 540.015, 1515);
			ctx.bezierCurveTo(713.468, 1515, 832.222, 1393.05, 906.494, 1246.43);
			ctx.bezierCurveTo(981.01, 1099.38, 1014, 922.049, 1014, 798.391);
			ctx.lineTo(1014, 779.813);
			ctx.lineTo(1013.61, 779.813);
			ctx.lineTo(1013.58, 779.813);
		}

		ctx.closePath();
		ctx.fill("evenodd");
		ctx.stroke();
		ctx.restore();
		ctx.save();
	}

	private _drawIdMask(ctx: CanvasRenderingContext2D): void {
		let DRAWING_X = this.isLandscape ? 1920 : 1080;
		let DRAWING_Y = this.isLandscape ? 1080 : 1920;

		ctx.fillStyle = "rgba(255,255,255,0.7)";
		ctx.beginPath();
		ctx.moveTo(this.WIDTH, 0);
		ctx.lineTo(0, 0);
		ctx.lineTo(0, this.HEIGHT);
		ctx.lineTo(this.WIDTH, this.HEIGHT);
		ctx.lineTo(this.WIDTH, 0);
		ctx.closePath();

		const scaleX = Math.min(this.WIDTH, DRAWING_X) / Math.max(this.WIDTH, DRAWING_X);
		const scaleY = Math.min(this.HEIGHT, DRAWING_Y) / Math.max(this.HEIGHT, DRAWING_Y);

		ctx.scale(scaleX, scaleY);

		// Light Mask
		if (this.isLandscape) {
			ctx.moveTo(259, 894);
			ctx.bezierCurveTo(259, 916.091, 276.909, 934, 299, 934);
			ctx.lineTo(1621, 934);
			ctx.bezierCurveTo(1643.09, 934, 1661, 916.091, 1661, 894);
			ctx.lineTo(1661, 186);
			ctx.bezierCurveTo(1661, 163.909, 1643.09, 146, 1621, 146);
			ctx.lineTo(299, 146);
			ctx.bezierCurveTo(276.909, 146, 259, 163.909, 259, 186);
			ctx.lineTo(259, 894);
		} else {
			ctx.moveTo(68, 1186);
			ctx.bezierCurveTo(68, 1208.09, 85.9086, 1226, 108, 1226);
			ctx.lineTo(972, 1226);
			ctx.bezierCurveTo(994.091, 1226, 1012, 1208.09, 1012, 1186);
			ctx.lineTo(1012, 734);
			ctx.bezierCurveTo(1012, 711.909, 994.091, 694, 972, 694);
			ctx.lineTo(108, 694);
			ctx.bezierCurveTo(85.9086, 694, 68, 711.909, 68, 734);
			ctx.lineTo(68, 1186);
		}

		ctx.closePath();
		ctx.fill("evenodd");
		ctx.stroke();
		ctx.restore();

		ctx.fillStyle = this._isCaptureValid() ? "#3bf65f" : "#FF5638";

		ctx.scale(scaleX, scaleY);
		ctx.beginPath();

		if (this.isLandscape) {
			ctx.moveTo(291.859, 189.778);
			ctx.lineTo(291.859, 890.222);
			ctx.bezierCurveTo(291.859, 896.267, 296.763, 901.167, 302.812, 901.167);
			ctx.lineTo(1617.19, 901.167);
			ctx.bezierCurveTo(1623.24, 901.167, 1628.14, 896.267, 1628.14, 890.222);
			ctx.lineTo(1628.14, 189.778);
			ctx.bezierCurveTo(1628.14, 183.733, 1623.24, 178.833, 1617.19, 178.833);
			ctx.lineTo(302.812, 178.833);
			ctx.bezierCurveTo(296.763, 178.833, 291.859, 183.733, 291.859, 189.778);
			ctx.closePath();

			ctx.moveTo(259, 890.222);
			ctx.bezierCurveTo(259, 914.4, 278.616, 934, 302.812, 934);
			ctx.lineTo(1617.19, 934);
			ctx.bezierCurveTo(1641.38, 934, 1661, 914.4, 1661, 890.222);
			ctx.lineTo(1661, 189.778);
			ctx.bezierCurveTo(1661, 165.6, 1641.38, 146, 1617.19, 146);
			ctx.lineTo(302.812, 146);
			ctx.bezierCurveTo(278.615, 146, 259, 165.6, 259, 189.778);
			ctx.lineTo(259, 890.222);
		} else {
			ctx.moveTo(90.125, 723.556);
			ctx.lineTo(90.125, 1196.44);
			ctx.bezierCurveTo(90.125, 1200.53, 93.4269, 1203.83, 97.5, 1203.83);
			ctx.lineTo(982.5, 1203.83);
			ctx.bezierCurveTo(986.573, 1203.83, 989.875, 1200.53, 989.875, 1196.44);
			ctx.lineTo(989.875, 723.556);
			ctx.bezierCurveTo(989.875, 719.475, 986.573, 716.167, 982.5, 716.167);
			ctx.lineTo(97.5, 716.167);
			ctx.bezierCurveTo(93.4269, 716.167, 90.125, 719.475, 90.125, 723.556);
			ctx.closePath();

			ctx.moveTo(68, 1196.44);
			ctx.bezierCurveTo(68, 1212.77, 81.2076, 1226, 97.5, 1226);
			ctx.lineTo(982.5, 1226);
			ctx.bezierCurveTo(998.792, 1226, 1012, 1212.77, 1012, 1196.44);
			ctx.lineTo(1012, 723.556);
			ctx.bezierCurveTo(1012, 707.233, 998.792, 694, 982.5, 694);
			ctx.lineTo(97.5, 694);
			ctx.bezierCurveTo(81.2076, 694, 68, 707.233, 68, 723.556);
			ctx.lineTo(68, 1196.44);
		}

		ctx.closePath();
		ctx.fill("evenodd");
		ctx.stroke();
		ctx.restore();
		ctx.restore();
	}

	private _drawMask(): void {
		const videoDim = this.camera.dimensions.video;
        const maskResultCanvas = this.maskCanvas.nativeElement;
		const ctx: CanvasRenderingContext2D = maskResultCanvas.getContext("2d", { willReadFrequently: true });

        maskResultCanvas.height = videoDim.height;
		maskResultCanvas.width = videoDim.width;

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

	private _initAppRegistrationData(): void {
		this.appRegistration = this._KYCService.appRegistration;
		this.demoData = this._demoService.getDemoData();
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;
	}

	private _inRange(value: number, min: number, max: number) {
		return value >= min && value <= max;
	}

	private _isCaptureValid(): boolean {
		return this.source === "document"
			? this.documentIsValid && ((this.side === "front" && this.faceIsValid) || this.side === "back")
			: this.faceIsValid;
	}

	private _isFaceCentered(nose): void {
		const faceCenterX = nose.x;
		const faceCenterY = nose.y;

		const { center, margin } = this.face.real;

		const inRangeX = this._inRange(faceCenterX, center.x - margin.x, center.x + margin.x);
		const inRangeY = this._inRange(faceCenterY, center.y, center.y + margin.y * 2.5);

		const isFaceCentered = inRangeX && inRangeY;

		if (!isFaceCentered) {
			let direction = "";

			if (!inRangeX) direction += `${faceCenterX < center.x - margin.x ? "→" : "←"}`;

			if (!inRangeY) direction += `${faceCenterY < center.y ? "↓" : "↑"}`;

			this.errorFace = {
				title: this._translocoService.translate("liveness.center_yor_face"),
				subtitle: this._translocoService.translate("liveness.center_your_face_subtitle"),
				canvas: direction,
			};
		}
	}

	private _isFaceClose(landmarks: faceapi.FaceLandmarks68): void {
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

	private _loading = ({ isLoading = true, start = undefined, result = undefined }) => {
		const key = (start && "camera") || (result && "response");

		if (key) this[key].isLoading = isLoading;

		const functionName = isLoading ? "show" : "hide";
		this._splashScreenService[functionName]();
	}

	private _resetVariables() {
		clearInterval(this._detectionInterval);
		clearInterval(this._ngxVideoInterval);

		this._detectionInterval = null;
		this._ngxVideoInterval = null;

		this._initAppRegistrationData();
		this._scanner = JSScanify;

		this.demoData = this._demoService.getDemoData();
		this.errorContent = { message: "" };
		this.showError = false;
		this.isLandscape = window.matchMedia("(orientation: landscape)").matches || window.innerHeight < window.innerWidth;

		this._startDefaultValues();
		this._changeDetectorRef.markForCheck();
	}

	private _setBounds() {
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
		const DOCUMENT_H_ANGLE_LIMIT = {
			PITCH_HIGH: 15,
			PITCH_LOW: -15,
			ROLL_HIGH: 15,
			ROLL_LOW: -15,
		};
		const DOCUMENT_V_ANGLE_LIMIT = {
			PITCH_HIGH: 15,
			PITCH_LOW: -15,
			ROLL_HIGH: 15,
			ROLL_LOW: -15,
		};

		const FACE_H_RESOLUTION_LIMIT = {
			WIDTH_HIGH: 750,
			WIDTH_LOW: 500,
			HEIGHT_HIGH: 750,
			HEIGHT_LOW: 500,
		};
		const FACE_V_RESOLUTION_LIMIT = {
			WIDTH_HIGH: 950,
			WIDTH_LOW: 800,
			HEIGHT_HIGH: 1000,
			HEIGHT_LOW: 850,
		};
		const DOCUMENT_H_RESOLUTION_LIMIT = {
			WIDTH_HIGH: 1500,
			WIDTH_LOW: 1000,
			HEIGHT_HIGH: 825,
			HEIGHT_LOW: 600,
		};
		const DOCUMENT_FACE_H_RESOLUTION_LIMIT = {
			WIDTH_HIGH: 500,
			WIDTH_LOW: 150,
			HEIGHT_HIGH: 500,
			HEIGHT_LOW: 150,
		};
		const DOCUMENT_V_RESOLUTION_LIMIT = {
			WIDTH_HIGH: 900,
			WIDTH_LOW: 700,
			HEIGHT_HIGH: 600,
			HEIGHT_LOW: 200,
		};
		const DOCUMENT_FACE_V_RESOLUTION_LIMIT = {
			WIDTH_HIGH: 350,
			WIDTH_LOW: 100,
			HEIGHT_HIGH: 325,
			HEIGHT_LOW: 100,
		};

		const FACE_H_BOUNDS_LIMIT = {
			X_HIGH: 900,
			X_LOW: 500,
			Y_HIGH: 400,
			Y_LOW: 225,
		};
		const FACE_V_BOUNDS_LIMIT = {
			X_HIGH: 170,
			X_LOW: 0,
			Y_HIGH: 620,
			Y_LOW: 430,
		};
		const DOCUMENT_H_BOUNDS_LIMIT = {
			X_HIGH: 1200,
			X_LOW: 450,
			Y_HIGH: 700,
			Y_LOW: 400,
		};
		const DOCUMENT_FACE_H_BOUNDS_LIMIT = {
			X_HIGH: 1500,
			X_LOW: 200,
			Y_HIGH: 600,
			Y_LOW: 200,
		};
		const DOCUMENT_V_BOUNDS_LIMIT = {
			X_HIGH: 700,
			X_LOW: 400,
			Y_HIGH: 1000,
			Y_LOW: 600,
		};
		const DOCUMENT_FACE_V_BOUNDS_LIMIT = {
			X_HIGH: 800,
			X_LOW: 75,
			Y_HIGH: 1200,
			Y_LOW: 700,
		};

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
			
			this.BOUNDS.document = this.isLandscape
				? {
						angle: { ...DOCUMENT_H_ANGLE_LIMIT },
						bounds: { ...DOCUMENT_H_BOUNDS_LIMIT },
						res: { ...DOCUMENT_H_RESOLUTION_LIMIT },
				}
				: {
						angle: { ...DOCUMENT_V_ANGLE_LIMIT },
						bounds: { ...DOCUMENT_V_BOUNDS_LIMIT },
						res: { ...DOCUMENT_V_RESOLUTION_LIMIT },
				}
		}
	}

	private _setDefaultFace = () => {
		this.face = {
			successPosition: 0,
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
				frameRate: { min: 15, ideal: 30, max: 30 },
			}
		) as MediaTrackConstraintSetExtended;

		const { facingMode, zoom } = navigator.mediaDevices.getSupportedConstraints() as MediaTrackSupportedConstraintsExtended;

		// can be 'user' || 'environment' https://w3c.github.io/mediacapture-main/#dom-videofacingmodeenum
		if (facingMode) {
			if (this.source === 'document') settings.facingMode = "environment";
			if (this.source === 'face') settings.facingMode = "user";
		}

		if (zoom) settings.zoom = { ideal: 0 };

		this.videoOptions = settings;
		console.log("🚀 ~ SmartScannerIosComponent ~ _setVideoOptionConfigs ~ this.videoOptions:", this.videoOptions)
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
				this.camera.dimensions[key].height = height * 0.6;
				this.camera.dimensions[key].offsetY = height * 0.18;
		
				this.camera.dimensions[key].width = Math.min(2 * radius.x, width);
				this.camera.dimensions[key].offsetX = center.x - this.camera.dimensions[key].width / 2;
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

        this.HEIGHT = videoNgx.clientHeight;
        this.WIDTH = videoNgx.clientWidth;

		this._setBounds();

		const maskResultCanvas = this.maskCanvas.nativeElement;

		maskResultCanvas.style.marginLeft = `0px`;
		maskResultCanvas.style.marginTop = `0px`;
	}

	private _setVideoNgxCameraData = () => {
		const videoNgx = this._dom.nativeElement.querySelector("video");

		if (!videoNgx) return;

		this._setVideoDimensions(videoNgx);
        this._drawMask();
		this._loading({ isLoading: false, start: true });

		if (!this._detectionInterval) {
			this._detectionInterval = setInterval(() => {
				this.takePicture.next();
			}, 300);
		}
	}

	private _startDefaultValues() {
		this._setDefaultResponse();
		this._setDefaultCamera();
		this._setDefaultFace();
		this._setMaxVideoDimensions();
	}

    private _startRecording(): void {
        this._setMaxVideoDimensions();

		if (!this._ngxVideoInterval) {
			this._ngxVideoInterval = setInterval(() => {
				this._setVideoNgxCameraData();
			}, 100);
		}
    }

	private _stopRecording(): void {
		this.faceIsValid = false;
		this.documentIsValid = false;

		clearInterval(this._ngxVideoInterval);
		clearInterval(this._detectionInterval);

		this._ngxVideoInterval = null;
		this._detectionInterval = null;
	}

	private _takePicture(img: HTMLImageElement) {
		const canvasResult = this.maskCanvas.nativeElement;
		const canvasToSend = this.toSendCanvas.nativeElement;

        this._setImageOnCanvas(canvasResult, img, this.camera.dimensions.real, this.camera.dimensions.result);
		this._setImageOnCanvas(canvasToSend, img, this.camera.dimensions.real, this.camera.dimensions.real);

		let faceToUpload: string;
		const base64Image = canvasToSend.toDataURL("image/jpeg");

		const isFront = this.side === "front";

		if (isFront && this.source === 'document') {
			const img = new Image();
			img.src = base64Image;

			const promise = faceapi
				.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
				.withFaceLandmarks();

			promise.then((detections) => {
				const face = this._demoService.findBiggestFace(detections);

				if (face) {
					this.errorContent = null;
					this.errorFace = null;
					this.showError = false;

					faceToUpload = this._demoService.cutFaceIdCard(img, face.alignedRect.box, this.faceCardCanvas.nativeElement);

					this.toSave = {
						base64Image,
						face: faceToUpload,
						force: !isFront || !!this.appRegistration.documentValidation,
						front: isFront,
						inputMethod: 'CAMERA',
						source: this.source,
					};
			
					this._stopRecording();
				} else throw Error('face_not_found');

				return detections;
			}).catch((error) => {
				console.error(error);
				this._faceNotFoundError();
			});

			return;
		}

		this.toSave = {
			base64Image,
			face: faceToUpload,
			force: !isFront || !!this.appRegistration.documentValidation,
			front: isFront,
			inputMethod: 'CAMERA',
			source: this.source,
		};

		this._stopRecording();
	}

	public get takePicture$(): Observable<void> {
		return this.takePicture.asObservable();
	}

	cameraError(error: WebcamInitError): void {
		if (!error.mediaStreamError || error.mediaStreamError.name !== "NotAllowedError") return;

		this._loading({ isLoading: false, start: true });
		this.camera.hasPermissions = false;
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
		console.log("🚀 ~ SmartScannerIosComponent ~ handleResolutionDetection ~ resolution:", resolution)
		this.videoOptions.aspectRatio = { exact: resolution.aspectRatio };
		this.videoOptions.height = { exact: resolution.height };
		this.videoOptions.width = { exact: resolution.width };

		this.restartCamera();
	}

	handleResolutionDetectionFail() {
		this.showError = true;
	}

	processImage(webcamImage: WebcamImage): void {
		if (this.response.base64Image) return;

		const img = new Image();
		img.src = webcamImage.imageAsDataUrl;

		img.onload = async () => {
			if (img.height < this.face.minHeight) {
				this.camera.isLowQuality = true;
				return;
			}

			try {
				const scanFace = (this.source === 'document' && this.side === 'front') || this.source === 'face';
				const scanDocument = this.source === 'document';

				if (scanDocument) {
					this._detectDocument(img);
				}

				if (scanFace) {
					await this._detectFace(img);
				}

				this._drawMask();

				const documentFrontIsValid = this.source === 'document' && this.side === 'front' && this.faceIsValid && this.documentIsValid;
				const documentBackIsValid = this.source === 'document' && this.side !== 'front' && this.documentIsValid;
				const livenessIsValid = this.source === 'face' && this.faceIsValid;

				if (documentFrontIsValid || documentBackIsValid || livenessIsValid) {
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

		this.showError = false;
		this.errorContent = null;
		this.killCamera = true;

		setTimeout(() => {
			this.killCamera = false;
			this._startRecording();
		}, 300);
	}

	retake(): void {
		this.toSave = null;
		this._startRecording();
	}

	upload(): void {
		let face = (this.source === 'face' ? this.toSave.base64Image : this.toSave.face).replace(/^data:.*;base64,/, "");
		let base64Image = this.toSave.base64Image.replace(/^data:.*;base64,/, "");

		this.onImageScan.next({
			...this.toSave,
			base64Image,
			face,
		});

		this.response.base64Image = this.source === 'face' ? face : base64Image;
		this.uploading = true;
	}
}
