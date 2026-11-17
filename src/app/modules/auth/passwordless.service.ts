import { Injectable, Optional } from "@angular/core";
import { environment } from "environments/environment";
import { HttpWrapperService } from "../demo/http-wrapper.service";
import { TranslocoService } from "@ngneat/transloco";
import { catchError, from, map, Observable, of, switchMap, tap } from "rxjs";
import { Project } from "app/core/classes/project.class";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { AntiBotChallengeService } from "app/core/services/anti-bot-challenge.service";
import { saveSignUpAppRegistrationToken } from "app/core/services/app-registration-session.storage";

export interface HumanIdLoginPayload {
	projectId: string;
	faceBase64: string;
	identifier?: string;
	humanId?: string;
	qrImageBase64?: string;
	sessionCode?: string;
	location?: any;
}

export interface HumanIdLoginResponse {
	token: string;
	appLogin: {
		_id: string;
		project: string;
		accessMode: string;
		sourceProject: string;
		sourceType: string;
		appRegistration?: string;
	};
	publicData?: Record<string, any>;
}

@Injectable({
	providedIn: "root",
})
export class PasswordlessService {
	private _currentProject: Project;
	protected _isVerifikProject: boolean = false;

	baseUrl: String = environment.apiUrl;
	flow: "onboarding" | "login" = "onboarding";

	constructor(
		private _httpWrapper: HttpWrapperService,
		private _translocoService: TranslocoService,
		@Optional() private _antiBotChallengeService?: AntiBotChallengeService
	) {}

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

	private _pickAntiBotHeaders(source?: Record<string, string>): Record<string, string> {
		if (!source || typeof source !== "object") return {};
		const picked: Record<string, string> = {};
		for (const headerName of AntiBotChallengeService.HEADER_NAMES) {
			const val = source[headerName];
			if (typeof val === "string" && val.length > 0) {
				picked[headerName] = val;
			}
		}
		return picked;
	}

	private _resolveAntiBotHeaders(
		projectId?: string,
		explicitHeaders?: Record<string, string>
	): Observable<Record<string, string>> {
		const pickedExplicit = this._pickAntiBotHeaders(explicitHeaders);
		if (pickedExplicit["X-Bot-Ticket"] && pickedExplicit["X-Bot-Proof"]) {
			return of(pickedExplicit);
		}

		const resolvedProjectId = projectId || this.currentProject?._id;
		if (resolvedProjectId && typeof sessionStorage !== "undefined") {
			const storageKey = AntiBotChallengeService.getStorageKey(resolvedProjectId);
			try {
				const raw = sessionStorage.getItem(storageKey);
				if (raw) {
					const storedHeaders = AntiBotChallengeService.extractValidHeaders(JSON.parse(raw));
					if (storedHeaders) {
						sessionStorage.removeItem(storageKey);
						return of({ ...storedHeaders, ...pickedExplicit });
					}
				}
			} catch {
				// Ignore storage access or malformed JSON errors and fall back gracefully
			}
		}

		if (resolvedProjectId && this._antiBotChallengeService?.prepareVerificationHeaders) {
			return from(this._antiBotChallengeService.prepareVerificationHeaders(resolvedProjectId)).pipe(
				map((generated) => ({
					...this._pickAntiBotHeaders(generated),
					...pickedExplicit,
				})),
				catchError(() => of(pickedExplicit))
			);
		}

		return of(pickedExplicit);
	}

	biometricsSignIn(data: any, antiBotHeaders?: Record<string, string>): Observable<any> {
		const projectId = data?.projectId || data?.project || this.currentProject?._id;
		return this._resolveAntiBotHeaders(projectId, antiBotHeaders).pipe(
			switchMap((headers) => {
				const options = Object.keys(headers).length ? { headers } : {};
				return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/projects/biometrics/sign-in`, data, options);
			})
		);
	}

	createLivenessSession(data: any, antiBotHeaders?: Record<string, string>): Observable<any> {
		const appLoginToken = localStorage.getItem("accessToken");
		const location = localStorage.getItem("loginLocation");

		if (location) data.location = JSON.parse(location);

		let url = `${this.baseUrl}/v2/biometric-validations`;

		if (appLoginToken) url += `/app-login`;

		const projectId = data?.projectId || data?.project || this.currentProject?._id;
		return this._resolveAntiBotHeaders(projectId, antiBotHeaders).pipe(
			switchMap((resolvedAntiBotHeaders) => {
				const headers: Record<string, string> = {
					...resolvedAntiBotHeaders,
				};
				if (appLoginToken) {
					headers["Authorization"] = `Bearer ${appLoginToken}`;
				}
				const options = Object.keys(headers).length ? { headers } : {};
				return this._httpWrapper.sendRequest(
					"post",
					url,
					{
						...data,
						projectFlow: this.currentProjectFlow?._id,
						project: this.currentProject?._id,
					},
					options
				);
			})
		);
	}

	requestIpLocation(): Observable<any> {
		return this._httpWrapper.sendRequest("get", `${this.baseUrl}/v2/projects/kyc/ip-location`);
	}

	validateBiometrics(data: any, antiBotHeaders?: Record<string, string>): Observable<any> {
		const location = localStorage.getItem("loginLocation");

		if (location) data.location = JSON.parse(location);

		const projectId = data?.projectId || data?.project || this.currentProject?._id;
		return this._resolveAntiBotHeaders(projectId, antiBotHeaders).pipe(
			switchMap((headers) => {
				const options = Object.keys(headers).length ? { headers } : {};
				return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/biometric-validations/validate`, data, options);
			})
		);
	}

	createAppRegistration(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-registrations`, data).pipe(
			tap((response) => {
				const token = response?.data?.token;
				const projectId = data?.project ?? this.currentProject?._id;

				if (token && projectId) {
					saveSignUpAppRegistrationToken(projectId, token);
				}
			})
		);
	}

	zkLogin(data: { record: any; faceBase64: string; projectId: string }, antiBotHeaders?: Record<string, string>): Observable<any> {
		return this._resolveAntiBotHeaders(data?.projectId, antiBotHeaders).pipe(
			switchMap((headers) => {
				const options = Object.keys(headers).length ? { headers } : {};
				return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-login/zk-proof`, data, options);
			})
		);
	}

	humanIdLogin(payload: HumanIdLoginPayload, antiBotHeaders?: Record<string, string>): Observable<any> {
		const location = localStorage.getItem("loginLocation");
		if (location && !payload.location) {
			try {
				payload.location = JSON.parse(location);
			} catch {}
		}

		return this._resolveAntiBotHeaders(payload.projectId, antiBotHeaders).pipe(
			switchMap((headers) => {
				const options = Object.keys(headers).length ? { headers } : {};
				return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-logins/human-id`, payload, options);
			})
		);
	}
}
