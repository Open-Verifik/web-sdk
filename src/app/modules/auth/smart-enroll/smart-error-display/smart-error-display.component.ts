import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";
import { Subscription } from "rxjs";
import { AppRegistration, Project, ProjectFlow } from "../../project";
import { EnrollSettings, EnrollStep, SmartEnrollService } from "../smart-enroll.service";
import { KYCService } from "../../kyc.service";
import { MatButtonModule } from "@angular/material/button";

@Component({
	selector: "smart-error-display",
	templateUrl: "./smart-error-display.component.html",
	styleUrls: ["../smart-enroll.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
        CommonModule,
        FlexLayoutModule,
        MatButtonModule,
        TranslocoModule,
	],
})
export class SmartErrorDisplayComponent implements OnDestroy {
    @Input('errorContent') errorContent: { message?: string, title?: string };
    @Input('source') source: 'face' | 'document';

    @Output('onClearError') onClearError: EventEmitter<void> = new EventEmitter();

	private smartEnrollSettings$ = new Subscription();

	appRegistration: AppRegistration;
    attemptsRemaining: number;
	currentStep: EnrollStep;
	enrollSettings: EnrollSettings;
	project: Project;
	projectFlow: ProjectFlow;

    constructor(
        private _KYCService: KYCService,
        private _smartEnrollService: SmartEnrollService,
    ) {
		this.appRegistration = this._KYCService.appRegistration;
		this.enrollSettings = this._smartEnrollService.enrollSettings;
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;
        
        const settings = this._smartEnrollService.enrollSettings;

        this.currentStep = settings.currentStep;

        if (this.currentStep === 'document') {
            this.attemptsRemaining = this._smartEnrollService.store.document.remaining;
        } else {
            this.attemptsRemaining = this._smartEnrollService.store.biometric.remaining;
        }

		this.smartEnrollSettings$ = this._smartEnrollService.enrollSettings$.subscribe({
			next: (enrollSettings) => this.onSettingsChange(enrollSettings)
		});
    }

	ngOnDestroy() {
		this.smartEnrollSettings$.unsubscribe();
	}

	exitApplication(): void {
		window.location.href = `${window.location.origin}/sign-up/${this.project._id}`;
	}

	onSettingsChange(settings: EnrollSettings) {
		this.currentStep = settings.currentStep;

        if (this.currentStep === 'document') {
            this.attemptsRemaining = this._smartEnrollService.store.document.remaining;
        } else {
            this.attemptsRemaining = this._smartEnrollService.store.biometric.remaining;
        }
	}

    tryAgain(): void {
        this.onClearError.next();
    }
}