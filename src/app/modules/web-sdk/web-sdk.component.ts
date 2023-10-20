import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
// import * as faceapi from "face-api.js";
// const tf = require('@tensorflow/tfjs-node')
// import * as coco from '@tensorflow-models/coco-ssd';
import * as faceapi from "@vladmandic/face-api";
import { Subject } from "rxjs";
import { FormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { WebSdkService } from "./web-sdk.service";
import { MatDialogRef, MatDialogModule, MatDialog } from "@angular/material/dialog";
import { TranslocoModule } from "@ngneat/transloco";


@Component({
	selector: "app-web-sdk",
	standalone: true,
	imports: [CommonModule, FormsModule, MatDialogModule, TranslocoModule],
	templateUrl: "./web-sdk.component.html",
	styleUrls: ["./web-sdk.component.scss"],
})
export class WebSdkComponent implements OnInit, OnDestroy {
	//INPUTS
	@Input() action;
	@Input() collectionId;
	@Input() personId;

	@ViewChild("video", { static: false }) public video: ElementRef;
	@ViewChild("canvas", { static: false }) public canvasRef: ElementRef;

	//DEFAULT CONFIG
	config = {
		addPerson: {
			totalImages: 3,
			stopRecord: true,
		},
		search: {
			totalImages: 3,
			stopRecord: false,
		},
		searchLiveFace: {
			totalImages: 1,
			stopRecord: true,
		},
		detect: {
			totalImages: 1,
			stopRecord: false,
		},
		liveness: {
			totalImages: 1,
			stopRecord: true,
		},
		verify: {
			totalImages: 3,
			stopRecord: false,
		},
	};

	loadingResults = false;
	loading = false;
	loadingStream = false;
	step: number = 0;
	stream: any;
	detection: any;
	private _unsubscribeAll: Subject<any> = new Subject<any>();

	// resizedDetections: any;
	canvas: any;
	canvasEl: any;
	displaySize: any;
	videoInput: HTMLVideoElement; // Explicitly type videoInput as HTMLVideoElement
	base64Images: any[];

	//SIZE OF CANVAS
	WIDTH = 720;
	HEIGHT = 1280;
	videoCenterX = this.WIDTH / 2;
	videoCenterY = this.HEIGHT / 2;
	marginX = 40;
	marginY = 80;

	faceError: {
		title: string;
		subtitle: string;
	} | null;
	detectFaceInterval: any;
	saveImageBase64Intent: any;

	personForm: FormGroup;

	//ACTIVE DEBUG GRAPHIC MODE
	isActiveDebug: Boolean;
	debugIndex: number;
	debugText: string = "debug";

	osInfo: string;

	//RESULTS
	livenessScore: any;
	personSearch: any;
	personsDetect: any;
	personLiveness: any;
	personVerify: any;
	personCreated: any;
	errorResult: {};
	loadingModel: boolean;

	constructor(
		private _changeDetectorRef: ChangeDetectorRef,
		private _sdkService: WebSdkService,
		private _formBuilder: FormBuilder // private dialogRef: MatDialogRef<SDK>
	) {
		this.debugIndex = 0;
		this.step = 0;
		this.isActiveDebug = Boolean(localStorage.getItem("isActiveDebug"));
		this.livenessScore = null;
		this.osInfo = this.detectOS();
		this.personCreated = null;
		this.personSearch = null;
		this.personsDetect = null;
		this.personLiveness = null;
		this.personVerify = null;
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

	initFormPerson() {
		this.personForm = this._formBuilder.group({
			name: ["", Validators.required],
			nationality: [""],
			date_of_birth: ["", Validators.required],
			gender: ["", Validators.required],
			notes: [""],
		});
	}

	addPerson() {
		if (this.loadingResults) return;

		if (this.personForm.valid && this.base64Images.length > 2) {
			const formValues: any = this.personForm.value;
			formValues.collections = [this.collectionId];
			formValues.images = this.base64Images;

			this.loadingResults = true;

			this._sdkService.addPerson(formValues).subscribe(
				(person) => {
					this.personCreated = person.data;
					this.completeResults();
					// this.dialogRef.close();
				},
				(error) => {
					this.errorResult = {
						status: error.error?.code,
						message: error.error?.message,
					};
					console.error("sdkService.addPerson");
					this.completeResults();
				}
			);
		}
	}

	search() {
		if (this.loadingResults) return;

		const payload: any = {
			images: this.base64Images,
			collection_id: this.collectionId,
			min_score: 0.7,
			search_mode: "ACCURATE",
		};

		this.loadingResults = true;

		this._sdkService.search(payload).subscribe(
			(searchResult) => {
				this.personSearch = searchResult.data;
				this.errorResult = null;
				this.loadingResults = false;
				this.completeResults();
			},
			(error) => {
				this.errorResult = {
					status: error.error?.code,
					message: error.error?.message,
				};
				console.error("sdkService.search");
				this.completeResults();
			}
		);
	}

	searchLiveFace() {
		if (this.loadingResults) return;

		const payload: any = {
			image: this.base64Images[0],
			collection_id: this.collectionId,
			os: this.osInfo,
			liveness_min_score: 0.7,
			min_score: 0.7,
			search_mode: "ACCURATE",
		};

		this.loadingResults = true;

		this._sdkService.searchLiveFace(payload).subscribe(
			(searchResult) => {
				this.livenessScore = searchResult.data.liveness_score;
				this.personSearch = searchResult.data.persons;
				this.errorResult = null;
				this.loadingResults = false;
				this.completeResults();
			},
			(error) => {
				this.errorResult = {
					status: error.error?.code,
					message: error.error?.message,
				};
				console.error("sdkService.searchLiveFace");
				this.loadingResults = false;
				this.completeResults();
			}
		);
	}

	detect() {
		if (this.loadingResults) return;

		const payload: any = {
			image: this.base64Images[0],
			collection_id: this.collectionId,
			min_score: 0.7,
			search_mode: "ACCURATE",
		};

		this.loadingResults = true;

		this._sdkService.detect(payload).subscribe(
			(detect) => {
				this.personsDetect = detect.data;
				this.errorResult = null;
				this.loadingResults = false;
				this.loadingResults = false;
				this.completeResults();
			},
			(error) => {
				this.errorResult = {
					status: error.error?.code,
					message: error.error?.message,
				};
				this.loadingResults = false;
				this.loadingResults = false;
				console.error("sdkService.detect");
				this.completeResults();
			}
		);
	}

	liveness() {
		if (this.loadingResults) return;

		const payload: any = {
			image: this.base64Images[0],
			os: this.osInfo,
			collection_id: this.collectionId,
		};

		this.loadingResults = true;

		this._sdkService.liveness(payload).subscribe(
			(liveness) => {
				this.livenessScore = liveness.data.liveness_score;
				this.errorResult = null;
				this.loadingResults = false;
				this.completeResults();
			},
			(error) => {
				this.errorResult = {
					status: error.error?.code,
					message: error.error?.message,
				};
				this.loadingResults = false;
				console.error("sdkService.liveness");
				this.completeResults();
			}
		);
	}

	verify() {
		if (this.loadingResults) return;

		const payload: any = {
			id: this.personId,
			images: this.base64Images,
			collection_id: this.collectionId,
			min_score: 0.7,
			search_mode: "ACCURATE",
		};

		this.loadingResults = true;

		this._sdkService.verify(payload).subscribe(
			(verify) => {
				this.personVerify = verify.data;
				this.errorResult = null;
				this.loadingResults = false;
				this.completeResults();
			},
			(error) => {
				this.errorResult = {
					status: error.error?.code,
					message: error.error?.message,
				};
				this.loadingResults = false;
				console.error("sdkService.verify");
				this.completeResults();
			}
		);
	}

	completeResults() {
		this.faceError = null;
		this.loadingResults = false;
		this.base64Images = [];

		if (!this.errorResult && this.config[this.action].stopRecord) {
			this.stopRecord();
		}

		this._changeDetectorRef.markForCheck();
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
		this.step = 0;
		this.loadingStream = false;
		this.loadingResults = false;
		this.video = undefined;
		if (this.detectFaceInterval) {
			this.stopRecord();
		}
	}
	stopRecord(): void {
		clearInterval(this.detectFaceInterval);
		this.stream.getTracks().forEach((track) => track.stop());
	}

	async ngOnInit(): Promise<void> {
		if (!this.action) {
			this.action = "search";
		}

		if (!this.collectionId) {
			this.collectionId = "e9cfece8-24ad-428c-aff4-243f5ff89efa";
		}

		switch (this.action) {
			case "addPerson":
				this.initFormPerson();
				break;

			default:
				break;
		}

		this.base64Images = [];
		this.faceError = null;

		await this.loadModels();
		await this.startAsyncVideo();
	}

	async loadModels(): Promise<void> {
		await faceapi.nets.ssdMobilenetv1.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.faceLandmark68Net.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.faceRecognitionNet.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.faceExpressionNet.loadFromUri("https://cdn.verifik.co/web-sdk/models");
		await faceapi.nets.ageGenderNet.loadFromUri("https://cdn.verifik.co/web-sdk/models");

	}

	async startAsyncVideo() {
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
				audio: false,
			});

			this.loadingModel = false;

			setTimeout(() => {
				console.log("startAsyncVideo", this.stream, this.canvas, this.video);

				if (!this.video && !this.canvas) {
					this.stopRecord();
					return;
				}

				const videoTrack = this.stream.getVideoTracks()[0];
				const settings = videoTrack.getSettings();

				// Access the width and height properties
				const { width, height } = settings;
				this.HEIGHT = height;
				this.WIDTH = width;

				this.marginX = this.WIDTH * 0.1;
				this.marginY = this.HEIGHT * 0.1;

				this.videoCenterX = this.WIDTH / 2;
				this.videoCenterY = this.HEIGHT / 2;

				this.videoInput = this.video.nativeElement as HTMLVideoElement;

				this.videoInput.srcObject = this.stream;

				this.displaySize = {
					width: this.WIDTH,
					height: this.HEIGHT,
				};

				this.videoInput.addEventListener("play", async () => {
					this.detectFaces();
				});
				this._changeDetectorRef.markForCheck();
			}, 300);
		} catch (error) {
			console.log("SHOW ERROR");
		}
	}

	// async detectObjects() {
	// 	await this.setConfigCanvas();
	// 	this.detectFaceInterval = setInterval(async () => {})

	// 	ssdMobilenetv1
	// }

	async detectFaces() {
		await this.setConfigCanvas();
		this.detectFaceInterval = setInterval(async () => {


			const detection = await faceapi
				.detectAllFaces(this.videoInput, new faceapi.TinyFaceDetectorOptions())
				.withFaceLandmarks()
				.withFaceExpressions()
				.withAgeAndGender();



			const context = this.canvas.getContext("2d");

			if (detection.length > 0) {
				console.log(detection)

				this.faceError = null;

				this.drawFaceAndCenter(detection, context);
				this.isFaceCentered(detection[0].landmarks.getNose()[3]);
				this.isFaceClose(detection[0].landmarks);

				if (!this.faceError) {
					this.captureBase64Image();
				}
			}

			this._changeDetectorRef.markForCheck();
		}, 100);
	}

	async setConfigCanvas(): Promise<void> {
		this.canvas = await faceapi.createCanvasFromMedia(this.videoInput);
		this.canvasEl = this.canvasRef.nativeElement;
		this.canvasEl.appendChild(this.canvas);
		this.canvas.setAttribute("id", "canvass");
		faceapi.matchDimensions(this.canvas, this.displaySize);
	}

	drawFaceAndCenter(detection, context): void {
		const resizedDetections = faceapi.resizeResults(detection, this.displaySize);

		context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		if (this.action == "addPerson" && !this.personForm.touched) {
			this.personForm.patchValue({ gender: resizedDetections[0].gender.charAt(0).toUpperCase() });
		}

		if (this.isActiveDebug) {
			context.strokeStyle = "red";
			context.lineWidth = 0.5;
			context.strokeRect(this.videoCenterX - this.marginX, this.videoCenterY, this.marginX * 2, this.marginY * 2);
			// faceapi.draw.drawDetections(this.canvas, resizedDetections);
			faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetections);
			faceapi.draw.drawFaceExpressions(this.canvas, resizedDetections);

			const box = detection[0].detection.box;
			const drawBox = new faceapi.draw.DrawBox(box, {
				label: `${detection[0].gender.toUpperCase()} | ${Math.round(detection[0].age)} years old`,
			});
			drawBox.draw(this.canvas);
		}
	}

	isFaceCentered(nose): void {
		const faceCenterX = nose.x;
		const faceCenterY = nose.y;

		const isFaceCentered =
			faceCenterX > this.videoCenterX - this.marginX &&
			faceCenterX < this.videoCenterX + this.marginX &&
			faceCenterY > this.videoCenterY &&
			faceCenterY < this.videoCenterY + this.marginY * 2;

		if (!isFaceCentered) {
			this.faceError = {
				title: "Centra tu rostro en la pantalla",
				subtitle: "Por favor, asegúrate de que tu rostro esté centrado.",
			};
		}
	}

	isFaceClose(landmarks: faceapi.FaceLandmarks68): void {
		const totalFaceArea = landmarks.imageHeight * landmarks.imageWidth;
		const totalImageArea = this.videoInput.width * this.videoInput.height;

		const faceProportion = totalFaceArea / totalImageArea;

		const threshold = 0.4;

		if (faceProportion < threshold) {
			this.faceError = {
				title: "Acerca tu rostro",
				subtitle: "Por favor, acércate un poco más para una mejor detección facial.",
			};
		}
	}

	captureBase64Image(): void {
		if (this.saveImageBase64Intent) {
			return;
		}

		this.saveImageBase64Intent = setTimeout(() => {
			this.saveImageBase64Intent = clearTimeout(this.saveImageBase64Intent);
		}, 1500);

		const context = this.canvas.getContext("2d");
		context.drawImage(this.videoInput, 0, 0, this.WIDTH, this.HEIGHT);
		const base64Image = this.canvas.toDataURL("image/jpeg").replace(/^data:.*;base64,/, "");
		this.base64Images.push(base64Image);
		if (this.base64Images.length >= this.config[this.action].totalImages) {
			this.step = +1;
			this.stopRecord();
			this[this.action]();
		}
	}
	detectOS() {
		const userAgent = window.navigator.userAgent.toLowerCase();

		if (/android/.test(userAgent)) {
			return "ANDROID";
		} else if (/iphone|ipad|ipod/.test(userAgent)) {
			return "IOS";
		}

		return "DESKTOP";
	}
}
