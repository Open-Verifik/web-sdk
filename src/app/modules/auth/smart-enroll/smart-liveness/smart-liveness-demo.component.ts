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

    private unsubscriber$: Subject<void> = new Subject<void>();

    private readonly DEMO_FACE_IMAGE = "assets/images/ui/template_person.png";
    private readonly BLURRY_BACKGROUND = "assets/images/ui/blurry-street.jpg";

    // Animation properties
    private animationFrameId: number | null = null;
    private animationStartTime: number = 0;
    private faceOffset: { x: number; y: number; rotation: number; scale: number } = { x: 0, y: 0, rotation: 0, scale: 1 };
    private backgroundOffset: { x: number; y: number } = { x: 0, y: 0 };
    private faceImage: HTMLImageElement | null = null;
    private backgroundImage: HTMLImageElement | null = null;

    appRegistration: any;
    base64Image: any;
    capturing: boolean = false;
    demoData: any;
    face: any = { success: false, error: false, message: "" };
    project: Project;
    projectFlow: ProjectFlow;
    uploading: boolean = false;
    camera: any = { loading: false };
    side: "front" = "front"; // Demo mode only uses front side

    constructor(private _demoService: DemoService, private _KYCService: KYCService, private _passwordlessService: PasswordlessService) {
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._passwordlessService.currentProject;
        this.projectFlow = this._passwordlessService.currentProjectFlow;
        this.demoData = this._demoService.getDemoData();

        // Ensure projectFlow has required structure for demo
        if (!this.projectFlow) {
            this.projectFlow = {
                onboardingSettings: {
                    steps: {
                        document: "mandatory",
                        liveness: "mandatory",
                    },
                },
            } as any;
        }
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
                    this._startAnimation();
                    resolve();
                };

                faceImg.src = this.DEMO_FACE_IMAGE;
            };

            backgroundImg.src = this.BLURRY_BACKGROUND;
        });
    }

    async captureImage(): Promise<void> {
        if (this.capturing) return;

        this.capturing = true;

        // Simulate capture delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const canvas = this.compositeCanvas.nativeElement;
        const base64Image = canvas.toDataURL("image/jpeg");

        // Extract face for comparison
        const faceImg = new Image();
        faceImg.src = this.DEMO_FACE_IMAGE;

        faceImg.onload = () => {
            const faceCanvas = this.faceCardCanvas.nativeElement;
            const faceCtx = faceCanvas.getContext("2d");

            faceCanvas.width = 300;
            faceCanvas.height = 300;

            faceCtx.drawImage(faceImg, 0, 0, 300, 300);
            const faceToUpload = faceCanvas.toDataURL("image/jpeg");
            const face = faceToUpload?.replace(/^data:.*;base64,/, "");

            this._emitImageScan(base64Image, face);
        };
    }

    private _emitImageScan(base64Image: string, face: string): void {
        this.onImageScan.emit({
            base64Image: base64Image.replace(/^data:.*;base64,/, ""),
            face,
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

    goNext(): void {
        // Continue to next step
        this.uploading = false;
    }

    goPrevious(): void {
        // Go back to previous step
        this.uploading = false;
    }

    get requiresBack(): boolean {
        // In demo mode, we only use front side
        return false;
    }

    canGoPrevious(): boolean {
        // In demo mode, we only have front side, so no previous side
        return false;
    }

    canSkip(): boolean {
        return true; // Allow skipping in demo mode
    }

    goBack(): void {
        // Navigate back to previous step
    }

    private _startAnimation(): void {
        this._stopAnimation();

        this.animationStartTime = Date.now();

        const animate = () => {
            if (!this.compositeCanvas?.nativeElement || !this.faceImage || !this.backgroundImage) return;

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

            this._drawAnimatedBackground(ctx, viewportSize);
            this._drawAnimatedFace(ctx, viewportSize);
            this._updateAnimation();

            this.animationFrameId = requestAnimationFrame(animate);
        };

        animate();
    }

    private _stopAnimation(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
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
        const faceSize = baseSize * 1.25 * 1.25 * this.faceOffset.scale;
        const aspectRatio = this.faceImage.naturalWidth / this.faceImage.naturalHeight;
        let faceWidth, faceHeight;

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

        // Continuous background movement using sine waves for smooth, natural motion
        const time = elapsed * 0.001; // Convert to seconds
        this.backgroundOffset.x = Math.sin(time * 0.5) * 20; // Faster horizontal drift with larger range
        this.backgroundOffset.y = Math.cos(time * 0.4) * 15; // Faster vertical drift with larger range

        // Gentle person movement - very subtle to avoid discomfort
        this.faceOffset.x = Math.sin(time * 0.15) * 3; // Very gentle horizontal movement
        this.faceOffset.y = Math.cos(time * 0.12) * 2; // Very gentle vertical movement
        this.faceOffset.rotation = Math.sin(time * 0.08) * 0.02; // Very gentle rotation
        this.faceOffset.scale = 1 + Math.sin(time * 0.1) * 0.05; // Gentle size breathing effect
    }
}
