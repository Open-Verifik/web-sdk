import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	inject,
	Input,
	OnDestroy,
	Output,
	ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { HumanIdResult } from "./verify-flow";

type CopyState = "idle" | "copied" | "failed";

let lastAnnouncedCopyMessage = "";

/** Writes text or PNG QR data URLs with the Async Clipboard API; falls back to execCommand for embedded or non-secure contexts. */
const writeToClipboard = async (value: string, asQrImage: boolean): Promise<boolean> => {
	if (asQrImage && value.startsWith("data:image/") && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
		try {
			const response = await fetch(value);
			const blob = await response.blob();
			await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
			return true;
		} catch {
			// Fall back to copying the data URL text below if image clipboard write is denied or unsupported.
		}
	}

	try {
		await navigator.clipboard.writeText(value);

		return true;
	} catch {
		const field = Object.assign(document.createElement("textarea"), { value });

		field.setAttribute("readonly", "");
		field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
		document.body.append(field);
		field.select();

		try {
			return document.execCommand("copy");
		} finally {
			field.remove();
		}
	}
};

/**
 * Final HumanAuthn screen: the enrollee gets their HumanID once (encrypted string or QR).
 * Verifik never keeps the face; the HumanID is the public key they use to come back.
 */
@Component({
	selector: "verify-human-id",
	standalone: true,
	imports: [CommonModule, TranslocoModule],
	templateUrl: "./verify-human-id.component.html",
	styleUrls: ["./verify-human-id.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyHumanIdComponent implements AfterViewInit, OnDestroy {
	private _cdr = inject(ChangeDetectorRef);
	private _transloco = inject(TranslocoService);
	private _feedbackTimer?: ReturnType<typeof setTimeout>;
	private _rafId?: number;

	@ViewChild("titleEl") titleEl?: ElementRef<HTMLHeadingElement>;

	@Input({ required: true }) result!: HumanIdResult;
	@Input() publicDataKeys: string[] = [];
	@Input() projectName = "";
	@Input() showContinue = true;
	@Output() continued = new EventEmitter<void>();

	copyState: CopyState = "idle";
	statusMessage = "";

	ngAfterViewInit(): void {
		this.titleEl?.nativeElement.focus({ preventScroll: true });
	}

	get isQr(): boolean {
		return this.result.outputFormat === "qrCode";
	}

	get storageKey(): string {
		return `verify.humanIdStorage_${this.result.storage}`;
	}

	get downloadName(): string {
		return this.isQr ? "human-id-qr.png" : "human-id.txt";
	}

	/** Object URL for the text download; released when replaced or destroyed. */
	private _textUrl = "";

	get downloadHref(): string {
		if (this.isQr) return this.result.value;

		if (!this._textUrl) {
			this._textUrl = URL.createObjectURL(new Blob([this.result.value], { type: "text/plain;charset=utf-8" }));
		}

		return this._textUrl;
	}

	async copy(): Promise<void> {
		const copied = await writeToClipboard(this.result.value, this.isQr);

		clearTimeout(this._feedbackTimer);
		if (this._rafId != null) cancelAnimationFrame(this._rafId);

		let message = this._transloco.translate(copied ? "verify.humanIdCopied" : "verify.humanIdCopyFailed");
		if (message === lastAnnouncedCopyMessage) {
			message += "\u00A0";
		}
		lastAnnouncedCopyMessage = message;

		this.copyState = "idle";
		this.statusMessage = "";
		this._cdr.detectChanges();

		this.copyState = copied ? "copied" : "failed";
		this._cdr.markForCheck();

		this._rafId = requestAnimationFrame(() => {
			this.statusMessage = message;
			this._cdr.markForCheck();
		});

		this._feedbackTimer = setTimeout(() => {
			this.copyState = "idle";
			this.statusMessage = "";
			this._cdr.markForCheck();
		}, 2000);
	}

	ngOnDestroy(): void {
		clearTimeout(this._feedbackTimer);
		if (this._rafId != null) cancelAnimationFrame(this._rafId);
		if (this._textUrl) URL.revokeObjectURL(this._textUrl);
	}
}
