import * as faceapi from "@vladmandic/face-api";
import { Observable, Subject } from "rxjs";
import { Contour } from "libs/jscanify";

import { Injectable } from "@angular/core";

import { AppRegistration, ProjectFlow } from "../project";

export interface MediaTrackSupportedConstraintsExtended extends MediaTrackSupportedConstraints {
	zoom?: boolean;	
}

export interface MediaTrackConstraintSetExtended extends MediaTrackConstraintSet {
	zoom?: ConstrainULong;	
}

export interface IOSCameraData {
	hasPermissions: boolean;
	isLoading: boolean;
	isLowQuality?: boolean;
	configuration: MediaTrackConstraintSetExtended;
	dimensions: {
		real?: {
			height: number;
			width: number;
			offsetX: number;
			offsetY: number;
		};
		result?: {
			height: number;
			width: number;
			offsetX: number;
			offsetY: number;
		};
		video: {
			max: {
				height: number;
				width: number;
			};
			height?: number;
			width?: number;
		};
	};
}

export interface BoundsDetection {
	face: any,
	document: any
};

export interface CorrectionsBounds { x: string; y: string; };
export interface CorrectionsHeightWidth { height: string; width: string; };
export interface CorrectionsAngle { pitch: string; roll: string; yaw: string };

export interface Corrections {
    angle?: CorrectionsAngle,
    bounds?: CorrectionsBounds,
    document?: CorrectionsBounds,
    documentResolution?: CorrectionsHeightWidth,
    resolution?: CorrectionsHeightWidth,
};

export interface DocumentAnalysis {
	bounds: CorrectionsBounds,
	detection: DocumentDetection,
	isValid: boolean;
	resolution: CorrectionsHeightWidth,
};

export interface FaceAnalysis {
	angle: CorrectionsAngle,
	bounds: CorrectionsBounds,
	isValid: boolean;
	resolution: CorrectionsHeightWidth,
};

export interface DocumentDetection {
	x: number;
	y: number;
	height: number;
	width: number;
	contours?: Contour;
};

export interface EnrollSettings {
	currentStep: EnrollStep;
	documentMethod: EnrollDocumentMethod;
}

export interface EnrollStore {
	document: {
		attempts: number;
		remaining: number;
		limit: number;
	};
	biometric: {
		attempts: number;
		remaining: number;
		limit: number;
		compareMinScore: number;
		compareScore: number;
		livenessMinScore: number;
		livenessScore: number;
	};
}

export type EnrollStep = "" | "document" | "document-review" | "biometric" | "result";
export type EnrollDocumentMethod = "" | "scan" | "upload";

@Injectable({
	providedIn: "root",
})
export class SmartEnrollService {
	private _enrollSettings: EnrollSettings;
	private _enrollSettings$: Subject<EnrollSettings> = new Subject<EnrollSettings>();
	private _skipChanged$: Subject<void> = new Subject<void>();

	availableSteps: EnrollStep[];
	enrollSettings$: Observable<EnrollSettings>;
	store: EnrollStore;
	skipChanged$: Observable<void>;

	constructor() {
		this._enrollSettings = {
			currentStep: "",
			documentMethod: localStorage.getItem("documentMethod") as EnrollDocumentMethod,
		};

		this.enrollSettings$ = this._enrollSettings$.asObservable();
		this.skipChanged$ = this._skipChanged$.asObservable();

		this.store = {
			document: {
				attempts: 0,
				limit: 3,
				remaining: 3,
			},
			biometric: {
				attempts: 0,
				compareMinScore: 0.62,
				compareScore: 0,
				limit: 3,
				livenessMinScore: 0.64,
				livenessScore: 0,
				remaining: 3,
			},
		};
	}

	get currentStepIndex(): number {
		return this.availableSteps.indexOf(this.enrollSettings.currentStep);
	}

	set enrollSettings(updatedSettings: EnrollSettings) {
		this._enrollSettings = { ...updatedSettings };
		this._enrollSettings$.next(this._enrollSettings);
	}

	get enrollSettings(): EnrollSettings {
		return { ...this._enrollSettings };
	}

	evaluateDocumentContours(boundsParameters: BoundsDetection, contours: Contour): DocumentAnalysis {
		const BOUNDS = boundsParameters.document;

		const shapeWidth = Math.floor(contours.bottomRightCorner.x - contours.bottomLeftCorner.x);
		const shapeHeight = Math.floor(contours.bottomLeftCorner.y - contours.topLeftCorner.y);

		const correctResolution =
			shapeHeight > BOUNDS.res.HEIGHT_LOW &&
			shapeHeight < BOUNDS.res.HEIGHT_HIGH &&
			shapeWidth > BOUNDS.res.WIDTH_LOW &&
			shapeWidth < BOUNDS.res.WIDTH_HIGH;

		const centerPoint = {
			x: Math.floor((contours.bottomRightCorner.x + contours.bottomLeftCorner.x + contours.topLeftCorner.x + contours.topRightCorner.x) / 4),
			y: Math.floor((contours.bottomRightCorner.y + contours.bottomLeftCorner.y + contours.topLeftCorner.y + contours.topRightCorner.y) / 4),
		};

		const fallsInBounds =
			centerPoint.x > BOUNDS.bounds.X_LOW &&
			centerPoint.x < BOUNDS.bounds.X_HIGH &&
			centerPoint.y > BOUNDS.bounds.Y_LOW &&
			centerPoint.y < BOUNDS.bounds.Y_HIGH;

		const detection = {
			...centerPoint,
			height: shapeHeight,
			width: shapeWidth,
			contours,
		};

		const isValid = correctResolution && fallsInBounds;

		const bounds: CorrectionsBounds = {
			x: !fallsInBounds && centerPoint.x > BOUNDS.bounds.X_HIGH ? "left" : !fallsInBounds && centerPoint.x < BOUNDS.bounds.X_LOW ? "right" : "",
			y: !fallsInBounds && centerPoint.y > BOUNDS.bounds.Y_HIGH ? "up" : !fallsInBounds && centerPoint.y < BOUNDS.bounds.Y_LOW ? "down" : "",
		}

		const resolution: CorrectionsHeightWidth = {
			height:
				!correctResolution && shapeHeight > BOUNDS.res.HEIGHT_HIGH
					? "back"
					: !correctResolution && shapeHeight < BOUNDS.res.HEIGHT_LOW
					? "forward"
					: "",
			width:
				!correctResolution && shapeWidth > BOUNDS.res.WIDTH_HIGH
					? "back"
					: !correctResolution && shapeWidth < BOUNDS.res.WIDTH_LOW
					? "forward"
					: "",
		}

		return {
			bounds,
			detection,
			isValid,
			resolution,
		};
	}

	evaluateFaceDetection(
		boundsParameters: BoundsDetection,
		face: faceapi.WithFaceLandmarks <{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>,
		source: "face" | "document"
	): FaceAnalysis {
		const BOUNDS = boundsParameters.face;

		let correctAngle: boolean = true;

		const correctResolution =
			face.alignedRect.box.height > BOUNDS.res.HEIGHT_LOW &&
			face.alignedRect.box.height < BOUNDS.res.HEIGHT_HIGH &&
			face.alignedRect.box.width > BOUNDS.res.WIDTH_LOW &&
			face.alignedRect.box.width < BOUNDS.res.WIDTH_HIGH;

		const fallsInBounds =
			face.alignedRect.box.x > BOUNDS.bounds.X_LOW &&
			face.alignedRect.box.x < BOUNDS.bounds.X_HIGH &&
			face.alignedRect.box.y > BOUNDS.bounds.Y_LOW &&
			face.alignedRect.box.y < BOUNDS.bounds.Y_HIGH;

		if (source === "face") {
			correctAngle =
				face.angle.pitch > BOUNDS.angle.PITCH_LOW &&
				face.angle.pitch < BOUNDS.angle.PITCH_HIGH &&
				face.angle.roll > BOUNDS.angle.ROLL_LOW &&
				face.angle.roll < BOUNDS.angle.ROLL_HIGH &&
				face.angle.yaw > BOUNDS.angle.YAW_LOW &&
				face.angle.yaw < BOUNDS.angle.YAW_HIGH;
		}

		const isValid = correctResolution && fallsInBounds && correctAngle;

		const resolution = {
			width:
				!correctResolution && face.alignedRect.box.width > BOUNDS.res.WIDTH_HIGH
					? "back"
					: !correctResolution && face.alignedRect.box.width < BOUNDS.res.WIDTH_LOW
					? "forward"
					: "",
			height:
				!correctResolution && face.alignedRect.box.height > BOUNDS.res.HEIGHT_HIGH
					? "back"
					: !correctResolution && face.alignedRect.box.height < BOUNDS.res.HEIGHT_LOW
					? "forward"
					: "",
		};

		const bounds = {
			x:
				!fallsInBounds && face.alignedRect.box.x > BOUNDS.bounds.X_HIGH
					? "right"
					: !fallsInBounds && face.alignedRect.box.x < BOUNDS.bounds.X_LOW
					? "left"
					: "",
			y:
				!fallsInBounds && face.alignedRect.box.y > BOUNDS.bounds.Y_HIGH
					? "up"
					: !fallsInBounds && face.alignedRect.box.y < BOUNDS.bounds.Y_LOW
					? "down"
					: "",
		};

		let angle: CorrectionsAngle;

		if (source === "face") {
			angle = {
				pitch:
					!correctAngle && face.angle.pitch > BOUNDS.angle.PITCH_HIGH
						? "down"
						: !correctAngle && face.angle.pitch < BOUNDS.angle.PITCH_LOW
						? "up"
						: "",
				roll:
					!correctAngle && face.angle.roll > BOUNDS.angle.ROLL_HIGH
						? "left"
						: !correctAngle && face.angle.roll < BOUNDS.angle.ROLL_LOW
						? "right"
						: "",
				yaw:
					!correctAngle && face.angle.yaw > BOUNDS.angle.YAW_HIGH
						? "left"
						: !correctAngle && face.angle.yaw < BOUNDS.angle.YAW_LOW
						? "right"
						: "",
			};
		} else {
			angle = { pitch: "", roll: "", yaw: "" };
		}

		return {
			angle,
			bounds,
			isValid,
			resolution,
		};
	}

	goToNextStep() {
		const currentStepIndex = this.currentStepIndex;
		const nextStep = this.availableSteps[currentStepIndex + 1] || "result";

		this.setCurrentStep(nextStep);
	}

	goToPreviousStep() {
		const currentStepIndex = this.currentStepIndex;
		const previousStep = this.availableSteps[currentStepIndex - 1] || "document";

		this.setCurrentStep(previousStep);

		if (currentStepIndex - 1 === -1) this.setDocumentMethod("");
	}

	isDocumentValidAndComplete(projectFlow: ProjectFlow, appRegistration: AppRegistration): boolean {
		if (projectFlow.onboardingSettings?.steps?.document === 'skip') return true;

		const docValidation = appRegistration?.documentValidation;

		if (!docValidation && projectFlow.onboardingSettings.steps.document === 'mandatory') return false;
		if (!docValidation && !this.wasSkippedDocument()) return false;
		if (docValidation?.requiresBackSide && !docValidation?.backUrl) return false;
		if (projectFlow.onboardingSettings.document.verifyNames && docValidation?.infoValidationSupported && !docValidation?.namesMatch) return false;

		return true;
	}

	setAvailableSteps(steps: EnrollStep[]) {
		this.availableSteps = steps;
	}

	skipToStep(step: EnrollStep) {
		this.setCurrentStep(step);
	}

	setAttempts(step: "document" | "biometric", remaining: number, limit: number) {
		this.store[step].attempts = (limit - remaining) | 0;
		this.store[step].limit = limit;
		this.store[step].remaining = remaining;
	}

	setCompareScore(score: number) {
		this.store.biometric.compareScore = score;
	}

	setCurrentStep(step: EnrollStep) {
		this.enrollSettings = {
			...this._enrollSettings,
			currentStep: step,
		};
	}

	setDocumentMethod(method: EnrollDocumentMethod) {
		localStorage.setItem('documentMethod', method);

		this.enrollSettings = {
			...this._enrollSettings,
			documentMethod: method,
		};
	}

	setDocumentMethodFromInputMethod(inputMethod: string) {
		let documentMethod: EnrollDocumentMethod = localStorage.getItem("documentMethod") as EnrollDocumentMethod || '';

		if (inputMethod === 'CAMERA') documentMethod = 'scan';
		if (inputMethod === 'FILE_UPLOAD') documentMethod = 'upload';

		this.setDocumentMethod(documentMethod);
	}

	setSkippedBiometric(status: boolean): void {
		localStorage.setItem('skippedBiometric', `${+status}`);
		this._skipChanged$.next();
	}

	setSkippedDocument(status: boolean): void {
		localStorage.setItem('skippedDocument', `${+status}`);
		this._skipChanged$.next();
	}

	setLivenessScore(score: number) {
		this.store.biometric.livenessScore = score;
	}

	subtractAttempt(step: "document" | "biometric") {
		this.store[step].attempts++;
		this.store[step].remaining--;
	}

	unsetLocalStorage() {
		localStorage.removeItem("documentMethod");
		localStorage.removeItem("skippedBiometric");
		localStorage.removeItem("skippedDocument");
	}

	wasSkippedDocument() {
		return !!+(localStorage.getItem('skippedDocument') || false);
	}

	wasSkippedBiometric() {
		return !!+(localStorage.getItem('skippedBiometric') || false);
	}
}
