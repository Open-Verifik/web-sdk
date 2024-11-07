import { Subject } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";
import { Component, ElementRef, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";

import { DemoService } from "app/modules/demo/demo.service";
import { KYCService } from "../../kyc.service";
import { EnrollSettings, SmartEnrollService } from "../smart-enroll.service";
import { AppRegistration, BiometricValidation, ImageScan, Project, ProjectFlow } from "../../project";

import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { SmartScannerComponent } from "../smart-scanner/smart-scanner.component";
import { SmartStepperComponent } from "../smart-enroll-stepper/smart-stepper.component";

import { environment } from "environments/environment";

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
		FormsModule,
		LanguagesComponent,
		MatButtonModule,
		MatIconModule,
		NgIf,
		ReactiveFormsModule,
		SmartScannerComponent,
		SmartStepperComponent,
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

    failedUploadSubject: Subject<{ message: string, livenessScore?: number }> = new Subject<{message: string, livenessScore: number}>();
    successfulUploadSubject: Subject<{livenessScore?: number}> = new Subject<{livenessScore?: number}>();

    constructor(
		private _demoService: DemoService,
		private _KYCService: KYCService,
		private _smartEnrollService: SmartEnrollService,
	) {
		this.enrollSettings = this._smartEnrollService.enrollSettings;
        this.appRegistration = this._KYCService.appRegistration;
        this.project = this._KYCService.currentProject;
        this.projectFlow = this._KYCService.currentProjectFlow;

		this.demoData = this._demoService.getDemoData();
	}

    async onImageScan(imageScan: ImageScan) {
		const body: any = {
			image: imageScan.base64Image,
			os: this.demoData.OS,
			force: !!this.appRegistration.biometricValidation,
		};

		this._createBiometricValidation(body);
    }

    private _createBiometricValidation(body: any) {
        this._KYCService
            .createBiometricValidation(body)
            .subscribe({
                next: (response) => {
                    this.appRegistration.biometricValidation = response.data.biometricValidation as BiometricValidation;
                    this.appRegistration.person = response.data.person;

                    const livenessScore = Math.round(+(response.data.biometricValidation.livenessScore || 0) * 100);

                    if (this.appRegistration.documentValidation && this.appRegistration.biometricValidation && !this.appRegistration.compareFaceVerification) {
                        this._KYCService.compareFaces().subscribe({
                            next: (response) => {
                                this.appRegistration.compareFaceVerification = response.data.compareFaceVerification;
                                this._syncAppRegistration("liveness");
                            },
                            error: () => {
                                this.failedUploadSubject.next({ message: 'failed_comparison', livenessScore });
                            },
                            complete: () => {
                                this.successfulUploadSubject.next({ livenessScore });
								this._smartEnrollService.goToNextStep();
                            },
                        });

                        return;
                    }

                    this._syncAppRegistration("liveness")
                    this.successfulUploadSubject.next({ livenessScore });
                },
                error: (error) => {
                    this.errorResult = true;
                    this.errorContent = { message: error?.error?.message || '' };

                    const split = this.errorContent.message.split("@");

                    this.errorContent.message = (new RegExp(/^[a-z]+(?:_{0,2}[a-z]+)*$/)).test(split[0]) ? split[0] : 'failed_to_read';

                    const livenessScore = Math.round(+(split[1] || 0) * 100);

                    this.failedUploadSubject.next({ message: this.errorContent.message, livenessScore });
                },
            });
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
}
