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

import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { environment } from "environments/environment";
import { KYCService } from "../../kyc.service";
import { AppRegistration, Project, ProjectFlow } from "../../project";
import { EnrollStep, SmartEnrollService } from "../../smart-enroll/smart-enroll.service";
import { Subject, takeUntil } from "rxjs";
import { DemoService } from "app/modules/demo/demo.service";
import { AuthService } from "app/core/auth/auth.service";

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

    stepInstructions: string[] = [];
    agreementForm: UntypedFormGroup;
    appRegistration: AppRegistration;
    device: any;
    isVerifikProject: boolean;
    project: Project;
    projectFlow: ProjectFlow;
    showQrCode: boolean = false;
    welcomeStyle: number = 0;

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _demoService: DemoService,
        private _formBuilder: UntypedFormBuilder,
        private _KYCService: KYCService,
        private _smartEnrollService: SmartEnrollService,
        private _translocoService: TranslocoService,
        private _authService: AuthService
    ) {
        this.appRegistration = this._KYCService.appRegistration;
        this.device = this._demoService.detectOS();
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

        this._setIsVerifikProject(this._activatedRoute.snapshot.params);
        this._setStepInstructions();

        if (this.appRegistration.currentStep === "signUpForm") {
            this._syncAppRegistration("instructions");
        }

        this._activatedRoute.params.pipe(takeUntil(this.unsubscriber$)).subscribe((params) => {
            this.isVerifikProject = Boolean(params.id === environment.verifikProject || params.id === environment.sandboxProject);
        });

        this._flowTop();
    }

    ngOnInit(): void {
        this.device = this._demoService.detectOS();

        const canvas = this.qrCodeCanvas.nativeElement;

        this._initForm();
        this._generateQRCode(canvas, window.location.href);

        if (["signUpForm", "instructions"].includes(this.appRegistration.currentStep)) {
            if (this._smartEnrollService.wasSkippedDocument() && this._smartEnrollService.wasSkippedBiometric()) {
                this.goToKYCApp("result");

                return;
            } else if (this._smartEnrollService.wasSkippedDocument()) {
                this.goToKYCApp("biometric");

                return;
            }
        }

        if (["document", "liveness", "end"].indexOf(this.appRegistration.currentStep) > -1) this.goToKYCApp("");
    }

    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }

    private _flowTop() {
        if (!this.projectFlow.onboardingSettings.steps) return;

        if (this.appRegistration.status === "COMPLETED" || this.appRegistration.status === "COMPLETED_WITHOUT_KYC") {
            this.welcomeStyle = 2;

            return;
        }

        const steps = this.projectFlow.onboardingSettings.steps;

        if (steps.document === "skip" && steps.liveness === "skip") {
            this.skipKYC();
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

    private _setIsVerifikProject(params: any) {
        this.isVerifikProject = params.id === environment.verifikProject || params.id === environment.sandboxProject;
    }

    private _setStepInstructions() {
        if (this.projectFlow.onboardingSettings.steps.document !== "skip") {
            this.stepInstructions.push(this._translocoService.translate("welcome.steps.1"), this._translocoService.translate("welcome.steps.2"));
        }

        if (this.projectFlow.onboardingSettings.steps.liveness !== "skip") {
            this.stepInstructions.push(this._translocoService.translate("welcome.steps.3"), this._translocoService.translate("welcome.steps.4"));
        }
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
                    this._authService.handleRedirect(this.projectFlow, this.project._id, _response.token, "onboarding");
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
            ((this._smartEnrollService.wasSkippedBiometric() || this.appRegistration.biometricValidation) &&
                (this._smartEnrollService.wasSkippedDocument() ||
                    this._smartEnrollService.isDocumentValidAndComplete(this.projectFlow, this.appRegistration)))
        ) {
            enrollStep = "result";
        } else if (
            (this.appRegistration.documentValidation &&
                this._smartEnrollService.isDocumentValidAndComplete(this.projectFlow, this.appRegistration) &&
                !this.appRegistration.biometricValidation) ||
            this._smartEnrollService.wasSkippedDocument()
        ) {
            this._syncAppRegistration("liveness", "ONGOING");

            enrollStep = "biometric";
        } else if (this.appRegistration.documentValidation) {
            this._syncAppRegistration("document", "ONGOING");

            enrollStep = "document-review";
        } else if (!enrollStep) {
            this._syncAppRegistration("document", "ONGOING");

            enrollStep = "document";
        }

        this.onServiceChange.next(enrollStep);
    }

    skipKYC(): void {
        this.welcomeStyle = 1;

        this._syncAppRegistration("skipKYC", "COMPLETED_WITHOUT_KYC", "redirect");
    }
}
