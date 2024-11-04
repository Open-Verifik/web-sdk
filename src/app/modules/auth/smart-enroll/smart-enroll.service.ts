import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";

export interface EnrollSettings {
    currentStep: EnrollStep;
    documentMethod: EnrollDocumentMethod;
};

export interface EnrollStore {
    document: {
        attempts: number,
        remaining: number,
        limit: number,
    },
    biometric: {
        attempts: number,
        remaining: number,
        limit: number,
        compareMinScore: number,
        livenessMinScore: number,
    },
};

export type EnrollStep = '' | 'document' | 'document-review' | 'biometric' | 'result';
export type EnrollDocumentMethod = '' | 'scan' | 'upload';

@Injectable({
	providedIn: "root",
})
export class SmartEnrollService {
    private _enrollSettings: EnrollSettings;
    private _enrollSettingsSubject: Subject<EnrollSettings> = new Subject<EnrollSettings>();

    availableSteps: EnrollStep[];
    enrollSettings$: Observable<EnrollSettings>;
    store: EnrollStore;

	constructor() {
        this._enrollSettings = { currentStep: '', documentMethod: '' };
        this.enrollSettings$ = this._enrollSettingsSubject.asObservable();

        this.store = {
            document: {
                attempts: 0,
                remaining: 3,
                limit: 3,
            },
            biometric: {
                attempts: 0,
                remaining: 3,
                limit: 3,
                compareMinScore: 0.62,
                livenessMinScore: 0.64,
            },
        };
    }

    get currentStepIndex(): number {
        return this.availableSteps.indexOf(this.enrollSettings.currentStep);
    }

    set enrollSettings(updatedSettings: EnrollSettings) {
      this._enrollSettings = updatedSettings;
      this._enrollSettingsSubject.next(this._enrollSettings);
    }

    get enrollSettings(): EnrollSettings {
        return { ...this._enrollSettings };
    }

    goToNextStep() {
        const currentStepIndex = this.currentStepIndex;
        const nextStep = this.availableSteps[currentStepIndex + 1] || 'result';

        this.setCurrentStep(nextStep);
    }

    goToPreviousStep() {
        const currentStepIndex = this.currentStepIndex;
        const previousStep = this.availableSteps[currentStepIndex - 1] || 'document';

        this.setCurrentStep(previousStep);

        if (currentStepIndex - 1 === -1) this.setDocumentMethod('');
    }

    setAvailableSteps(steps: EnrollStep[]) {
        this.availableSteps = steps;
    }

    skipToStep(step: EnrollStep) {
        this.setCurrentStep(step);
    }

    setCurrentStep(step: EnrollStep) {
        this.enrollSettings = {
            ...this._enrollSettings,
            currentStep: step,
        };
    }

    setDocumentMethod(method: EnrollDocumentMethod) {
        this.enrollSettings = {
            ...this._enrollSettings,
            documentMethod: method,
        };
    }

    setAttempts(step: 'document' | 'biometric', remaining: number, limit: number) {
        this.store[step].attempts = (limit - remaining) | 0;
        this.store[step].limit = limit;
        this.store[step].remaining = remaining;
    }

    subtractAttempt(step: 'document' | 'biometric') {
        this.store[step].attempts++;
        this.store[step].remaining--;
    }
}