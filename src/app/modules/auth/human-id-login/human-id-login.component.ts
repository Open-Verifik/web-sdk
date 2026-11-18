import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
	inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { FuseAlertComponent } from "@fuse/components/alert";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { Subject, takeUntil } from "rxjs";

import { AuthService } from "app/core/auth/auth.service";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { AntiBotChallengeService } from "app/core/services/anti-bot-challenge.service";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { ImageScan } from "app/modules/auth/project";
import { VerifySelfieComponent } from "app/modules/auth/verify/verify-selfie.component";
import { HumanIdLoginPayload, PasswordlessService } from "../passwordless.service";

export type HumanIdStep = "loading" | "input" | "selfie" | "submitting" | "success" | "error";
export type HumanIdInputMode = "qr_camera" | "qr_upload" | "text_paste";

@Component({
	selector: "app-human-id-login",
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		RouterModule,
		TranslocoModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		FuseAlertComponent,
		LanguagesComponent,
		VerifySelfieComponent,
	],
	templateUrl: "./human-id-login.component.html",
	styleUrls: ["./human-id-login.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HumanIdLoginComponent implements OnInit, OnDestroy {
	private _cdr = inject(ChangeDetectorRef);
	private _route = inject(ActivatedRoute);
	private _router = inject(Router);
	private _passwordlessService = inject(PasswordlessService);
	private _authService = inject(AuthService);
	private _transloco = inject(TranslocoService);
	private _antiBotChallengeService = inject(AntiBotChallengeService);
	private _destroy$ = new Subject<void>();

	@ViewChild("qrVideo") qrVideoRef?: ElementRef<HTMLVideoElement>;
	@ViewChild("fileInput") fileInputRef?: ElementRef<HTMLInputElement>;

	// State Machine
	step: HumanIdStep = "loading";
	inputMode: HumanIdInputMode = "qr_camera";

	projectId = "";
	project: Project | null = null;
	projectFlow: ProjectFlow | null = null;

	// Credentials & Context
	identifier: string | null = null;
	humanId: string | null = null;
	qrImageBase64: string | null = null;
	sessionCode: string | null = null;
	faceBase64: string | null = null;

	// Input Mode: Camera
	qrCameraReady = false;
	qrCameraPermissionDenied = false;
	availableCameras: MediaDeviceInfo[] = [];
	selectedCameraIndex = 0;
	facingMode: "environment" | "user" = "environment";
	private _qrStream: MediaStream | null = null;
	private _qrScanInterval: any = null;
	private _zxingReaderPromise: Promise<any> | null = null;
	private _offscreenCanvas: HTMLCanvasElement | null = null;

	// Input Mode: Upload
	isDragOver = false;
	isDecodingUpload = false;
	uploadErrorKey: string | null = null;

	// Input Mode: Text Paste
	pastedHumanId = "";
	isTextValid = false;
	textValidationErrorKey: string | null = null;

	// Step 2: Selfie
	selfiePhase: "idle" | "liveness" | "compare" | "finishing" = "idle";

	// Error & Feedback
	errorMessageKey: string | null = null;
	rawErrorMessage: string | null = null;

	constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

	ngOnInit(): void {
		this._route.paramMap.pipe(takeUntil(this._destroy$)).subscribe((params) => {
			this.projectId = params.get("id") || "";
			if (!this.projectId) {
				this._router.navigate(["/sign-in"]);
				return;
			}
			this._loadProject();
		});

		this._route.queryParamMap.pipe(takeUntil(this._destroy$)).subscribe((query) => {
			const sessionCode = query.get("sessionCode");
			const humanId = query.get("humanId");
			const identifier = query.get("identifier");
			const direct = query.get("direct");

			if (sessionCode) {
				this.sessionCode = sessionCode;
			}
			if (humanId) {
				this.humanId = humanId;
			}
			if (identifier) {
				this.identifier = identifier;
			}

			if (sessionCode || humanId || (identifier && direct === "selfie")) {
				this._skipToSelfie();
			}
		});
	}

	ngOnDestroy(): void {
		this._stopQrCamera();
		this._destroy$.next();
		this._destroy$.complete();
	}

	@HostListener("window:message", ["$event"])
	onWindowMessage(event: MessageEvent): void {
		if (event.data?.type === "VERIFIK_HUMAN_ID_CONTEXT") {
			const humanId = event.data.humanId;
			if (humanId) {
				this.humanId = humanId;
				this._skipToSelfie();
			}
		}
	}

	private _loadProject(): void {
		this.step = "loading";
		this._passwordlessService.requestProject(this.projectId, "login").subscribe({
			next: (res) => {
				this.project = new Project({ ...res.data, type: "login" });
				this.projectFlow = this.project.getLoginProjectFlow();

				if (this.sessionCode || this.humanId || this.identifier) {
					this._skipToSelfie();
				} else {
					this.step = "input";
					setTimeout(() => {
						void this._startQrCameraMode();
					}, 100);
				}
				this._cdr.markForCheck();
			},
			error: (err) => {
				this.rawErrorMessage = err?.error?.message || "Failed to load authentication project";
				this.step = "error";
				this._cdr.markForCheck();
			},
		});
	}

	private _skipToSelfie(): void {
		this._stopQrCamera();
		this.step = "selfie";
		this._cdr.markForCheck();
	}

	// ------------------------------------------------------------------------
	// Mode Switcher
	// ------------------------------------------------------------------------
	switchInputMode(mode: HumanIdInputMode): void {
		if (this.inputMode === mode) return;

		this.inputMode = mode;
		this.uploadErrorKey = null;

		if (mode === "qr_camera") {
			void this._startQrCameraMode();
		} else {
			this._stopQrCamera();
		}
		this._cdr.markForCheck();
	}

	// ------------------------------------------------------------------------
	// QR Camera Scanner
	// ------------------------------------------------------------------------
	private async _startQrCameraMode(): Promise<void> {
		if (!isPlatformBrowser(this.platformId) || typeof navigator === "undefined" || !navigator.mediaDevices) return;

		this._stopQrCamera();
		this.qrCameraReady = false;
		this.qrCameraPermissionDenied = false;

		try {
			await this._loadZxing();
			await this._initMediaDevices();
			await this._startCameraStream();
		} catch (err: any) {
			console.warn("Camera init error:", err);
			if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
				this.qrCameraPermissionDenied = true;
			}
			this._cdr.markForCheck();
		}
	}

	private async _initMediaDevices(): Promise<void> {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			this.availableCameras = devices.filter((d) => d.kind === "videoinput");
		} catch {
			this.availableCameras = [];
		}
	}

	toggleCamera(): void {
		if (this.availableCameras.length > 1) {
			this.selectedCameraIndex = (this.selectedCameraIndex + 1) % this.availableCameras.length;
		} else {
			this.facingMode = this.facingMode === "environment" ? "user" : "environment";
		}
		void this._startCameraStream();
	}

	private async _startCameraStream(): Promise<void> {
		this._stopCameraTracks();

		const videoConstraints: MediaTrackConstraints = {};
		if (this.availableCameras.length > 1 && this.availableCameras[this.selectedCameraIndex]?.deviceId) {
			videoConstraints.deviceId = { exact: this.availableCameras[this.selectedCameraIndex].deviceId };
		} else {
			videoConstraints.facingMode = this.facingMode;
		}
		videoConstraints.width = { ideal: 1280 };
		videoConstraints.height = { ideal: 720 };

		this._qrStream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: videoConstraints,
		});

		const videoEl = this.qrVideoRef?.nativeElement;
		if (videoEl) {
			videoEl.srcObject = this._qrStream;
			videoEl.onloadedmetadata = () => {
				this.qrCameraReady = true;
				this._startScanLoop();
				this._cdr.markForCheck();
			};
			await videoEl.play().catch(() => undefined);
		}
	}

	private _startScanLoop(): void {
		if (this._qrScanInterval) clearInterval(this._qrScanInterval);

		this._qrScanInterval = setInterval(() => {
			if (!this.qrCameraReady || this.step !== "input" || this.inputMode !== "qr_camera") return;
			void this._scanCurrentFrame();
		}, 200);
	}

	private async _scanCurrentFrame(): Promise<void> {
		const video = this.qrVideoRef?.nativeElement;
		if (!video || video.readyState < 2 || !video.videoWidth) return;

		const canvas = this._offscreenCanvas || (this._offscreenCanvas = document.createElement("canvas"));
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		try {
			const reader = await this._loadZxing();
			const results = await reader.readBarcodes(imageData, {
				formats: ["QRCode"],
				maxNumberOfSymbols: 1,
				tryHarder: false,
			});

			const hit = (results || []).find((r: any) => r?.isValid && r?.text);
			if (hit) {
				const snapshotDataUrl = canvas.toDataURL("image/png");
				this._onQrCodeExtracted(hit.text, snapshotDataUrl);
			}
		} catch {
			// Frame decode misses are normal
		}
	}

	private _stopCameraTracks(): void {
		if (this._qrStream) {
			this._qrStream.getTracks().forEach((track) => track.stop());
			this._qrStream = null;
		}
	}

	private _stopQrCamera(): void {
		if (this._qrScanInterval) {
			clearInterval(this._qrScanInterval);
			this._qrScanInterval = null;
		}
		this._stopCameraTracks();
		this.qrCameraReady = false;
	}

	private _loadZxing(): Promise<any> {
		if (!this._zxingReaderPromise) {
			this._zxingReaderPromise = import("zxing-wasm/reader").then(async (mod) => {
				await mod.prepareZXingModule({
					overrides: {
						locateFile: (path: string, prefix: string) =>
							path.endsWith(".wasm") ? "assets/zxing_reader.wasm" : `${prefix}${path}`,
					},
				});
				return mod;
			});
		}
		return this._zxingReaderPromise;
	}

	// ------------------------------------------------------------------------
	// QR Image Upload Dropzone
	// ------------------------------------------------------------------------
	onDragOver(event: DragEvent): void {
		event.preventDefault();
		event.stopPropagation();
		this.isDragOver = true;
	}

	onDragLeave(event: DragEvent): void {
		event.preventDefault();
		event.stopPropagation();
		this.isDragOver = false;
	}

	onFileDrop(event: DragEvent): void {
		event.preventDefault();
		event.stopPropagation();
		this.isDragOver = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			void this._processUploadedFile(files[0]);
		}
	}

	onFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			void this._processUploadedFile(input.files[0]);
		}
	}

	private async _processUploadedFile(file: File): Promise<void> {
		if (!file.type.startsWith("image/")) {
			this.uploadErrorKey = "human_id_login.invalid_qr";
			this._cdr.markForCheck();
			return;
		}

		this.isDecodingUpload = true;
		this.uploadErrorKey = null;
		this._cdr.markForCheck();

		try {
			const reader = await this._loadZxing();
			const results = await reader.readBarcodes(file, {
				formats: ["QRCode"],
				maxNumberOfSymbols: 1,
				tryHarder: true,
			});

			const hit = (results || []).find((r: any) => r?.isValid && r?.text);
			if (hit) {
				const dataUrl = await this._fileToDataUrl(file);
				this._onQrCodeExtracted(hit.text, dataUrl);
			} else {
				this.uploadErrorKey = "human_id_login.invalid_qr";
			}
		} catch (err) {
			console.warn("Upload decode error:", err);
			this.uploadErrorKey = "human_id_login.invalid_qr";
		} finally {
			this.isDecodingUpload = false;
			this._cdr.markForCheck();
		}
	}

	private _fileToDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	// ------------------------------------------------------------------------
	// Text Paste Validation
	// ------------------------------------------------------------------------
	onTextChange(value: string): void {
		this.pastedHumanId = value;
		this.isTextValid = this._validateHumanIdFormat(value);
		this.textValidationErrorKey = value.trim() && !this.isTextValid ? "human_id_login.invalid_code" : null;
		this._cdr.markForCheck();
	}

	private _validateHumanIdFormat(str: string): boolean {
		const trimmed = (str || "").trim();
		if (!trimmed) return false;

		// JSON format
		if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
			try {
				const parsed = JSON.parse(trimmed);
				const hasData =
					parsed.data &&
					(typeof parsed.data === "string"
						? parsed.data.trim().length > 0
						: typeof parsed.data === "object"
						? Object.keys(parsed.data).length > 0
						: false);
				return Boolean(parsed.humanId || parsed.zelfProof || parsed.proof || hasData);
			} catch {
				return false;
			}
		}

		// Base64 format
		const base64Regex = /^[A-Za-z0-9+/=_-]+$/;
		if (trimmed.length >= 32 && base64Regex.test(trimmed)) {
			return true;
		}

		// Data URL format
		if (trimmed.startsWith("data:image/")) {
			return true;
		}

		return false;
	}

	private _extractHumanId(raw: string): string {
		const trimmed = (raw || "").trim();
		if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
			try {
				const parsed = JSON.parse(trimmed);
				if (parsed.data !== undefined && parsed.data !== null) {
					if (typeof parsed.data === "string") {
						const innerTrimmed = parsed.data.trim();
						if (innerTrimmed.startsWith("{") && innerTrimmed.endsWith("}")) {
							try {
								const innerParsed = JSON.parse(innerTrimmed);
								const inner =
									innerParsed.zelfProof ||
									innerParsed.proof ||
									innerParsed.humanId ||
									innerParsed.data;
								if (inner && typeof inner === "string") {
									return inner.trim();
								}
							} catch {}
						}
						return innerTrimmed;
					}
					if (typeof parsed.data === "object") {
						const inner =
							parsed.data.zelfProof ||
							parsed.data.proof ||
							parsed.data.humanId;
						if (inner && typeof inner === "string") {
							return inner.trim();
						}
						return JSON.stringify(parsed.data);
					}
				}
				if (parsed.zelfProof && typeof parsed.zelfProof === "string") {
					return parsed.zelfProof.trim();
				}
				if (parsed.proof && typeof parsed.proof === "string") {
					return parsed.proof.trim();
				}
				if (parsed.humanId && typeof parsed.humanId === "string") {
					return parsed.humanId.trim();
				}
			} catch {
				return trimmed;
			}
		}
		return trimmed;
	}

	submitPastedText(): void {
		if (!this.isTextValid) return;
		this.humanId = this._extractHumanId(this.pastedHumanId);
		this._skipToSelfie();
	}

	// ------------------------------------------------------------------------
	// QR Extracted Transition
	// ------------------------------------------------------------------------
	private _onQrCodeExtracted(text: string, dataUrl: string): void {
		this.humanId = this._extractHumanId(text);
		this.qrImageBase64 = dataUrl;
		this._skipToSelfie();
	}

	// ------------------------------------------------------------------------
	// Step 2: Live Selfie Capture
	// ------------------------------------------------------------------------
	onSelfieCaptured(scan: ImageScan): void {
		this.faceBase64 = scan.face || scan.base64Image;
		this.selfiePhase = "finishing";
		this.step = "submitting";
		this._cdr.markForCheck();

		void this._submitLogin();
	}

	onSelfiePermissionDenied(): void {
		this.errorMessageKey = "human_id_login.camera_permission_denied";
		this.step = "error";
		this._cdr.markForCheck();
	}

	// ------------------------------------------------------------------------
	// Step 3: API Submission
	// ------------------------------------------------------------------------
	private async _resolveAntiBotHeaders(): Promise<Record<string, string> | undefined> {
		if (!this.projectId) return undefined;

		if (isPlatformBrowser(this.platformId) && typeof sessionStorage !== "undefined") {
			const storageKey = `verifik_antibot_headers_${this.projectId}`;
			try {
				const raw = sessionStorage.getItem(storageKey);
				if (raw) {
					const storedHeaders = AntiBotChallengeService.extractValidHeaders(JSON.parse(raw));
					if (storedHeaders) {
						sessionStorage.removeItem(storageKey);
						return storedHeaders;
					}
				}
			} catch {
				// Ignore malformed sessionStorage payloads and regenerate challenge below
			}
		}

		if (isPlatformBrowser(this.platformId) && this._antiBotChallengeService?.prepareVerificationHeaders) {
			try {
				const prepared = await this._antiBotChallengeService.prepareVerificationHeaders(this.projectId);
				return AntiBotChallengeService.extractValidHeaders(prepared) || undefined;
			} catch (err) {
				console.warn("[AntiBot] Challenge preparation failed during HumanID login", err);
			}
		}

		return undefined;
	}

	private async _submitLogin(): Promise<void> {
		if (!this.faceBase64) return;

		const payload: HumanIdLoginPayload = {
			projectId: this.projectId,
			faceBase64: this.faceBase64,
			identifier: this.identifier || undefined,
			humanId: this.humanId || undefined,
			qrImageBase64: this.qrImageBase64 || undefined,
			sessionCode: this.sessionCode || undefined,
		};

		const antiBotHeaders = await this._resolveAntiBotHeaders();
		this._sendHumanIdLogin(payload, antiBotHeaders);
	}

	private _sendHumanIdLogin(
		payload: HumanIdLoginPayload,
		antiBotHeaders?: Record<string, string>,
		isTurnstileRetry: boolean = false
	): void {
		this._passwordlessService
			.humanIdLogin(payload, antiBotHeaders)
			.pipe(takeUntil(this._destroy$))
			.subscribe({
				next: (res) => {
					this.step = "success";
					this._cdr.markForCheck();

					// PostMessage to host app / opener
					const successEvent = {
						type: "VERIFIK_HUMAN_ID_SUCCESS",
						token: res.data?.token,
						appLogin: res.data?.appLogin,
					};
					if (window.opener) {
						window.opener.postMessage(successEvent, "*");
					} else if (window.parent && window.parent !== window) {
						window.parent.postMessage(successEvent, "*");
					}

					// Redirect to host application
					setTimeout(() => {
						this._authService.handleRedirect(this.projectFlow!, this.projectId, res.data?.token, "login");
					}, 600);
				},
				error: (err) => {
					if (!isTurnstileRetry && this._antiBotChallengeService?.isFallbackRequired(err)) {
						void this._handleTurnstileFallbackAndRetry(payload, err);
						return;
					}

					this.rawErrorMessage = err?.error?.message || err?.message;
					this.errorMessageKey = "human_id_login.verification_failed";
					this.step = "error";
					this.selfiePhase = "idle";
					this._cdr.markForCheck();
				},
			});
	}

	private async _handleTurnstileFallbackAndRetry(payload: HumanIdLoginPayload, err: any): Promise<void> {
		try {
			const fallbackData = this._antiBotChallengeService.extractFallbackData(err);
			if (!fallbackData?.turnstileSiteKey) {
				throw new Error(err?.error?.message || "Turnstile fallback site key missing");
			}

			const turnstileToken = await this._antiBotChallengeService.handleTurnstileFallback(
				fallbackData.turnstileSiteKey
			);
			const freshHeaders = await this._antiBotChallengeService.prepareVerificationHeaders(this.projectId);
			const retryHeaders: Record<string, string> = {
				...(AntiBotChallengeService.extractValidHeaders(freshHeaders) || {}),
				"X-Turnstile-Token": turnstileToken,
			};

			this._sendHumanIdLogin(payload, retryHeaders, true);
		} catch (fallbackErr: any) {
			this.rawErrorMessage = fallbackErr?.error?.message || fallbackErr?.message || err?.error?.message;
			this.errorMessageKey = "human_id_login.verification_failed";
			this.step = "error";
			this.selfiePhase = "idle";
			this._cdr.markForCheck();
		}
	}

	retry(): void {
		this.errorMessageKey = null;
		this.rawErrorMessage = null;
		this.faceBase64 = null;
		this.selfiePhase = "idle";
		if (this.sessionCode || this.identifier) {
			this.step = "selfie";
		} else {
			this.step = "input";
			if (this.inputMode === "qr_camera") {
				setTimeout(() => {
					void this._startQrCameraMode();
				}, 100);
			}
		}
		this._cdr.markForCheck();
	}

	backToSignIn(): void {
		this._router.navigate(["/sign-in", this.projectId]);
	}
}
