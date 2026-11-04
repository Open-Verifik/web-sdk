import { HttpClient } from "@angular/common/http";
import { Injectable, Optional } from "@angular/core";
import { TranslocoService } from "@ngneat/transloco";
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { environment } from "environments/environment";
import { HttpWrapperService } from "../demo/http-wrapper.service";
import { SmartEnrollService } from "./smart-enroll/smart-enroll.service";

export interface BackgroundCheckProgress {
	status: "idle" | "running" | "completed" | "error";
	hasError: boolean;
	error?: any;
	informationValidationFulfilled: boolean;
	documentCriminalFulfilled: boolean;
}

@Injectable({
	providedIn: "root",
})
export class KYCService {
	appRegistration: any;
	baseUrl: String = environment.apiUrl;
	currentProject: Project;
	currentProjectFlow: ProjectFlow;
	navigation: any;

	private _backgroundCheckProgress$ = new BehaviorSubject<BackgroundCheckProgress>({
		status: "idle",
		hasError: false,
		informationValidationFulfilled: false,
		documentCriminalFulfilled: false,
	});
	public backgroundCheckProgress$: Observable<BackgroundCheckProgress> = this._backgroundCheckProgress$.asObservable();

	get backgroundCheckProgress(): BackgroundCheckProgress {
		return this._backgroundCheckProgress$.value;
	}

	constructor(
		private _httpWrapper: HttpWrapperService,
		private _translocoService: TranslocoService,
		private _http: HttpClient,
		@Optional() private _smartEnrollService?: SmartEnrollService,
	) {}

	setProjectData(project: Project, projectFlow: ProjectFlow): void {
		this.currentProject = project;
		this.currentProjectFlow = projectFlow;
	}

	get roles(): Array<{ label: string; code: string }> {
		return [
			{
				label: "signup.roles.founder",
				code: "founder",
			},
			{
				label: "signup.roles.high_management",
				code: "high_management",
			},
			{
				label: "signup.roles.manager",
				code: "manager",
			},
			{
				label: "signup.roles.developer",
				code: "developer",
			},
			{
				label: "signup.roles.compliance",
				code: "compliance",
			},
			{
				label: "signup.roles.marketing",
				code: "marketing",
			},
			{
				label: "signup.roles.ciso",
				code: "ciso",
			},
		];
	}

	private _validateProjectData(): void {
		if (!this.currentProject || !this.currentProjectFlow) {
			throw new Error("Project or ProjectFlow is not set. Please ensure project data is properly initialized.");
		}

		if (this.currentProject._id === "new") {
			throw new Error("Project is not set");
		}
	}

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

				this.currentProject = new Project({
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
		this._validateProjectData();

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

	sendAppRegistationEmailValidation(email: string): Observable<any> {
		this._validateProjectData();

		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/email-validations/app-registration`, {
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
		this._validateProjectData();

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

	sendAppRegistrationPhoneValidation(countryCode: string, phone: string, phoneGateway?: string): Observable<any> {
		this._validateProjectData();

		return this._httpWrapper
			.sendRequest("post", `${this.baseUrl}/v2/phone-validations/app-registration`, {
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
		this._validateProjectData();

		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/email-validations/validate`, {
			email,
			otp,
			type: "onboarding",
			project: this.currentProject._id,
			projectFlow: this.currentProjectFlow._id,
		});
	}

	confirmPhoneValidation(countryCode: string, phone: string, otp: string): Observable<any> {
		this._validateProjectData();

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
		this.appRegistration.currentStep = step;
		this.appRegistration.status = status;

		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}/sync`, {
			step,
			status,
		});
	}

	createDocumentValidation(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/document-validations/app-registration`, data);
	}

	updateDocumentValidation(id: string, data: any): Observable<any> {
		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/document-validations/${id}`, data);
	}

	createBiometricValidation(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/biometric-validations/app-registration`, data);
	}

	updateInformationValidationWithCriminalRecords(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/information-validations/${data._id}/background-check`, data);
	}

	updateDocumentValidationWithCriminalRecords(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/document-validations/${data._id}/background-check`, data);
	}

	dispatchBackgroundChecks(): Observable<BackgroundCheckProgress> {
		if (this._backgroundCheckProgress$.value.status === "running") {
			return this.backgroundCheckProgress$;
		}

		const currentProgress: BackgroundCheckProgress = {
			status: "running",
			hasError: false,
			informationValidationFulfilled: Boolean(this.appRegistration?.informationValidation?.criminalData),
			documentCriminalFulfilled: Boolean(this.appRegistration?.documentValidation?.criminalData),
		};
		this._backgroundCheckProgress$.next(currentProgress);

		const informationValidationId =
			!this.appRegistration?.informationValidation
				? null
				: typeof this.appRegistration.informationValidation === "string"
					? this.appRegistration.informationValidation
					: this.appRegistration.informationValidation?._id;

		const documentValidationId = this.appRegistration?.documentValidation?._id;

		if (!informationValidationId && !documentValidationId) {
			this._backgroundCheckProgress$.next({
				status: "completed",
				hasError: false,
				informationValidationFulfilled: currentProgress.informationValidationFulfilled,
				documentCriminalFulfilled: currentProgress.documentCriminalFulfilled,
			});
			return this.backgroundCheckProgress$;
		}

		const infoCheck$: Observable<any> =
			informationValidationId && !currentProgress.informationValidationFulfilled
				? this.updateInformationValidationWithCriminalRecords({ _id: informationValidationId }).pipe(
						tap((response: any) => {
							if (response?.data && this.appRegistration) {
								this.appRegistration.informationValidation = response.data;
							}
						}),
						catchError((err: any) => {
							if (err?.error?.code === "PaymentRequired" || err?.code === "PaymentRequired" || err?.status === 402) {
								this._smartEnrollService?.insufficientCreditsTrigger();
							}
							return of({ error: err });
						})
					)
				: of(null);

		infoCheck$
			.pipe(
				switchMap((infoResult: any) => {
					const infoError = infoResult?.error;
					if (infoError && (infoError?.error?.code === "PaymentRequired" || infoError?.code === "PaymentRequired" || infoError?.status === 402)) {
						const errorState: BackgroundCheckProgress = {
							status: "error",
							hasError: true,
							error: infoError,
							informationValidationFulfilled: false,
							documentCriminalFulfilled: false,
						};
						this._backgroundCheckProgress$.next(errorState);
						return of(null);
					}

					const docCheck$: Observable<any> =
						documentValidationId && !this.appRegistration?.documentValidation?.criminalData
							? this.updateDocumentValidationWithCriminalRecords({ _id: documentValidationId }).pipe(
									tap((response: any) => {
										if (response?.data?.criminalData && this.appRegistration?.documentValidation) {
											this.appRegistration.documentValidation.criminalData = response.data.criminalData;
										}
									}),
									catchError((err: any) => {
										if (err?.error?.code === "PaymentRequired" || err?.code === "PaymentRequired" || err?.status === 402) {
											this._smartEnrollService?.insufficientCreditsTrigger();
										}
										return of({ error: err });
									})
								)
							: of(null);

					return docCheck$.pipe(
						map((docResult: any) => {
							const docError = docResult?.error;
							const anyError = infoError || docError;
							const infoFulfilled = Boolean(this.appRegistration?.informationValidation?.criminalData);
							const docFulfilled = Boolean(this.appRegistration?.documentValidation?.criminalData);

							const finalState: BackgroundCheckProgress = {
								status: anyError && !infoFulfilled && !docFulfilled ? "error" : "completed",
								hasError: Boolean(anyError),
								error: anyError || undefined,
								informationValidationFulfilled: infoFulfilled,
								documentCriminalFulfilled: docFulfilled,
							};
							this._backgroundCheckProgress$.next(finalState);
							return finalState;
						})
					);
				})
			)
			.subscribe();

		return this.backgroundCheckProgress$;
	}

	updateDocumentValidationNameValidation(data: any): Observable<any> {
		const id = typeof data === "string" ? data : data?._id;
		const payload = typeof data === "string" ? { _id: data } : data;

		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/document-validations/${id}/validate`, payload);
	}

	setDocumentValidationManualVerification(data: {
		_id: string;
		reason?: string;
		timeoutType?: string;
		elapsedTime?: number;
	} | string): Observable<any> {
		const id = typeof data === "string" ? data : data?._id;
		const payload =
			typeof data === "string"
				? { _id: data, reason: "name_mismatch_user_proceeded" }
				: data;

		return this._httpWrapper.sendRequest("put", `${this.baseUrl}/v2/document-validations/${id}/manual-verification`, payload);
	}

	getIdentityImages(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("get", `${this.baseUrl}/v2/identity-images`, data);
	}

	compareFaces(): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/face-recognition/compare/app-registration`, {});
	}

	submitKycApprovalRequest(): Observable<any> {
		return this._httpWrapper.sendRequest(
			"post",
			`${this.baseUrl}/v2/app-registrations/${this.appRegistration._id}/submit-kyc-approval`,
			{},
		);
	}

	restartKYC(): Observable<any> {
		return this._httpWrapper.sendRequest("delete", `${this.baseUrl}/v2/biometric-validations/${this.appRegistration.biometricValidation._id}`);
	}

	createZkProof(faceBase64?: string): Observable<any> {
		const body: any = {};

		if (faceBase64) {
			body.faceBase64 = faceBase64;
		}

		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/document-validations/zk-proof`, body);
	}

	createAppRegistrationZkProof(faceBase64: string): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-registrations/zk-proof`, {
			faceBase64,
		});
	}
}
