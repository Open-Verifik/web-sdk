import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { HttpWrapperService } from "../demo/http-wrapper.service";
import { TranslocoService } from "@ngneat/transloco";
import { Observable, tap } from "rxjs";
import { Project, ProjectFlow, ProjectModel } from "./project";

@Injectable({
	providedIn: "root",
})
export class KYCService {
	baseUrl: String = environment.apiUrl;
	appRegistration: any;
	currentProject: Project;
	currentProjectFlow: ProjectFlow;
	navigation: any;

	constructor(private _httpWrapper: HttpWrapperService, private _translocoService: TranslocoService) {}

	getNavigation(): any {
		return this.navigation;
	}

	initNavigation(): void {
		let stepsCount = 1;

		const displayableSteps = [];

		const map = {};

		const steps = this.currentProjectFlow.onboardingSettings.steps;
		// init steps based on the appRegistration

		// if (["mandatory", "optional"].includes(steps.basicInformation)) stepsCount++;

		if (["mandatory", "optional"].includes(steps.document)) {
			stepsCount++;

			displayableSteps.push({
				code: "document",
				status: steps.document,
			});

			map["document"] = steps.document;
		}

		if (["mandatory", "optional"].includes(steps.liveness)) {
			stepsCount++;

			displayableSteps.push({
				code: "liveness",
				status: steps.liveness,
			});

			map["liveness"] = steps.liveness;
		}

		displayableSteps.push({
			code: "end",
			status: "mandatory",
		});

		stepsCount++;

		this.navigation = {
			currentStep: 1,
			lastStep: stepsCount,
			steps,
			map,
			displayableSteps,
		};

		return this.navigation;
	}

	getProject(): Project {
		return this.currentProject;
	}

	navigateTo(step: string): void {
		setTimeout(() => {
			if (step === "next") {
				if (this.navigation.currentStep === "liveness") {
					this.navigation.currentStep = "end";
				}

				return;
			}

			this.navigation.currentStep = step;
		}, 750);
	}

	getAppRegistration(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("get", `${this.baseUrl}/v2/app-registrations/me`, data).pipe(
			tap((response: any) => {
				this.appRegistration = response.data;

				this.currentProject = new ProjectModel({
					...this.appRegistration.project,
					type: "onboarding",
				});

				this.currentProjectFlow = this.appRegistration.projectFlow;
			})
		);
	}

	createAppRegistration(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-registrations`, data);
	}

	sendEmailValidation(email: string): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/email-validations`, {
				email,
				project: this.currentProject._id,
				projectFlow: this.currentProjectFlow._id,
				type: "onboarding",
				validationMethod: "verificationCode",
				language: this._translocoService.getActiveLang(),
			})
			.pipe(tap((response: any) => {}));
	}

	sendPhoneValidation(countryCode: string, phone: string): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/phone-validations`, {
				countryCode,
				phone,
				project: this.currentProject._id,
				projectFlow: this.currentProjectFlow._id,
				type: "onboarding",
				validationMethod: "verificationCode",
				language: this._translocoService.getActiveLang(),
			})
			.pipe(tap((response: any) => {}));
	}

	confirmEmailValidation(email: string, otp: string): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/email-validations/validate`, {
			email,
			otp,
			project: this.currentProject._id,
			projectFlow: this.currentProjectFlow._id,
		});
	}

	confirmPhoneValidation(countryCode: string, phone: string, otp: string): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/phone-validations/validate`, {
			countryCode,
			phone,
			otp,
			project: this.currentProject._id,
			projectFlow: this.currentProjectFlow._id,
		});
	}

	updateAppRegistration(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}`, {
			...data,
		});
	}

	syncAppRegistration(step: string): Observable<any> {
		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}/sync`, {
			step,
		});
	}

	createBiometricValidation(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/biometric-validations/app-registration`, data);
	}
}
