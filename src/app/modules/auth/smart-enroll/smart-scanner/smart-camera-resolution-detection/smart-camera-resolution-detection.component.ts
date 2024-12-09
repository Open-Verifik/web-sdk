import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { MediaTrackConstraintSetExtended, MediaTrackSupportedConstraintsExtended } from '../../smart-enroll.service';

export type Resolution = { height: number, width: number, aspectRatio?: number };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  selector: 'smart-camera-resolution-detection',
  standalone: true,
  styleUrls: [],
  template: '<video #video hidden autoplay muted></video>',
})
export class SmartCameraResolutionDetectionComponent implements OnInit {
	@ViewChild("video", { static: true }) video: ElementRef<HTMLVideoElement>;

  @Output('detected') detected: EventEmitter<Resolution> = new EventEmitter<Resolution>;
  @Output('failedToDetect') failedToDetect: EventEmitter<void> = new EventEmitter<void>;

  @Input('facingMode') facingMode: 'user' | 'environment';

  private WIDE: Array<Resolution> = [
    { height: 2160, width: 3840 },
    { height: 1440, width: 2560 },
    { height: 1080, width: 1920 },
    { height: 720, width: 1280 },
    { height: 360, width: 640 },
  ];

  private NARROW: Array<Resolution> = [
    { height: 1536, width: 2048 },
    { height: 1200, width: 1600 },
    { height: 768, width: 1024 },
    { height: 600, width: 800 },
    { height: 480, width: 640 },
  ];
  
  private SQUARE: Array<Resolution> = [
    { height: 2160, width: 2160 },
    { height: 1080, width: 1080 },
    { height: 720, width: 720 },
    { height: 480, width: 480 },
    { height: 360, width: 360 },
  ];

  private MAX_HEIGHT: number;
  private MAX_WIDTH: number;
  private IS_LANDSCAPE: boolean = false;
  private START_INDEX: number = -1;

  private WIDE_NOT_SUPPORTED: boolean = false;
  private NARROW_NOT_SUPPORTED: boolean = false;
  private SQUARE_NOT_SUPPORTED: boolean = false;

  constructor(private _renderer: Renderer2) {}

  ngOnInit(): void {
		this._renderer.listen("window", "resize", () => this._init());

    this._init();
  }

  private _init() {
    this.MAX_HEIGHT = window.innerHeight;
    this.MAX_WIDTH = window.innerWidth;

    this.IS_LANDSCAPE = window.matchMedia("(orientation: landscape)").matches || window.innerHeight < window.innerWidth;

    this.NARROW_NOT_SUPPORTED = false;
    this.SQUARE_NOT_SUPPORTED = false;
    this.WIDE_NOT_SUPPORTED = false;

    this.START_INDEX = this._findIndex();

    if (this.START_INDEX === -1) return;

    this._cycleResolutions().catch(console.error);
  }

  private _findIndex(): number {
    for (let index = 0; index < this.WIDE.length; index++) {
      const maxWide = this.WIDE[index];
      const maxNarrow = this.NARROW[index];
      const maxSquare = this.SQUARE[index];

      if (maxWide.width <= this.MAX_WIDTH || maxNarrow.width <= this.MAX_WIDTH || maxSquare.width <= this.MAX_WIDTH) {
        return index;
      };
    }

    return -1;
  }

  private async _cycleResolutions(): Promise<void> {
    const keys = ['WIDE', 'NARROW', 'SQUARE'];

    let keyPassed: string;
    let resolutionPassed: Resolution;

    for (let resIndex = this.START_INDEX; resIndex < this.WIDE.length; resIndex++) {
      for (let index = 0; index < 3; index++) {
        const key = keys[index];

        if (this[`${key}_NOT_SUPPORTED`]) continue;

        const resolution = this[key][resIndex];

        const result = await this._findBestResolution(key, resolution);

        if (!result) continue;

        keyPassed = key;
        resolutionPassed = this.IS_LANDSCAPE ? {
          ...resolution,
          aspectRatio: resolution.width / resolution.height,
        } : {
          aspectRatio: resolution.height / resolution.width,
          height: resolution.width,
          width: resolution.height,
        };

        break;
      }

      if (keyPassed) break;
    }

    if (keyPassed) {
      this.detected.next(resolutionPassed);
    } else {
      this.failedToDetect.next();
    }
  }

  private async _findBestResolution(key: string, resolution: Resolution): Promise<boolean> {
		const { facingMode, zoom } = navigator.mediaDevices.getSupportedConstraints() as MediaTrackSupportedConstraintsExtended;

    const mediaOptions = { audio: false, video: {} as MediaTrackConstraintSetExtended };

		if (facingMode) {
			mediaOptions.video.facingMode = this.facingMode || 'environment';
		}

    if (zoom) {
      mediaOptions.video.zoom = { ideal: 0 };
    }

    if (this.IS_LANDSCAPE) {
      mediaOptions.video.height = { exact: resolution.height };
      mediaOptions.video.width = { exact: resolution.width };
    } else {
      mediaOptions.video.height = { exact: resolution.width };
      mediaOptions.video.width = { exact: resolution.height };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(mediaOptions);

      const promise = new Promise((resolve, reject) => {
        setTimeout(()=> {
          const video: HTMLVideoElement = this.video.nativeElement;

          video.srcObject = stream;
    
          if (stream) stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

          resolve(true);
        });
      }) as Promise<boolean>;

      return await promise;
    } catch (error) {
      console.log("🚀 ~ SmartCameraResolutionDetectionComponent ~ _findBestResolution ~ error:", error)
      if (!(error instanceof OverconstrainedError)) this[`${key}_NOT_SUPPORTED`] = true;

      return false;
    }
  }
}
