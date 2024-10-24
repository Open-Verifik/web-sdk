import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { HttpWrapperService } from "../demo/http-wrapper.service";
import { TranslocoService } from "@ngneat/transloco";
import { Observable, tap } from "rxjs";
import { Project, ProjectModel } from "./project";

@Injectable({
	providedIn: "root",
})
export class PasswordlessService {
	baseUrl: String = environment.apiUrl;
	currentProject: Project;

	constructor(private _httpWrapper: HttpWrapperService, private _translocoService: TranslocoService) {}

	requestProject(projectId: string, type: string = "onboarding"): Observable<any> {
		const request = this._httpWrapper.sendRequest("get", `${this.baseUrl}/v2/projects/kyc`, {
			id: projectId,
		});

		request.subscribe((response) => {
			this.currentProject = new ProjectModel({
				...response.data,
				type,
			});
		});

		return request;
	}

	sendEmailValidation(email: string, location: any): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/email-validations`, {
				email,
				project: this.currentProject._id,
				projectFlow: this.currentProject.currentProjectFlow._id,
				type: "login",
				validationMethod: "verificationCode",
				language: this._translocoService.getActiveLang(),
				location,
			})
			.pipe(tap((response: any) => {}));
	}

	sendPhoneValidation(countryCode: string, phone: string, phoneGateway?: string, location?: any): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/phone-validations`, {
				phone,
				countryCode,
				projectFlow: this.currentProject.currentProjectFlow._id,
				project: this.currentProject._id,
				phoneGateway,
				type: "login",
				language: this._translocoService.getActiveLang(),
				validationMethod: "verificationCode",
				location,
			})
			.pipe(tap((response: any) => {}));
	}

	confirmPhoneValidation(countryCode: string, phone: string, otp: string, authenticatorOTP: string, location?: any): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/phone-validations/validate`, {
				projectFlow: this.currentProject.currentProjectFlow._id,
				countryCode,
				phone,
				otp,
				authenticatorOTP,
				type: "login",
				location,
				// ipData: JSON.parse(localStorage.getItem("ipData")),
			})
			.pipe(tap((response: any) => {}));
	}

	confirmEmailValidation(email: string, otp: string, authenticatorOTP: string, location?: any): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/email-validations/validate`, {
				email,
				otp,
				projectFlow: this.currentProject.currentProjectFlow._id,
				location,
				// authenticatorOTP,
				// ipData: JSON.parse(localStorage.getItem("ipData")),
			})
			.pipe(tap((response: any) => {}));
	}

	getProject(): Project {
		return this.currentProject;
	}

	biometricsSignIn(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/projects/biometrics/sign-in`, data);
	}

	createLivenessSession(data: any): Observable<any> {
		const appLoginToken = localStorage.getItem("accessToken");

		const location = localStorage.getItem("loginLocation");

		if (location) {
			data.location = JSON.parse(location);
		}

		let url = `${this.baseUrl}/v2/biometric-validations`;

		if (appLoginToken) url += `/app-login`;

		return this._httpWrapper.sendRequest(
			"post",
			url,
			{
				...data,
				projectFlow: this.currentProject.currentProjectFlow._id,
				project: this.currentProject._id,
			},
			{
				Headers: {
					Authorization: appLoginToken ? `Bearer ${appLoginToken}` : "",
				},
			}
		);
	}

	validateBiometrics(data: any): Observable<any> {
		const location = localStorage.getItem("loginLocation");

		if (location) {
			data.location = JSON.parse(location);
		}

		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/biometric-validations/validate`, data);
	}

	createAppRegistration(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-registrations`, data);
	}
}
