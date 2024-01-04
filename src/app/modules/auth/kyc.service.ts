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

	constructor(private _httpWrapper: HttpWrapperService, private _translocoService: TranslocoService) {}

	getProject(): Project {
		return this.currentProject;
	}

	getAppRegistration(id: string, data: any): Observable<any> {
		return this._httpWrapper.sendRequest("get", `${this.baseUrl}/v2/app-registrations/${id}`, data).pipe(
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

	completeSignUpForm(step: string): Observable<any> {
		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}/sync`, {
			step,
		});
	}
}
