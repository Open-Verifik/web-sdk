import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { TranslocoModule } from "@ngneat/transloco";
import * as faceapi from "@vladmandic/face-api";

import { ImageScan } from "app/modules/auth/project";
import { DemoService } from "app/modules/demo/demo.service";
import { Rect, ScanState, ScanVerdict, judgeSelfie, luminanceVariance, ovalRect, visibleRect } from "./verify-scan";

const STEADY_FRAMES_REQUIRED = 3;

@Component({
	selector: "verify-selfie",
	standalone: true,
	imports: [CommonModule, TranslocoModule],
	templateUrl: "./verify-selfie.component.html",
	styleUrls: ["./verify-selfie.component.scss"],
})
export class VerifySelfieComponent implements OnInit, OnDestroy {
	@Input() canSkip = false;
	@Input() phase: "idle" | "liveness" | "compare" | "finishing" = "idle";

	@Output() captured = new EventEmitter<ImageScan>();
	@Output() permissionDenied = new EventEmitter<void>();
	@Output() skipped = new EventEmitter<void>();

	@ViewChild("video") videoRef?: ElementRef<HTMLVideoElement>;
	@ViewChild("still") stillRef?: ElementRef<HTMLCanvasElement>;

	cameraReady = false;
	capturedPreview: string | null = null;
	framed = false;
	hintKey = "verify.selfieCenter";
	progress = 0;
	state: ScanState = "starting";

	private _alive = true;
	private _avgMs = 110;
	private _capturing = false;
	private _crop: HTMLCanvasElement | null = null;
	private _detecting = false;
	private _hits = 0;
	private _stream: MediaStream | null = null;
	private _timer: ReturnType<typeof setTimeout> | null = null;

	constructor(private _cdr: ChangeDetectorRef, private _demo: DemoService) {}

	ngOnInit(): void {
		void this._start();
	}

	ngOnDestroy(): void {
		this._alive = false;
		this._stop();
	}

	get phaseKey(): string {
		if (this.phase === "compare") return "verify.selfieStepCompare";
		if (this.phase === "finishing") return "verify.selfieStepFinish";

		return "verify.selfieStepLiveness";
	}

	private async _start(): Promise<void> {
		try {
			await this._demo.loadModels();
		} catch {
			// Continue so camera still opens.
		}

		try {
			this._stream = await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
			});
		} catch {
			this.permissionDenied.emit();
			return;
		}

		const video = this.videoRef?.nativeElement;

		if (!video || !this._alive) {
			this._stop();
			return;
		}

		video.srcObject = this._stream;
		video.onloadedmetadata = () => {
			this.cameraReady = true;
			this._cdr.markForCheck();
		};
		await video.play().catch(() => undefined);
		this.cameraReady = true;
		this._cdr.markForCheck();
		this._loop();
	}

	private _loop(): void {
		if (!this._alive || this._capturing) return;

		const delay = Math.min(650, Math.max(240, this._avgMs * 1.8));

		this._timer = setTimeout(async () => {
			const started = performance.now();

			if (!document.hidden) await this._watch();

			this._avgMs = this._avgMs * 0.7 + (performance.now() - started) * 0.3;
			this._loop();
		}, delay);
	}

	private async _watch(): Promise<void> {
		if (!this._alive || this._capturing || this._detecting) return;

		this._detecting = true;

		try {
			const result = await this._judge();

			if (!this._alive || this._capturing) return;

			this.state = result.state;
			this.hintKey = result.hintKey;
			this.framed = result.ready;
			this._hits = result.ready ? this._hits + 1 : 0;
			this.progress = Math.min(1, this._hits / STEADY_FRAMES_REQUIRED);
			this._cdr.markForCheck();

			if (this._hits >= STEADY_FRAMES_REQUIRED) this._finishCapture();
		} finally {
			this._detecting = false;
		}
	}

	private async _judge(): Promise<ScanVerdict> {
		const canvas = this._drawStill();

		if (!canvas) return { state: "starting", hintKey: "verify.selfieCenter", ready: false };

		const visible = visibleRect(canvas.width, canvas.height);
		const oval = ovalRect(canvas.width, canvas.height);
		const scale = 416 / visible.width;
		const crop = this._crop || (this._crop = document.createElement("canvas"));

		crop.width = 416;
		crop.height = Math.max(1, Math.round(visible.height * scale));

		const ctx = crop.getContext("2d", { willReadFrequently: true });

		if (!ctx) return { state: "starting", hintKey: "verify.selfieCenter", ready: false };

		ctx.drawImage(canvas, visible.x, visible.y, visible.width, visible.height, 0, 0, crop.width, crop.height);

		const { data } = ctx.getImageData(0, 0, crop.width, crop.height);
		const lum = new Float32Array(crop.width * crop.height);

		for (let i = 0; i < lum.length; i += 1) {
			const p = i * 4;

			lum[i] = data[p] * 0.3 + data[p + 1] * 0.59 + data[p + 2] * 0.11;
		}

		const contrast = luminanceVariance(lum);

		try {
			const detections = await faceapi
				.detectAllFaces(crop, this._demo.faceEngine)
				.withFaceLandmarks(!this._demo.useSsdMobilenetv1);

			if (!detections.length) return judgeSelfie({ contrast, faces: [], oval });

			const best: any = this._demo.findBiggestFace(detections);
			const rawBox = best?.detection?.box || best?.alignedRect?.box || best?.box;

			if (!rawBox) return judgeSelfie({ contrast, faces: [], oval });

			const faceInVideo: Rect = {
				x: visible.x + rawBox.x / scale,
				y: visible.y + rawBox.y / scale,
				width: rawBox.width / scale,
				height: rawBox.height / scale,
			};

			return judgeSelfie({
				angle: best?.angle || null,
				contrast,
				faces: [faceInVideo],
				oval,
			});
		} catch {
			return judgeSelfie({ contrast, faces: [], oval });
		}
	}

	private _finishCapture(): void {
		const canvas = this._drawStill();

		if (!canvas) return;

		this._capturing = true;
		this._alive = false;
		this._stop();

		const visible = visibleRect(canvas.width, canvas.height);
		const size = Math.min(canvas.width, canvas.height);
		const sx = Math.round((canvas.width - size) / 2);
		const sy = Math.round((canvas.height - size) / 2);
		const outSize = Math.min(720, Math.max(480, size));

		const rawCanvas = document.createElement("canvas");
		rawCanvas.width = outSize;
		rawCanvas.height = outSize;
		rawCanvas.getContext("2d")?.drawImage(canvas, sx, sy, size, size, 0, 0, outSize, outSize);

		const previewH = Math.min(720, Math.max(320, Math.round(visible.height)));
		const previewW = Math.max(240, Math.round(previewH * (visible.width / visible.height)));
		const mirrorCanvas = document.createElement("canvas");
		mirrorCanvas.width = previewW;
		mirrorCanvas.height = previewH;
		const mCtx = mirrorCanvas.getContext("2d");
		if (mCtx) {
			mCtx.translate(previewW, 0);
			mCtx.scale(-1, 1);
			mCtx.drawImage(canvas, visible.x, visible.y, visible.width, visible.height, 0, 0, previewW, previewH);
		}

		const rawDataUrl = rawCanvas.toDataURL("image/jpeg", 0.92);
		const base64 = rawDataUrl.replace(/^data:.*;base64,/, "");

		this.capturedPreview = mirrorCanvas.toDataURL("image/jpeg", 0.9);
		this.framed = true;
		this.progress = 1;
		this.hintKey = "verify.selfieCaptured";
		this._cdr.markForCheck();

		this.captured.emit({
			base64Image: base64,
			face: base64,
			front: true,
			inputMethod: "CAMERA",
			rawImage: rawDataUrl,
			source: "face",
		});
	}

	private _drawStill(): HTMLCanvasElement | null {
		const video = this.videoRef?.nativeElement;
		const canvas = this.stillRef?.nativeElement;

		if (!video || !canvas || !video.videoWidth) return null;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

		return canvas;
	}

	private _stop(): void {
		if (this._timer) clearTimeout(this._timer);

		this._timer = null;
		this._stream?.getTracks().forEach((track) => track.stop());
		this._stream = null;
	}
}

