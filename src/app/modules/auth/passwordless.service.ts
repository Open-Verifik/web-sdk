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
		return this._httpWrapper
			.sendRequest("get", `${this.baseUrl}/v2/projects/kyc`, {
				id: projectId,
			})
			.pipe(
				tap((response: any) => {
					this.currentProject = new ProjectModel({
						...response.data,
						type,
					});
				})
			);
	}

	sendEmailValidation(projectId: string, email: string): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/projects/email-login`, {
				email,
				id: projectId,
				type: "login",
				language: this._translocoService.getActiveLang(),
			})
			.pipe(tap((response: any) => {}));
	}

	sendPhoneValidation(projectId: string, countryCode: string, phone: string, phoneGateway?: string): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/projects/phone-login`, {
				phone,
				countryCode,
				id: projectId,
				phoneGateway,
				type: "login",
				language: this._translocoService.getActiveLang(),
			})
			.pipe(tap((response: any) => {}));
	}

	confirmPhoneValidation(projectId: string, countryCode: string, phone: string, otp: string, authenticatorOTP: string): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/projects/phone-login/confirm`, {
				phone,
				otp,
				countryCode,
				id: projectId,
				authenticatorOTP,
				type: "login",
				// ipData: JSON.parse(localStorage.getItem("ipData")),
			})
			.pipe(
				tap((response: any) => {
					// console.log({
					//     response
					// });
				})
			);
	}

	confirmEmailValidation(projectId: string, email: string, otp: string, authenticatorOTP: string): Observable<any> {
		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/projects/email-login/confirm`, {
				email,
				otp,
				id: projectId,
				authenticatorOTP,
				type: "login",
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
}
