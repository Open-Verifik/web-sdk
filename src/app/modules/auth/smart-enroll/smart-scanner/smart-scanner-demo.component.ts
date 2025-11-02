import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Observable, Subject, takeUntil } from "rxjs";
import * as faceapi from "@vladmandic/face-api";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { KYCService } from "app/modules/auth/kyc.service";
import { ImageScan } from "app/modules/auth/project";
import { DemoService } from "app/modules/demo/demo.service";
import { PasswordlessService } from "../../passwordless.service";
import { SmartEnrollService } from "../smart-enroll.service";

@Component({
    animations: fuseAnimations,
    imports: [CommonModule, FlexLayoutModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslocoModule],
    selector: "smart-scanner-demo",
    standalone: true,
    styleUrls: ["./smart-scanner.component.scss"],
    templateUrl: "./smart-scanner-demo.component.html",
})
export class SmartScannerDemoComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("compositeCanvas") public compositeCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("maskCanvas") public maskCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("canvasContainer") public canvasContainer: ElementRef<HTMLDivElement>;
    @ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;

    @Input() source: "document" | "face";
    @Input() successfulUpload: Observable<void>;

    @Output("onImageScan") onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();

    private readonly DEMO_DOC_IMAGE = "assets/images/ui/template_id_2.png";
    private readonly BLURRY_BACKGROUND = "assets/images/ui/blurry-street.jpg";

    private unsubscriber$: Subject<void> = new Subject<void>();
    private actualHeight: number = 600;
    private actualWidth: number = 800;
    private animationFrameId: number | null = null;
    private animationStartTime: number = 0;
    private backgroundImage: HTMLImageElement | null = null;
    private baseDocumentPosition: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };
    private documentOffset: { x: number; y: number; rotation: number } = { x: 0, y: 0, rotation: 0 };
    private documentPosition: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };
    private overlayImage: HTMLImageElement | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private targetOffset: { x: number; y: number; rotation: number } = { x: 0, y: 0, rotation: 0 };

    appRegistration: any;
    base64Image: any;
    capturing: boolean = false;
    demoData: any;
    faceIdCard: string;
    failedToDetectDocument: boolean = false;
    hasCameraPermissions: boolean = true;
    HEIGHT = 600;
    hideTip: boolean = false;
    loadingCamera: boolean = false;
    project: Project;
    projectFlow: ProjectFlow;
    side: "front" = "front";
    uploading: boolean = false;
    WIDTH = 800;

    constructor(
        private _demoService: DemoService,
        private _KYCService: KYCService,
        private _passwordlessService: PasswordlessService,
        private _smartEnrollService: SmartEnrollService
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._passwordlessService.currentProject;
        this.projectFlow = this._passwordlessService.currentProjectFlow;
        this.demoData = this._demoService.getDemoData();
    }

    ngOnInit(): void {
        this.successfulUpload.pipe(takeUntil(this.unsubscriber$)).subscribe(() => {
            this.uploading = false;
        });
    }

    ngAfterViewInit(): void {
        this._setupResponsiveCanvas();

        setTimeout(() => {
            if (this.compositeCanvas?.nativeElement) {
                this._composeImages().catch(() => {
                    this.failedToDetectDocument = true;
                });
            } else {
                this.failedToDetectDocument = true;
            }
        }, 100);
    }

    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
        this._cleanupResponsiveCanvas();
        this._stopDocumentAnimation();
    }

    get requiresBack(): boolean {
        return false;
    }

    private async _composeImages(): Promise<void> {
        if (!this.compositeCanvas?.nativeElement) return;

        const canvas = this.compositeCanvas.nativeElement;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const pixelRatio = (window.devicePixelRatio || 1) * 1.5;

        canvas.width = this.WIDTH * pixelRatio;
        canvas.height = this.HEIGHT * pixelRatio;
        canvas.style.width = this.WIDTH + "px";
        canvas.style.height = this.HEIGHT + "px";

        ctx.scale(pixelRatio, pixelRatio);
        ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        const backgroundImg = new Image();

        backgroundImg.crossOrigin = "anonymous";

        return new Promise((resolve, reject) => {
            backgroundImg.onload = () => {
                try {
                    ctx.drawImage(backgroundImg, 0, 0, this.WIDTH, this.HEIGHT);

                    const overlayImg = new Image();

                    overlayImg.crossOrigin = "anonymous";
                    overlayImg.onload = () => {
                        try {
                            const targetWidth = this.WIDTH * 0.765;
                            const targetHeight = this.HEIGHT * 0.765;
                            const originalWidth = overlayImg.naturalWidth;
                            const originalHeight = overlayImg.naturalHeight;
                            const aspectRatio = originalWidth / originalHeight;

                            let drawWidth = targetWidth;
                            let drawHeight = targetWidth / aspectRatio;

                            if (drawHeight > targetHeight) {
                                drawHeight = targetHeight;
                                drawWidth = targetHeight * aspectRatio;
                            }

                            const x = (this.WIDTH - drawWidth) / 2;
                            const y = (this.HEIGHT - drawHeight) / 2;

                            this.overlayImage = overlayImg;
                            this.backgroundImage = backgroundImg;
                            this.baseDocumentPosition = { x, y, width: drawWidth, height: drawHeight };
                            this.documentPosition = { x, y, width: drawWidth, height: drawHeight };

                            this._drawMaskOverlay();
                            this._startDocumentAnimation();

                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };

                    overlayImg.onerror = () => reject(new Error("Failed to load overlay image"));
                    overlayImg.src = this.DEMO_DOC_IMAGE;
                } catch (error) {
                    reject(error);
                }
            };

            backgroundImg.onerror = () => reject(new Error("Failed to load background image"));
            backgroundImg.src = this.BLURRY_BACKGROUND;
        });
    }

    private _drawMaskOverlay(): void {
        if (!this.maskCanvas?.nativeElement) return;

        const canvas = this.maskCanvas.nativeElement;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const pixelRatio = (window.devicePixelRatio || 1) * 3;

        canvas.width = this.WIDTH * pixelRatio;
        canvas.height = this.HEIGHT * pixelRatio;
        canvas.style.width = this.WIDTH + "px";
        canvas.style.height = this.HEIGHT + "px";

        ctx.scale(pixelRatio, pixelRatio);

        this._drawDocumentMask(ctx);
    }

    private _drawDocumentMask(ctx: CanvasRenderingContext2D): void {
        const { x, y, width, height } = this.documentPosition;

        // Add extra padding around the document for a more realistic camera viewfinder (reduced by 10%)
        const padding = 27;
        const maskX = x - padding;
        const maskY = y - padding;
        const maskWidth = width + padding * 2;
        const maskHeight = height + padding * 2;

        // Fill the entire canvas with semi-transparent white overlay
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        // Create the document outline with rounded corners (using the padded dimensions)
        const cornerRadius = 20;

        ctx.beginPath();
        ctx.moveTo(maskX + cornerRadius, maskY);
        ctx.lineTo(maskX + maskWidth - cornerRadius, maskY);
        ctx.quadraticCurveTo(maskX + maskWidth, maskY, maskX + maskWidth, maskY + cornerRadius);
        ctx.lineTo(maskX + maskWidth, maskY + maskHeight - cornerRadius);
        ctx.quadraticCurveTo(maskX + maskWidth, maskY + maskHeight, maskX + maskWidth - cornerRadius, maskY + maskHeight);
        ctx.lineTo(maskX + cornerRadius, maskY + maskHeight);
        ctx.quadraticCurveTo(maskX, maskY + maskHeight, maskX, maskY + maskHeight - cornerRadius);
        ctx.lineTo(maskX, maskY + cornerRadius);
        ctx.quadraticCurveTo(maskX, maskY, maskX + cornerRadius, maskY);
        ctx.closePath();

        // Clear the document area (make it transparent)
        ctx.globalCompositeOperation = "destination-out";
        ctx.fill();

        // Reset composite operation
        ctx.globalCompositeOperation = "source-over";

        // Draw the solid border (using the padded dimensions)
        this._drawSolidBorder(ctx, maskX, maskY, maskWidth, maskHeight);

        // Draw corner indicators (using the padded dimensions)
        this._drawCornerIndicators(ctx, maskX, maskY, maskWidth, maskHeight);

        // Draw detection text (centered on the padded area)
        this._drawDetectionText(ctx, maskX, maskY, maskWidth, maskHeight);
    }

    private _drawSolidBorder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
        const cornerRadius = 20;

        // Create the border path
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + width - cornerRadius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
        ctx.lineTo(x + width, y + height - cornerRadius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
        ctx.lineTo(x + cornerRadius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();

        // Draw solid emerald green border
        ctx.strokeStyle = "#10b981"; // Tailwind emerald-500
        ctx.lineWidth = 3;
        ctx.setLineDash([]); // Solid line
        ctx.stroke();
    }

    private _drawCornerIndicators(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
        const cornerSize = 20;
        const cornerThickness = 3;
        const padding = 10;

        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = cornerThickness;
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding + cornerSize);
        ctx.lineTo(x + padding, y + padding);
        ctx.lineTo(x + padding + cornerSize, y + padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + width - padding - cornerSize, y + padding);
        ctx.lineTo(x + width - padding, y + padding);
        ctx.lineTo(x + width - padding, y + padding + cornerSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + padding, y + height - padding - cornerSize);
        ctx.lineTo(x + padding, y + height - padding);
        ctx.lineTo(x + padding + cornerSize, y + height - padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + width - padding - cornerSize, y + height - padding);
        ctx.lineTo(x + width - padding, y + height - padding);
        ctx.lineTo(x + width - padding, y + height - padding - cornerSize);
        ctx.stroke();
    }

    private _drawDetectionText(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Face Detected", x + width / 2, y - 10);
    }

    private _setupResponsiveCanvas(): void {
        if (!this.canvasContainer?.nativeElement) return;

        this._updateCanvasDimensions();

        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                this._updateCanvasDimensions();
                this._composeImages().catch((error) => {
                    console.error("❌ Failed to recompose images on resize:", error);
                });
            }
        });

        this.resizeObserver.observe(this.canvasContainer.nativeElement);
    }

    private _updateCanvasDimensions(): void {
        if (!this.canvasContainer?.nativeElement) return;

        const container = this.canvasContainer.nativeElement;
        const rect = container.getBoundingClientRect();

        this.actualWidth = rect.width;
        this.actualHeight = rect.height;

        this.WIDTH = this.actualWidth;
        this.HEIGHT = this.actualHeight;
    }

    private _cleanupResponsiveCanvas(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    private _startDocumentAnimation(): void {
        this._stopDocumentAnimation();

        this.animationStartTime = Date.now();
        this._generateNewTargetPosition();

        const animate = () => {
            if (!this.compositeCanvas?.nativeElement || !this.overlayImage || !this.backgroundImage) return;

            if (this.uploading || this.capturing) return this._stopDocumentAnimation();

            const canvas = this.compositeCanvas.nativeElement;
            const ctx = canvas.getContext("2d");

            if (!ctx) return;

            ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
            ctx.drawImage(this.backgroundImage, 0, 0, this.WIDTH, this.HEIGHT);

            this._drawAnimatedDocument(ctx);

            this.animationFrameId = requestAnimationFrame(animate);
        };

        animate();
    }

    private _stopDocumentAnimation(): void {
        if (!this.animationFrameId) return;

        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }

    private _drawAnimatedDocument(ctx: CanvasRenderingContext2D): void {
        if (!this.overlayImage) return;

        const { x, y, width, height } = this.baseDocumentPosition;
        const { x: offsetX, y: offsetY, rotation } = this.documentOffset;

        const animatedX = x + offsetX;
        const animatedY = y + offsetY;

        ctx.save();
        ctx.translate(animatedX + width / 2, animatedY + height / 2);
        ctx.rotate(rotation);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(this.overlayImage, -width / 2, -height / 2, width, height);
        ctx.globalAlpha = 1.0;
        ctx.restore();

        this._updateDocumentAnimation();
    }

    private _updateDocumentAnimation(): void {
        const now = Date.now();
        const elapsed = now - this.animationStartTime;

        const lerpFactor = 0.02;

        this.documentOffset.x += (this.targetOffset.x - this.documentOffset.x) * lerpFactor;
        this.documentOffset.y += (this.targetOffset.y - this.documentOffset.y) * lerpFactor;
        this.documentOffset.rotation += (this.targetOffset.rotation - this.documentOffset.rotation) * lerpFactor;

        if (elapsed > 2000 + Math.random() * 2000) {
            this._generateNewTargetPosition();
            this.animationStartTime = now;
        }
    }

    private _generateNewTargetPosition(): void {
        const maxOffset = 30;
        const maxRotation = 0.1;

        if (Math.random() < 0.3) {
            this.targetOffset = { x: 0, y: 0, rotation: 0 };

            return;
        }

        this.targetOffset = {
            x: (Math.random() - 0.5) * maxOffset * 2,
            y: (Math.random() - 0.5) * maxOffset * 2,
            rotation: (Math.random() - 0.5) * maxRotation * 2,
        };
    }

    async captureImage(): Promise<void> {
        if (this.capturing) return;

        this.capturing = true;

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const canvas = this.compositeCanvas.nativeElement;
        const base64Image = canvas.toDataURL("image/jpeg");

        let face: string | null = null;

        try {
            const image = new Image();
            image.src = base64Image;

            await new Promise<void>((resolve) => {
                image.onload = async () => {
                    try {
                        const faceEngine = this._demoService.faceEngine;
                        const detections = await faceapi.detectAllFaces(image, faceEngine).withFaceLandmarks(!this._demoService.useSsdMobilenetv1);

                        if (!detections.length) return resolve();

                        const detection = this._demoService.findBiggestFace(detections);

                        if (!detection) return resolve();

                        const faceToUpload = this._demoService.cutFaceIdCard(image, detection.alignedRect.box, this.faceCardCanvas.nativeElement);

                        face = faceToUpload?.replace(/^data:.*;base64,/, "");

                        resolve();
                    } catch (error) {
                        resolve();
                    }
                };

                image.onerror = () => resolve();
            });
        } catch (error) {}

        this._emitImageScan(base64Image, face);
    }

    private _emitImageScan(base64Image: string, face: string | null): void {
        const isFront = this.side === "front";

        this.onImageScan.emit({
            base64Image: base64Image.replace(/^data:.*;base64,/, ""),
            face,
            force: !isFront || !!this.appRegistration.documentValidation,
            front: isFront,
            inputMethod: "CAMERA",
            rawImage: base64Image,
            source: this.source,
        });

        this.base64Image = base64Image;
        this.uploading = true;
        this.capturing = false;
    }

    goNext(): void {
        this._smartEnrollService.goToNextStep();
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

    canGoPrevious(): boolean {
        return !this.uploading;
    }

    canSkip(): boolean {
        if (this.uploading) return false;

        const canSkipDocument = this.projectFlow?.onboardingSettings?.steps?.document !== "mandatory" && !this.appRegistration?.documentValidation;

        return canSkipDocument;
    }

    goBack(): void {
        this._smartEnrollService.setDocumentMethod("");
        this._smartEnrollService.skipToStep("document");
    }

    closeTip(): void {
        this.hideTip = true;
    }

    retryImageLoad(): void {
        this.failedToDetectDocument = false;

        this._composeImages().catch(() => {
            this.failedToDetectDocument = true;
        });
    }
}
