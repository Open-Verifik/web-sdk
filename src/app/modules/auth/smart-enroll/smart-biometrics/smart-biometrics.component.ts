import { Subject } from "rxjs";

import { CommonModule } from "@angular/common";
import { Component, ElementRef, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";

import { DemoService } from "app/modules/demo/demo.service";
import { KYCService } from "../../kyc.service";
import { EnrollSettings, SmartEnrollService } from "../smart-enroll.service";
import { AppRegistration, BiometricValidation, ImageScan, Project, ProjectFlow } from "../../project";

import { SmartScannerComponent } from "../smart-scanner/smart-scanner.component";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";

import { environment } from "environments/environment";
import { SmartErrorDisplayComponent } from "../smart-error-display/smart-error-display.component";

@Component({
	selector: "smart-biometrics",
	templateUrl: "./smart-biometrics.component.html",
	styleUrls: ["../smart-enroll.component.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		CommonModule,
		FlexLayoutModule,
		SmartScannerComponent,
		SmartStepperComponent,
		SmartErrorDisplayComponent,
		TranslocoModule,
	],
})
export class SmartBiometricsComponent {
	@ViewChild("faceCardCanvas", { static: true }) faceCardCanvas: ElementRef<HTMLCanvasElement>;

	appRegistration: AppRegistration;
	demoData: any;
	enrollSettings: EnrollSettings;
    faceIdCard: string;
	project: Project;
	projectFlow: ProjectFlow;
	errorResult: boolean;
	errorContent: { message: string };

    successfulUploadSubject: Subject<void> = new Subject<void>();

    constructor(
		private _demoService: DemoService,
		private _KYCService: KYCService,
		private _smartEnrollService: SmartEnrollService,
	) {
		this.enrollSettings = this._smartEnrollService.enrollSettings;
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

		this.errorResult = this._smartEnrollService.store.biometric.remaining === 0;
		this.errorContent = { message: '' };

		this.demoData = this._demoService.getDemoData();
	}

    private _createBiometricValidation(body: any) {
        this._KYCService
            .createBiometricValidation(body)
            .subscribe({
                next: (response) => {
                    this.appRegistration.biometricValidation = response.data.biometricValidation as BiometricValidation;
                    this.appRegistration.person = response.data.person;

                    if (this.appRegistration.documentValidation && this.appRegistration.biometricValidation && !this.appRegistration.compareFaceVerification) {
                        this._KYCService.compareFaces().subscribe({
                            next: (response) => {
                                this.appRegistration.compareFaceVerification = response.data.compareFaceVerification;
                                this._syncAppRegistration("liveness", "ONGOING");
                            },
                            error: (error) => this._handleError(error),
							complete: () => {
								this.successfulUploadSubject.next();
								this._smartEnrollService.goToNextStep();
                            },
                        });

                        return;
                    }

                    this._syncAppRegistration("liveness", "ONGOING");
					this._smartEnrollService.goToNextStep();
                    this.successfulUploadSubject.next();
                },
                error: (error) => this._handleError(error),
            });
    }

	private _handleError(error: any): void {
		this._smartEnrollService.subtractAttempt('biometric');

		this.errorResult = true;
		this.errorContent = { message: error?.error?.message || '' };

		const split = this.errorContent.message.split("@");
		this.errorContent.message = (new RegExp(/^[a-z]+(?:_{0,2}[a-z]+)*$/)).test(split[0]) ? split[0] : 'failed_to_scan';
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

    onImageScan(imageScan: ImageScan) {
		const body: any = {
			image: imageScan.base64Image,
			os: this.demoData.OS,
			force: !!this.appRegistration.biometricValidation,
		};

		this._createBiometricValidation(body);
    }

	retry() {
		this.errorResult = false;
		this.errorContent = { message: '' };
	}
}
