import { CommonModule } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import * as faceapi from "@vladmandic/face-api";
import { Subject } from "rxjs";

import { PromptTemplate } from "app/core/models/prompt-template.model";
import { ImageScan } from "app/modules/auth/project";
import { ColombianBarcodeReadinessService } from "app/modules/auth/smart-enroll/colombian-barcode-readiness.service";
import { DemoService } from "app/modules/demo/demo.service";
import {
	HINT_KEYS,
	Rect,
	ScanState,
	ScanVerdict,
	ShapeResult,
	aspectFor,
	findDocumentEdges,
	guideRect,
	judgeBack,
	judgeFront,
	judgeShape,
	laplacianVariance,
	luminanceVariance,
	visibleRect,
} from "./verify-scan";

@Component({
	selector: "verify-camera",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./verify-camera.component.html",
	styleUrls: ["./verify-camera.component.scss"],
})
export class VerifyCameraComponent implements OnInit, OnDestroy {
	/** `passport`, `license` or `government_id`: picks the frame shape and the shape the card must have. */
	@Input() category = "";
	@Input() checkBarcode = false;
	@Input() mode: "auto" | "manual" = "auto";
	@Input() promptTemplate: PromptTemplate | null = null;
	@Input() side: "front" | "back" = "front";

	@Output() captured = new EventEmitter<ImageScan>();
	@Output() permissionDenied = new EventEmitter<void>();

	@ViewChild("video") videoRef: ElementRef<HTMLVideoElement>;
	@ViewChild("still") stillRef: ElementRef<HTMLCanvasElement>;
	@ViewChild("faceCard") faceCardRef: ElementRef<HTMLCanvasElement>;

	/** What the auto scan sees right now. The shell shows `hintKey` and colours the frame from `state`. */
	state: ScanState = "starting";
	hintKey = HINT_KEYS.starting;
	/** True while the frame is good and we are counting frames before the shot. */
	framed = false;
	/** The card outline we found, in % of the camera well, so the screen can snap a frame onto it. */
	outline: { height: number; left: number; top: number; width: number } | null = null;
	outlineOk = false;

	private _alive = true;
	private _capturing = false;
	private _cardRect: Rect | null = null;
	private _detecting = false;
	private _hits = 0;
	private _lastFaces: Rect[] | null = null;
	private _misses = 0;
	private _crop: HTMLCanvasElement | null = null;
	private _probe: HTMLCanvasElement | null = null;
	private _stream: MediaStream | null = null;
	private _avgMs = 120;
	private _grid: HTMLCanvasElement | null = null;
	private _tick = 0;
	private _timer: ReturnType<typeof setTimeout> | null = null;
	private _weakHits = 0;
	private readonly _destroy$ = new Subject<void>();

	constructor(private _barcode: ColombianBarcodeReadinessService, private _demo: DemoService) {}

	ngOnInit(): void {
		this._start();
		window.addEventListener("keydown", this._onKey);
	}

	ngOnDestroy(): void {
		this._alive = false;
		window.removeEventListener("keydown", this._onKey);
		this._stop();
		this._destroy$.next();
		this._destroy$.complete();
	}

	shutter(): void {
		void this._capture("CAMERA");
	}

	private _onKey = (event: KeyboardEvent): void => {
		if (event.code !== "Space" || this.mode !== "manual") return;

		event.preventDefault();
		this.shutter();
	};

	private async _start(): Promise<void> {
		try {
			await this._demo.loadModels();
		} catch {
			// Manual shutter still works when the face model is unavailable.
		}

		try {
			this._stream = await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
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
		await video.play().catch(() => undefined);
		this._loop();
	}

	get aspect(): number {
		return aspectFor(this.category);
	}

	/**
	 * One scan at a time, paced by how long the last one took: a slow phone is asked for fewer scans instead of
	 * piling them up, and nothing runs while the tab is hidden.
	 */
	private _loop(): void {
		if (!this._alive) return;

		const delay = Math.min(900, Math.max(300, this._avgMs * 2));

		this._timer = setTimeout(async () => {
			const started = performance.now();

			if (!document.hidden) await this._watch();

			this._avgMs = this._avgMs * 0.7 + (performance.now() - started) * 0.3;
			this._loop();
		}, delay);
	}

	private async _watch(): Promise<void> {
		if (!this._alive || this._capturing) return;

		if (this.mode !== "auto") {
			this._show({ state: "manual", hintKey: HINT_KEYS.manual, ready: false });
			this.outline = null;
			this._hits = 0;
			this._weakHits = 0;
			return;
		}

		// The interval keeps ticking while a detection runs; never stack them.
		if (this._detecting) return;

		this._detecting = true;

		this._tick += 1;

		try {
			const result = await this._judge();

			if (!this._alive || this._capturing) return;

			// A round that skipped the face model says nothing new: keep the hint on screen instead of flipping it
			// between "looking" and the last real advice, and leave the weak-streak untouched.
			if (result.skipped) {
				this._hits = 0;

				const keepHint = !["starting", "steady", "manual", "searching"].includes(this.state);

				if (!keepHint || result.state === "noFace") this._show(result);

				return;
			}

			this._show(result);
			this._hits = result.ready ? this._hits + 1 : 0;
			// The card outline was not found but the face and image are fine: wait longer before trusting it. These rounds
			// come every few scans, so four in a row is about five seconds.
			this._weakHits = result.weak ? this._weakHits + 1 : 0;

			if (this._hits >= 3 || this._weakHits >= 4) void this._capture("CAMERA");
		} finally {
			this._detecting = false;
		}
	}

	private _show(result: ScanVerdict): void {
		this.state = result.state;
		this.hintKey = result.hintKey;
		this.framed = result.ready;
	}

	private async _judge(): Promise<ScanVerdict> {
		const canvas = this._drawStill();

		if (!canvas) return { state: "starting", hintKey: HINT_KEYS.starting, ready: false };

		const aspect = this.aspect;
		const guide = guideRect(canvas.width, canvas.height, aspect);
		const region = this._regionStats(canvas, guide);
		const shape = this._findShape(canvas, guide, aspect);

		if (this.side === "front") {
			// The face model is the expensive part. Run it when a card shape is in view, and only now and then otherwise.
			const worthChecking = (shape.found && shape.coverage >= 0.5) || this._tick % 3 === 0;
			const faces = worthChecking ? await this._detectFaces(canvas, guide) : undefined;

			if (faces && faces.length) this._lastFaces = faces;

			this._misses = faces === null || (faces && faces.length) ? 0 : this._misses + 1;

			return { ...judgeFront({ aspect, cardRect: this._cardRect, faces, guide, missesInARow: this._misses, region, shape }), skipped: faces === undefined };
		}

		if (this.checkBarcode && this._barcode.shouldCheck({ promptTemplate: this.promptTemplate, side: "back" })) {
			await this._barcode.sampleCanvas(canvas);

			if (this._barcode.ready) return { state: "steady", hintKey: HINT_KEYS.steady, ready: true };

			return { state: "back", hintKey: this._barcode.hintKey || HINT_KEYS.back, ready: false };
		}

		return judgeBack(region, shape, aspect);
	}

	/**
	 * Looks for the four card edges on a tiny grayscale copy of the area around the guide (256px wide), then
	 * publishes the outline so the screen can snap a frame onto the card.
	 */
	private _findShape(canvas: HTMLCanvasElement, guide: Rect, aspect: number): ShapeResult {
		const pad = 0.3;
		const x = Math.max(0, guide.x - guide.width * pad);
		const y = Math.max(0, guide.y - guide.height * pad);
		const width = Math.min(canvas.width - x, guide.width * (1 + pad * 2));
		const height = Math.min(canvas.height - y, guide.height * (1 + pad * 2));
		const gridWidth = 256;
		const scale = gridWidth / width;
		const gridHeight = Math.max(16, Math.round(height * scale));
		const grid = this._grid || (this._grid = document.createElement("canvas"));

		grid.width = gridWidth;
		grid.height = gridHeight;

		const context = grid.getContext("2d", { willReadFrequently: true });

		if (!context) return { found: false, aspect: 0, coverage: 0, offsetX: 0, offsetY: 0, rect: { x: 0, y: 0, width: 0, height: 0 } };

		context.drawImage(canvas, x, y, width, height, 0, 0, gridWidth, gridHeight);

		const { data } = context.getImageData(0, 0, gridWidth, gridHeight);
		const luminance = new Float32Array(gridWidth * gridHeight);

		for (let index = 0; index < luminance.length; index += 1) {
			const offset = index * 4;

			luminance[index] = data[offset] * 0.3 + data[offset + 1] * 0.59 + data[offset + 2] * 0.11;
		}

		const guideInGrid = { x: (guide.x - x) * scale, y: (guide.y - y) * scale, width: guide.width * scale, height: guide.height * scale };
		const shape = findDocumentEdges(luminance, gridWidth, gridHeight, guideInGrid, aspect);

		if (!shape.found) {
			this.outline = null;
			this.outlineOk = false;
			this._cardRect = null;

			return shape;
		}

		// grid pixels -> video pixels -> percentages of the visible well
		const visible = visibleRect(canvas.width, canvas.height);
		const toVideoX = (value: number): number => x + value / scale;
		const toVideoY = (value: number): number => y + value / scale;
		const videoRect: Rect = {
			x: toVideoX(shape.rect.x),
			y: toVideoY(shape.rect.y),
			width: shape.rect.width / scale,
			height: shape.rect.height / scale,
		};

		this.outline = {
			left: ((videoRect.x - visible.x) / visible.width) * 100,
			top: ((videoRect.y - visible.y) / visible.height) * 100,
			width: (videoRect.width / visible.width) * 100,
			height: (videoRect.height / visible.height) * 100,
		};
		this.outlineOk = judgeShape(shape, aspect).ok;
		this._cardRect = this.outlineOk ? videoRect : null;

		return shape;
	}

	/**
	 * Face boxes in video pixels, or `null` when the face model could not run.
	 *
	 * The detector shrinks whatever it gets to ~416px. The photo on an ID is small, so on a full 1280px frame it shrank to
	 * a few pixels and was never found. Looking only at the area around the guide keeps it large enough to detect.
	 */
	private async _detectFaces(canvas: HTMLCanvasElement, guide: Rect): Promise<Rect[] | null> {
		const margin = 0.08;
		const x = Math.max(0, guide.x - guide.width * margin);
		const y = Math.max(0, guide.y - guide.height * margin);
		const width = Math.min(canvas.width - x, guide.width * (1 + margin * 2));
		const height = Math.min(canvas.height - y, guide.height * (1 + margin * 2));
		const scale = 512 / width;
		const crop = this._crop || (this._crop = document.createElement("canvas"));

		crop.width = 512;
		crop.height = Math.max(1, Math.round(height * scale));
		crop.getContext("2d")?.drawImage(canvas, x, y, width, height, 0, 0, crop.width, crop.height);

		try {
			const detections = await faceapi.detectAllFaces(crop, this._demo.faceEngine);

			// Plain detections carry `box`; only landmark results add `alignedRect`. Reading `alignedRect` alone made every
			// frame look empty, so auto capture never fired. Filter out low-confidence partial detections.
			return detections
				.filter((detection: any) => (detection.score ?? detection.detection?.score ?? 1) >= 0.45)
				.map((detection: any) => {
					const box = detection.alignedRect?.box || detection.box;

					return { x: x + box.x / scale, y: y + box.y / scale, width: box.width / scale, height: box.height / scale };
				});
		} catch {
			return null;
		}
	}

	private async _capture(inputMethod: ImageScan["inputMethod"]): Promise<void> {
		if (!this._alive || this._capturing) return;

		const canvas = this._drawStill();

		if (!canvas) return;

		this._capturing = true;
		this._alive = false;
		this._stop();

		// Crop tightly to the detected card (or the guide frame) with a small border margin so Review and OCR only see the ID.
		const cardCanvas = this._cropDocument(canvas);
		const raw = cardCanvas.toDataURL("image/jpeg", 0.92);
		let base64 = raw.replace(/^data:.*;base64,/, "");
		let face: string | undefined;
		let barcodeReadAttempts: number | undefined;

		if (this.side === "front") face = await this._cropFace(raw, canvas);

		if (this.side === "back" && this.checkBarcode && this._barcode.shouldCheck({ promptTemplate: this.promptTemplate, side: "back" })) {
			const decision = await this._barcode.evaluateShutter(raw);

			barcodeReadAttempts = decision.attempts;

			if (!decision.accept) {
				this._capturing = false;
				this._alive = true;
				this._hits = 0;
				void this._start();
				return;
			}

			base64 = decision.image;
		}

		this.captured.emit({
			barcodeReadAttempts,
			base64Image: base64,
			face,
			front: this.side === "front",
			inputMethod,
			rawImage: raw,
			source: "document",
		});
	}

	/** Crops the video frame to the detected card rectangle (or the guide frame) plus a 6% border margin. */
	private _cropDocument(canvas: HTMLCanvasElement): HTMLCanvasElement {
		const target = this._cardRect || guideRect(canvas.width, canvas.height, this.aspect);
		const padX = target.width * 0.06;
		const padY = target.height * 0.06;
		const x = Math.max(0, Math.round(target.x - padX));
		const y = Math.max(0, Math.round(target.y - padY));
		const width = Math.min(canvas.width - x, Math.max(1, Math.round(target.width + padX * 2)));
		const height = Math.min(canvas.height - y, Math.max(1, Math.round(target.height + padY * 2)));
		const out = document.createElement("canvas");

		out.width = width;
		out.height = height;
		out.getContext("2d")?.drawImage(canvas, x, y, width, height, 0, 0, width, height);

		return out;
	}

	private async _cropFace(raw: string, fullCanvas?: HTMLCanvasElement): Promise<string | undefined> {
		const image = new Image();

		image.src = raw;
		await image.decode().catch(() => undefined);

		const cutCanvas = this.faceCardRef?.nativeElement || document.createElement("canvas");

		try {
			let detections: any[] = [];
			try {
				detections = await faceapi.detectAllFaces(image, this._demo.faceEngine).withFaceLandmarks(!this._demo.useSsdMobilenetv1);
			} catch {
				detections = [];
			}

			if (!detections?.length) {
				detections = await faceapi.detectAllFaces(image, this._demo.faceEngine);
			}

			const found: any = detections?.length ? this._demo.findBiggestFace(detections) : null;
			const box = found?.alignedRect?.box || found?.detection?.box || found?.box;

			if (box) {
				const cropped = this._demo.cutFaceIdCard(image, box, cutCanvas);
				const clean = String(cropped || "").replace(/^data:.*;base64,/, "");
				if (clean) return clean;
			}
		} catch {
			// Fall back to the last face rect detected during live framing
		}

		if (this._lastFaces?.length && fullCanvas) {
			const best = this._lastFaces.reduce((acc, r) => (r.width * r.height > acc.width * acc.height ? r : acc), this._lastFaces[0]);
			const ctx = cutCanvas.getContext("2d");
			if (ctx) {
				const width = Math.min(fullCanvas.width, Math.max(1, Math.ceil(best.width * 2)));
				const height = Math.min(fullCanvas.height, Math.max(1, Math.ceil(best.height * 2)));
				const sx = Math.max(0, Math.min(fullCanvas.width - width, Math.floor(best.x - best.width / 2)));
				const sy = Math.max(0, Math.min(fullCanvas.height - height, Math.floor(best.y - best.height / 2)));

				cutCanvas.width = width;
				cutCanvas.height = height;
				ctx.drawImage(fullCanvas, sx, sy, width, height, 0, 0, width, height);

				const cropped = cutCanvas.toDataURL("image/jpeg", 0.9);
				return String(cropped || "").replace(/^data:.*;base64,/, "") || undefined;
			}
		}

		return undefined;
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

	/** Contrast and sharpness of the pixels inside the guide, measured on a small copy to stay cheap. */
	private _regionStats(canvas: HTMLCanvasElement, guide: Rect): { contrast: number; sharpness: number } {
		const width = 160;
		const height = Math.max(1, Math.round((width * guide.height) / guide.width));
		const probe = this._probe || (this._probe = document.createElement("canvas"));

		probe.width = width;
		probe.height = height;

		const context = probe.getContext("2d", { willReadFrequently: true });

		if (!context) return { contrast: 0, sharpness: 0 };

		context.drawImage(canvas, guide.x, guide.y, guide.width, guide.height, 0, 0, width, height);

		const { data } = context.getImageData(0, 0, width, height);
		const luminance = new Float32Array(width * height);

		for (let index = 0; index < luminance.length; index += 1) {
			const offset = index * 4;

			luminance[index] = data[offset] * 0.3 + data[offset + 1] * 0.59 + data[offset + 2] * 0.11;
		}

		return { contrast: luminanceVariance(luminance), sharpness: laplacianVariance(luminance, width, height) };
	}

	private _stop(): void {
		if (this._timer) clearTimeout(this._timer);

		this._timer = null;
		this._stream?.getTracks().forEach((track) => track.stop());
		this._stream = null;
	}
}
