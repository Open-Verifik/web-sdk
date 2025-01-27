import QRCode from "qrcode";
import { Observable, Subject, takeUntil } from "rxjs";

import * as faceapi from "@vladmandic/face-api";

// import jscanify from "libs/jscanify";
import { Contour } from "libs/jscanify";

import { ErrorFace, IdCard, ResponseData } from "app/modules/demo/models/sdk.models";

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
import { SmartScannerCorrectionsComponent } from "./smart-scanner-corrections/smart-scanner-corrections.component";
import { MediaStreamService } from "app/media-stream.service";

// const JSScanify = new jscanify();

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
    ],
})
export class SmartScannerIosComponent implements OnInit, OnDestroy {
    @ViewChild("faceCardCanvas", { static: true })
    faceCardCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("resultCanvas", { static: true })
    public resultCanvas: ElementRef<HTMLCanvasElement>;

    @ViewChild("videoElement")
    public videoElement: ElementRef<HTMLVideoElement>;
    @ViewChild("videoCanvas") public videoCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("qrCodeCanvas")
    public qrCodeCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("maskCanvas") public maskCanvas: ElementRef;

    @Input("source") source: "document" | "face";
    @Input() successfulUpload: Observable<void>;

    @Output("onImageScan") onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();

    private unsubscriber$: Subject<void> = new Subject<void>();
    private _detectionInterval: ReturnType<typeof setInterval>;
    // private _scanner: jscanify;

    DEBUG_MODE: boolean = !environment.production && false;
    BOUNDS: { face: any; document: any } = { face: {}, document: {} };

    appRegistration: any;
    aspectRatio: number = 0.75;
    calculating: boolean = false;
    camera: IOSCameraData;
    demoData: any;
    documentIsValid: boolean;
    errorContent: any;
    errorFace: ErrorFace | null;
    faceIsValid: boolean;
    hideTip: boolean = false;
    idCard: IdCard;
    isLandscape: boolean = false;
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
    stream: MediaStream;
    successPosition: number = 0;
    uploading: boolean = false;
    videoOptions: any;

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
        private _KYCService: KYCService,
        private _smartEnrollService: SmartEnrollService,
        private _translocoService: TranslocoService,
        private _mediaStreamService: MediaStreamService
    ) {
        this._resetVariables();
        // call the stopAllStreams from mediaStream
    }

    async ngOnInit(): Promise<any> {
        this._mediaStreamService.stopAllStreams();

        this.camera.hasPermissions = true;

        this._loading({ isLoading: true, start: true });
        this._setVideoOptionConfigs();

        this.successfulUpload.pipe(takeUntil(this.unsubscriber$)).subscribe(() => {
            this.uploading = false;
            this.requiresBack = this.appRegistration.documentValidation?.requiresBackSide || !!this.appRegistration.documentValidation?.backUrl;
        });

        this._demoService.faceapi$.pipe(takeUntil(this.unsubscriber$)).subscribe(async (isLoaded) => {
            this.camera.isLoading = !isLoaded;
        });
    }

    ngOnDestroy(): void {
        this._stopRecording();

        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }

    private _calculateMaxDimensions(container: { height: number; width: number }, innerContainerToResize: { height: number; width: number }) {
        const scaleFactorWidth = innerContainerToResize.width / container.width;
        const scaleFactorHeight = innerContainerToResize.height / container.height;

        const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

        const scaledWidth = Math.floor(container.width * scaleFactor);
        const scaledHeight = Math.floor(container.height * scaleFactor);

        return { width: scaledWidth, height: scaledHeight };
    }

    private _cropImage = (resultCanvas: HTMLCanvasElement, inputImg: HTMLImageElement, resizeDimensions: any) => {
        resultCanvas.width = resizeDimensions.width;
        resultCanvas.height = resizeDimensions.height;

        const ctx = resultCanvas.getContext("2d");

        ctx.drawImage(
            inputImg,
            resizeDimensions.offsetX,
            resizeDimensions.offsetY,
            resizeDimensions.width,
            resizeDimensions.height,
            0,
            0,
            resizeDimensions.width,
            resizeDimensions.height
        );

        ctx.save();
    };

    // private _detectDocument(videoCanvas: HTMLCanvasElement) {
    // 	try {
    // 		const img = cv.imread(videoCanvas);
    // 		const maxContour = this._scanner.findPaperContour(img);

    // 		if (maxContour) {
    // 			const contours = this._scanner.getCornerPoints(maxContour);

    // 			const {
    // 				bounds,
    // 				detection,
    // 				isValid,
    // 				resolution,
    // 			} = this._smartEnrollService.evaluateDocumentContours(this.BOUNDS, contours);

    // 			this.corrections.document = bounds;
    // 			this.corrections.documentResolution = resolution;

    // 			this.documentDetection = detection;
    // 			this.documentIsValid = isValid;
    // 		}

    // 		img.delete();
    // 	} catch (e) {}
    // }

    private async _detectFace(image: HTMLImageElement) {
        try {
            const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

            if (!detections.length) throw Error("no_face");
            else {
                const faceDetection = this._demoService.findBiggestFace(detections);

                const { angle, bounds, resolution, isValid } = this._smartEnrollService.evaluateFaceDetection(
                    this.BOUNDS,
                    faceDetection,
                    this.source
                );

                this.corrections.angle = angle;
                this.corrections.bounds = bounds;
                this.corrections.resolution = resolution;

                this.faceIsValid = isValid;
                this.errorFace = isValid ? null : this.errorFace;
            }
        } catch (e) {
            this._faceNotFoundError();
        }
    }

    private _drawFaceMask(ctx: CanvasRenderingContext2D, viewportDimensions: { height: number; width: number }): void {
        const { height, width } = viewportDimensions;

        const originalDrawingSize = this.isLandscape ? 180 : 150;
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
        ctx.globalCompositeOperation = "destination-atop";

        const adjustX = this.isLandscape ? 0 : 15;
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
        ctx.globalCompositeOperation = "source-over";

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

    private _drawIdMask(ctx: CanvasRenderingContext2D, viewportDimensions: { height: number; width: number }): void {
        const { height, width } = viewportDimensions;

        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(0, 0, width, height);
        ctx.closePath();

        const hitboxDimensions = this._getDetectionRectangleDimensions(width, height);

        const center = {
            x: width / 2 - hitboxDimensions.width / 2,
            y: height / 2 - hitboxDimensions.height / 2,
        };

        ctx.beginPath();
        ctx.clearRect(center.x, center.y, hitboxDimensions.width, hitboxDimensions.height);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.roundRect(center.x, center.y, hitboxDimensions.width, hitboxDimensions.height, 8);
        ctx.strokeStyle = this._isCaptureValid() ? "#3bf65f" : "#FF5638";
        ctx.lineWidth = Math.max(Math.floor(Math.max(width, height) / 100), 4);
        ctx.stroke();
        ctx.closePath();
    }

    private _drawMask(): void {
        const maskResultCanvas = this.maskCanvas?.nativeElement;

        if (!maskResultCanvas) return;

        const viewportDimensions = {
            height: window.innerHeight,
            width: window.innerWidth,
        };
        const ctx: CanvasRenderingContext2D = maskResultCanvas.getContext("2d", { willReadFrequently: true });

        maskResultCanvas.height = viewportDimensions.height;
        maskResultCanvas.width = viewportDimensions.width;

        if (this.source === "face") {
            this._drawFaceMask(ctx, viewportDimensions);
        } else {
            this._drawIdMask(ctx, viewportDimensions);
        }
    }

    private _faceNotFoundError(): void {
        this.faceIsValid = false;

        if (this.source === "document") {
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

    private _fitBoxCover(container: { height: number; width: number }, containerToFit: { height: number; width: number }) {
        const { width: width1, height: height1 } = container;
        const { width: width2, height: height2 } = containerToFit;

        const scale = {
            x: width2 / width1,
            y: height2 / height1,
        };

        const inverseScale = {
            x: width1 / width2,
            y: height1 / height2,
        };

        const scaleFactor = Math.max(scale.x, scale.y);

        const newWidth = width1 * scaleFactor;
        const newHeight = height1 * scaleFactor;

        const offsetX = (width2 - newWidth) / 2;
        const offsetY = (height2 - newHeight) / 2;

        const prescaleOffsetX = inverseScale.x * offsetX;
        const prescaleOffsetY = inverseScale.y * offsetY;

        return {
            offsetX,
            offsetY,
            prescaleOffsetX,
            prescaleOffsetY,
            height: newHeight,
            width: newWidth,
        };
    }

    private _getDetectionRectangleDimensions(intialWidth: number, intialHeight: number) {
        const container = { width: 16, height: 9 };
        const innerContainerToResize = {
            width: intialWidth,
            height: intialHeight,
        };

        const rectDimensions = this._calculateMaxDimensions(container, innerContainerToResize);

        rectDimensions.height = Math.floor(rectDimensions.height * (this.isLandscape ? 0.5 : 0.9));
        rectDimensions.width = Math.floor(rectDimensions.width * (this.isLandscape ? 0.5 : 0.9));

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
    };

    private _onIntervalDetect = (videoCanvas: HTMLCanvasElement): Promise<void> => {
        if (this.calculating) return Promise.resolve();

        // To limit processing multiple calculations at once (for devices that run a little slower)
        this.calculating = true;

        const promise = new Promise<void>((resolve, reject) => {
            const base64Image = videoCanvas.toDataURL("image/jpeg");

            const img = new Image();
            img.src = base64Image;

            img.onload = () => {
                let faceDetectPromise: Promise<void>;

                try {
                    // Removing document scanner for the time being - Causes stutter/lag for mobile devices
                    // if (this.source === 'document') {
                    // 	this._detectDocument(videoCanvas);
                    // }
                    this.documentIsValid = true;

                    if (this.side === "front" || this.source === "face") {
                        faceDetectPromise = this._detectFace(img);
                    } else {
                        faceDetectPromise = Promise.resolve();
                    }

                    faceDetectPromise.then(() => {
                        const documentFrontIsValid = this.source === "document" && this.side === "front" && this.faceIsValid && this.documentIsValid;
                        const documentBackIsValid = this.source === "document" && this.side !== "front" && this.documentIsValid;
                        const livenessIsValid = this.source === "face" && this.faceIsValid;

                        this._drawMask();
                        this.successPosition = documentFrontIsValid || documentBackIsValid || livenessIsValid ? ++this.successPosition : 0;

                        if (this.successPosition > 1) {
                            this.successPosition = 0;
                            this.errorContent = null;

                            this._changeDetectorRef.markForCheck();

                            if (this.source === "face") {
                                this._takePicture(img, base64Image);
                            }
                        } else {
                            this._changeDetectorRef.markForCheck();
                        }

                        resolve();
                    });
                } catch (e) {
                    return reject(e);
                }
            };
        });

        return promise;
    };

    private _onLoadedMetadata = () => {
        const videoElement: HTMLVideoElement = this.videoElement.nativeElement;
        const videoCanvas: HTMLCanvasElement = this.videoCanvas.nativeElement;

        const ctx = videoCanvas.getContext("2d", { willReadFrequently: true });

        this._onVideoLoaded(videoElement, videoCanvas);
        this._loading({ isLoading: false, start: true });

        // Delay detection calculations by a number of frames for performance.
        const detectionDelay = 30;

        let frameCount = 0;

        this._detectionInterval = setInterval(() => {
            ++frameCount;

            ctx.drawImage(videoElement, 0, 0, this.camera.dimensions.real.width, this.camera.dimensions.real.height);
            ctx.save();

            if (frameCount < detectionDelay) return;

            this._onIntervalDetect(videoCanvas)
                .catch((error) => {
                    console.error(
                        `file: smart-scanner-ios.component.ts:596 ~ SmartScannerIosComponent ~ this._detectionInterval=setInterval ~ error:`,
                        error
                    );
                })
                .finally(() => {
                    this.calculating = false;

                    frameCount = 0;
                });
        }, Math.floor(1000 / 30));
    };

    private _onVideoLoaded(videoElement: HTMLVideoElement, videoCanvas: HTMLCanvasElement) {
        const maskCanvas = this.maskCanvas.nativeElement;

        const { videoHeight, videoWidth } = videoElement;

        const videoStreamDimensions = {
            height: videoHeight,
            width: videoWidth,
        };
        const maxViewportDimesions = {
            height: Math.min(window.innerHeight, videoHeight),
            width: Math.min(window.innerWidth, videoWidth),
        };

        const coverViewport = this._fitBoxCover(videoStreamDimensions, maxViewportDimesions);

        videoCanvas.height = videoHeight;
        videoCanvas.width = videoWidth;
        maskCanvas.height = videoHeight;
        maskCanvas.width = videoWidth;

        videoCanvas.style.height = `${coverViewport.height}px`;
        videoCanvas.style.width = `${coverViewport.width}px`;

        maskCanvas.style.height = `${maxViewportDimesions.height}px`;
        maskCanvas.style.width = `${maxViewportDimesions.width}px`;

        // user viewport dimensions
        this.camera.dimensions.viewport.height = maxViewportDimesions.height;
        this.camera.dimensions.viewport.width = maxViewportDimesions.width;

        // scaled video dimensions
        this.camera.dimensions.video.height = coverViewport.height;
        this.camera.dimensions.video.width = coverViewport.width;

        // video stream dimensions
        this.camera.dimensions.real = {
            height: videoHeight,
            width: videoWidth,
            offsetX: 0,
            offsetY: 0,
        };

        // visible video pixel dimensions
        this.camera.dimensions.visible = {
            width: videoWidth - coverViewport.prescaleOffsetX,
            height: videoHeight - coverViewport.prescaleOffsetY,
            offsetX: coverViewport.prescaleOffsetX ? coverViewport.prescaleOffsetX * -1 : 0,
            offsetY: coverViewport.prescaleOffsetY ? coverViewport.prescaleOffsetY * -1 : 0,
        };

        if (this.source === "face") {
            videoCanvas.style.transform = `translate(${coverViewport.offsetX}px, ${coverViewport.offsetY * 2}px) scaleX(-1)`;
        } else {
            videoCanvas.style.transform = `translate(${coverViewport.offsetX}px, ${coverViewport.offsetY * 2}px)`;
        }

        videoElement.play();

        this._setBounds();
        this._drawMask();
    }

    private _resetVariables() {
        clearInterval(this._detectionInterval);

        this._detectionInterval = null;

        this._initAppRegistrationData();
        // this._scanner = JSScanify;
        this.successPosition = 0;

        this.demoData = this._demoService.getDemoData();
        this.errorContent = { message: "" };
        this.showError = false;
        this.isLandscape = window.matchMedia("(orientation: landscape)").matches || window.innerHeight < window.innerWidth;

        this._startDefaultValues();
        this._changeDetectorRef.markForCheck();
    }

    private _setBounds() {
        let document = {};
        let face = {};

        const { height, width } = this.camera.dimensions.real;

        const center = {
            x: width / 2,
            y: height / 2,
        };

        if (this.source === "document") {
            const hitboxDimensions = this._getDetectionRectangleDimensions(width, height);

            const angle = {
                PITCH_HIGH: 15,
                PITCH_LOW: -15,
                ROLL_HIGH: 15,
                ROLL_LOW: -15,
            };

            const rectangleHalfWidth = hitboxDimensions.width / 2;
            const rectangleHalfHeight = hitboxDimensions.height / 2;

            const topLeft = {
                x: center.x - rectangleHalfWidth,
                y: center.y - rectangleHalfHeight,
            };

            const bottomRight = {
                x: center.x + rectangleHalfWidth,
                y: center.y + rectangleHalfHeight,
            };

            const bounds = {
                X_HIGH: Math.floor(bottomRight.x * 0.9),
                X_LOW: Math.floor(topLeft.x * 1.1),
                Y_HIGH: Math.floor(bottomRight.y * 0.9),
                Y_LOW: Math.floor(topLeft.y * 1.1),
            };

            // use the full video size for height/width
            const faceResolution = {
                HEIGHT_HIGH: Math.floor(hitboxDimensions.height * 0.7),
                HEIGHT_LOW: Math.floor(hitboxDimensions.height * 0.1),
                WIDTH_HIGH: Math.floor(hitboxDimensions.width * 0.7),
                WIDTH_LOW: Math.floor(hitboxDimensions.width * 0.1),
            };

            const documentResolution = {
                HEIGHT_HIGH: Math.floor(this.isLandscape ? hitboxDimensions.height : hitboxDimensions.height * 1.4),
                HEIGHT_LOW: Math.floor(hitboxDimensions.height * 0.2),
                WIDTH_HIGH: Math.floor(this.isLandscape ? hitboxDimensions.width * 1.2 : hitboxDimensions.width),
                WIDTH_LOW: Math.floor(hitboxDimensions.width * 0.2),
            };

            face = {
                bounds: { ...bounds },
                res: { ...faceResolution },
            };

            // document = {
            // 	angle: { ...angle },
            // 	bounds: { ...bounds },
            // 	res: { ...documentResolution },
            // };

            this.BOUNDS = { document, face };

            // Image crop dimensions
            this.camera.dimensions.result = {
                height: documentResolution.HEIGHT_HIGH,
                width: documentResolution.WIDTH_HIGH,
                offsetX: Math.floor(bounds.X_LOW * 0.8),
                offsetY: Math.floor(bounds.Y_LOW * 0.8),
            };
        } else {
            const angle = {
                PITCH_HIGH: 15,
                PITCH_LOW: -15,
                ROLL_HIGH: 15,
                ROLL_LOW: -15,
                YAW_HIGH: 30,
                YAW_LOW: -30,
            };

            const square = Math.min(height, width);
            const halfSquare = Math.floor(square / 2);

            const isHorizontal = width > height;

            const lowY = Math.floor(center.y - halfSquare);
            const lowX = Math.floor(center.x - halfSquare);

            const highY = Math.floor(center.y + halfSquare);
            const highX = Math.floor(center.x + halfSquare);

            const adjustDown = 0.6;
            const adjustUp = 1.3;

            const bounds = {
                Y_HIGH: highY * adjustDown,
                Y_LOW: lowY * adjustUp,
                X_HIGH: highX * adjustDown,
                X_LOW: lowX * adjustUp,
            };

            const resolution = {
                HEIGHT_HIGH: Math.max(isHorizontal ? square : Math.floor(square * 0.8), 240),
                HEIGHT_LOW: Math.max(Math.floor(square * 0.4), 240),
                WIDTH_HIGH: Math.max(isHorizontal ? Math.floor(square * 0.8) : square, 240),
                WIDTH_LOW: Math.max(Math.floor(square * 0.4), 240),
            };

            face = {
                angle: { ...angle },
                bounds: { ...bounds },
                res: { ...resolution },
            };

            this.BOUNDS = { document, face };

            // Image crop dimensions
            this.camera.dimensions.result = {
                height: square,
                width: square,
                offsetX: lowX,
                offsetY: lowY,
            };
        }
    }

    private _setVideoOptionConfigs(): void {
        this.isLandscape = window.matchMedia("(orientation: landscape)").matches || window.innerHeight < window.innerWidth;

        const settings = {
            ...this.videoOptions,
            facingMode: {
                exact: this.source === "face" ? "user" : "environment",
            },
            focusMode: "continuous",
            frameRate: { ideal: 60 },
            noiseSuppression: true,
            zoom: { ideal: 0 },
        } as MediaTrackConstraintSetExtended;

        this.videoOptions = settings;
    }

    private _setDefaultCamera = () => {
        this.camera = {
            hasPermissions: false,
            isLoading: false,
            isLowQuality: false,
            dimensions: {
                real: {
                    height: 0,
                    width: 0,
                    offsetX: 0,
                    offsetY: 0,
                },
                result: {
                    height: 0,
                    width: 0,
                    offsetX: 0,
                    offsetY: 0,
                },
                video: {
                    max: {
                        height: window.innerHeight,
                        width: window.innerWidth,
                    },
                },
                viewport: {
                    height: 0,
                    width: 0,
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

    private _startDefaultValues() {
        this._setDefaultResponse();
        this._setDefaultCamera();
        this._setMaxVideoDimensions();
    }

    private _startRecording(): void {
        if (this.uploading) return;

        this._setMaxVideoDimensions();

        navigator.mediaDevices
            .getUserMedia({
                audio: false,
                video: this.videoOptions,
            })
            .then((stream) => {
                this.stream = stream;

                this._mediaStreamService.addStream(stream);

                setTimeout(() => {
                    const videoElement: HTMLVideoElement = this.videoElement.nativeElement;

                    videoElement.srcObject = stream;

                    videoElement.removeEventListener("loadedmetadata", this._onLoadedMetadata, true);
                    videoElement.addEventListener("loadedmetadata", this._onLoadedMetadata, true);
                });
            })
            .catch();
    }

    private _stopRecording(): void {
        this.faceIsValid = false;
        this.documentIsValid = false;

        clearInterval(this._detectionInterval);

        this._detectionInterval = null;

        this._mediaStreamService.stopAllStreams();
    }

    private _takePicture(img: HTMLImageElement, rawBase64Image: string) {
        const canvasResult = this.resultCanvas.nativeElement;

        this._cropImage(canvasResult, img, this.camera.dimensions.result);

        let face: string;
        let faceToUpload: string;
        let base64Image = canvasResult.toDataURL("image/jpeg");

        const isFront = this.side === "front";

        if (isFront && this.source === "document") {
            const croppedImage = new Image();
            croppedImage.src = base64Image;

            croppedImage.onload = () => {
                const promise = faceapi
                    .detectAllFaces(
                        croppedImage,
                        new faceapi.SsdMobilenetv1Options({
                            minConfidence: 0.2,
                        })
                    )
                    .withFaceLandmarks();

                promise
                    .then((detections) => {
                        const detection = this._demoService.findBiggestFace(detections);

                        if (detection) {
                            if (detection.detection.score < this.projectFlow.onboardingSettings.liveness.livenessMinScore) {
                                throw new Error("face_not_found");
                            }

                            this.errorContent = null;
                            this.errorFace = null;
                            this.showError = false;

                            faceToUpload = this._demoService.cutFaceIdCard(
                                croppedImage,
                                detection.alignedRect.box,
                                this.faceCardCanvas.nativeElement
                            );

                            base64Image = base64Image.replace(/^data:.*;base64,/, "");
                            face = faceToUpload?.replace(/^data:.*;base64,/, "");

                            this.onImageScan.next({
                                base64Image,
                                face,
                                force: !isFront || !!this.appRegistration.documentValidation,
                                front: isFront,
                                inputMethod: "CAMERA",
                                rawImage: rawBase64Image,
                                source: this.source,
                            });

                            this.response.base64Image = base64Image;
                            this.uploading = true;

                            this._stopRecording();
                        } else throw Error("face_not_found");

                        return detections;
                    })
                    .catch((error) => {
                        console.error(error);
                        this._faceNotFoundError();
                    });

                return;
            };
        } else {
            if (this.source === "face") {
                face = base64Image.replace(/^data:.*;base64,/, "");
            } else {
                base64Image = base64Image.replace(/^data:.*;base64,/, "");
            }

            this.onImageScan.next({
                base64Image,
                face,
                force: !isFront || !!this.appRegistration.documentValidation,
                front: isFront,
                inputMethod: "CAMERA",
                rawImage: rawBase64Image,
                source: this.source,
            });

            this.response.base64Image = this.source === "face" ? face : base64Image;
            this.uploading = true;

            this._stopRecording();
        }
    }

    cameraError(): void {
        this._loading({ isLoading: false, start: true });
        this.camera.hasPermissions = false;
        this.camera.isLowQuality = true;
    }

    canGoPrevious(): boolean {
        const canGoBackToDocument =
            !!this.appRegistration.documentValidation ||
            this.projectFlow.onboardingSettings.steps.document !== "skip" ||
            !this._smartEnrollService.wasSkippedDocument();

        return !this.uploading && (this.source === "document" || (this.source === "face" && canGoBackToDocument));
    }

    canSkip(): boolean {
        if (this.uploading) return false;

        const canSkipBiometric =
            this.source === "face" &&
            (this.projectFlow.onboardingSettings.steps.liveness !== "mandatory" || !this.appRegistration.biometricValidation);
        const canSkipDocument =
            this.source === "document" &&
            this.projectFlow.onboardingSettings.steps.document !== "mandatory" &&
            !this.appRegistration.documentValidation;

        return canSkipDocument || canSkipBiometric;
    }

    captureManually(): void {
        const videoCanvas: HTMLCanvasElement = this.videoCanvas.nativeElement;
        const base64Image = videoCanvas.toDataURL("image/jpeg");

        let img = new Image();

        img.src = base64Image;
        img.title = "manualCapture";

        img.onload = () => {
            this._takePicture(img, base64Image);
        };
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
            this.response.base64Image = "";
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
                this.response.base64Image = "";
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

    skipStep(): void {
        if (this.projectFlow.onboardingSettings.steps.liveness !== "skip" && !this._smartEnrollService.wasSkippedBiometric()) {
            this._smartEnrollService.setSkippedDocument(!this.appRegistration.documentValidation);
            this._smartEnrollService.skipToStep("biometric");
        } else {
            this._smartEnrollService.setSkippedBiometric(!this.appRegistration.biometricValidation);
            this._smartEnrollService.skipToStep("result");
        }
    }

    restartCamera(): void {
        if (this.uploading) return;

        this._stopRecording();

        this._loading({ isLoading: true, start: true });
        this._setVideoOptionConfigs();

        this.showError = false;
        this.errorContent = null;
        this.response.base64Image = undefined;
        this.successPosition = 0;

        this._startRecording();
    }

    showPassportColor(): boolean {
        return (
            !this.appRegistration?.documentValidation ||
            this.side === "front" ||
            this.appRegistration.documentValidation?.documentCategory?.toLowerCase() === "passport"
        );
    }

    showLicenseColor(): boolean {
        return (
            !this.appRegistration?.documentValidation ||
            this.side === "front" ||
            this.appRegistration?.documentValidation?.documentCategory?.toLowerCase() === "driverlicense"
        );
    }

    showGovernmentIDColor(): boolean {
        return (
            !this.appRegistration?.documentValidation ||
            this.side === "front" ||
            ["id", "idv2"].includes(this.appRegistration?.documentValidation?.documentCategory?.toLowerCase())
        );
    }

    loadQRCode(): void {
        this.revealQRCode = true;

        const qrCanvas = this.qrCodeCanvas.nativeElement;
        this._generateQRCode(qrCanvas, window.location.href);
    }
}
