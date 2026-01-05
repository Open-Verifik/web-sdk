import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { HttpWrapperService } from "../demo/http-wrapper.service";
import { TranslocoService } from "@ngneat/transloco";
import { Observable, tap } from "rxjs";
import { Project } from "app/core/classes/project.class";
import { ProjectFlow } from "app/core/classes/project-flow.class";

@Injectable({
	providedIn: "root",
})
export class PasswordlessService {
	private _currentProject: Project;
	protected _isVerifikProject: boolean = false;

	baseUrl: String = environment.apiUrl;
	flow: "onboarding" | "login" = "onboarding";

	constructor(private _httpWrapper: HttpWrapperService, private _translocoService: TranslocoService) {}

	get currentProjectFlow(): ProjectFlow {
		return this.flow === "onboarding" ? this.currentProject?.getOnboardingProjectFlow() : this.currentProject?.getLoginProjectFlow();
	}

	get currentProject(): Project {
		return this._currentProject;
	}

	set currentProject(project: Project) {
		this._currentProject = project;

		this._isVerifikProject = Boolean(
			this._currentProject._id === environment.verifikProject || this._currentProject._id === environment.sandboxProject
		);
	}

	get isVerifikProject(): boolean {
		return this._isVerifikProject;
	}

	requestProject(projectId: string, type: string = "onboarding"): Observable<any> {
		return this._httpWrapper
			.sendRequest("get", `${this.baseUrl}/v2/projects/kyc`, {
				id: projectId,
				type,
			})
			.pipe(
				tap((response) => {
					this.currentProject = new Project({
						...response.data,
						type,
					});
				})
			);
	}

	sendEmailValidation(email: string, location: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/email-validations`, {
			email,
			project: this.currentProject._id,
			projectFlow: this.currentProjectFlow?._id,
			type: "login",
			validationMethod: "verificationCode",
			language: this._translocoService.getActiveLang(),
			location,
		});
	}

	sendPhoneValidation(countryCode: string, phone: string, phoneGateway?: string, location?: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/phone-validations`, {
			countryCode,
			language: this._translocoService.getActiveLang(),
			location,
			phone,
			phoneGateway,
			project: this.currentProject._id,
			projectFlow: this.currentProjectFlow?._id,
			type: "login",
			validationMethod: "verificationCode",
		});
	}

	confirmPhoneValidation(countryCode: string, phone: string, otp: string, authenticatorOTP: string, location?: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/phone-validations/validate`, {
			authenticatorOTP,
			countryCode,
			location,
			otp,
			phone,
			projectFlow: this.currentProjectFlow?._id,
			type: "login",
		});
	}

	confirmEmailValidation(email: string, otp: string, authenticatorOTP: string, location?: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/email-validations/validate`, {
			email,
			location,
			otp,
			projectFlow: this.currentProjectFlow?._id,
			type: "login",
		});
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

		if (location) data.location = JSON.parse(location);

		let url = `${this.baseUrl}/v2/biometric-validations`;

		if (appLoginToken) url += `/app-login`;

		return this._httpWrapper.sendRequest(
			"post",
			url,
			{
				...data,
				projectFlow: this.currentProjectFlow?._id,
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

		if (location) data.location = JSON.parse(location);

		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/biometric-validations/validate`, data);
	}

	createAppRegistration(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-registrations`, data);
	}

	zkLogin(data: { record: any; faceBase64: string; projectId: string }): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-login/zk-proof`, data);
	}
}
