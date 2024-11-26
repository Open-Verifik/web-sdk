import QRCode from "qrcode";

import { CommonModule, NgIf } from "@angular/common";
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute } from "@angular/router";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";

import { environment } from "environments/environment";
import { KYCService } from "../../kyc.service";
import { AppRegistration, Project, ProjectFlow } from "../../project";
import { EnrollStep, SmartEnrollService } from "../../smart-enroll/smart-enroll.service";
import { Subject, takeUntil } from "rxjs";

@Component({
	selector: "auth-sign-up-verification-complete",
	templateUrl: "./sign-up-verification-complete.component.html",
	styleUrls: ["../../sign-in/sign-in.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		MatButtonModule,
		MatCheckboxModule,
		MatChipsModule,
		MatIconModule,
		MatProgressSpinnerModule,
		NgIf,
		ReactiveFormsModule,
		TranslocoModule,
	],
})
export class AuthSignUpVerificationCompleteComponent implements OnInit, OnDestroy {
	@ViewChild("agreementNgForm") agreementNgForm: NgForm;
	@ViewChild("qrCodeCanvas", { static: true }) public qrCodeCanvas: ElementRef<HTMLCanvasElement>;

	@Output("onServiceChange") onServiceChange: EventEmitter<EnrollStep> = new EventEmitter<EnrollStep>();

	private unsubscriber$: Subject<void> = new Subject<void>();

	agreementForm: UntypedFormGroup;
	appRegistration: AppRegistration;
	isVerifikProject: boolean;
	project: Project;
	projectFlow: ProjectFlow;
	showQrCode: boolean = false;
	welcomeStyle: number = 0;

	constructor(
		private _activatedRoute: ActivatedRoute,
		private _formBuilder: UntypedFormBuilder,
		private _KYCService: KYCService,
		private _smartEnrollService: SmartEnrollService,
	) {
		this.appRegistration = this._KYCService.appRegistration;
		this.project = this._KYCService.currentProject;
		this.projectFlow = this._KYCService.currentProjectFlow;

		if (this.appRegistration.currentStep === "signUpForm") {
			this._syncAppRegistration("instructions");
		}

		this._flowTop();
	}

	ngOnInit(): void {
		const canvas = this.qrCodeCanvas.nativeElement;

		this._initForm();
		this._generateQRCode(canvas, window.location.href);

		this._activatedRoute.params
			.pipe(takeUntil(this.unsubscriber$))
			.subscribe((params) => {
				this.isVerifikProject = Boolean(params.id === environment.verifikProject || params.id === environment.sandboxProject);
			});

		if (["signUpForm", "instructions"].includes(this.appRegistration.currentStep)) {
			if (this._smartEnrollService.wasSkippedDocument() && this._smartEnrollService.wasSkippedBiometric()) {
				this.goToKYCApp('result');

				return;
			} else if (this._smartEnrollService.wasSkippedDocument()) {
				this.goToKYCApp('biometric');

				return;
			}
		}

		if (this.appRegistration.currentStep === "document") {
			this.goToKYCApp("document-review");
		} else if (this.appRegistration.currentStep === "liveness" || this.appRegistration.currentStep === "end") {
			this.goToKYCApp("result");
		}
	}

	ngOnDestroy(): void {
		this.unsubscriber$.next();
		this.unsubscriber$.complete();
	}

	private _flowTop() {
		if (!this.projectFlow.onboardingSettings.steps) return;

		if (this.appRegistration.status === "COMPLETED" || this.appRegistration.status === "COMPLETED_WITHOUT_KYC") {
			this.welcomeStyle = 3;
			return;
		}

		const steps = this.projectFlow.onboardingSettings.steps;

		if (steps.document === "skip" && steps.liveness === "skip") {
			if (this.isVerifikProject) {
				this.welcomeStyle = 2;
			} else {
				this.skipKYC();
			}
		} else if (steps.document === "skip") {
			this.welcomeStyle = 1;
		} else {
			this.welcomeStyle = 0;
		}
	}

	private async _generateQRCode(canvas: HTMLCanvasElement, text: string) {
		try {
			await QRCode.toCanvas(canvas, text, { errorCorrectionLevel: "L" });
		} catch (err) {
			console.error(err);
		}
	}

	private _initForm(): void {
		this.agreementForm = this._formBuilder.group({ agreement: ["", Validators.requiredTrue] });
	}

	private _syncAppRegistration(step: string, status?: string, action?: string) {
		let _response: any = null;

		this._KYCService.syncAppRegistration(step, status).subscribe({
			next: (response) => {
				_response = response.data;
			},
			error: () => {},
			complete: () => {
				if (status === "COMPLETED_WITHOUT_KYC" && action === "redirect") {
					let redirectUrl = this.projectFlow.redirectUrl;

					if (environment.verifikProject === this.project._id) {
						redirectUrl = `${environment.appUrl}/sign-in`;
					} else if (environment.sandboxProject === this.project._id) {
						redirectUrl = `${environment.sandboxUrl}/sign-in`;
					}

					window.location.href = `${redirectUrl}?type=onboarding&token=${_response.token}`;

					return;
				}

				this.appRegistration.currentStep = step;
			},
		});
	}

	goToKYCApp(enrollStep: EnrollStep): void {
		if (
			this.appRegistration.status === "COMPLETED" ||
			this.appRegistration.status === "FAILED" ||
			(
				this._smartEnrollService.wasSkippedBiometric() &&
				(
					this._smartEnrollService.wasSkippedDocument() || this._KYCService.isDocumentValidAndComplete()
				)
			)
		) {
			enrollStep = "result";
		} else if (
			(
				this._KYCService.isDocumentValidAndComplete() &&
				!this.appRegistration.biometricValidation
			) || this._smartEnrollService.wasSkippedDocument()
		) {
			enrollStep = "biometric";
		} else if (this._KYCService.isDocumentValidAndComplete()) {
			enrollStep = "document-review";
		}

		this.onServiceChange.next(enrollStep);
	}

	skipDocument(): void {
		this._smartEnrollService.setSkippedDocument(true);

		if (this.projectFlow.onboardingSettings.steps.liveness === "skip" || this._smartEnrollService.wasSkippedBiometric()) {
			this.skipKYC();

			return;
		}

		this.welcomeStyle = 1;
	}

	skipBiometrics(): void {
		if (this.isVerifikProject) {
			this.welcomeStyle = 2;

			return;
		}

		this.skipKYC();
	}

	skipKYC(): void {
		this._syncAppRegistration("skipKYC", "COMPLETED_WITHOUT_KYC", "redirect");

		this.welcomeStyle = 4;
	}
}
