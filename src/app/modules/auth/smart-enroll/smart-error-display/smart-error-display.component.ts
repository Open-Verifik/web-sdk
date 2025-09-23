import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Subscription } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { KYCService } from "../../kyc.service";
import { AppRegistration } from "../../project";
import { EnrollSettings, EnrollStep, SmartEnrollService } from "../smart-enroll.service";

@Component({
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, MatButtonModule, TranslocoModule],
    selector: "smart-error-display",
    standalone: true,
    styleUrls: ["./smart-error-display.component.scss"],
    templateUrl: "./smart-error-display.component.html",
})
export class SmartErrorDisplayComponent implements OnDestroy {
    @Input("errorContent") errorContent: { message?: string; title?: string };
    @Input("source") source: "face" | "document";

    @Output("onClearError") onClearError: EventEmitter<void> = new EventEmitter();

    private smartEnrollSettings$ = new Subscription();

    appRegistration: AppRegistration;
    attemptsRemaining: number;
    currentStep: EnrollStep;
    enrollSettings: EnrollSettings;
    project: Project;
    projectFlow: ProjectFlow;

    constructor(private _KYCService: KYCService, private _smartEnrollService: SmartEnrollService) {
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
        if (this.source === "document") return "id_scanning." + this.errorContent.message;
        if (this.source === "face") return "liveness." + this.errorContent.message;
        return "errors.something_went_wrong";
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

    onSettingsChange(settings: EnrollSettings) {
        this.currentStep = settings.currentStep;

        if (this.currentStep === "document") {
            this.attemptsRemaining = this._smartEnrollService.store.document.remaining;

            if (this.attemptsRemaining === 0) this._syncAppRegistration("document", "FAILED");
        } else {
            this.attemptsRemaining = this._smartEnrollService.store.biometric.remaining;

            if (this.attemptsRemaining === 0) this._syncAppRegistration("liveness", "FAILED");
        }
    }

    tryAgain(): void {
        this.onClearError.next();
    }
}
