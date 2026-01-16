import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output, ViewEncapsulation } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";

import { AuthService } from "app/core/auth/auth.service";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { VerifikMediaDisplayComponent } from "app/shared/components/verifik-media-display";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { SmartEnrollService } from "../smart-enroll.service";

interface VerificationStep {
	icon: string;
	titleKey: string;
	descriptionKey: string;
	status: "mandatory" | "optional" | "skip";
	type: "document" | "liveness";
}

type SkipModalState = "confirm" | "loading" | "success" | "error";

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslocoModule, VerifikMediaDisplayComponent],
	selector: "smart-instructions",
	standalone: true,
	styleUrls: ["../smart-enroll.component.scss", "./smart-instructions.component.scss"],
	templateUrl: "./smart-instructions.component.html",
})
export class SmartInstructionsComponent {
	@Output() onStart = new EventEmitter<void>();

	errorMessage: string = "";
	isVerifikProject: boolean = false;
	project: Project;
	projectFlow: ProjectFlow;
	showSkipModal: boolean = false;
	skipModalState: SkipModalState = "confirm";
	steps: VerificationStep[] = [];
	year: number = new Date().getFullYear();

	constructor(
		private _authService: AuthService,
		private _KYCService: KYCService,
		private _passwordlessService: PasswordlessService,
		private _smartEnrollService: SmartEnrollService
	) {
		this.project = this._passwordlessService.currentProject;
		this.projectFlow = this._passwordlessService.currentProjectFlow;
		this.isVerifikProject = this._passwordlessService.isVerifikProject;

		this._buildSteps();
	}

	private _buildSteps(): void {
		const onboardingSteps = this.projectFlow.onboardingSettings.steps;

		if (onboardingSteps.document !== "skip") {
			this.steps.push({
				icon: "heroicons_outline:identification",
				titleKey: "smart_enroll.instructions.document_title",
				descriptionKey: "smart_enroll.instructions.document_description",
				status: onboardingSteps.document as "mandatory" | "optional",
				type: "document",
			});
		}

		if (onboardingSteps.liveness !== "skip") {
			this.steps.push({
				icon: "heroicons_outline:face-smile",
				titleKey: "smart_enroll.instructions.liveness_title",
				descriptionKey: "smart_enroll.instructions.liveness_description",
				status: onboardingSteps.liveness as "mandatory" | "optional",
				type: "liveness",
			});
		}
	}

	get canSkipAll(): boolean {
		const onboardingSteps = this.projectFlow.onboardingSettings.steps;

		const documentOptional = onboardingSteps.document === "optional" || onboardingSteps.document === "skip";
		const livenessOptional = onboardingSteps.liveness === "optional" || onboardingSteps.liveness === "skip";

		return documentOptional && livenessOptional;
	}

	get hasTermsOrPrivacy(): boolean {
		return !!(this.project.termsAndConditionsUrl || this.project.privacyUrl);
	}

	get redirectUrl(): string {
		const baseUrl = this.projectFlow.integrations?.redirectUrl || window.location.origin;

		return baseUrl;
	}

	get displayRedirectUrl(): string {
		try {
			const url = new URL(this.redirectUrl);
			return url.hostname + (url.pathname !== "/" ? url.pathname : "");
		} catch {
			return this.redirectUrl;
		}
	}

	startVerification(): void {
		this.onStart.emit();
	}

	openSkipModal(): void {
		if (!this.canSkipAll) return;

		this.showSkipModal = true;
		this.skipModalState = "confirm";
		this.errorMessage = "";
	}

	closeSkipModal(): void {
		if (this.skipModalState === "loading") return;

		this.showSkipModal = false;
		this.skipModalState = "confirm";
		this.errorMessage = "";
	}

	confirmSkipVerification(): void {
		this.skipModalState = "loading";

		this._smartEnrollService.setSkippedDocument(true);
		this._smartEnrollService.setSkippedBiometric(true);

		this._KYCService.syncAppRegistration("end", "COMPLETED_WITHOUT_KYC").subscribe({
			next: (response) => {
				this.skipModalState = "success";

				setTimeout(() => {
					this._authService.handleRedirect(this.projectFlow, this.project._id, response.data.token, "onboarding");
				}, 1500);
			},
			error: (error) => {
				this.skipModalState = "error";
				this.errorMessage = error?.error?.message || "Something went wrong. Please try again.";
			},
		});
	}

	retrySkip(): void {
		this.confirmSkipVerification();
	}
}
