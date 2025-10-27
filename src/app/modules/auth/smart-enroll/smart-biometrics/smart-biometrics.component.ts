import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule } from "@ngneat/transloco";
import { Subject } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { DemoService } from "app/modules/demo/demo.service";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration, BiometricValidation, ImageScan } from "../../project";
import { EnrollSettings, SmartEnrollService } from "../smart-enroll.service";
import { SmartErrorDisplayComponent } from "../smart-error-display/smart-error-display.component";
import { SmartLivenessComponent } from "../smart-liveness/smart-liveness.component";
import { SmartLivenessDemoComponent } from "../smart-liveness/smart-liveness-demo.component";

@Component({
    animations: fuseAnimations,
    imports: [CommonModule, SmartLivenessComponent, SmartLivenessDemoComponent, SmartErrorDisplayComponent, TranslocoModule],
    selector: "smart-biometrics",
    standalone: true,
    styleUrls: ["../smart-enroll.component.scss"],
    templateUrl: "./smart-biometrics.component.html",
})
export class SmartBiometricsComponent implements OnDestroy {
    @ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;

    appRegistration: AppRegistration;
    demoData: any;
    demoModeChoice: "own" | "demo" | "" = "";
    enrollSettings: EnrollSettings;
    errorContent: { message: string };
    errorResult: boolean;
    faceIdCard: string;
    project: Project;
    projectFlow: ProjectFlow;
    retrySubject: Subject<void> = new Subject<void>();
    successfulUploadSubject: Subject<void> = new Subject<void>();
    useDemoData: boolean = false;

    constructor(
        private _demoService: DemoService,
        private _KYCService: KYCService,
        private _smartEnrollService: SmartEnrollService,
        private _passwordlessService: PasswordlessService
    ) {
        this.enrollSettings = this._smartEnrollService.enrollSettings;

        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._passwordlessService.currentProject;
        this.projectFlow = this._passwordlessService.currentProjectFlow;

        this.errorResult = this._smartEnrollService.store.biometric.remaining === 0;
        this.errorContent = { message: "" };

        this.demoModeChoice = this._demoService.demoModeChoice;
        this.useDemoData = this.demoModeChoice === "demo";
        this.demoData = this._demoService.getDemoData();
    }

    ngOnDestroy() {
        this.successfulUploadSubject.complete();
        this.retrySubject.complete();
    }

    private _createBiometricValidation(body: any) {
        this._smartEnrollService.setSkippedBiometric(false);

        this._KYCService.createBiometricValidation(body).subscribe({
            next: (response) => {
                this.appRegistration.biometricValidation = response.data.biometricValidation as BiometricValidation;
                this.appRegistration.person = response.data.person;
                this.appRegistration.face = null;

                this._smartEnrollService.setLivenessScore(response.data.biometricValidation.livenessScore);

                if (this.appRegistration.documentValidation && this.appRegistration.biometricValidation) {
                    this._KYCService.compareFaces().subscribe({
                        next: (response) => {
                            this.appRegistration.compareFaceVerification = response.data.compareFaceVerification;

                            this._smartEnrollService.setCompareScore(response.data.compareFaceVerification.result.score);
                        },
                        error: (error) => this._handleError(error),
                        complete: () => {
                            this._syncAppRegistration("end", "ONGOING");
                            this.successfulUploadSubject.next();
                            this._smartEnrollService.goToNextStep();
                        },
                    });

                    return;
                }

                this._syncAppRegistration("end", "ONGOING");
                this._smartEnrollService.goToNextStep();
                this.successfulUploadSubject.next();
            },
            error: (error) => this._handleError(error),
        });
    }

    private _handleError(exception: any): void {
        if (exception?.error?.code === "PaymentRequired") {
            this._smartEnrollService.insufficientCreditsTrigger();
            return;
        }

        this._smartEnrollService.subtractAttempt("biometric");
        this.errorContent = { message: exception?.error?.message || "" };

        const str = this.errorContent.message.split("@");

        if (str.length > 1) {
            this._smartEnrollService.setLivenessScore(parseFloat(str[1]) || 0);
            this._smartEnrollService.goToNextStep();

            return;
        }

        this.errorResult = true;
        this.errorContent.message = new RegExp(/^[a-z]+(?:_{0,2}[a-z]+)*$/).test(str[0]) ? str[0] : "liveness_failed";
    }

    private _syncAppRegistration(step: string, status?: string, action?: string) {
        this._KYCService.syncAppRegistration(step, status).subscribe({
            next: () => {},
            error: () => {},
            complete: () => {},
        });
    }

    onImageScan(imageScan: ImageScan) {
        const body: any = {
            image: imageScan.face,
            os: this.demoData.OS,
            force: !!this.appRegistration.biometricValidation,
        };

        this._createBiometricValidation(body);
    }

    retry() {
        this.errorResult = false;
        this.errorContent = { message: "" };

        this.retrySubject.next();
    }

    skipStep() {
        if (this.projectFlow.onboardingSettings.steps.liveness === "mandatory") return;

        this._smartEnrollService.setSkippedBiometric(true);
        this._smartEnrollService.skipToStep("result");
    }
}
