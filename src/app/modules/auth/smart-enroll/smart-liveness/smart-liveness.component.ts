import { CommonModule } from "@angular/common";
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
    ViewChild,
} from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import * as faceapi from "@vladmandic/face-api";
import QRCode from "qrcode";
import { Observable, Subject, takeUntil } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { environment } from "environments/environment";
import { MediaStreamService } from "app/media-stream.service";
import { DemoService } from "app/modules/demo/demo.service";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration, ImageScan } from "../../project";
import { FaceDetectionWithLandmarks } from "../smart-enroll.service";
import {
    Resolution,
    SmartCameraResolutionDetectionComponent,
} from "../smart-scanner/smart-camera-resolution-detection/smart-camera-resolution-detection.component";

type Angle = {
    roll?: number;
    pitch?: number;
    yaw?: number;
};

type AngleThreshold = {
    min: Angle;
    max: Angle;
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
    @ViewChild("qrCodeCanvas") public qrCodeCanvas: ElementRef<HTMLCanvasElement>;

    @Output("onImageScan") onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();
    @Output("skipStep") skipStep: EventEmitter<void> = new EventEmitter<void>();
    @Output("onCameraQualityLow") onCameraQualityLow: EventEmitter<void> = new EventEmitter<void>();

    @Input() retry: Observable<void>;
    @Input() successfulUpload: Observable<void>;

    private _detectionInterval: ReturnType<typeof setInterval>;
    private _unsubscriber$: Subject<void> = new Subject<void>();

    private DEBUG = false;
    private MINIMUM_DEPTH = 240 * 240;

    angleThreshold: AngleThreshold = { min: {}, max: {} };
    appRegistration: AppRegistration;
    bounds: DetectionBounds = {};
    boundsRelaxed: DetectionBounds = {};
    camera: CameraStatus = { loading: true, permissions: false, quality: false };
    device: "IOS" | "ANDROID" | "DESKTOP";
    devices: MediaDeviceInfo[] = [];
    face: FaceStatus = { error: false, success: false, successPosition: 0, message: "" };
    faceCapture: FaceCapture | null = null;
    faceApiLoaded: boolean = false;
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

    // Camera quality modal state
    showCameraQualityModal: boolean = false;
    cameraQualityModalState: "warning" | "qr" = "warning";
    detectedResolution: { width: number; height: number } | null = null;
    loadingQRCode: boolean = false;
    pendingResolution: Resolution | null = null;

    constructor(
        private _changeDetectionRef: ChangeDetectorRef,
        private _demoService: DemoService,
        private _KYCService: KYCService,
        private _mediaStreamService: MediaStreamService,
        private _passwordlessService: PasswordlessService,
        private _renderer: Renderer2,
        private _translocoService: TranslocoService
    ) {
        this.device = this._demoService.detectOS();

        this._setScreenStatus();

        this._renderer.listen("window", "resize", () => {
            if (this.uploading) return;

            this._restartCamera();
        });
    }

    ngOnInit(): void {
        this._mediaStreamService.stopAllStreams();

        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._passwordlessService.currentProject;
        this.projectFlow = this._passwordlessService.currentProjectFlow;

        this.successfulUpload?.pipe(takeUntil(this._unsubscriber$)).subscribe(() => {
            this.uploading = false;
        });

        this.retry?.pipe(takeUntil(this._unsubscriber$)).subscribe(() => {
            this.faceCapture = null;

            this.face.successPosition = 0;
            this.face.success = false;
            this.face.error = false;
            this.face.message = "";

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
        const faceCapture = this.faceCapture;
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
        if (!this.faceApiLoaded) return;

        const faceEngine = this._demoService.faceEngine;
        const detections = await faceapi.detectAllFaces(canvas, faceEngine).withFaceLandmarks(!this._demoService.useSsdMobilenetv1);

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

    private _isInRange(value: number, min: number, max: number): boolean {
        if (min <= max) {
            return value >= min && value <= max;
        } else {
            return value <= min && value >= max;
        }
    }

    private _onIntervalDetect = () => {
        this._findFace(this.videoCanvas.nativeElement)
            .then(this._validateFace)
            .catch(() => {
                this.face.error = true;
                this.face.message = "not-found";
            });
    };

    private _restartCamera() {
        this._stopCamera();

        this._setDimensions();
        this._setDetectionBounds();
        this._setAngleThresholds();

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
        // Only face center - no angle variations
        this.angleThreshold = {
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
            instructions: this._translocoService.translate("smart_enroll.liveness.instructions.look_straight"),
        };
    }

    private _setDetectionBounds() {
        const { height: viewportHeight, width: viewportWidth, offsetX, offsetY } = this.scaledViewport;

        const __maxCalc = (offset: number, dimension: number) => {
            return Math.floor((dimension + offset) * 0.95);
        };

        this.bounds = {
            min: {
                x: Math.floor(offsetX ? offsetX * 1.1 : viewportWidth * 0.1),
                y: Math.floor(offsetY ? offsetY * 1.1 : viewportHeight * 0.1),
                score: this.projectFlow?.onboardingSettings?.liveness?.livenessMinScore * 0.8 || 0.5,
                resolution: Math.max(Math.floor(viewportHeight * viewportWidth * 0.27), this.MINIMUM_DEPTH),
            },
            max: {
                x: __maxCalc(offsetX, viewportWidth),
                y: __maxCalc(offsetY, viewportHeight),
                score: 1,
                resolution: Math.max(Math.floor(viewportHeight * viewportWidth * 0.65), this.MINIMUM_DEPTH),
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
        if (!this.faceApiLoaded) return;

        const bounds = this.bounds;

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
        const requiredSuccesses = this.device !== "DESKTOP" ? 2 : 2;

        if (this.face.successPosition < requiredSuccesses) return;

        this.faceCapture = { angle, base64: this.videoCanvas.nativeElement.toDataURL(), detection };

        this.face.successPosition = 0;
        this.face.success = false;
        this.face.error = false;
        this.face.message = "";

        this._changeDetectionRef.detectChanges();

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
        this.detectedResolution = { width: videoWidth, height: videoHeight };

        // QA: force camera quality modal for testing (see environment.forceCameraQualityModal)
        if (environment.forceCameraQualityModal) {
            this.camera.quality = false;
        }

        if (!this.camera.quality) {
            // Store resolution for later use and show warning modal
            this.pendingResolution = resolution;
            this.showCameraQualityModal = true;
            this.cameraQualityModalState = "warning";
            this.onCameraQualityLow.emit();
            this._changeDetectionRef.detectChanges();
            return;
        }

        this._setupCameraWithResolution(resolution);
    }

    /**
     * Sets up the camera with the given resolution and starts capturing.
     */
    private _setupCameraWithResolution(resolution: Resolution): void {
        const { height: videoHeight, width: videoWidth } = resolution;

        this._setAngleThresholds();

        this.videoOptions = {
            aspectRatio: { exact: resolution.aspectRatio },
            deviceId: resolution.deviceId,
            facingMode: "user",
            zoom: { ideal: 0 },
            height: { exact: videoHeight },
            width: { exact: videoWidth },
        };

        this._startCamera();
    }

    /**
     * Closes the camera quality modal and continues with liveness detection anyway.
     */
    continueWithLowQuality(): void {
        this.showCameraQualityModal = false;
        this.cameraQualityModalState = "warning";

        if (this.pendingResolution) {
            this._setupCameraWithResolution(this.pendingResolution);
            this.pendingResolution = null;
        }

        this._changeDetectionRef.detectChanges();
    }

    /**
     * Switches to QR code view for mobile handoff.
     */
    showMobileQRCode(): void {
        this.cameraQualityModalState = "qr";
        this.loadingQRCode = true;
        this._changeDetectionRef.detectChanges();

        // Wait for ViewChild to be available
        setTimeout(() => {
            if (this.qrCodeCanvas) {
                this._generateQRCode(this.qrCodeCanvas.nativeElement, window.location.href);
            }
        }, 100);
    }

    /**
     * Goes back from QR view to warning view.
     */
    backToWarning(): void {
        this.cameraQualityModalState = "warning";
        this._changeDetectionRef.detectChanges();
    }

    /**
     * Closes the modal without continuing.
     */
    closeCameraQualityModal(): void {
        this.showCameraQualityModal = false;
        this.cameraQualityModalState = "warning";
        this.pendingResolution = null;
        this._changeDetectionRef.detectChanges();
    }

    /**
     * Generates a QR code on the given canvas.
     */
    private async _generateQRCode(canvas: HTMLCanvasElement, text: string): Promise<void> {
        try {
            await QRCode.toCanvas(canvas, text, { 
                errorCorrectionLevel: "L",
                width: 200,
                margin: 2
            });
            this.loadingQRCode = false;
            this._changeDetectionRef.detectChanges();
        } catch (e) {
            console.error("Failed to generate QR code:", e);
            this.loadingQRCode = false;
            this._changeDetectionRef.detectChanges();
        }
    }

    onCameraError(): void {
        this.camera.permissions = false;
    }
}
