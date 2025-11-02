import { CommonModule, NgIf } from "@angular/common";
import { Component, OnDestroy, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatIconModule } from "@angular/material/icon";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Subject, takeUntil } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { KYCService } from "../../kyc.service";
import { EnrollDocumentMethod, EnrollSettings, EnrollStep, SmartEnrollService } from "../smart-enroll.service";

@Component({
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    imports: [CommonModule, FlexLayoutModule, MatIconModule, NgIf, TranslocoModule],
    selector: "smart-stepper",
    standalone: true,
    styleUrls: ["../smart-enroll.component.scss", "../../sign-up/sign-up.component.scss"],
    templateUrl: "./smart-stepper.component.html",
})
export class SmartStepperComponent implements OnDestroy {
    private unsubscriber$: Subject<void> = new Subject<void>();

    biometricSkipped: boolean = false;
    currentStep: EnrollStep;
    documentSkipped: boolean = false;
    method: EnrollDocumentMethod;
    project: Project;
    projectFlow: ProjectFlow;

    constructor(private _smartEnrollService: SmartEnrollService, private _KYCService: KYCService) {
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

        const settings = this._smartEnrollService.enrollSettings;

        this.currentStep = settings.currentStep;
        this.method = settings.documentMethod;

        this.biometricSkipped = this._smartEnrollService.wasSkippedBiometric();
        this.documentSkipped = this._smartEnrollService.wasSkippedDocument();

        this._smartEnrollService.enrollSettings$.pipe(takeUntil(this.unsubscriber$)).subscribe({
            next: (enrollSettings) => this.onSettingsChange(enrollSettings),
        });

        this._smartEnrollService.skipChanged$.pipe(takeUntil(this.unsubscriber$)).subscribe({
            next: () => {
                this.biometricSkipped = this._smartEnrollService.wasSkippedBiometric();
                this.documentSkipped = this._smartEnrollService.wasSkippedDocument();
            },
        });
    }

    ngOnDestroy() {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }

    onSettingsChange(settings: EnrollSettings) {
        this.currentStep = settings.currentStep;
        this.method = settings.documentMethod;
    }
}
