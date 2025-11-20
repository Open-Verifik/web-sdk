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
            class="relative hidden md:flex flex-auto justify-center h-full overflow-hidden dark:border-r w-full"
            fxLayout="row"
            fxLayoutAlign="end end"
        ></div>

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
        `,
    ],
})
export class VerifikMediaDisplayComponent implements OnInit, AfterViewInit {
    @Input() additionalClasses: string = "";
    @Input() brandingImage: string | null = null;
    @Input() isVerifikProject: boolean = false;
    @Input() videoSource: string = "assets/animations/verifik_services.mp4";

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
