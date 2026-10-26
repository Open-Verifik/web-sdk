import { CommonModule } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import * as faceapi from "@vladmandic/face-api";
import { Subject } from "rxjs";

import { PromptTemplate } from "app/core/models/prompt-template.model";
import { ImageScan } from "app/modules/auth/project";
import { ColombianBarcodeReadinessService } from "app/modules/auth/smart-enroll/colombian-barcode-readiness.service";
import { DemoService } from "app/modules/demo/demo.service";

@Component({
	selector: "verify-camera",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./verify-camera.component.html",
	styleUrls: ["./verify-camera.component.scss"],
})
export class VerifyCameraComponent implements OnInit, OnDestroy {
	@Input() checkBarcode = false;
	@Input() mode: "auto" | "manual" = "auto";
	@Input() promptTemplate: PromptTemplate | null = null;
	@Input() side: "front" | "back" = "front";

	@Output() captured = new EventEmitter<ImageScan>();
	@Output() permissionDenied = new EventEmitter<void>();

	@ViewChild("video") videoRef: ElementRef<HTMLVideoElement>;
	@ViewChild("still") stillRef: ElementRef<HTMLCanvasElement>;
	@ViewChild("faceCard") faceCardRef: ElementRef<HTMLCanvasElement>;

	framed = false;

	private _alive = true;
	private _capturing = false;
	private _hits = 0;
	private _stream: MediaStream | null = null;
	private _timer: ReturnType<typeof setInterval> | null = null;
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
		this._timer = setInterval(() => void this._watch(), 350);
	}

	private async _watch(): Promise<void> {
		if (!this._alive || this._capturing || this.mode !== "auto") return;

		const ready = await this._frameIsReady();

		if (!this._alive || this._capturing) return;

		this.framed = ready;
		this._hits = ready ? this._hits + 1 : 0;

		if (this._hits >= 3) void this._capture("CAMERA");
	}

	private async _frameIsReady(): Promise<boolean> {
		const canvas = this._drawStill();

		if (!canvas) return false;
		if (this.side === "front") return this._frontIsReady(canvas);

		if (this.checkBarcode && this._barcode.shouldCheck({ promptTemplate: this.promptTemplate, side: "back" })) {
			await this._barcode.sampleCanvas(canvas);
			return this._barcode.ready;
		}

		return this._contrast(canvas) > 350;
	}

	private async _frontIsReady(canvas: HTMLCanvasElement): Promise<boolean> {
		try {
			const detections = await faceapi.detectAllFaces(canvas, this._demo.faceEngine);
			const face = this._demo.findBiggestFace(detections);

			if (face?.alignedRect?.box?.width > 36) return true;
		} catch {
			return this._contrast(canvas) > 350;
		}

		return false;
	}

	private async _capture(inputMethod: ImageScan["inputMethod"]): Promise<void> {
		if (!this._alive || this._capturing) return;

		const canvas = this._drawStill();

		if (!canvas) return;

		this._capturing = true;
		this._alive = false;
		this._stop();

		const raw = canvas.toDataURL("image/jpeg", 0.92);
		let base64 = raw.replace(/^data:.*;base64,/, "");
		let face: string | undefined;
		let barcodeReadAttempts: number | undefined;

		if (this.side === "front") face = await this._cropFace(raw);

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

	private async _cropFace(raw: string): Promise<string | undefined> {
		const image = new Image();

		image.src = raw;
		await image.decode().catch(() => undefined);

		try {
			const detections = await faceapi.detectAllFaces(image, this._demo.faceEngine).withFaceLandmarks(!this._demo.useSsdMobilenetv1);
			const found = this._demo.findBiggestFace(detections);

			if (!found || !this.faceCardRef) return undefined;

			const cropped = this._demo.cutFaceIdCard(image, found.alignedRect.box, this.faceCardRef.nativeElement);

			return String(cropped || "").replace(/^data:.*;base64,/, "") || undefined;
		} catch {
			return undefined;
		}
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

	private _contrast(canvas: HTMLCanvasElement): number {
		const context = canvas.getContext("2d", { willReadFrequently: true });

		if (!context) return 0;

		const width = Math.floor(canvas.width * 0.6);
		const height = Math.floor(canvas.height * 0.5);
		const data = context.getImageData(Math.floor(canvas.width * 0.2), Math.floor(canvas.height * 0.25), width, height).data;
		let sum = 0;
		let sumSq = 0;
		let count = 0;

		for (let index = 0; index < data.length; index += 16) {
			const luminance = data[index] * 0.3 + data[index + 1] * 0.59 + data[index + 2] * 0.11;

			sum += luminance;
			sumSq += luminance * luminance;
			count += 1;
		}

		if (!count) return 0;

		const mean = sum / count;

		return sumSq / count - mean * mean;
	}

	private _stop(): void {
		if (this._timer) clearInterval(this._timer);

		this._timer = null;
		this._stream?.getTracks().forEach((track) => track.stop());
		this._stream = null;
	}
}
