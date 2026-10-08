import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: "verifik-media-display",
    standalone: true,
    imports: [CommonModule, FlexLayoutModule, MatIconModule],
    host: {
        "[ngClass]": 'isVerifikProject ? "verifik-services-video--self" : ""',
    },
    template: `
        <div
            [style.background]="'center / cover no-repeat url(' + brandingImage + ')'"
            *ngIf="!isVerifikProject && brandingImage"
            class="verifik-media-panel relative hidden md:flex flex-auto justify-center items-end h-full overflow-hidden dark:border-r w-full"
            fxLayout="row"
            fxLayoutAlign="center end"
        >
            <div class="verifik-media-panel__overlay"></div>

            <div class="verifik-media-panel__glass" *ngIf="showHighlight">
                <div class="verifik-media-panel__glass-badge">
                    <mat-icon class="verifik-media-panel__glass-icon">verified_user</mat-icon>
                </div>
                <div class="verifik-media-panel__glass-text">
                    <p class="verifik-media-panel__glass-title">{{ highlightTitle }}</p>
                    <p class="verifik-media-panel__glass-subtitle">{{ highlightSubtitle }}</p>
                </div>
            </div>
        </div>

        <div
            [ngClass]="additionalClasses"
            *ngIf="isVerifikProject"
            class="relative hidden md:flex flex-auto justify-center items-center h-full overflow-hidden dark:border-r w-full verifik-services-video"
            fxLayout="row"
            fxLayoutAlign="center center"
        >
            <video
                (canplay)="onVideoCanPlay()"
                (error)="onVideoError()"
                (loadeddata)="onVideoLoaded()"
                [autoplay]="true"
                [loop]="true"
                [muted]="true"
                [playsinline]="true"
                [preload]="'metadata'"
                *ngIf="!showFallbackImage"
                #videoElement
                class="max-w-full max-h-full object-contain"
            >
                <source [src]="videoSource" type="video/mp4" />
            </video>

            <div
                [style.background]="'center / cover no-repeat url(' + brandingImage + ')'"
                *ngIf="showFallbackImage && brandingImage"
                class="w-full h-full"
            ></div>
        </div>
    `,
    styles: [
        `
            :host {
                display: contents;
                min-height: 100vh;
                overflow: hidden;

                &:not(.verifik-services-video--self) {
                    background-color: #f9fafb;
                }

                &.verifik-services-video--self {
                    background-color: var(--custom-verifik-background);
                }
            }

            .verifik-services-video {
                background-color: #e2e6ff;
            }

            .verifik-media-panel__overlay {
                position: absolute;
                inset: 0;
                pointer-events: none;
                background: linear-gradient(
                    180deg,
                    rgba(15, 23, 42, 0) 35%,
                    rgba(15, 23, 42, 0.35) 75%,
                    rgba(15, 23, 42, 0.7) 100%
                );
            }

            .verifik-media-panel__glass {
                position: relative;
                z-index: 1;
                display: flex;
                align-items: center;
                gap: 0.875rem;
                margin: 0 auto 2.5rem;
                padding: 0.875rem 1.125rem;
                max-width: 24rem;
                border-radius: 1rem;
                background: rgba(255, 255, 255, 0.14);
                border: 1px solid rgba(255, 255, 255, 0.25);
                backdrop-filter: blur(14px);
                box-shadow: 0 16px 40px -16px rgba(0, 0, 0, 0.5);
                animation: verifik-glass-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
            }

            .verifik-media-panel__glass-badge {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 2.5rem;
                height: 2.5rem;
                flex-shrink: 0;
                border-radius: 0.75rem;
                background: rgba(255, 255, 255, 0.2);
            }

            .verifik-media-panel__glass-icon.mat-icon {
                color: #ffffff;
                font-size: 22px;
                width: 22px;
                height: 22px;
                line-height: 22px;
            }

            .verifik-media-panel__glass-title {
                margin: 0;
                color: #ffffff;
                font-weight: 600;
                font-size: 0.9375rem;
                line-height: 1.2;
            }

            .verifik-media-panel__glass-subtitle {
                margin: 0.125rem 0 0;
                color: rgba(255, 255, 255, 0.8);
                font-size: 0.8125rem;
                line-height: 1.3;
            }

            @keyframes verifik-glass-in {
                from {
                    opacity: 0;
                    transform: translateY(16px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .verifik-media-panel__glass {
                    animation: none;
                }
            }
        `,
    ],
})
export class VerifikMediaDisplayComponent implements OnInit, AfterViewInit {
    @Input() additionalClasses: string = "";
    @Input() brandingImage: string | null = null;
    @Input() isVerifikProject: boolean = false;
    @Input() videoSource: string = "assets/animations/verifik_services.mp4";
    @Input() showHighlight: boolean = false;
    @Input() highlightTitle: string = "";
    @Input() highlightSubtitle: string = "";

    @ViewChild("videoElement") videoElement!: ElementRef<HTMLVideoElement>;

    private readonly _maxRetries = 3;

    private _videoLoaded = false;
    private _retryCount = 0;
    private _showFallbackImage = false;

    get showFallbackImage(): boolean {
        return this._showFallbackImage;
    }

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        if (this.isVerifikProject && this.videoElement) {
            this._initializeVideo();
        }
    }

    private _initializeVideo(): void {
        if (!this.videoElement) return;

        const video = this.videoElement.nativeElement;

        video.muted = true;
        video.volume = 0;

        video.addEventListener("error", () => this._handleVideoError());

        this._playVideo();
    }

    private _playVideo(): void {
        if (!this.videoElement || this._videoLoaded) return;

        const video = this.videoElement.nativeElement;

        const playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log("Video started playing successfully");
                    this._videoLoaded = true;
                })
                .catch(() => {
                    this._handleAutoplayFailure();
                });
        }
    }

    private _handleVideoError(): void {
        if (this._retryCount < this._maxRetries) {
            this._retryCount++;

            setTimeout(() => {
                if (this.videoElement) {
                    this.videoElement.nativeElement.load();
                }
            }, 1000 * this._retryCount);
        } else {
            this._showFallbackImage = true;
        }
    }

    private _handleAutoplayFailure(): void {
        this._showFallbackImage = true;
    }

    onVideoLoaded(): void {
        this._videoLoaded = true;
    }

    onVideoError(): void {
        this._handleVideoError();
    }

    onVideoCanPlay(): void {
        if (this.videoElement && !this._videoLoaded) this._playVideo();
    }
}
