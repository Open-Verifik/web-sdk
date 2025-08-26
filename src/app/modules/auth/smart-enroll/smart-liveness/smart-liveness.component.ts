import * as faceapi from "@vladmandic/face-api";

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    TemplateRef,
    ViewChild,
} from "@angular/core";

import { Observable, Subject, takeUntil } from "rxjs";
import { DemoService } from "app/modules/demo/demo.service";
import { AppRegistration, ImageScan, Project, ProjectFlow } from "../../project";
import {
    Resolution,
    SmartCameraResolutionDetectionComponent,
} from "../smart-scanner/smart-camera-resolution-detection/smart-camera-resolution-detection.component";

import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { KYCService } from "../../kyc.service";
import { fuseAnimations } from "@fuse/animations";
import { FaceDetectionWithLandmarks, SmartEnrollService } from "../smart-enroll.service";
import { MediaStreamService } from "app/media-stream.service";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

type Angle = {
    roll?: number;
    pitch?: number;
    yaw?: number;
};

type AngleThreshold = {
    mid?: Angle;
    min: Angle;
    max: Angle;
    indicatorAdjust: number | undefined;
    instructions?: string;
};

type CameraStatus = {
    permissions?: boolean;
    loading?: boolean;
    quality?: boolean;
};

type DetectionBounds = {
    min?: {
        x: number;
        y: number;
        score: number;
        resolution: number;
    };
    max?: {
        x: number;
        y: number;
        score: number;
        resolution: number;
    };
};

type FaceStatus = {
    detection?: faceapi.FaceDetection;
    angle?: Angle;
    error: boolean;
    success: boolean;
    successPosition?: number;
    message?: string;
};

type FaceCapture = {
    detection: faceapi.FaceDetection;
    angle: Angle;
    base64: string;
};

type ScreenStatus = {
    height?: number;
    width?: number;
    landscape?: boolean;
};

type VideoStatus = {
    center?: {
        x: number;
        y: number;
    };
    height?: number;
    offsetX?: number;
    offsetY?: number;
    width?: number;
};

@Component({
    animations: [fuseAnimations],
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "smart-liveness",
    standalone: true,
    styleUrls: ["./smart-liveness.component.scss"],
    templateUrl: "./smart-liveness.component.html",
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatProgressSpinnerModule,
        SmartCameraResolutionDetectionComponent,
        TranslocoModule,
    ],
})
export class SmartLivenessComponent implements OnInit, OnDestroy {
    @ViewChild("videoElement") public videoElement: ElementRef<HTMLVideoElement>;
    @ViewChild("videoCanvas") public videoCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("viewportContainer") public viewportContainer: ElementRef<HTMLElement>;
    @ViewChild("instructions", { static: true }) instructions: TemplateRef<HTMLElement>;

    @Output("onImageScan") onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();

    @Input() retry: Observable<void>;
    @Input() successfulUpload: Observable<void>;

    private _detectionInterval: ReturnType<typeof setInterval>;
    private _unsubscriber$: Subject<void> = new Subject<void>();

    private DEBUG = false;
    private MINIMUM_DEPTH = 300 * 300;

    angleThreshold: AngleThreshold = { min: {}, max: {}, indicatorAdjust: undefined };
    angleThresholds: Array<AngleThreshold> = [];
    appRegistration: AppRegistration;
    bounds: DetectionBounds = {};
    boundsRelaxed: DetectionBounds = {};
    camera: CameraStatus = { loading: true, permissions: false, quality: false };
    currentLivenessIndex = 0;
    device: "IOS" | "ANDROID" | "DESKTOP";
    devices: MediaDeviceInfo[] = [];
    face: FaceStatus = { error: false, success: false, successPosition: 0, message: "" };
    faceCaptures: Array<FaceCapture> = [];
    faceApiLoaded: boolean = false;
    instructionsClosed: boolean = false;
    indicatorTransform: string = "scale3d(0.8, 0.8, 1)";
    indicatorCutTransform: string = "rotate(-20deg) skewY(-50deg)";
    project: Project;
    projectFlow: ProjectFlow;
    scaledVideo: VideoStatus = { height: 0, width: 0 };
    scaledViewport: VideoStatus = { height: 0, width: 0 };
    screen: ScreenStatus = { landscape: false };
    stream: MediaStream;
    uploading: boolean = false;
    resolution: Resolution = { height: 0, width: 0 };
    video: VideoStatus = { height: 0, width: 0 };
    viewport: VideoStatus = { height: 0, width: 0 };
    videoOptions: any = {};

    constructor(
        private _changeDetectionRef: ChangeDetectorRef,
        private _demoService: DemoService,
        private _dialog: MatDialog,
        private _kycService: KYCService,
        private _mediaStreamService: MediaStreamService,
        private _renderer: Renderer2,
        private _smartEnrollService: SmartEnrollService,
        private translocoService: TranslocoService
    ) {
        this.device = this._demoService.detectOS();
        this.instructionsClosed = this._smartEnrollService.instructionsClosed;

        this._setScreenStatus();

        this._renderer.listen("window", "resize", () => {
            if (this.uploading) return;

            this._restartCamera();
        });
    }

    ngOnInit(): void {
        this._openInstructions();
        this._mediaStreamService.stopAllStreams();

        this.appRegistration = this._kycService.appRegistration;
        this.project = this._kycService.currentProject;
        this.projectFlow = this._kycService.currentProjectFlow;

        this.successfulUpload.pipe(takeUntil(this._unsubscriber$)).subscribe(() => {
            this.uploading = false;
        });

        this.retry.pipe(takeUntil(this._unsubscriber$)).subscribe(() => {
            // Reset all state completely
            this.faceCaptures = [];
            this.currentLivenessIndex = 0;
            this.angleThresholds = [];
            this.angleThreshold = { min: {}, max: {}, indicatorAdjust: undefined };
            this.face.successPosition = 0;
            this.face.success = false;
            this.face.error = false;
            this.face.message = "";

            // Reset indicator transforms
            this.indicatorTransform = "scale3d(0.8, 0.8, 1)";
            this.indicatorCutTransform = "rotate(-20deg) skewY(-50deg)";

            this._restartCamera();
        });

        this._demoService.faceapi$.pipe(takeUntil(this._unsubscriber$)).subscribe((isLoaded) => {
            this.faceApiLoaded = isLoaded;
        });
    }

    ngOnDestroy(): void {
        this._stopCamera();

        this._unsubscriber$.next();
        this._unsubscriber$.complete();
    }

    private _calculateIndicatorScale(angleScore: number) {
        const scale = 0.8 + (angleScore * 2) / 10;

        this.indicatorTransform = `scale3d(${scale}, ${scale}, 1)`;
    }

    private _calculateThresholdScore(angle: Angle) {
        const { min, mid, max } = this.angleThreshold;

        // Weighted scoring - yaw is most important, roll least important
        const weights = { pitch: 0.4, yaw: 0.5, roll: 0.1 };

        // Calculate normalized scores with bounds checking
        const pitchRange = max.pitch - min.pitch;
        const pitchDifference = Math.abs(mid.pitch - angle.pitch);
        const pitchScore = pitchRange > 0 ? Math.max(0, 1 - pitchDifference / pitchRange) : 1;

        const rollRange = max.roll - min.roll;
        const rollDifference = Math.abs(mid.roll - angle.roll);
        const rollScore = rollRange > 0 ? Math.max(0, 1 - rollDifference / rollRange) : 1;

        const yawRange = max.yaw - min.yaw;
        const yawDifference = Math.abs(mid.yaw - angle.yaw);
        const yawScore = yawRange > 0 ? Math.max(0, 1 - yawDifference / yawRange) : 1;

        return pitchScore * weights.pitch + rollScore * weights.roll + yawScore * weights.yaw;
    }

    private _calculateVideoCoverDimensions(video: VideoStatus, container: VideoStatus) {
        const { width: width1, height: height1 } = video;
        const { width: width2, height: height2 } = container;

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

    private _captureAndCropImage(): Promise<string> {
        const faceCapture = this.faceCaptures[0];
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const { width, height, offsetX, offsetY } = this.scaledViewport;

        canvas.width = Math.max(Math.floor(width * 0.5), 240);
        canvas.height = Math.max(Math.floor(height * 0.5), 240);

        let image = new Image();

        image.src = faceCapture.base64;

        return new Promise<string>((resolve) => {
            image.onload = () => {
                ctx.drawImage(image, offsetX, offsetY, width, height, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL());

                image.src = "";
                image.onload = null;
                image = null;
            };
        });
    }

    private _checkQuality(videoHeight: number, videoWidth: number): boolean {
        const minimumResolution = videoHeight >= 240 && videoWidth >= 240;
        const minimumDepth = videoHeight * videoWidth >= this.MINIMUM_DEPTH;

        return minimumResolution && minimumDepth;
    }

    private async _findFace(canvas: HTMLCanvasElement): Promise<FaceDetectionWithLandmarks> {
        let faceEngine: faceapi.TinyFaceDetectorOptions | faceapi.SsdMobilenetv1Options;

        if ((navigator as any)?.deviceMemory === undefined || (navigator as any)?.deviceMemory >= 4) {
            faceEngine = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 });
        } else {
            faceEngine = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 });
        }

        const detections = await faceapi.detectAllFaces(canvas, faceEngine).withFaceLandmarks(true);

        if (!detections.length) throw Error("no_face");

        this.face.error = false;

        if (this.DEBUG) {
            const resizedResults = faceapi.resizeResults(detections, canvas);

            faceapi.draw.drawDetections(canvas, resizedResults);
            faceapi.draw.drawFaceLandmarks(canvas, resizedResults);
        }

        return this._demoService.findBiggestFace(detections);
    }

    private _findNextCamera(): void {
        if (!this.devices.length) return;

        const currentDeviceIndex = this.devices.findIndex((device) => device.deviceId === this.videoOptions.deviceId);

        this.videoOptions.deviceId =
            currentDeviceIndex === -1 ? this.devices[0].deviceId : this.devices[(currentDeviceIndex + 1) % this.devices.length].deviceId;
    }

    private _generateRandomAngleThresholds(): void {
        const randomIndicatorAngles = this._generateRandomIndicatorAngles(10);

        randomIndicatorAngles.forEach((indicatorAngle) => {
            this.angleThresholds.push(indicatorAngle);
        });

        this._changeDetectionRef.detectChanges();
    }

    private _generateRandomIndicatorAngles(count: number): AngleThreshold[] {
        const indicatorAngles: number[] = [];
        const minSeparation = 45; // Reduced to 45° separation to accommodate diagonal directions

        for (let i = 0; i < count; i++) {
            let angle: number;
            let attempts = 0;

            do {
                angle = Math.floor(Math.random() * 360); // 0-359°

                attempts++;
            } while (
                attempts < 100 &&
                indicatorAngles.some((existingAngle) => {
                    const diff = Math.abs(angle - existingAngle);
                    return Math.min(diff, 360 - diff) < minSeparation;
                })
            );

            indicatorAngles.push(angle);
        }

        return indicatorAngles.map((indicatorAngle, index) => {
            const { targetYaw, targetPitch } = this._indicatorAngleToYawPitch(indicatorAngle);

            let instruction = "Look ";

            const pitchAbs = Math.abs(targetPitch);
            const yawAbs = Math.abs(targetYaw);

            if (pitchAbs > yawAbs) {
                instruction += targetPitch > 0 ? "up" : "down";

                if (yawAbs > 15) {
                    instruction += targetYaw > 0 ? " and right" : " and left";
                }
            } else {
                instruction += targetYaw > 0 ? "right" : "left";

                if (pitchAbs > 15) {
                    instruction += targetPitch > 0 ? " and up" : " and down";
                }
            }

            const { minBounds, maxBounds } = this._calculateOvalBounds(indicatorAngle);

            const finalThreshold: AngleThreshold = {
                min: minBounds,
                max: maxBounds,
                mid: {
                    pitch: targetPitch,
                    roll: 0,
                    yaw: targetYaw,
                },
                instructions: instruction,
                indicatorAdjust: indicatorAngle + 20,
            };

            return finalThreshold;
        });
    }

    private _indicatorAngleToYawPitch(indicatorAngle: number): { targetYaw: number; targetPitch: number } {
        let targetYaw: number;
        let targetPitch: number;

        const angle = indicatorAngle + 20; // Adjusted for the indicator skew

        if (angle >= 315 || angle < 45) {
            // North (up) - 315° to 45°
            targetYaw = 0;
            targetPitch = 30;
        } else if (angle >= 45 && angle < 67.5) {
            // Northeast (up-right) - 45° to 67.5°
            targetYaw = 60;
            targetPitch = 20;
        } else if (angle >= 67.5 && angle < 112.5) {
            // East (right) - 67.5° to 112.5°
            targetYaw = 120;
            targetPitch = 0;
        } else if (angle >= 112.5 && angle < 157.5) {
            // Southeast (down-right) - 112.5° to 157.5°
            targetYaw = 60;
            targetPitch = -20;
        } else if (angle >= 157.5 && angle < 202.5) {
            // South (down) - 157.5° to 202.5°
            targetYaw = 0;
            targetPitch = -30;
        } else if (angle >= 202.5 && angle < 247.5) {
            // Southwest (down-left) - 202.5° to 247.5°
            targetYaw = -60;
            targetPitch = -20;
        } else if (angle >= 247.5 && angle < 292.5) {
            // West (left) - 247.5° to 292.5°
            targetYaw = -120;
            targetPitch = 0;
        } else {
            // Northwest (up-left) - 292.5° to 315°
            targetYaw = -60;
            targetPitch = 20;
        }

        return { targetYaw, targetPitch };
    }

    private _calculateOvalBounds(indicatorAngle: number): { minBounds: any; maxBounds: any } {
        const { targetYaw, targetPitch } = this._indicatorAngleToYawPitch(indicatorAngle);

        const minBounds = {
            pitch: targetPitch === 0 ? -15 : targetPitch > 0 ? 2 : -2, // Pitch: ±2° minimum (very forgiving)
            roll: -45, // Roll: standard range
            yaw: targetYaw === 0 ? -110 : targetYaw > 0 ? 40 : -40, // Yaw: ±40° minimum (moderate)
        };

        const maxBounds = {
            pitch: targetPitch === 0 ? 15 : targetPitch > 0 ? 60 : -60, // Pitch: ±40° maximum (generous)
            roll: 45, // Roll: standard range
            yaw: targetYaw === 0 ? 110 : targetYaw > 0 ? 200 : -200, // Yaw: ±180° maximum (very generous)
        };

        return { minBounds, maxBounds };
    }

    private _isInRange(value: number, min: number, max: number): boolean {
        if (min <= max) {
            return value >= min && value <= max;
        } else {
            return value <= min && value >= max;
        }
    }

    private _onIntervalDetect = () => {
        if (!this.faceApiLoaded || this.currentLivenessIndex === this.angleThresholds.length) return;

        this._findFace(this.videoCanvas.nativeElement)
            .then(this._validateFace)
            .catch(() => {
                this.face.error = true;
                this.face.message = "not-found";
            });
    };

    private _openInstructions() {
        if (this.instructionsClosed) return;

        const dialogRef = this._dialog.open(this.instructions, { disableClose: true, panelClass: "rounded-2xl" });

        dialogRef.afterClosed().subscribe(() => {
            this.instructionsClosed = true;
            this._smartEnrollService.instructionsClosed = true;
        });
    }

    private _restartCamera() {
        this._stopCamera();

        this._setDimensions();
        this._setDetectionBounds();
        this._setAngleThresholds();

        if (this.angleThresholds.length > 0) {
            this.angleThreshold = this.angleThresholds[0];

            if (this.angleThreshold.indicatorAdjust !== undefined) {
                this.indicatorCutTransform = `rotate(${this.angleThreshold.indicatorAdjust - 20}deg) skewY(-50deg)`;
            }
        }

        this._startCamera();
    }

    private _onLoadedMetadata = () => {
        const videoElement: HTMLVideoElement = this.videoElement.nativeElement;
        const videoCanvas: HTMLCanvasElement = this.videoCanvas.nativeElement;

        const ctx = videoCanvas.getContext("2d", { willReadFrequently: true });

        videoElement.play();

        this._setDimensions();
        this._setDetectionBounds();

        videoCanvas.height = this.video.height;
        videoCanvas.width = this.video.width;
        videoCanvas.style.width = `${this.scaledVideo.width}px`;
        videoCanvas.style.height = `${this.scaledVideo.height}px`;
        videoCanvas.style.transform = `translate(${this.scaledVideo.offsetX}px, ${this.scaledVideo.offsetY}px) scaleX(-1)`;

        this.camera.loading = false;

        // Adaptive detection timing based on device performance
        const isMobile = this.device !== "DESKTOP";
        const detectionDelay = isMobile ? 30 : 20; // Slower on mobile
        const frameRate = isMobile ? 45 : 30; // Lower FPS on mobile
        const detectionsPerSecond = Math.floor(1000 / frameRate);

        let frameCount = 0;

        this._detectionInterval = setInterval(() => {
            if (!this.instructionsClosed) return;

            ++frameCount;

            if (this.device === "DESKTOP") {
                ctx.drawImage(videoElement, 0, 0, this.video.width, this.video.height);
            } else {
                ctx.clearRect(0, 0, this.video.width, this.video.height);
                ctx.drawImage(videoElement, 0, 0, this.video.width, this.video.height);
            }

            ctx.save();

            if (frameCount < detectionDelay) return;

            frameCount = 0;

            this._onIntervalDetect();
        }, detectionsPerSecond);
    };

    private _setAngleThresholds(): void {
        // Always face center for the first threshold
        this.angleThresholds = [
            {
                min: {
                    pitch: -30,
                    roll: -30,
                    yaw: -75,
                },
                max: {
                    pitch: 30,
                    roll: 30,
                    yaw: 75,
                },
                indicatorAdjust: undefined,
                instructions: this.translocoService.translate("smart_enroll.liveness.instructions.look_straight"),
            },
        ];

        this._generateRandomAngleThresholds();
    }

    private _setDetectionBounds() {
        const { height: viewportHeight, width: viewportWidth, offsetX, offsetY } = this.scaledViewport;

        const __minCalc = (offset: number) => {
            return Math.floor(offset);
        };

        const __maxCalc = (offset: number, dimension: number) => {
            return Math.floor(dimension + offset);
        };

        this.bounds = {
            min: {
                x: __minCalc(offsetX),
                y: __minCalc(offsetY),
                score: this.projectFlow.onboardingSettings.liveness.livenessMinScore * 0.8,
                resolution: Math.max(viewportHeight * viewportWidth * 0.05, this.MINIMUM_DEPTH),
            },
            max: {
                x: __maxCalc(offsetX, viewportWidth),
                y: __maxCalc(offsetY, viewportHeight),
                score: 1,
                resolution: Math.max(viewportHeight * viewportWidth * 0.9, this.MINIMUM_DEPTH),
            },
        };
    }

    private _setDimensions() {
        const viewportContainer = this.viewportContainer.nativeElement;
        const { videoHeight, videoWidth } = this.videoElement.nativeElement;

        // The raw video size from the camera. (i.e. 1920x1080)
        this.video = {
            height: videoHeight,
            width: videoWidth,
        };

        // The viewport size - the container the video shows within. (i.e 400x400)
        this.viewport = {
            height: viewportContainer.clientHeight,
            width: viewportContainer.clientWidth,
        };

        const rescaledVideo = this._calculateVideoCoverDimensions(this.video, this.viewport);
        const rescaledViewport = Math.min(videoWidth, videoHeight);

        // Stores the scaled video dimensions that fit within the viewport. (i.e 900x400)
        this.scaledVideo = {
            height: rescaledVideo.height,
            width: rescaledVideo.width,
            offsetX: rescaledVideo.offsetX,
            offsetY: rescaledVideo.offsetY,
        };

        // Stores the scaled viewport dimensions that fit within the video. (i.e 400x400)
        this.scaledViewport = {
            height: rescaledViewport,
            width: rescaledViewport,
            offsetX: (videoWidth - rescaledViewport) / 2,
            offsetY: (videoHeight - rescaledViewport) / 2,
        };

        // If the video and the viewport were the same size without scaling, the offset would be:
        this.video.offsetX = rescaledVideo.prescaleOffsetX;
        this.video.offsetY = rescaledVideo.prescaleOffsetY;

        // Stores the offset of the video within the viewport. (i.e 250x0)
        this.viewport.offsetX = rescaledVideo.offsetX;
        this.viewport.offsetY = rescaledVideo.offsetY;
    }

    private _setScreenStatus() {
        const height = window.innerHeight;
        const width = window.innerWidth;

        this.screen = {
            height,
            landscape: height < width,
            width,
        };
    }

    private _startCamera() {
        if (this.stream) return;

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

    private _stopCamera() {
        clearInterval(this._detectionInterval);

        this._detectionInterval = null;
        this.uploading = false;
        this.camera.loading = true;
        this.face.error = false;
        this.face.message = "";

        if (this.stream) {
            this._mediaStreamService.stopAllStreams();
            this.stream = null;
        }
    }

    private _validateFace = ({ angle, detection }: FaceDetectionWithLandmarks) => {
        const bounds = this.bounds;

        if (this.currentLivenessIndex) {
            const angleScore = this._calculateThresholdScore(angle);

            this._calculateIndicatorScale(angleScore);
        }

        if (bounds.min.score > detection.score) {
            this.face.error = true;
            this.face.message = "low-score";
        } else if (bounds.min.resolution > detection.box.area) {
            this.face.error = true;
            this.face.message = "move-closer";
        } else if (bounds.max.resolution < detection.box.area) {
            this.face.error = true;
            this.face.message = "move-away";
        } else if (
            bounds.min.x > detection.box.left ||
            bounds.min.y > detection.box.top ||
            bounds.max.x < detection.box.right ||
            bounds.max.y < detection.box.bottom
        ) {
            this.face.error = true;
            this.face.message = "not-in-frame";
        } else if (!this._isInRange(angle.pitch, this.angleThreshold.min.pitch, this.angleThreshold.max.pitch)) {
            this.face.error = true;
            this.face.message = angle.pitch > this.angleThreshold.max.pitch ? "pitch-down" : "pitch-up";
        } else if (!this._isInRange(angle.roll, this.angleThreshold.min.roll, this.angleThreshold.max.roll)) {
            this.face.error = true;
            this.face.message = angle.roll > this.angleThreshold.max.roll ? "roll-right" : "roll-left";
        } else if (!this._isInRange(angle.yaw, this.angleThreshold.min.yaw, this.angleThreshold.max.yaw)) {
            this.face.error = true;
            this.face.message = angle.yaw > this.angleThreshold.max.yaw ? "yaw-left" : "yaw-right";
        } else {
            this.face.error = false;
            this.face.success = true;
            this.face.successPosition += 1;
            this.face.message = "";
        }

        if (this.face.error) {
            this.face.successPosition = 0;
            this.face.success = false;
        }

        // Require fewer consecutive successes on mobile for better UX
        const requiredSuccesses = this.device !== "DESKTOP" ? 1 : 2;

        if (this.face.successPosition < requiredSuccesses) return;

        this.faceCaptures.push({ angle, base64: this.videoCanvas.nativeElement.toDataURL(), detection });

        this.currentLivenessIndex += 1;

        this.face.successPosition = 0;
        this.face.success = false;
        this.face.error = false;
        this.face.message = "";

        this._changeDetectionRef.detectChanges();

        if (this.currentLivenessIndex === this.angleThresholds.length) {
            this.angleThreshold = { min: {}, max: {}, indicatorAdjust: undefined }; // Hide indicator when complete
            this.uploading = true;

            this._stopCamera();

            this._captureAndCropImage().then((base64Image) => {
                const croppedImage = base64Image.replace(/^data:.*;base64,/, "");

                this.onImageScan.emit({
                    base64Image: croppedImage,
                    face: croppedImage,
                    force: !!this.appRegistration.biometricValidation,
                    front: true,
                    inputMethod: "CAMERA",
                    rawImage: base64Image,
                    source: "face",
                });
            });
        } else {
            this.indicatorTransform = "scale(0.8)";
            this.angleThreshold = this.angleThresholds[this.currentLivenessIndex];
            this.indicatorCutTransform = `rotate(${this.angleThreshold.indicatorAdjust - 20}deg) skewY(-50deg)`;
        }
    };

    cycleCamera(): void {
        this._stopCamera();

        this._findNextCamera();

        this.videoOptions.aspectRatio = { ideal: 1.7777777778 };
        this.videoOptions.height = { ideal: 1080 };
        this.videoOptions.width = { ideal: 1080 };
        this.videoOptions.zoom = { ideal: 0 };

        this._startCamera();
    }

    handleResolutionDetection(resolution: Resolution) {
        if (this.uploading) return;

        this.resolution = resolution;
        this.devices = resolution?.devices || [];

        this._stopCamera();

        const { height: videoHeight, width: videoWidth } = resolution;

        this.camera.quality = this._checkQuality(videoHeight, videoWidth);

        if (!this.camera.quality) return;

        this._setAngleThresholds();

        this.angleThreshold = this.angleThresholds[0];

        this.videoOptions = {
            aspectRatio: { exact: this.resolution.aspectRatio },
            deviceId: this.resolution.deviceId,
            facingMode: "user",
            zoom: { ideal: 0 },
            height: { exact: videoHeight },
            width: { exact: videoWidth },
        };

        this._startCamera();
    }

    onCameraError(): void {
        this.camera.permissions = false;
    }
}
