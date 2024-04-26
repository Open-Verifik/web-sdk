import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { HttpClient } from "@angular/common/http";
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

	constructor(private _httpWrapper: HttpWrapperService, private _translocoService: TranslocoService, private _http: HttpClient) {}

	getNavigation(): any {
		return this.navigation;
	}

	initNavigation(): void {
		let stepsCount = 1;

		const displayableSteps = [];

		const map = {};

		const steps = this.currentProjectFlow.onboardingSettings.steps;

		if (["mandatory", "optional"].includes(steps.document)) {
			stepsCount++;

			displayableSteps.push({
				code: "document",
				status: steps.document,
			});

			map["document"] = steps.document;

			stepsCount++;

			displayableSteps.push({
				code: "documentReview",
				status: steps.document,
			});

			map["documentReview"] = steps.document;
		}

		if (["mandatory", "optional"].includes(steps.liveness)) {
			stepsCount++;

			displayableSteps.push({
				code: "liveness",
				status: steps.liveness,
			});

			map["liveness"] = steps.liveness;

			if (map["document"]) {
				stepsCount++;

				// displayableSteps.push({
				// 	code: "documentLivenessReview",
				// 	status: steps.liveness,
				// 	hidden: true,
				// });

				map["documentLivenessReview"] = steps.liveness;
			}
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
				switch (this.navigation.currentStep) {
					case "liveness":
						this.navigation.currentStep = "documentLivenessReview";

						break;
					case "document":
						this.navigation.currentStep = "documentReview";

						break;
					case "documentReview":
						this.navigation.currentStep = "liveness";

						break;
					case "documentLivenessReview":
						this.navigation.currentStep = "end";

						break;
				}

				return;
			}

			this.navigation.currentStep = step;
		}, 750);
	}

	getAppRegistration(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-registrations/me`, data).pipe(
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

	sendPhoneValidation(countryCode: string, phone: string, phoneGateway?: string): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/phone-validations`, {
				countryCode,
				phone,
				project: this.currentProject._id,
				projectFlow: this.currentProjectFlow._id,
				type: "onboarding",
				validationMethod: "verificationCode",
				language: this._translocoService.getActiveLang(),
				phoneGateway: phoneGateway || "sms",
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

	syncAppRegistration(step: string, status: string): Observable<any> {
		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}/sync`, {
			step,
			status,
		});
	}

	createDocumentValidation(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/document-validations/app-registration`, data);
	}

	createBiometricValidation(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/biometric-validations/app-registration`, data);
	}

	// const authToken: string = localStorage.getItem("accessToken");
	// let headers: any = {
	// 	timeout: 20,
	// };

	// if (authToken) {
	// 	headers["Authorization"] = `Bearer ${authToken}`;
	// }
	// return this._http.put(`${this.baseUrl}/v2/information-validations/${data._id}/background-check`, {}, headers);
	updateInformationValidationWithCriminalRecords(data: any): Observable<any> {
		console.log(data);
		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/information-validations/${data._id}/background-check`);
	}

	updateDocumentValidationNameValidation(data: any): Observable<any> {
		console.log(data);
		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/document-validations/${data._id}/validate`);
	}

	/////////////////////// identity images /////////////////////////
	getIdentityImages(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("get", `${this.baseUrl}/v2/identity-images`, data);
	}

	compareFaces(): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/face-recognition/compare/app-registration`, {});
	}

	restartKYC(): Observable<any> {
		return this._httpWrapper.sendRequest("delete", `${this.baseUrl}/v2/biometric-validations/${this.appRegistration.biometricValidation._id}`);
	}
}
