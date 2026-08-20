import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { Subscription } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration } from "../../project";
import { EnrollSettings, EnrollStep, SmartEnrollService } from "../smart-enroll.service";

@Component({
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, MatButtonModule, MatIconModule, TranslocoModule],
    selector: "smart-error-display",
    standalone: true,
    styleUrls: ["./smart-error-display.component.scss"],
    templateUrl: "./smart-error-display.component.html",
})
export class SmartErrorDisplayComponent implements OnDestroy {
    @Input("errorContent") errorContent: {
        message?: string;
        title?: string;
        livenessScore?: number;
        livenessMinScore?: number;
    };
    @Input("source") source: "face" | "document";
    @Input("cameraQualityHint") cameraQualityHint: boolean = false;

    @Output("onClearError") onClearError: EventEmitter<void> = new EventEmitter();
    @Output("onSwitchToMobile") onSwitchToMobile: EventEmitter<void> = new EventEmitter();

    private smartEnrollSettings$ = new Subscription();
    private kycApprovalSubmitted = false;

    appRegistration: AppRegistration;
    attemptsRemaining: number;
    currentStep: EnrollStep;
    enrollSettings: EnrollSettings;
    project: Project;
    projectFlow: ProjectFlow;

    constructor(
        private _KYCService: KYCService,
        private _smartEnrollService: SmartEnrollService,
        private _passwordlessService: PasswordlessService,
        private _translocoService: TranslocoService,
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.enrollSettings = this._smartEnrollService.enrollSettings;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

        const settings = this._smartEnrollService.enrollSettings;

        this.currentStep = settings.currentStep;

        this.onSettingsChange(settings);

        this.smartEnrollSettings$ = this._smartEnrollService.enrollSettings$.subscribe({
            next: (enrollSettings) => this.onSettingsChange(enrollSettings),
        });
    }

    ngOnDestroy() {
        this.smartEnrollSettings$.unsubscribe();
    }

    get translationKey(): string {
        if (!this.errorContent?.message) return "errors.something_went_wrong";
        if (this.source === "document") return "id_scanning." + this.errorContent.message;
        if (this.source === "face") return "liveness." + this.errorContent.message;
        return "errors.something_went_wrong";
    }

    /** Liveness score as 0–100 for display (backend uses 0–1). */
    get livenessScorePercent(): number | null {
        const s = this.errorContent?.livenessScore;
        if (s == null) return null;
        return s <= 1 ? Math.round(Number(s) * 100) : Math.round(Number(s));
    }

    /** Minimum liveness score as 0–100 for display. */
    get livenessMinScorePercent(): number | null {
        const s = this.errorContent?.livenessMinScore;
        if (s == null) return null;
        return s <= 1 ? Math.round(Number(s) * 100) : Math.round(Number(s));
    }

    get showLivenessScoreLine(): boolean {
        return this.source === "face" && this.livenessScorePercent != null && this.livenessMinScorePercent != null;
    }

    /**
     * Corrective instruction for the specific failure, when one is translated.
     * Recoverable capture problems (no face, several faces, cropped face) carry a
     * `<reason>_hint` key telling the user what to change before retrying.
     */
    get guidanceText(): string | null {
        if (!this.errorContent?.message) return null;

        const key = `${this.translationKey}_hint`;
        const translation = this._translocoService.translate(key);

        return translation && translation !== key ? translation : null;
    }

    private _syncAppRegistration(step: string, status?: string, action?: string) {
        this._KYCService.syncAppRegistration(step, status).subscribe({
            next: () => {},
            error: () => {},
            complete: () => {},
        });
    }

    exitApplication(): void {
        window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
    }

    private _maybeSubmitKycApprovalRequest(): void {
        if (!this._passwordlessService.isVerifikProject || this.kycApprovalSubmitted) {
            return;
        }

        this.kycApprovalSubmitted = true;

        this._KYCService.syncAppRegistration("end", "FAILED").subscribe({
            error: () => {},
        });

        this._KYCService.submitKycApprovalRequest().subscribe({
            error: () => {},
        });
    }

    onSettingsChange(settings: EnrollSettings) {
        this.currentStep = settings.currentStep;

        if (this.currentStep === "document") {
            this.attemptsRemaining = this._smartEnrollService.store.document.remaining;

            if (this.attemptsRemaining === 0) {
                this._syncAppRegistration("document", "FAILED");
                this._maybeSubmitKycApprovalRequest();
            }
        } else {
            this.attemptsRemaining = this._smartEnrollService.store.biometric.remaining;

            if (this.attemptsRemaining === 0) {
                this._syncAppRegistration("liveness", "FAILED");
                this._maybeSubmitKycApprovalRequest();
            }
        }
    }

    tryAgain(): void {
        this.onClearError.next();
    }

    switchToMobile(): void {
        this.onSwitchToMobile.next();
    }
}
