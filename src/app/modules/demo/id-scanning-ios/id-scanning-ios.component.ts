import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { DemoService } from "../demo.service";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { WebcamImage, WebcamInitError, WebcamModule } from "ngx-webcam";
import { Observable, Subject, takeUntil } from "rxjs";
import { CameraData, FacingMode, IdCard, Intervals, ResponseData } from "../models/sdk.models";
import * as faceapi from "@vladmandic/face-api";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "app/modules/auth/project";
import { Router } from "@angular/router";
import { KYCService } from "app/modules/auth/kyc.service";
import { DocumentErrorsDisplayComponent } from "app/modules/kyc/document-errors-display/document-errors-display.component";
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";

@Component({
	selector: "id-scanning-ios",
	templateUrl: "./id-scanning-ios.component.html",
	styleUrls: ["./id-scanning-ios.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [
		FlexLayoutModule,
		MatCheckboxModule,
		MatButtonModule,
		CommonModule,
		MatProgressSpinnerModule,
		TranslocoModule,
		WebcamModule,
		DocumentErrorsDisplayComponent,
	],
})
export class IdScanningIOSComponent implements OnInit {
	@ViewChild("maskResult", { static: false }) public maskResultCanvasRef: ElementRef;
	@ViewChild("toSend", { static: false }) public ToSendCanvasRef: ElementRef;
	@ViewChild("cardIdFace", { static: false }) cardIdFaceRef: ElementRef;

	attempts: number;
	attemptsLimit: number;
	demoData: any;
	camera: CameraData;
	response: ResponseData;
	interval: Intervals;
	view: string;
	appRegistration: any;
	project: Project;
	projectFlow: ProjectFlow;
	idCard: IdCard;
	navigation: any;
	aspectRatio = 85.6 / 53.98;
	errorContent: any;
	errorResult: boolean;
	errorFace: any;
	checkFaceTimeout: any;

	private takePicture: Subject<void> = new Subject<void>();

	public get takePicture$(): Observable<void> {
		return this.takePicture.asObservable();
	}
	phoneMode: boolean;
	tabletMode: boolean;
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	constructor(
		private _dom: ElementRef,
		private _demoService: DemoService,
		private _splashScreenService: FuseSplashScreenService,
		private _translocoService: TranslocoService,
		private renderer: Renderer2,
		private _router: Router,
		private _changeDetectorRef: ChangeDetectorRef,
		private _fuseMediaWatcherService: FuseMediaWatcherService,
		private _KYCService: KYCService
	) {
		this._ObserveDomMedia();

		this.demoData = this._demoService.getDemoData();

		this.view = this._router.url.includes("/kyc") ? "kyc" : "demo";

		this.project = new ProjectModel({});

		this.projectFlow = new ProjectFlowModel({});

		if (this.view === "kyc") {
			this.appRegistration = this._KYCService.appRegistration;

			this.project = this._KYCService.currentProject;

			this.projectFlow = this._KYCService.currentProjectFlow;

			this.navigation = this._KYCService.getNavigation();

			this.attempts = this.appRegistration?.failedDocumentValidations?.length || 0;

			this.attemptsLimit = this.projectFlow.onboardingSettings.document.maxAttempts;
		}

		this.errorContent = {
			message: "",
		};

		this.startDefaultValues();

		this.setDefaultInterval();

		this.renderer.listen("window", "resize", () => {
			this.interval.checkNgxVideo = setInterval(() => {
				this.setVideoNgxCameraData();
			}, this.demoData.time);
		});
		this._changeDetectorRef.markForCheck();
	}

	setDefaultCamera = () => {
		let key = this.demoData.isMobile ? "width" : "height";

		this.camera = {
			hasPermissions: false,
			isLoading: false,
			configuration: {
				frameRate: { ideal: 30, max: 30 },
				[key]: { ideal: 1080 },
				facingMode: FacingMode[this.demoData.isMobile],
			},
			dimensions: {
				video: {
					max: {
						height: Math.ceil(window.innerHeight * 0.7),
						width: Math.ceil(window.innerWidth * 0.9),
					},
				},
			},
		};
	};

	_ObserveDomMedia(): void {
		this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe(({ matchingAliases }) => {
			this.phoneMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && !matchingAliases.includes("sm"));

			this.tabletMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && matchingAliases.includes("sm"));
			console.log(this.tabletMode, this.phoneMode);
			this._changeDetectorRef.markForCheck();
		});
	}

	setDefaultInterval = () => {
		this.interval = {};
	};

	setDefaultResponse = () => {
		this.response = {
			isLoading: false,
			isFailed: false,
		};
	};

	ngOnInit(): void {
		console.log("here in ios");
		this.startDefaultValues();

		this.camera.hasPermissions = true;

		this.errorFace = {};

		this.loading({ start: true });
		this._demoService.faceapi$.subscribe(async (isLoaded) => {
			if (isLoaded) {
				this.interval.checkNgxVideo = setInterval(() => {
					this.setMaxVideoDimensions();
					this.setVideoNgxCameraData();
				}, this.demoData.time);

				// this.interval.checkNgxVideo = setInterval(() => {
				// 	this.setVideoNgxCameraData();
				// }, 100);
			}
		});
	}

	startDefaultValues() {
		this.setDefaultResponse();
		this.setDefaultCamera();
		this.setMaxVideoDimensions();
		this._changeDetectorRef.markForCheck();
	}

	setVideoNgxCameraData = () => {
		const videoNgx = this._dom.nativeElement.querySelector("video");
		if (!videoNgx) return;

		videoNgx.addEventListener("loadeddata", () => {
			this.setVideoDimensions(videoNgx);
			this.drawRect();
		});

		if (!this.interval.detectFace) {
			this.interval.detectFace = setInterval(() => {
				if (this.response.base64Image) {
					this.interval.detectFace = clearInterval(this.interval.detectFace);
				}

				this.takePicture.next();
			}, this.demoData.time);
		}

		this.interval.checkNgxVideo = clearInterval(this.interval.checkNgxVideo);

		this.setVideoDimensions(videoNgx);
		this.drawRect();
		this.loading({ isLoading: false, start: true });
	};

	setVideoDimensions(videoNgx) {
		this.camera.dimensions.video.height = videoNgx.clientHeight;
		this.camera.dimensions.video.width = videoNgx.clientWidth;

		const maskResultCanvas = this.maskResultCanvasRef.nativeElement;
		maskResultCanvas.style.marginLeft = `0px`;
		maskResultCanvas.style.marginTop = `0px`;
	}

	setMaxVideoDimensions(): void {
		this.camera.dimensions.video = {
			max: {
				height: Math.ceil(window.innerHeight * 0.7),
				width: Math.ceil(window.innerWidth * 0.9),
			},
		};
		this.camera.dimensions.result = undefined;
	}

	setResultDimensions(data, height, width) {
		const isHorizontal = height < width;

		if (isHorizontal) {
			data.offsetY = Math.floor(height * 0.1);
			data.height = Math.floor(height * 0.8);
			data.width = Math.floor(this.aspectRatio * data.height);
			data.offsetX = Math.floor((width - data.width) / 2);
		} else {
			data.offsetX = Math.floor(width * 0.1);
			data.width = Math.floor(width * 0.8);
			data.height = Math.floor(this.aspectRatio * data.width);
			data.offsetY = Math.floor((height - data.height) / 2);
		}
	}

	loading = ({ isLoading = true, start = undefined, result = undefined }) => {
		const key = (start && "camera") || (result && "response");

		if (key) {
			this[key].isLoading = isLoading;
		}

		const functionName = isLoading ? "show" : "hide";
		this.demoData.loading = isLoading;
		this._splashScreenService[functionName]();
	};

	drawRect(): void {
		this.camera.dimensions.result = { height: 0, width: 0, offsetX: 0, offsetY: 0 };
		this.setResultDimensions(this.camera.dimensions.result, this.camera.dimensions.video.height, this.camera.dimensions.video.width);

		const maskResultCanvas = this.maskResultCanvasRef.nativeElement;

		const videoDim = this.camera.dimensions.video;
		const resultDim = this.camera.dimensions.result;

		maskResultCanvas.height = videoDim.height;
		maskResultCanvas.width = videoDim.width;

		const ctx: CanvasRenderingContext2D = maskResultCanvas.getContext("2d");

		//CLEAR CANVAS
		ctx.clearRect(0, 0, videoDim.width, videoDim.height);

		//OPACITY OUTSIDE THE ELLIPSE
		ctx.fillStyle = "rgba(255, 255, 255, 0.75)"; // Color de la máscara
		ctx.fillRect(0, 0, videoDim.width, videoDim.height);
		ctx.globalCompositeOperation = "destination-out";

		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(resultDim.offsetX, resultDim.offsetY, resultDim.width, resultDim.height);
		ctx.globalCompositeOperation = "source-over";
	}

	cameraError(error: WebcamInitError): void {
		if (error.mediaStreamError && error.mediaStreamError.name === "NotAllowedError") {
			this.loading({ isLoading: false, start: true });
			this.camera.hasPermissions = false;
		}
	}

	proccessImage(webcamImage: WebcamImage): void {
		if (this.response.base64Image) return;

		if (!this.interval.detectFace) {
			this.takePictureManual(webcamImage);
			return;
		}

		const img = new Image();

		img.src = webcamImage.imageAsDataUrl;

		img.onload = async () => {
			try {
				this.detectFace(img);
			} catch (error) {
				alert(error.message);
			}
		};
	}

	async detectFace(image) {
		try {
			const detection = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })).withFaceLandmarks();

			if (detection.length) {
				this.checkFaceTimeout = clearTimeout(this.checkFaceTimeout);
				this.errorFace = null;
				return detection;
			}

			if (!this.checkFaceTimeout) {
				this.checkFaceTimeout = setTimeout(() => {
					this.errorFace = {
						title: this._translocoService.translate("id_scanning.face_not_found"),
						subtitle: this._translocoService.translate("id_scanning.face_not_found_details"),
					};
				}, 3 * this.demoData.time);
			}
			return null;
		} catch (error) {
			alert(error.message);
		}
	}

	takePictureManual(webcamImage: WebcamImage): void {
		const img = new Image();

		img.src = webcamImage.imageAsDataUrl;

		img.onload = async () => {
			const faces = await this.detectFace(img);

			if (!faces || !faces.length) {
				alert(this._translocoService.translate("id_scanning.face_not_found"));
				return this.tryAgain();
			}

			const faceBiggest = this._demoService.getBiggestFace(faces.map((face) => face.detection.box));

			this.idCard = {
				face: this._demoService.cutFaceIdCard(img, faceBiggest, this.cardIdFaceRef.nativeElement),
			};

			this.camera.dimensions.real = { height: 0, width: 0, offsetX: 0, offsetY: 0 };
			this.setResultDimensions(this.camera.dimensions.real, img.height, img.width);

			const maskResultCanvas = this.maskResultCanvasRef.nativeElement;
			this.setImageOnCanvas(maskResultCanvas, img, this.camera.dimensions.real, this.camera.dimensions.result);

			const toSendCanvas = this.ToSendCanvasRef.nativeElement;
			this.setImageOnCanvas(toSendCanvas, img, this.camera.dimensions.real, this.camera.dimensions.real);

			this.response.base64Image = toSendCanvas.toDataURL("image/jpeg");
		};
	}

	setImageOnCanvas = (canvas, inputImg, originalDim, resizeDim) => {
		canvas.width = resizeDim.width;
		canvas.height = resizeDim.height;
		canvas.style.marginLeft = `${resizeDim.offsetX || 0}px`;
		canvas.style.marginTop = `${resizeDim.offsetY || 0}px`;

		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, originalDim.width, originalDim.height);

		ctx.drawImage(
			inputImg,
			originalDim.offsetX,
			originalDim.offsetY,
			originalDim.width,
			originalDim.height,
			0,
			0,
			resizeDim.width,
			resizeDim.height
		);
	};

	takePictureSnapshot(): void {
		this.interval.detectFace = clearInterval(this.interval.detectFace);

		this.takePicture.next();
	}

	async continue(): Promise<void> {
		const dataToSend = {
			image: this.response.base64Image.replace("data:image/jpeg;base64", ""),
			force: this.appRegistration?.forceUpload || false,
		};

		this.loading({ result: true });

		if (this.view === "kyc") {
			this._KYCService
				.createDocumentValidation({
					...dataToSend,
					documentFace: this.idCard.face,
				})
				.subscribe({
					next: (response) => {
						this.appRegistration.documentValidation = response.data.documentValidation;

						this._KYCService.navigateTo("next");
					},
					error: (exception) => {
						this.errorResult = true;

						this.errorContent = exception.error;

						this.loading({ isLoading: false });

						this._splashScreenService.hide();
					},
					complete: () => {
						this.loading({ isLoading: false });
					},
				});

			return;
		}

		this._demoService.sendDocument(dataToSend).subscribe(
			(response) => {
				this._demoService.setDemoDocument(response.data);

				localStorage.setItem("idCardFaceImage", this.idCard.face);
				localStorage.setItem("documentId", response.data._id);

				this.loading({ isLoading: false });

				this._demoService.moveToStep(3);
			},
			(err) => {
				this.response.isFailed = true;
				this.loading({ isLoading: false });
			}
		);
	}

	tryAgain(): void {
		this.attempts++;

		this.ngOnInit();
	}

	restartDemo(): void {
		this._demoService.restart();
	}

	onErrorCallback(payload: any) {
		window.location.reload();
	}
}
