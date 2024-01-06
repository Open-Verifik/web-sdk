import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as cocoSSD from "@tensorflow-models/coco-ssd";
import { WebSdkService } from "../web-sdk.service";
import { FormBuilder } from "@angular/forms";

@Component({
	selector: "app-scan",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./scan.component.html",
	styleUrls: ["./scan.component.scss"],
})
export class ScanComponent implements OnInit {
	@ViewChild("video", { static: false }) public video: ElementRef;
	@ViewChild("canvas", { static: false }) public canvasRef: ElementRef;
	loadingModel: boolean;

	//ACTIVE DEBUG GRAPHIC MODE
	isActiveDebug: Boolean;
	debugIndex: number;
	debugText: string = "debug";
	stream: MediaStream;
	modelCOCO: cocoSSD.ObjectDetection;

	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		private _sdkService: WebSdkService,
		private _formBuilder: FormBuilder // private dialogRef: MatDialogRef<SDK>
	) {
		this.loadingModel = true;

		document.addEventListener("keydown", (event) => {
			if (this.debugText.charAt(this.debugIndex) === event.key.toLowerCase()) {
				if (this.debugIndex === 3) {
					this.isActiveDebug = !this.isActiveDebug;

					localStorage.setItem("isActiveDebug", this.isActiveDebug.toString());
					this._changeDetectorRef.markForCheck();
				}
				return this.debugIndex++;
			}
			this.debugIndex = 0;
		});

		this._changeDetectorRef.markForCheck();
	}
	async ngOnInit() {
		await this.loadModels();
		await this.startAsyncVideo();
	}

	async loadModels(): Promise<void> {
		this.modelCOCO = await cocoSSD.load({ base: "lite_mobilenet_v2" });
	}

	async startAsyncVideo() {
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
				audio: false,
			});

			this.loadingModel = false;

			this.modelCOCO.detect(this.video.nativeElement).then((predictions) => {
				this.renderPredictions(predictions);
			});
		} catch (error) {
			console.error("SHOW ERROR", { error });
		}
	}

	renderPredictions = (predictions) => {
		if (typeof document !== "undefined") {
			const canvas = <HTMLCanvasElement>document.getElementById("canvas");
			let ctx;
			let font;
			if (canvas) {
				ctx = canvas.getContext("2d");
				canvas.width = 300;
				canvas.height = 300;
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				// Font options.
				font = "16px sans-serif";
				ctx.font = font;
				ctx.textBaseline = "top";
				ctx.drawImage(this.video, 0, 0, 300, 350);
			}

			predictions.forEach((prediction) => {
				const x = prediction.bbox[0];
				const y = prediction.bbox[1];
				const width = prediction.bbox[2];
				const height = prediction.bbox[3];
				// Draw the bounding box.
				ctx.strokeStyle = "#00FFFF";
				ctx.lineWidth = 2;
				ctx.strokeRect(x, y, width, height);
				// Draw the label background.
				ctx.fillStyle = "#00FFFF";
				const textWidth = ctx.measureText(prediction.class).width;
				const textHeight = parseInt(font, 10); // base 10
				ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
			});

			predictions.forEach((prediction) => {
				const x = prediction.bbox[0];
				const y = prediction.bbox[1];
				// Draw the text last to ensure it's on top.
				ctx.fillStyle = "#000000";
				ctx.fillText(prediction.class, x, y);
			});
		}
	};
}
