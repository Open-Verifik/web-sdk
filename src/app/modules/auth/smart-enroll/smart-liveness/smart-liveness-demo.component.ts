import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Observable, Subject, takeUntil } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { KYCService } from "app/modules/auth/kyc.service";
import { ImageScan } from "app/modules/auth/project";
import { DemoService } from "app/modules/demo/demo.service";
import { PasswordlessService } from "../../passwordless.service";

@Component({
    animations: fuseAnimations,
    imports: [CommonModule, FlexLayoutModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslocoModule],
    selector: "smart-liveness-demo",
    standalone: true,
    styleUrls: ["./smart-liveness.component.scss"],
    templateUrl: "./smart-liveness-demo.component.html",
})
export class SmartLivenessDemoComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("compositeCanvas") public compositeCanvas: ElementRef<HTMLCanvasElement>;
    @ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;

    @Input() successfulUpload: Observable<void>;

    @Output("onImageScan") onImageScan: EventEmitter<ImageScan> = new EventEmitter<ImageScan>();

    private readonly DEMO_LIVENESS_IMAGE = "assets/images/ui/template_liveness.jpg";
    private readonly DEMO_FACE_IMAGE = "assets/images/ui/template_person.png";
    private readonly BLURRY_BACKGROUND = "assets/images/ui/blurry-street.jpg";

    private animationFrameId: number | null = null;
    private animationStartTime: number = 0;
    private backgroundImage: HTMLImageElement | null = null;
    private backgroundOffset: { x: number; y: number } = { x: 0, y: 0 };
    private faceImage: HTMLImageElement | null = null;
    private faceOffset: { x: number; y: number; rotation: number; scale: number } = { x: 0, y: 0, rotation: 0, scale: 1 };
    private livenessImage: HTMLImageElement | null = null;
    private unsubscriber$: Subject<void> = new Subject<void>();

    appRegistration: any;
    base64Image: any;
    capturing: boolean = false;
    demoData: any;
    face: any = { success: false, error: false, message: "" };
    project: Project;
    projectFlow: ProjectFlow;
    uploading: boolean = false;
    camera: any = { loading: false };
    side: "front" = "front";
    useDemoLiveness: boolean = true;

    constructor(private _demoService: DemoService, private _KYCService: KYCService, private _passwordlessService: PasswordlessService) {
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
        this._composeImages();
    }

    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
        this._stopAnimation();
    }

    get requiresBack(): boolean {
        return false;
    }

    private async _composeImages(): Promise<void> {
        const canvas = this.compositeCanvas.nativeElement;
        const ctx = canvas.getContext("2d");

        const viewportSize = 400;
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = viewportSize * pixelRatio;
        canvas.height = viewportSize * pixelRatio;
        canvas.style.width = viewportSize + "px";
        canvas.style.height = viewportSize + "px";
        ctx.scale(pixelRatio, pixelRatio);

        const backgroundImg = new Image();
        backgroundImg.crossOrigin = "anonymous";

        return new Promise((resolve) => {
            backgroundImg.onload = () => {
                this.backgroundImage = backgroundImg;

                const faceImg = new Image();
                faceImg.crossOrigin = "anonymous";
                faceImg.onload = () => {
                    this.faceImage = faceImg;

                    const livenessImg = new Image();
                    livenessImg.crossOrigin = "anonymous";
                    livenessImg.onload = () => {
                        this.livenessImage = livenessImg;
                        this._startAnimation();
                        resolve();
                    };
                    livenessImg.onerror = () => {
                        console.error("Failed to load liveness image");
                        this._startAnimation();
                        resolve();
                    };
                    livenessImg.src = this.DEMO_LIVENESS_IMAGE;
                };
                faceImg.onerror = () => {
                    console.error("Failed to load face image");
                    this._startAnimation();
                    resolve();
                };
                faceImg.src = this.DEMO_FACE_IMAGE;
            };
            backgroundImg.onerror = () => {
                console.error("Failed to load background image");
                this._startAnimation();
                resolve();
            };
            backgroundImg.src = this.BLURRY_BACKGROUND;
        });
    }

    async captureImage(): Promise<void> {
        if (this.capturing) return;

        this.capturing = true;

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const canvas = this.compositeCanvas.nativeElement;
        const base64Image = canvas.toDataURL("image/jpeg");

        this._emitImageScan(base64Image);
    }

    private _emitImageScan(base64Image: string): void {
        this.onImageScan.emit({
            base64Image: base64Image.replace(/^data:.*;base64,/, ""),
            face: base64Image.replace(/^data:.*;base64,/, ""),
            force: true,
            front: this.side === "front",
            inputMethod: "CAMERA",
            rawImage: base64Image,
            source: "face",
        });

        this.base64Image = base64Image;
        this.uploading = true;
        this.capturing = false;
    }

    private _startAnimation(): void {
        this._stopAnimation();

        this.animationStartTime = Date.now();

        const animate = () => {
            if (!this.compositeCanvas?.nativeElement || !this.faceImage || !this.backgroundImage) return;

            if (this.uploading || this.capturing) return this._stopAnimation();

            const canvas = this.compositeCanvas.nativeElement;
            const ctx = canvas.getContext("2d");

            if (!ctx) return;

            const viewportSize = 400;
            const pixelRatio = window.devicePixelRatio || 1;

            canvas.width = viewportSize * pixelRatio;
            canvas.height = viewportSize * pixelRatio;
            canvas.style.width = viewportSize + "px";
            canvas.style.height = viewportSize + "px";

            ctx.scale(pixelRatio, pixelRatio);

            if (this.useDemoLiveness) {
                this._drawDemoLiveness(ctx, viewportSize);
            } else {
                this._drawAnimatedBackground(ctx, viewportSize);
                this._drawAnimatedFace(ctx, viewportSize);
                this._updateAnimation();

                this.animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    private _stopAnimation(): void {
        if (!this.animationFrameId) return;

        cancelAnimationFrame(this.animationFrameId);

        this.animationFrameId = null;
    }

    private _drawDemoLiveness(ctx: CanvasRenderingContext2D, viewportSize: number): void {
        if (!this.livenessImage) return;

        ctx.clearRect(0, 0, viewportSize, viewportSize);

        const zoomFactor = 1.6;
        const zoomedSize = viewportSize * zoomFactor;

        const offsetY = 0;
        const offsetX = (viewportSize - zoomedSize) / 2 + viewportSize * 0.05;

        ctx.drawImage(this.livenessImage, offsetX, offsetY, zoomedSize, zoomedSize);
    }

    private _drawAnimatedBackground(ctx: CanvasRenderingContext2D, viewportSize: number): void {
        if (!this.backgroundImage) return;

        const bgSize = viewportSize * 1.1;
        const bgX = (viewportSize - bgSize) / 2 + this.backgroundOffset.x;
        const bgY = (viewportSize - bgSize) / 2 + this.backgroundOffset.y;

        ctx.drawImage(this.backgroundImage, bgX, bgY, bgSize, bgSize);
    }

    private _drawAnimatedFace(ctx: CanvasRenderingContext2D, viewportSize: number): void {
        if (!this.faceImage) return;

        const baseSize = viewportSize * 1.2;
        const faceSize = baseSize * 1.25 * 1.1 * this.faceOffset.scale;
        const aspectRatio = this.faceImage.naturalWidth / this.faceImage.naturalHeight;

        let faceWidth: number;
        let faceHeight: number;

        if (aspectRatio > 1) {
            faceWidth = faceSize;
            faceHeight = faceSize / aspectRatio;
        } else {
            faceHeight = faceSize;
            faceWidth = faceSize * aspectRatio;
        }

        const baseX = (viewportSize - faceWidth) / 2 + viewportSize * 0.05;
        const baseY = (viewportSize - faceHeight) / 2 + viewportSize * 0.25;

        const animatedX = baseX + this.faceOffset.x;
        const animatedY = baseY + this.faceOffset.y;

        ctx.save();
        ctx.translate(animatedX + faceWidth / 2, animatedY + faceHeight / 2);
        ctx.rotate(this.faceOffset.rotation);
        ctx.scale(this.faceOffset.scale, this.faceOffset.scale);

        ctx.globalAlpha = 0.95;

        ctx.drawImage(this.faceImage, -faceWidth / 2, -faceHeight / 2, faceWidth, faceHeight);

        ctx.globalAlpha = 1.0;

        ctx.restore();
    }

    private _updateAnimation(): void {
        const now = Date.now();
        const elapsed = now - this.animationStartTime;
        const time = elapsed * 0.001;

        this.backgroundOffset.x = Math.sin(time * 0.5) * 20;
        this.backgroundOffset.y = Math.cos(time * 0.4) * 15;

        this.faceOffset.x = Math.sin(time * 0.15) * 3;
        this.faceOffset.y = Math.cos(time * 0.12) * 2;
        this.faceOffset.rotation = Math.sin(time * 0.08) * 0.02;
        this.faceOffset.scale = 1 + Math.sin(time * 0.1) * 0.05;
    }
}
