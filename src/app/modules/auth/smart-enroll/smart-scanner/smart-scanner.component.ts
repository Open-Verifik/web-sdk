import { CommonModule } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import * as faceapi from "@vladmandic/face-api";
import { debounce, DebouncedFunc } from "lodash";
import QRCode from "qrcode";
import { Observable, Subject, takeUntil } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { KYCService } from "app/modules/auth/kyc.service";
import { AppRegistration, ImageScan } from "app/modules/auth/project";
import { DemoService } from "app/modules/demo/demo.service";
import { environment } from "environments/environment";
import { Corrections, SmartEnrollService } from "../smart-enroll.service";
import { PasswordlessService } from "../../passwordless.service";

interface MediaTrackConstraintSetExtended extends MediaTrackConstraintSet {
    zoom?: ConstrainULong;
}

@Component({
    animations: fuseAnimations,
    imports: [CommonModule, FlexLayoutModule, MatButtonModule, MatCheckboxModule, MatIconModule, MatProgressSpinnerModule, TranslocoModule],
    selector: "smart-scanner",
    standalone: true,
    styleUrls: ["./smart-scanner.component.scss"],
    templateUrl: "./smart-scanner.component.html",
})
export class SmartScannerComponent implements OnInit, OnDestroy {
    @Input() source;
    @Input() successfulUpload: Observable<void>;

    @ViewChild("canvasContainer") canvasContainer: ElementRef<HTMLDivElement>;
    @ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("qrCodeCanvas") public qrCodeCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("maskCanvas") public maskCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("toSendCanvas") public toSendCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("videoCanvas") public videoCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("videoElement") videoElement: ElementRef<HTMLVideoElement>;

    @Output("onImageScan") onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();

    private unsubscriber$: Subject<void> = new Subject<void>();

    private _checkFaceTimeout: any;
    private _debouncedWindowResize: DebouncedFunc<() => void>;
    private _detectionInterval: ReturnType<typeof setInterval>;
    private _rectCredential: any;

    DEBUG_MODE: boolean = !environment.production && false;

    appRegistration: AppRegistration;
    aspectRatio = 85.6 / 53.98;
    base64Image: any;
    calculating: boolean = false;
    cameraConstraintsInvalid: boolean = false;
    demoData: any;
    device: "IOS" | "ANDROID" | "DESKTOP";
    devices: MediaDeviceInfo[] = [];
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

    BOUNDS: { face: any; document: any } = { face: {}, document: {} };
    HEIGHT: number;
    WIDTH: number;

    videoOptions: any = {
        aspectRatio: { ideal: 1.7777777778 },
        frameRate: { ideal: 30 },
        height: { ideal: 1080 },
        width: { ideal: 1080 },
        zoom: { ideal: 0 },
    };

    corrections: Corrections = {
        angle: { pitch: "", roll: "", yaw: "" },
        bounds: { x: "", y: "" },
        resolution: { height: "", width: "" },
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
        private _passwordlessService: PasswordlessService,
        private _renderer: Renderer2,
        private _smartEnrollService: SmartEnrollService,
        private _translocoService: TranslocoService
    ) {
        this.device = this._demoService.detectOS();
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

        this.successfulUpload.pipe(takeUntil(this.unsubscriber$)).subscribe(() => {
            this.uploading = false;
            this.requiresBack = this.appRegistration.documentValidation?.requiresBackSide || !!this.appRegistration.documentValidation?.backUrl;
        });

        this._demoService.faceapi$.pipe(takeUntil(this.unsubscriber$)).subscribe((isLoaded) => {
            if (!isLoaded || this.stream) return;

            setTimeout(() => this._startCamera());
        });
    }

    ngOnDestroy(): void {
        this._debouncedWindowResize?.cancel();

        this.unsubscriber$.next();
        this.unsubscriber$.complete();

        this._stopRecord();
    }

    async _detectFace(image: faceapi.TNetInput) {
        this._paintMaskCanvas();

        try {
            const faceEngine = this._demoService.faceEngine;
            const detections = await faceapi.detectAllFaces(image, faceEngine).withFaceLandmarks(!this._demoService.useSsdMobilenetv1);

            if (detections.length) {
                this.faceDetection = this._demoService.findBiggestFace(detections);

                this.errorFace = null;
                this._checkFaceTimeout = clearTimeout(this._checkFaceTimeout);

                const { bounds, isValid, resolution } = this._smartEnrollService.evaluateFaceDetection(this.BOUNDS, this.faceDetection, this.source);

                this.corrections.bounds = bounds;
                this.corrections.resolution = resolution;

                this.faceIsValid = isValid;
            } else if (!this._checkFaceTimeout) {
                this._checkFaceTimeout = setTimeout(() => this._detectFaceError(), 3 * this.demoData.time);
            }
        } catch (e) {}
    }

    private _detectFaceError(): void {
        this.faceIsValid = false;

        this.errorFace = {
            title: this._translocoService.translate("id_scanning.face_not_found"),
            subtitle: this._translocoService.translate("id_scanning.face_not_found_details"),
        };
    }

    private _drawIdMask(ctx: CanvasRenderingContext2D): void {
        const height = this.HEIGHT;
        const width = this.WIDTH;

        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(0, 0, width, height);
        ctx.closePath();

        const rectDimensions = this._calculateMaxDimensions({ width: 16, height: 9 }, { width, height });

        rectDimensions.height = Math.floor(rectDimensions.height * (this.isLandscape ? 0.6 : 0.8));
        rectDimensions.width = Math.floor(rectDimensions.width * (this.isLandscape ? 0.6 : 0.8));

        const center = {
            x: width / 2 - rectDimensions.width / 2,
            y: height / 2 - rectDimensions.height / 2,
        };

        ctx.beginPath();
        ctx.clearRect(center.x, center.y, rectDimensions.width, rectDimensions.height);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.roundRect(center.x, center.y, rectDimensions.width, rectDimensions.height, 8);
        ctx.strokeStyle = this.side === "back" ? "#181818" : this._isCaptureValid() ? "#3bf65f" : "#FF5638";
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

        this._drawIdMask(ctx);

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
        return this.documentIsValid && ((this.side === "front" && this.faceIsValid) || this.side === "back");
    }

    private _resetVariables() {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._passwordlessService.currentProject;
        this.projectFlow = this._passwordlessService.currentProjectFlow;
        this.requiresBack = this.appRegistration.documentValidation?.requiresBackSide || !!this.appRegistration.documentValidation?.backUrl;

        this._rectCredential = {};

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

        const settings: MediaTrackConstraintSetExtended = {
            aspectRatio: this.isLandscape ? IDEAL_A / IDEAL_B : IDEAL_B / IDEAL_A,
            facingMode: "environment",
            frameRate: { ideal: 30 },
            height: this.isLandscape ? { min: 480, ideal: IDEAL_B, max: IDEAL_B } : { min: 854, ideal: IDEAL_A, max: IDEAL_A },
            width: this.isLandscape ? { min: 854, ideal: IDEAL_A, max: IDEAL_A } : { min: 480, ideal: IDEAL_B, max: IDEAL_B },
        };

        settings.zoom = { ideal: 0 };

        this.video = {};

        this.videoOptions = {
            ...this.videoOptions,
            ...settings,
        };
    }

    private _calculateMaxDimensions(container: { height: number; width: number }, containerToFit: { height: number; width: number }) {
        const scaleFactorWidth = containerToFit.width / container.width;
        const scaleFactorHeight = containerToFit.height / container.height;

        const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

        const scaledWidth = Math.floor(container.width * scaleFactor);
        const scaledHeight = Math.floor(container.height * scaleFactor);

        return { width: scaledWidth, height: scaledHeight };
    }

    private _findNextCamera(): void {
        if (!this.devices.length) return;

        const currentDeviceIndex = this.devices.findIndex((device) => device.deviceId === this.videoOptions.deviceId);

        this.videoOptions.deviceId =
            currentDeviceIndex === -1 ? this.devices[0].deviceId : this.devices[(currentDeviceIndex + 1) % this.devices.length].deviceId;
    }

    private _paintMaskCanvas() {
        const maskCanvas: HTMLCanvasElement = this.maskCanvas.nativeElement;

        maskCanvas.height = this.HEIGHT;
        maskCanvas.width = this.WIDTH;

        const canvasCtx = maskCanvas.getContext("2d");
        this._drawMask(canvasCtx);
    }

    private _setCanvasDimensions = () => {
        const canvasContainer = this.canvasContainer.nativeElement;

        const containerHeight = canvasContainer.clientHeight;
        const containerWidth = canvasContainer.clientWidth;

        const containerToFit = {
            height: Math.min(containerHeight, this.video.height),
            width: Math.min(containerWidth, this.video.width),
        };

        const rescaledProportions = this._calculateMaxDimensions(this.video, containerToFit);

        this.HEIGHT = rescaledProportions.height;
        this.WIDTH = rescaledProportions.width;
    };

    private _setDimensions(height: number, width: number, data: any) {
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

                const { width, height, deviceId } = settings;

                this.videoOptions.deviceId = deviceId;
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
        };

        const DOCUMENT_FACE_H_RESOLUTION_LIMIT = {
            WIDTH_HIGH: __rescaleCalc(500),
            WIDTH_LOW: 80,
            HEIGHT_HIGH: __rescaleCalc(500),
            HEIGHT_LOW: 80,
        };
        const DOCUMENT_FACE_V_RESOLUTION_LIMIT = {
            WIDTH_HIGH: __rescaleCalc(500),
            WIDTH_LOW: 80,
            HEIGHT_HIGH: __rescaleCalc(500),
            HEIGHT_LOW: 80,
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

        this.BOUNDS.face = this.isLandscape
            ? {
                  bounds: { ...DOCUMENT_FACE_H_BOUNDS_LIMIT },
                  res: { ...DOCUMENT_FACE_H_RESOLUTION_LIMIT },
              }
            : {
                  bounds: { ...DOCUMENT_FACE_V_BOUNDS_LIMIT },
                  res: { ...DOCUMENT_FACE_V_RESOLUTION_LIMIT },
              };
    }

    private _onVideoLoaded = () => {
        const video: HTMLVideoElement = this.videoElement.nativeElement;

        this._setCanvasDimensions();
        this._paintMaskCanvas();

        video.style.transform = "";

        // Delay detection calculations by a number of frames for performance.
        const detectionDelay = this.demoData === "ANDROID" ? 20 : 15;
        const detectionsPerSecond = Math.floor(1000 / 30);

        let frameCount = 0;

        this._detectionInterval = setInterval(() => {
            ++frameCount;

            if (frameCount < detectionDelay) return;

            this._onIntervalDetect(video)
                .catch((error) => {
                    console.error(
                        `file: smart-scanner.component.ts:821 ~ SmartScannerComponent ~ this._detectionInterval=setInterval ~ error:`,
                        error
                    );
                })
                .finally(() => {
                    this.calculating = false;

                    frameCount = 0;
                });
        }, detectionsPerSecond);
    };

    private _onIntervalDetect = async (video: HTMLVideoElement): Promise<void> => {
        if (this.calculating) return Promise.resolve();

        this.calculating = true;
        this.documentIsValid = true;

        if (this.side === "front") await this._detectFace(video);
    };

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
        return !this.uploading;
    }

    canSkip(): boolean {
        if (this.uploading) return false;

        const canSkipDocument = this.projectFlow.onboardingSettings.steps.document !== "mandatory" && !this.appRegistration.documentValidation;

        return canSkipDocument;
    }

    closeTip() {
        this.hideTip = true;
    }

    goPrevious(): void {
        if (this.requiresBack && this.side !== "front") {
            this.side = "front";
            this._resetVariables();
            this._startCamera();

            return;
        }

        this._smartEnrollService.setDocumentMethod("");
        this._smartEnrollService.skipToStep("document"); // document
    }

    loadQRCode(): void {
        this.revealQRCode = true;

        const qrCanvas = this.qrCodeCanvas.nativeElement;

        this._generateQRCode(qrCanvas, window.location.href);
    }

    setPictureInCanvas(canvas: HTMLCanvasElement, dimensions: any) {
        const context = canvas.getContext("2d", { willReadFrequently: true });

        canvas.width = dimensions.rectWidth;
        canvas.height = dimensions.rectHeight;

        context.drawImage(this.videoElement.nativeElement, 0, 0, dimensions.rectWidth, dimensions.rectHeight);
    }

    showPassportColor(): boolean {
        return (
            !this.appRegistration.documentValidation ||
            this.side === "front" ||
            this.appRegistration.documentValidation?.documentCategory?.toLowerCase() === "passport"
        );
    }

    showLicenseColor(): boolean {
        return (
            !this.appRegistration.documentValidation ||
            this.side === "front" ||
            this.appRegistration.documentValidation?.documentCategory?.toLowerCase() === "driverlicense"
        );
    }

    showGovernmentIDColor(): boolean {
        return (
            !this.appRegistration.documentValidation ||
            this.side === "front" ||
            ["id", "idv2"].includes(this.appRegistration.documentValidation?.documentCategory?.toLowerCase())
        );
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

    cycleCamera(): void {
        this._findNextCamera();

        this.videoOptions.aspectRatio = { ideal: 1.7777777778 };
        this.videoOptions.height = { ideal: 1080 };
        this.videoOptions.width = { ideal: 1080 };
        this.videoOptions.zoom = { ideal: 0 };

        this._startCamera();
    }

    async takePicture() {
        clearInterval(this._detectionInterval);

        this._detectionInterval = null;

        const canvasToSend = this.toSendCanvas.nativeElement;

        this.setPictureInCanvas(canvasToSend, this.video);

        const rawBase64Image = canvasToSend.toDataURL("image/jpeg");
        const isFront = this.side === "front";

        let base64Image = rawBase64Image;
        let face: string;
        let faceToUpload: string;

        if (isFront) {
            const image = new Image();

            image.src = rawBase64Image;

            try {
                const faceEngine = this._demoService.faceEngine;
                const detections = await faceapi.detectAllFaces(image, faceEngine).withFaceLandmarks(!this._demoService.useSsdMobilenetv1);

                const face = this._demoService.findBiggestFace(detections);

                if (!face) throw Error("face_not_found");

                this.faceIdCard = this._demoService.cutFaceIdCard(image, face.alignedRect.box, this.faceCardCanvas.nativeElement);

                faceToUpload = this.faceIdCard;
            } catch (error) {
                this._detectFaceError();
                this._stopRecord();
                this._startCamera();

                return;
            }
        }

        base64Image = rawBase64Image.replace(/^data:.*;base64,/, "");
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

        this.base64Image = rawBase64Image;
        this.uploading = true;

        this._stopRecord();
    }
}
