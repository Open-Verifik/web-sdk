import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { AppRegistration, ProjectFlow } from "../project";

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
