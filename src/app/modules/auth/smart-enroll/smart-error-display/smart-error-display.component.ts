import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";
import { Subscription } from "rxjs";
import { AppRegistration, Project, ProjectFlow } from "../../project";
import { EnrollSettings, EnrollStep, SmartEnrollService } from "../smart-enroll.service";
import { KYCService } from "../../kyc.service";
import { environment } from "environments/environment";
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

    @Output('onClearError') onClearError: EventEmitter<void> = new EventEmitter();

	private _smartEnrollSettingsSubscription = new Subscription();

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

		this._smartEnrollSettingsSubscription = this._smartEnrollService.enrollSettings$.subscribe({
			next: (enrollSettings) => this.onSettingsChange(enrollSettings)
		});
    }

	ngOnDestroy() {
		this._smartEnrollSettingsSubscription.unsubscribe();
	}

	private _syncAppRegistration(step: string, status?: string, action?: string) {
		let _response: any = null;

		this._KYCService
			.syncAppRegistration(step, status)
			.subscribe({
				next: (response) => {
					_response = response.data;
				},
				error: () => {},
				complete: () => {
					if (status !== "COMPLETED_WITHOUT_KYC" && action !== "redirect") return;

                    let redirectUrl = this.projectFlow.redirectUrl;

                    if (environment.verifikProject === this.project._id) {
                        redirectUrl = `${environment.appUrl}/sign-in`;
                    } else if (environment.sandboxProject === this.project._id) {
                        redirectUrl = `${environment.sandboxUrl}/sign-in`;
                    }

                    window.location.href = `${redirectUrl}?type=onboarding&token=${_response.token}`;
            },
			}
		);
	}

    canSkipStep() {
        if (this.currentStep === 'document') {
            return this.projectFlow.onboardingSettings.steps.document === 'optional';
        }

        return this.projectFlow.onboardingSettings.steps.liveness === 'optional';
    }

    skipStep() {
        if (this.currentStep === 'document') {
            this.appRegistration.documentValidation = null;

            if (this.projectFlow.onboardingSettings.steps.liveness === 'skip') {
			    return this._syncAppRegistration("skipKYC", "COMPLETED_WITHOUT_KYC", "redirect");
            }

            this._smartEnrollService.skipToStep('biometric');

            return;
        }

        return this._syncAppRegistration("skipKYC", "COMPLETED_WITHOUT_KYC", "redirect");
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