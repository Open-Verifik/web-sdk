import { Injectable } from "@angular/core";

import { PromptTemplate } from "app/core/models/prompt-template.model";
import { parseDataCode } from "./colombian-pdf417-parser";

const PHYSICAL_CEDULA = new Set(["CC", "CO:1993_CC"]);
const STABLE_READS = 3;
const CONTINUE_ATTEMPT = 4;
const READER_OPTIONS = {
	formats: ["PDF417", "CompactPDF417"],
	maxNumberOfSymbols: 1,
	tryHarder: true,
};

type BarcodeReader = {
	prepareZXingModule: (options?: { overrides?: { locateFile?: (path: string, prefix: string) => string } }) => Promise<unknown> | void;
	readBarcodesFromImageData: (
		image: { data: Uint8ClampedArray; width: number; height: number; colorSpace: "srgb" },
		options: typeof READER_OPTIONS
	) => Promise<Array<{ bytes?: Uint8Array; isValid?: boolean }>>;
};

export type BarcodeCaptureDecision = {
	accept: boolean;
	attempts: number;
	hintKey: string | null;
	image: string;
};

export type BarcodeCheckInput = {
	documentValidation?: { documentType?: unknown; OCRExtraction?: { documentType?: unknown } };
	promptTemplate?: PromptTemplate | null;
	side: "back" | "front";
};

@Injectable({ providedIn: "root" })
export class ColombianBarcodeReadinessService {
	hintKey: string | null = null;
	hintParams: { attempt?: number } = {};
	ready = false;

	private _attempts = 0;
	private _canvas: HTMLCanvasElement | null = null;
	private _scaledCanvas: HTMLCanvasElement | null = null;
	private _lastGoodFrame: string | null = null;
	private _reader: Promise<BarcodeReader> | null = null;
	private _streak: string[] = [];

	reset(): void {
		this._attempts = 0;
		this._lastGoodFrame = null;
		this._streak = [];
		this.hintKey = null;
		this.hintParams = {};
		this.ready = false;
	}

	shouldCheck(input: BarcodeCheckInput): boolean {
		if (input.side !== "back") return false;

		const candidates = [
			input.promptTemplate?.documentType,
			input.documentValidation?.documentType,
			input.documentValidation?.OCRExtraction?.documentType,
		];

		return candidates.some((candidate) => PHYSICAL_CEDULA.has(documentTypeCode(candidate)));
	}

	async sampleVideo(video: HTMLVideoElement): Promise<void> {
		if (!video.videoWidth || !video.videoHeight) return;

		const canvas = this._drawingCanvas(video.videoWidth, video.videoHeight);
		const context = canvas.getContext("2d", { willReadFrequently: true });

		if (!context) return;

		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		await this._noteCanvas(canvas, context);
	}

	async sampleCanvas(source: HTMLCanvasElement): Promise<void> {
		const context = source.getContext("2d", { willReadFrequently: true });

		if (!context || !source.width || !source.height) return;

		await this._noteCanvas(source, context);
	}

	async evaluateStill(image: string): Promise<BarcodeCaptureDecision> {
		const documentNumber = await this._decodeBase64(image);

		if (documentNumber) {
			this._attempts += 1;
			this.ready = true;
			this.hintKey = "smart_enroll.barcode.readable";
			this.hintParams = { attempt: this._attempts };

			return { accept: true, attempts: this._attempts, hintKey: this.hintKey, image: stripDataUrl(image) };
		}

		return this._miss(image);
	}

	async evaluateShutter(image: string): Promise<BarcodeCaptureDecision> {
		if (this.ready && this._lastGoodFrame) {
			this._attempts += 1;
			this.hintKey = "smart_enroll.barcode.readable";
			this.hintParams = { attempt: this._attempts };

			return { accept: true, attempts: this._attempts, hintKey: this.hintKey, image: this._lastGoodFrame };
		}

		const documentNumber = await this._decodeBase64(image);

		this._rememberRead(documentNumber, documentNumber ? stripDataUrl(image) : null);

		if (this.ready && this._lastGoodFrame) {
			this._attempts += 1;
			this.hintParams = { attempt: this._attempts };

			return { accept: true, attempts: this._attempts, hintKey: this.hintKey, image: this._lastGoodFrame };
		}

		if (documentNumber) {
			return { accept: false, attempts: this._attempts, hintKey: this.hintKey, image: stripDataUrl(image) };
		}

		return this._miss(image);
	}

	private async _noteCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): Promise<void> {
		const direct = await this._readImageData(context.getImageData(0, 0, canvas.width, canvas.height));
		const documentNumber = direct || (await this._readScaled(canvas));
		const frame = documentNumber ? stripDataUrl(canvas.toDataURL("image/jpeg", 0.92)) : null;

		this._rememberRead(documentNumber, frame);
	}

	private _rememberRead(documentNumber: string | null, frame: string | null): void {
		if (!documentNumber) {
			this._streak = [];
			this.ready = false;
			if (!this.hintKey || this.hintKey === "smart_enroll.barcode.readable") this.hintKey = "smart_enroll.barcode.hold_steady";

			return;
		}

		const last = this._streak[this._streak.length - 1];

		this._streak = last === documentNumber ? [...this._streak, documentNumber] : [documentNumber];
		if (this._streak.length > STABLE_READS) this._streak = this._streak.slice(-STABLE_READS);
		if (frame) this._lastGoodFrame = frame;

		this.ready = this._streak.length >= STABLE_READS;
		this.hintKey = this.ready ? "smart_enroll.barcode.readable" : "smart_enroll.barcode.hold_steady";
		this.hintParams = { attempt: this._attempts };
	}

	private _miss(image: string): BarcodeCaptureDecision {
		this._attempts += 1;
		this.ready = false;
		this._streak = [];
		const accept = this._attempts >= CONTINUE_ATTEMPT;

		this.hintKey = accept ? "smart_enroll.barcode.continue_without_validation" : "smart_enroll.barcode.retry";
		this.hintParams = { attempt: this._attempts };

		return { accept, attempts: this._attempts, hintKey: this.hintKey, image: stripDataUrl(image) };
	}

	private async _decodeBase64(image: string): Promise<string | null> {
		const canvas = await loadImage(image);

		if (!canvas) return null;

		const context = canvas.getContext("2d", { willReadFrequently: true });

		if (!context) return null;

		const direct = await this._readImageData(context.getImageData(0, 0, canvas.width, canvas.height));

		return direct || this._readScaled(canvas);
	}

	private async _readScaled(canvas: HTMLCanvasElement): Promise<string | null> {
		if (!this._scaledCanvas) this._scaledCanvas = document.createElement("canvas");

		const scaled = this._scaledCanvas;

		scaled.width = canvas.width * 2;
		scaled.height = canvas.height * 2;

		const context = scaled.getContext("2d", { willReadFrequently: true });

		if (!context) return null;

		context.imageSmoothingEnabled = true;
		context.imageSmoothingQuality = "high";
		context.drawImage(canvas, 0, 0, scaled.width, scaled.height);

		return this._readImageData(context.getImageData(0, 0, scaled.width, scaled.height));
	}

	private async _readImageData(imageData: ImageData): Promise<string | null> {
		try {
			const reader = await this._loadReader();
			const results = await reader.readBarcodesFromImageData(
				{ colorSpace: "srgb", data: imageData.data, height: imageData.height, width: imageData.width },
				READER_OPTIONS
			);
			const hit = (results || []).find((result) => result?.isValid && result.bytes?.length);

			if (!hit?.bytes) return null;

			const text = new TextDecoder("iso-8859-1").decode(hit.bytes);

			return parseDataCode(text)?.documentNumber || null;
		} catch {
			return null;
		}
	}

	private _loadReader(): Promise<BarcodeReader> {
		if (!this._reader) {
			this._reader = import("zxing-wasm/reader").then(async (mod) => {
				const reader = mod as BarcodeReader;

				await reader.prepareZXingModule({
					overrides: {
						locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? "assets/zxing_reader.wasm" : `${prefix}${path}`),
					},
				});

				return reader;
			});
		}

		return this._reader;
	}

	private _drawingCanvas(width: number, height: number): HTMLCanvasElement {
		if (!this._canvas) this._canvas = document.createElement("canvas");

		this._canvas.width = width;
		this._canvas.height = height;

		return this._canvas;
	}
}

const documentTypeCode = (value: unknown): string => {
	if (!value) return "";
	if (typeof value === "string") return value.trim().toUpperCase();
	if (typeof value === "object" && value && "code" in value) return `${(value as { code?: string }).code || ""}`.trim().toUpperCase();

	return "";
};

const stripDataUrl = (image: string): string => (image.includes(",") ? image.split(",")[1] : image);

const loadImage = (image: string): Promise<HTMLCanvasElement | null> =>
	new Promise((resolve) => {
		const element = new Image();

		element.onload = () => {
			const canvas = document.createElement("canvas");

			canvas.width = element.naturalWidth;
			canvas.height = element.naturalHeight;
			canvas.getContext("2d")?.drawImage(element, 0, 0);
			resolve(canvas.width ? canvas : null);
		};
		element.onerror = () => resolve(null);
		element.src = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
	});
