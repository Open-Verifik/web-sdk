import { Injectable } from "@angular/core";
import { TranslocoService } from "@ngneat/transloco";
import * as faceapi from "@vladmandic/face-api";
import { Contour } from "libs/jscanify";
import { Observable, Subject } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { CountryOption } from "app/core/services/country.service";
import { AppRegistration } from "../project";
import { PromptTemplate } from "app/core/models/prompt-template.model";

export interface FaceDetectionWithLandmarks extends faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68> {}

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
    dimensions: {
        viewport?: {
            height: number;
            width: number;
        };
        real?: {
            height: number;
            width: number;
            offsetX: number;
            offsetY: number;
        };
        visible?: {
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
    face: any;
    document: any;
}

export interface CorrectionsBounds {
    x: string;
    y: string;
}
export interface CorrectionsHeightWidth {
    height: string;
    width: string;
}
export interface CorrectionsAngle {
    pitch: string;
    roll: string;
    yaw: string;
}

export interface Corrections {
    angle?: CorrectionsAngle;
    bounds?: CorrectionsBounds;
    document?: CorrectionsBounds;
    documentResolution?: CorrectionsHeightWidth;
    resolution?: CorrectionsHeightWidth;
}

export interface DocumentAnalysis {
    bounds: CorrectionsBounds;
    detection: DocumentDetection;
    isValid: boolean;
    resolution: CorrectionsHeightWidth;
}

export interface FaceAnalysis {
    angle: CorrectionsAngle;
    bounds: CorrectionsBounds;
    isValid: boolean;
    resolution: CorrectionsHeightWidth;
}

export interface DocumentDetection {
    x: number;
    y: number;
    height: number;
    width: number;
    contours?: Contour;
}

export interface EnrollSettings {
    country: keyof CountryOption;
    currentStep: EnrollStep;
    documentMethod: EnrollDocumentMethod;
    documentCategory: DocumentCategory;
    promptTemplate: PromptTemplate;
}

export type DocumentCategory = "passport" | "id" | "driving_license" | "tax_information";

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

export type EnrollStep = "" | "instructions" | "document" | "document-review" | "biometric" | "result";
export type EnrollDocumentMethod = "" | "scan" | "upload";

export type DocumentSide = "front" | "back";

/**
 * Client copy when a stored document image was removed and must be captured again.
 * Wording stays source-agnostic: no storage vendor, engine, or provider names.
 */
export const DOCUMENT_RESCAN_REQUIRED_I18N_KEY = "errors.document.rescan_required";

/**
 * Fields the enrollee reload and the scan response use to describe stored images.
 * `none` and `ephemeral` responses null `url` / `backUrl` even when the image was kept
 * for the session, so those addresses are not proof that a side is missing.
 */
export interface DocumentImageState {
    backUrl?: string | null;
    hasBackImage?: boolean | null;
    hasFrontImage?: boolean | null;
    isPurged?: boolean | null;
    requiresBackSide?: boolean | null;
    retention?: {
        mode?: string | null;
        purgedAt?: string | Date | null;
    } | null;
    url?: string | null;
}

const URL_HIDDEN_RETENTION_MODES = new Set(["none", "ephemeral"]);

/**
 * True when the validation was purged and its images are no longer available.
 * `isPurged` is the enrollee-view flag. `retention.purgedAt` covers responses that
 * stamp the purge but omit the flag.
 */
export function isDocumentPurged(dv: DocumentImageState | null | undefined): boolean {
    if (!dv) return false;

    return dv.isPurged === true || hasPurgeStamp(dv.retention?.purgedAt);
}

/**
 * Whether `side` is already captured.
 *
 * The enrollee flags are authoritative and do not depend on `url` / `backUrl`:
 * - `true` means the image is stored
 * - `false` means it is not, so a two-sided document still needs that side
 * - a purged record has neither side
 *
 * When a flag is omitted, a non-empty address still counts (older `store` responses).
 * When the address is also omitted because retention hides URLs (`none`, `ephemeral`,
 * or `hasFrontImage` with a stripped front address), the missing flag is treated as
 * captured. That stops a reload from sending the enrollee back to a side they already
 * scanned. An explicit `false` still asks for the side.
 */
export function hasSide(dv: DocumentImageState | null | undefined, side: DocumentSide): boolean {
    if (!dv || isDocumentPurged(dv)) return false;

    const flag = side === "front" ? dv.hasFrontImage : dv.hasBackImage;

    if (flag === true) return true;
    if (flag === false) return false;

    const address = side === "front" ? dv.url : dv.backUrl;

    if (hasImageAddress(address)) return true;
    if (urlsAreHidden(dv)) return true;

    return false;
}

/**
 * The document type needs a reverse image.
 * A stored back image counts when `requiresBackSide` was not copied onto the record.
 * An omitted `hasBackImage` does not: hidden URLs must not turn a passport into a two-sided scan.
 */
export function documentRequiresBackSide(dv: DocumentImageState | null | undefined, promptRequiresBack?: boolean): boolean {
    if (promptRequiresBack) return true;
    if (!dv) return false;
    if (dv.requiresBackSide) return true;
    if (dv.hasBackImage === true) return true;

    return hasImageAddress(dv.backUrl);
}

/**
 * True when this two-sided document does not yet have its reverse image.
 * A purged record is a full re-scan, not a back-side-only gap.
 */
export function isBackSideMissing(dv: DocumentImageState | null | undefined): boolean {
    if (!dv?.requiresBackSide || isDocumentPurged(dv)) return false;

    return !hasSide(dv, "back");
}

/**
 * Side to open when a scanner or uploader resumes a saved validation.
 * A purged document and a missing front both start on the front. The back opens
 * only when the front is already captured and the back is still required.
 */
export function resumeDocumentSide(dv: DocumentImageState | null | undefined, backRequired: boolean): DocumentSide {
    if (!backRequired || isDocumentPurged(dv)) return "front";
    if (hasSide(dv, "front") && !hasSide(dv, "back")) return "back";

    return "front";
}

function hasImageAddress(url: string | null | undefined): boolean {
    return typeof url === "string" && url.trim().length > 0;
}

function hasPurgeStamp(value: string | Date | null | undefined): boolean {
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;

    return true;
}

function urlsAreHidden(dv: DocumentImageState): boolean {
    const mode = (dv.retention?.mode || "").toLowerCase();

    if (URL_HIDDEN_RETENTION_MODES.has(mode)) return true;

    return dv.hasFrontImage === true && !hasImageAddress(dv.url);
}

@Injectable({
    providedIn: "root",
})
export class SmartEnrollService {
    private _enrollSettings: EnrollSettings;
    private _enrollSettings$: Subject<EnrollSettings> = new Subject<EnrollSettings>();
    private _insufficientCredits$: Subject<void> = new Subject<void>();
    private _skipChanged$: Subject<void> = new Subject<void>();

    availableSteps: EnrollStep[];
    enrollSettings$: Observable<EnrollSettings>;
    store: EnrollStore;
    skipChanged$: Observable<void>;

    constructor(private translocoService: TranslocoService) {
        this._enrollSettings = {
            country: localStorage.getItem("country") as keyof CountryOption,
            currentStep: "",
            documentCategory: localStorage.getItem("documentCategory") as DocumentCategory,
            documentMethod: localStorage.getItem("documentMethod") as EnrollDocumentMethod,
            promptTemplate: JSON.parse(localStorage.getItem("promptTemplate") || "null") as PromptTemplate,
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

    get insufficientCredits$(): Observable<void> {
        return this._insufficientCredits$.asObservable();
    }

    errorTranslation(message: string = "errors.something_went_wrong"): string {
        if (message === "errors.something_went_wrong") return this.translocoService.translate(message);

        const translation = this.translocoService.translate(message);

        if (translation === message) return this.translocoService.translate("errors.something_went_wrong");

        return translation;
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
        };

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
        };

        return {
            bounds,
            detection,
            isValid,
            resolution,
        };
    }

    evaluateFaceDetection(boundsParameters: BoundsDetection, face: any, source: "face" | "document"): FaceAnalysis {
        const BOUNDS = boundsParameters.face;

        let correctAngle: boolean = true;

        const box = face?.alignedRect?.box || face.box;

        const correctResolution =
            box.height > BOUNDS.res.HEIGHT_LOW &&
            box.height < BOUNDS.res.HEIGHT_HIGH &&
            box.width > BOUNDS.res.WIDTH_LOW &&
            box.width < BOUNDS.res.WIDTH_HIGH;

        const fallsInBounds =
            box.x > BOUNDS.bounds.X_LOW && box.x < BOUNDS.bounds.X_HIGH && box.y > BOUNDS.bounds.Y_LOW && box.y < BOUNDS.bounds.Y_HIGH;

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
                !correctResolution && box.width > BOUNDS.res.WIDTH_HIGH
                    ? "back"
                    : !correctResolution && box.width < BOUNDS.res.WIDTH_LOW
                    ? "forward"
                    : "",
            height:
                !correctResolution && box.height > BOUNDS.res.HEIGHT_HIGH
                    ? "back"
                    : !correctResolution && box.height < BOUNDS.res.HEIGHT_LOW
                    ? "forward"
                    : "",
        };

        const bounds = {
            x: !fallsInBounds && box.x > BOUNDS.bounds.X_HIGH ? "right" : !fallsInBounds && box.x < BOUNDS.bounds.X_LOW ? "left" : "",
            y: !fallsInBounds && box.y > BOUNDS.bounds.Y_HIGH ? "up" : !fallsInBounds && box.y < BOUNDS.bounds.Y_LOW ? "down" : "",
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

    insufficientCreditsTrigger(): void {
        this._insufficientCredits$.next();
    }

    /**
     * The document step can be left behind. A purged image or a two-sided document
     * that is still missing its reverse side keeps the enrollee on document review.
     */
    isDocumentValidAndComplete(projectFlow: ProjectFlow, appRegistration: AppRegistration): boolean {
        if (projectFlow.onboardingSettings?.steps?.document === "skip") return true;

        const docValidation = appRegistration?.documentValidation;

        if (isDocumentPurged(docValidation)) return false;

        if (!docValidation && projectFlow.onboardingSettings.steps.document === "mandatory") return false;
        if (!docValidation && !this.wasSkippedDocument()) return false;
        if (isBackSideMissing(docValidation)) return false;
        if (projectFlow.onboardingSettings.document.verifyNames && docValidation?.infoValidationSupported && docValidation?.imageValidated && !docValidation?.namesMatch) return false;

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

    setCountry(country?: keyof CountryOption) {
        localStorage.setItem("country", country || "");

        this.enrollSettings = {
            ...this._enrollSettings,
            country,
        };
    }

    setPromptTemplate(promptTemplate?: PromptTemplate) {
        localStorage.setItem("promptTemplate", JSON.stringify(promptTemplate || null));

        this.enrollSettings = {
            ...this._enrollSettings,
            promptTemplate,
        };
    }

    setDocumentMethod(documentMethod?: EnrollDocumentMethod) {
        localStorage.setItem("documentMethod", documentMethod || "");

        this.enrollSettings = {
            ...this._enrollSettings,
            documentMethod,
        };
    }

    setDocumentCategory(documentCategory?: DocumentCategory) {
        localStorage.setItem("documentCategory", documentCategory || "");

        this.enrollSettings = {
            ...this._enrollSettings,
            documentCategory,
        };
    }

    setDocumentMethodFromInputMethod(inputMethod: string) {
        let documentMethod: EnrollDocumentMethod = (localStorage.getItem("documentMethod") as EnrollDocumentMethod) || "";

        if (inputMethod === "CAMERA") documentMethod = "scan";
        if (inputMethod === "FILE_UPLOAD") documentMethod = "upload";

        this.setDocumentMethod(documentMethod);
    }

    setSkippedBiometric(status: boolean): void {
        localStorage.setItem("skippedBiometric", `${+status}`);
        this._skipChanged$.next();
    }

    setSkippedDocument(status: boolean): void {
        localStorage.setItem("skippedDocument", `${+status}`);
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
        localStorage.removeItem("country");
        localStorage.removeItem("documentCategory");
        localStorage.removeItem("documentMethod");
        localStorage.removeItem("promptTemplate");
        localStorage.removeItem("skippedBiometric");
        localStorage.removeItem("skippedDocument");
    }

    wasSkippedDocument() {
        return !!+(localStorage.getItem("skippedDocument") || false);
    }

    wasSkippedBiometric() {
        return !!+(localStorage.getItem("skippedBiometric") || false);
    }
}
