import { CommonModule, NgIf } from "@angular/common";
import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { catchError, map, of, timeout, TimeoutError } from "rxjs";

import { AuthService } from "app/core/auth/auth.service";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { VerifikMediaDisplayComponent } from "app/shared/components/verifik-media-display";
import { environment } from "environments/environment";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration, DocumentValidation, FaceVerification, InformationValidation } from "../../project";
import { SmartEnrollService } from "../smart-enroll.service";

type CombinedValidationResponse = {
	criminalValidation: CriminalValidationResponse;
	compareValidation: CompareFaceVerificationResponse;
	nameValidation: NameValidationResponse;
	zkProofValidation: ZkProofValidationResponse;
	documentCriminalValidation: DocumentCriminalValidationResponse;
};

type CompareFaceVerificationResponse = {
	data: FaceVerification;
	error: any;
	reason: any;
	status: "fulfilled" | "rejected" | "NA";
};

type CriminalValidationResponse = {
	data: InformationValidation;
	error: any;
	reason: any;
	status: "fulfilled" | "rejected" | "NA";
};

type NameValidationResponse = {
	data: DocumentValidation;
	error: any;
	reason: any;
	status: "fulfilled" | "rejected" | "NA";
};

type ZkProofValidationResponse = {
	data: DocumentValidation;
	error: any;
	reason: any;
	status: "fulfilled" | "rejected" | "NA";
};

type DocumentCriminalValidationResponse = {
	data: DocumentValidation;
	error: any;
	reason: any;
	status: "fulfilled" | "rejected" | "NA";
};

@Component({
	animations: fuseAnimations,
	imports: [
		CommonModule,
		FlexLayoutModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		NgIf,
		MatCardModule,
		TranslocoModule,
		VerifikMediaDisplayComponent,
	],
	selector: "smart-documents-review",
	standalone: true,
	styleUrls: ["../smart-enroll.component.scss", "../../sign-up/sign-up.component.scss"],
	templateUrl: "./smart-documents-review.component.html",
})
export class SmartDocumentsReviewComponent {
	appRegistration: AppRegistration;
	errors: any = {};
	isVerifikProject: boolean = false;
	project: Project;
	projectFlow: ProjectFlow;
	showErrors: boolean = false;
	ocrKeys: Array<string> = [];

	ORDER_OCR_BY: { [key: string]: number } = {
		address: 15,
		age: 13,
		"date of birth": 12,
		"document number": 17,
		"document type": 16,
		"first last name mrz": 22,
		"first name": 27,
		"first name mrz": 26,
		"full name": 90,
		"last name": 24,
		"middle name": 25,
		"name 1": 31,
		"name 2": 30,
		"name 3": 29,
		"second last name": 23,
	};

	loading: { [key: string]: boolean } = {
		compareValidation: true,
		criminalValidation: true,
		nameValidation: true,
		zkProofValidation: true,
		documentCriminalValidation: true,
	};

	validationStartTimes: { [key: string]: number } = {};
	validationMessages: { [key: string]: string } = {};
	validationMessageIntervals: { [key: string]: ReturnType<typeof setTimeout>[] } = {};
	validationErrors: { [key: string]: any } = {};
	showManualVerificationBanner: boolean = false;
	manualVerificationMessage: string = "";
	retryingValidations: { [key: string]: boolean } = {};

	private readonly VALIDATION_TIMEOUT = 60000; // 60 seconds
	private readonly PROGRESS_MESSAGE_INTERVALS = [15000, 30000, 45000]; // 15s, 30s, 45s

	constructor(
		private _authService: AuthService,
		private _KYCService: KYCService,
		private _smartEnrollService: SmartEnrollService,
		private _translocoService: TranslocoService,
		private _passwordlessService: PasswordlessService
	) {
		this.appRegistration = this._KYCService.appRegistration;
		this.project = this._passwordlessService.currentProject;
		this.projectFlow = this._passwordlessService.currentProjectFlow;
		this.isVerifikProject = this._passwordlessService.isVerifikProject;

		if (!this.appRegistration.documentValidation) {
			this.onPreviousStep();

			return;
		}

		// If validation is already complete (on page reload), set loading states to false
		// This ensures _setErrors() can properly evaluate the validation state
		const docValidation = this.appRegistration.documentValidation;

		if (docValidation?.imageValidated) {
			this.loading.nameValidation = false;
		}
		if (this.appRegistration?.informationValidation?.criminalData) {
			this.loading.criminalValidation = false;
		}
		if (this.appRegistration?.compareFaceVerification) {
			this.loading.compareValidation = false;
		}
		if (docValidation?.zelfKey) {
			this.loading.zkProofValidation = false;
		}
		if (docValidation?.criminalData) {
			this.loading.documentCriminalValidation = false;
		}

		this._cleanOCR(this.appRegistration.documentValidation.OCRExtraction);

		this._setErrors();

		this._sendDocumentValidationAndNameValidation();
	}

	get hasErrors(): boolean {
		return Object.keys(this.errors).length > 0;
	}

	get validationsInProgress(): boolean {
		return Object.values(this.loading).includes(true);
	}

	get verifyNamesEnabled(): boolean {
		return Boolean(this.projectFlow?.onboardingSettings?.document?.verifyNames);
	}

	get verifyCriminalHistoryEnabled(): boolean {
		return Boolean(this.projectFlow?.onboardingSettings?.document?.verifyCriminalHistory);
	}

	get zeroKnowledgeProofEnabled(): boolean {
		if (!this.projectFlow) return false;
		// Handle both Mongoose documents and plain objects
		const projectFlowObj = (this.projectFlow as any).toObject ? (this.projectFlow as any).toObject() : this.projectFlow;
		const liveness = projectFlowObj?.liveness || {};
		return liveness?.kycType === "zero_knowledge";
	}

	private _cleanOCR(OCRExtraction: any) {
		if (!OCRExtraction) return {};

		if (OCRExtraction["confidenceScore"]) delete OCRExtraction["confidenceScore"];

		Object.keys(OCRExtraction).forEach((key) => {
			let fieldKey = "";

			if (["documentType", "country", "documentNumber"].includes(key)) {
				fieldKey = this._translocoService.translate(`extracted_information.${key}`);

				if (key === "documentNumber") OCRExtraction[key] = OCRExtraction[key].split("|")[0];
			} else {
				fieldKey = key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
			}

			if (OCRExtraction[key]) OCRExtraction[fieldKey] = OCRExtraction[key];

			delete OCRExtraction[key];
		});

		this.ocrKeys = Object.keys(OCRExtraction).sort((a, b) => {
			const lowerA = a.toLowerCase();
			const lowerB = b.toLowerCase();
			const orderA = this.ORDER_OCR_BY[lowerA] ?? Infinity;
			const orderB = this.ORDER_OCR_BY[lowerB] ?? Infinity;

			return orderA - orderB;
		});
	}

	private _executeValidationRequest(
		validationType: string,
		serviceCall: () => any,
		validationResults: Partial<CombinedValidationResponse>,
		validationErrors: any[],
		completedValidations: Set<string>,
		checkAllCompleted: () => void
	): void {
		this.loading[validationType] = true;
		this.validationStartTimes[validationType] = Date.now();

		// Start progressive feedback messages
		this._startProgressiveFeedback(validationType);

		serviceCall()
			.pipe(
				timeout(this.VALIDATION_TIMEOUT),
				map((result: any) => ({
					status: "fulfilled" as const,
					data: result.data,
					error: null,
					reason: null,
				})),
				catchError((error: any) => {
					// Handle timeout specifically
					if (error instanceof TimeoutError) {
						return this._handleValidationTimeout(validationType).pipe(
							map(() => ({
								status: "rejected" as const,
								data: null,
								error: { message: "validation_timeout" },
								reason: "timeout",
							}))
						);
					}

					return of({
						status: "rejected" as const,
						data: null,
						error: error,
						reason: error,
					});
				})
			)
			.subscribe({
				next: (result: any) => {
					this.loading[validationType] = false;
					this._clearProgressiveFeedback(validationType);

					(validationResults as Partial<CombinedValidationResponse>)[validationType] = result;
					completedValidations.add(validationType as string);

					checkAllCompleted();
				},
				error: (error: any) => {
					this.loading[validationType] = false;
					this._clearProgressiveFeedback(validationType);

					validationErrors.push(error);
					this.validationErrors[validationType] = error;
					completedValidations.add(validationType as string);

					checkAllCompleted();
				},
			});
	}

	private _handleValidationTimeout(validationType: string): any {
		const elapsedTime = Date.now() - this.validationStartTimes[validationType];

		// Show manual verification banner
		this.showManualVerificationBanner = true;
		this.manualVerificationMessage = this._translocoService.translate("smart_enroll.validation_timeout_manual_review");

		// Call manual verification endpoint if we have a document validation ID
		if (this.appRegistration.documentValidation?._id) {
			return this._KYCService.setDocumentValidationManualVerification({
				_id: this.appRegistration.documentValidation._id,
				reason: "validation_timeout",
				timeoutType: validationType,
				elapsedTime,
			});
		}

		return of(null);
	}

	private _startProgressiveFeedback(validationType: string): void {
		// Clear any existing messages and intervals
		this._clearProgressiveFeedback(validationType);

		// Set initial message
		this.validationMessages[validationType] = this._translocoService.translate("smart_enroll.validating");

		// Store intervals for cleanup
		this.validationMessageIntervals[validationType] = [];

		// Schedule progressive messages
		this.PROGRESS_MESSAGE_INTERVALS.forEach((interval, index) => {
			const timeoutId = setTimeout(() => {
				if (this.loading[validationType]) {
					if (index === 0) {
						// 15s
						this.validationMessages[validationType] = this._translocoService.translate("smart_enroll.still_validating");
					} else if (index === 1) {
						// 30s
						this.validationMessages[validationType] = this._translocoService.translate("smart_enroll.almost_there", {
							validation: this._getValidationDisplayName(validationType),
						});
					} else if (index === 2) {
						// 45s
						this.validationMessages[validationType] = this._translocoService.translate("smart_enroll.taking_longer");
					}
				}
			}, interval);

			this.validationMessageIntervals[validationType].push(timeoutId);
		});
	}

	private _clearProgressiveFeedback(validationType: string): void {
		// Clear all scheduled intervals
		if (this.validationMessageIntervals[validationType]) {
			this.validationMessageIntervals[validationType].forEach(clearTimeout);
			delete this.validationMessageIntervals[validationType];
		}

		delete this.validationMessages[validationType];
		delete this.validationStartTimes[validationType];
	}

	private _getValidationDisplayName(validationType: string): string {
		const displayNames: { [key: string]: string } = {
			nameValidation: this._translocoService.translate("smart_enroll.name_verification"),
			criminalValidation: this._translocoService.translate("smart_enroll.background_check"),
			documentCriminalValidation: this._translocoService.translate("smart_enroll.document_background_check"),
			compareValidation: this._translocoService.translate("smart_enroll.face_comparison"),
			zkProofValidation: this._translocoService.translate("smart_enroll.zero_knowledge_proof"),
		};

		return displayNames[validationType] || validationType;
	}

	retryValidation(validationType: string): void {
		// Clear previous error
		delete this.validationErrors[validationType];
		this.retryingValidations[validationType] = true;

		// Trigger the validation again based on type
		const completedValidations = new Set<string>();
		const validationResults: Partial<CombinedValidationResponse> = {};
		const validationErrors: any[] = [];

		const checkAllCompleted = () => {
			this.retryingValidations[validationType] = false;
			if (validationErrors.length > 0) {
				this.validationErrors[validationType] = validationErrors[0];
			}
		};

		switch (validationType) {
			case "nameValidation":
				if (this.appRegistration.documentValidation?._id) {
					this._executeValidationRequest(
						"nameValidation",
						() =>
							this._KYCService.updateDocumentValidationNameValidation({
								_id: this.appRegistration.documentValidation._id,
								force: true,
							}),
						validationResults,
						validationErrors,
						completedValidations,
						checkAllCompleted
					);
				}
				break;

			case "criminalValidation":
				const informationValidationId =
					!this.appRegistration.informationValidation
						? null
						: typeof this.appRegistration.informationValidation === "string"
							? this.appRegistration.informationValidation
							: this.appRegistration.informationValidation?._id;

				if (informationValidationId) {
					this._executeValidationRequest(
						"criminalValidation",
						() =>
							this._KYCService.updateInformationValidationWithCriminalRecords({
								_id: informationValidationId,
								force: true,
							}),
						validationResults,
						validationErrors,
						completedValidations,
						checkAllCompleted
					);
				}
				break;

			case "documentCriminalValidation":
				if (this.appRegistration.documentValidation?._id) {
					this._executeValidationRequest(
						"documentCriminalValidation",
						() =>
							this._KYCService.updateDocumentValidationWithCriminalRecords({
								_id: this.appRegistration.documentValidation._id,
								force: true,
							}),
						validationResults,
						validationErrors,
						completedValidations,
						checkAllCompleted
					);
				}
				break;

			case "compareValidation":
				this._executeValidationRequest(
					"compareValidation",
					() => this._KYCService.compareFaces(),
					validationResults,
					validationErrors,
					completedValidations,
					checkAllCompleted
				);
				break;

			case "zkProofValidation":
				const documentFace = this.appRegistration.documentFace?.base64;
				const faceBase64 = documentFace ? documentFace.replace(/^data:image\/\w+;base64,/, "") : undefined;

				this._executeValidationRequest(
					"zkProofValidation",
					() => this._KYCService.createZkProof(faceBase64),
					validationResults,
					validationErrors,
					completedValidations,
					checkAllCompleted
				);
				break;
		}
	}

	hasValidationError(validationType: string): boolean {
		return !!this.validationErrors[validationType];
	}

	private _handleError(exception: any): void {
		this.loading.compareValidation = false;
		this.loading.criminalValidation = false;
		this.loading.nameValidation = false;
		this.loading.zkProofValidation = false;
		this.loading.documentCriminalValidation = false;

		if (exception?.error?.code === "PaymentRequired") {
			this._smartEnrollService.insufficientCreditsTrigger();

			return;
		}

		this._setErrors();
	}

	private _handleValidationResults(results: Partial<CombinedValidationResponse>): void {
		if (results.criminalValidation?.status === "fulfilled") {
			this.appRegistration.informationValidation = results.criminalValidation.data;
		} else if (results.criminalValidation?.status === "rejected") {
			if (results.criminalValidation?.error?.code === "PaymentRequired") {
				this._smartEnrollService.insufficientCreditsTrigger();
				return;
			}
		}

		if (results.nameValidation?.status === "fulfilled") {
			this.appRegistration.documentValidation = results.nameValidation.data;
			this._cleanOCR(this.appRegistration.documentValidation.OCRExtraction);
		} else if (results.nameValidation?.status === "rejected") {
			if (results.nameValidation?.error?.code === "PaymentRequired") {
				this._smartEnrollService.insufficientCreditsTrigger();

				return;
			}
		}

		if (results.compareValidation?.status === "fulfilled") {
			this.appRegistration.compareFaceVerification = results.compareValidation.data;
		} else if (results.compareValidation?.status === "rejected") {
			if (results.compareValidation?.error?.code === "PaymentRequired") {
				this._smartEnrollService.insufficientCreditsTrigger();

				return;
			}
		}

		if (results.zkProofValidation?.status === "fulfilled") {
			// Only assign zelfKey, don't replace the entire documentValidation
			if (results.zkProofValidation.data?.zelfKey) {
				this.appRegistration.documentValidation.zelfKey = results.zkProofValidation.data.zelfKey;
			}
			if (results.zkProofValidation?.error?.code === "PaymentRequired") {
				this._smartEnrollService.insufficientCreditsTrigger();

				return;
			}
		}

		if (results.documentCriminalValidation?.status === "fulfilled") {
			// Merge the crimnalData into the existing documentValidation
			if (results.documentCriminalValidation.data?.criminalData) {
				this.appRegistration.documentValidation.criminalData = results.documentCriminalValidation.data.criminalData;
			}
		} else if (results.documentCriminalValidation?.status === "rejected") {
			if (results.documentCriminalValidation?.error?.code === "PaymentRequired") {
				this._smartEnrollService.insufficientCreditsTrigger();

				return;
			}
		}

		this._setErrors();
	}

	private _sendDocumentValidationAndNameValidation(): void {
		if (this.errors && Object.keys(this.errors).length > 0) return;

		const completedValidations = new Set<string>();
		const validationResults: Partial<CombinedValidationResponse> = {};
		const validationErrors: any[] = [];

		const totalValidations = [
			this.verifyNamesEnabled ? "nameValidation" : null,
			this.verifyCriminalHistoryEnabled && !this.appRegistration?.informationValidation?.criminalData ? "criminalValidation" : null,
			this.appRegistration.biometricValidation ? "compareValidation" : null,
			this.zeroKnowledgeProofEnabled && !this.appRegistration.documentValidation?.zelfKey ? "zkProofValidation" : null,
			this.verifyCriminalHistoryEnabled && !this.appRegistration.documentValidation?.criminalData ? "documentCriminalValidation" : null,
		].filter(Boolean);

		const checkAllCompleted = () => {
			if (completedValidations.size !== totalValidations.length) return;

			if (validationErrors.length > 0) {
				this._handleError(validationErrors[0]);
			} else {
				this._handleValidationResults(validationResults as CombinedValidationResponse);
			}
		};

		// Name Validation
		if (this.verifyNamesEnabled && !this.appRegistration.documentValidation?.imageValidated) {
			// Check if documentValidation exists before accessing _id
			if (this.appRegistration.documentValidation?._id) {
				this._executeValidationRequest(
					"nameValidation",
					() =>
						this._KYCService.updateDocumentValidationNameValidation({
							_id: this.appRegistration.documentValidation._id,
							force: true,
						}),
					validationResults,
					validationErrors,
					completedValidations,
					checkAllCompleted
				);
			} else {
				this.loading.nameValidation = false;
				completedValidations.add("nameValidation");
				checkAllCompleted();
			}
		} else {
			this.loading.nameValidation = false;
		}

		// Criminal Validation
		if (this.verifyCriminalHistoryEnabled && !this.appRegistration?.informationValidation?.criminalData) {
			// Check if informationValidation exists and has an _id before proceeding
			const informationValidationId =
				!this.appRegistration.informationValidation
					? null
					: typeof this.appRegistration.informationValidation === "string"
						? this.appRegistration.informationValidation
						: this.appRegistration.informationValidation?._id;

			if (informationValidationId) {
				this._executeValidationRequest(
					"criminalValidation",
					() =>
						this._KYCService.updateInformationValidationWithCriminalRecords({
							_id: informationValidationId,
							force: environment.production,
						}),
					validationResults,
					validationErrors,
					completedValidations,
					() => {
						// Chain document criminal validation after information validation
						if (this.verifyCriminalHistoryEnabled && !this.appRegistration.documentValidation?.criminalData) {
							// Check if documentValidation exists before accessing _id
							if (this.appRegistration.documentValidation?._id) {
								this._executeValidationRequest(
									"documentCriminalValidation",
									() =>
										this._KYCService.updateDocumentValidationWithCriminalRecords({
											_id: this.appRegistration.documentValidation._id,
											force: environment.production,
										}),
									validationResults,
									validationErrors,
									completedValidations,
									checkAllCompleted
								);
							} else {
								this.loading.documentCriminalValidation = false;
								completedValidations.add("documentCriminalValidation");
								checkAllCompleted();
							}
						} else {
							checkAllCompleted();
						}
					}
				);
			} else {
				// If informationValidation doesn't exist, skip criminal validation
				this.loading.criminalValidation = false;
				completedValidations.add("criminalValidation");
				// Still check for document criminal validation
				if (this.verifyCriminalHistoryEnabled && !this.appRegistration.documentValidation?.criminalData) {
					if (this.appRegistration.documentValidation?._id) {
						this._executeValidationRequest(
							"documentCriminalValidation",
							() =>
								this._KYCService.updateDocumentValidationWithCriminalRecords({
									_id: this.appRegistration.documentValidation._id,
									force: environment.production,
								}),
							validationResults,
							validationErrors,
							completedValidations,
							checkAllCompleted
						);
					} else {
						this.loading.documentCriminalValidation = false;
						completedValidations.add("documentCriminalValidation");
						checkAllCompleted();
					}
				} else {
					this.loading.documentCriminalValidation = false;
					completedValidations.add("documentCriminalValidation");
					checkAllCompleted();
				}
			}
		} else {
			this.loading.criminalValidation = false;
			this.loading.documentCriminalValidation = false;
		}

		// Face Comparison Validation
		if (this.appRegistration.biometricValidation) {
			this._executeValidationRequest(
				"compareValidation",
				() => this._KYCService.compareFaces(),
				validationResults,
				validationErrors,
				completedValidations,
				checkAllCompleted
			);
		} else {
			this.loading.compareValidation = false;
		}

		// Zero Knowledge Proof Validation
		// Backend will extract face from document if not provided, so we can always attempt ZKP
		if (this.zeroKnowledgeProofEnabled && !this.appRegistration.documentValidation?.zelfKey) {
			// Optionally pass faceBase64 if available, but backend will extract if not provided
			const documentFace = this.appRegistration.documentFace?.base64;
			const faceBase64 = documentFace ? documentFace.replace(/^data:image\/\w+;base64,/, "") : undefined;

			this._executeValidationRequest(
				"zkProofValidation",
				() => this._KYCService.createZkProof(faceBase64),
				validationResults,
				validationErrors,
				completedValidations,
				checkAllCompleted
			);
		} else {
			this.loading.zkProofValidation = false;
		}

		if (totalValidations.length === 0) {
			this._handleValidationResults({} as CombinedValidationResponse);
		}
	}

	private _setErrors() {
		if (this.canContinue()) {
			this.errors = {};
			this.showErrors = false;

			return;
		}

		const docValidation = this.appRegistration?.documentValidation;

		if (!docValidation && this.projectFlow.onboardingSettings.steps.document === "mandatory") {
			this.errors.mandatory = true;

			return;
		}

		if (this.appRegistration?.documentValidation?.OCRExtraction?.error) {
			this.errors.extractionError = this.appRegistration?.documentValidation?.OCRExtraction?.error;

			return;
		}

		if (docValidation?.requiresBackSide && !docValidation?.backUrl) {
			this.errors.requiresBack = true;
		}

		if (
			this.verifyNamesEnabled &&
			!this.loading.nameValidation &&
			docValidation?.infoValidationSupported &&
			docValidation?.namesMatch === false
		) {
			this.errors.namesDoNotMatch = true;
		}

		this.showErrors = Object.keys(this.errors).length > 0;
	}

	private _syncAppRegistration(step: string, status?: string, action?: string) {
		let _response: any = null;

		this._KYCService.syncAppRegistration(step, status).subscribe({
			next: (response) => {
				_response = response.data;
			},
			error: () => {},
			complete: () => {
				if (status !== "COMPLETED_WITHOUT_KYC" && action !== "redirect") return;

				this._authService.handleRedirect(this.projectFlow, this.project._id, _response.token, "onboarding");
			},
		});
	}

	canContinue(): boolean {
		const isValid = this._smartEnrollService.isDocumentValidAndComplete(this.projectFlow, this.appRegistration);
		const notInProgress = !this.validationsInProgress;
		const result = isValid && notInProgress;

		// Debug logging (only in development)
		if (!result && !environment.production) {
			const reasons = this.getContinueBlockingReasons();
			console.log("❌ Continue button disabled. Blocking reasons:", reasons);
		}

		return result;
	}

	getContinueBlockingReasons(): string[] {
		const reasons: string[] = [];
		const docValidation = this.appRegistration?.documentValidation;

		// Check validation in progress
		if (this.validationsInProgress) {
			const inProgressValidations = Object.entries(this.loading)
				.filter(([key, value]) => value === true)
				.map(([key]) => key);
			reasons.push(`Validations still in progress: ${inProgressValidations.join(", ")}`);
		}

		// Check document validation conditions (from isDocumentValidAndComplete)
		if (!docValidation && this.projectFlow.onboardingSettings.steps.document === "mandatory") {
			reasons.push("Document validation is mandatory but not present");
		}

		if (!docValidation && !this._smartEnrollService.wasSkippedDocument()) {
			reasons.push("Document validation not present and not skipped");
		}

		if (docValidation?.requiresBackSide && !docValidation?.backUrl) {
			reasons.push("Document requires back side but backUrl is missing");
		}

		if (
			this.projectFlow.onboardingSettings.document.verifyNames &&
			docValidation?.infoValidationSupported &&
			!docValidation?.namesMatch
		) {
			reasons.push("Name verification enabled and names do not match");
		}

		return reasons;
	}

	/** True when not in production; used to hide debug UI in production. */
	get isDevelopmentMode(): boolean {
		return !environment.production;
	}

	showDebugInfo: boolean = false;

	toggleDebugInfo(): void {
		this.showDebugInfo = !this.showDebugInfo;
	}

	getDebugInfo(): any {
		const docValidation = this.appRegistration?.documentValidation;
		return {
			canContinue: this.canContinue(),
			blockingReasons: this.getContinueBlockingReasons(),
			validationsInProgress: this.validationsInProgress,
			loadingStates: this.loading,
			documentValidation: {
				exists: !!docValidation,
				requiresBackSide: docValidation?.requiresBackSide,
				hasBackUrl: !!docValidation?.backUrl,
				imageValidated: docValidation?.imageValidated,
				namesMatch: docValidation?.namesMatch,
				infoValidationSupported: docValidation?.infoValidationSupported,
				nameMatchPercentages: {
					fullName: docValidation?.fullNameMatchPercentage || 0,
					firstName: docValidation?.firstNameMatchPercentage || 0,
					lastName: docValidation?.lastNameMatchPercentage || 0,
				},
			},
			projectFlow: {
				documentStep: this.projectFlow.onboardingSettings.steps.document,
				verifyNames: this.projectFlow.onboardingSettings.document.verifyNames,
			},
		};
	}

	proceedWithManualVerification(): void {
		if (!this.appRegistration?.documentValidation?._id) return;

		// Show loading state
		this.loading.nameValidation = true;

		this._KYCService.setDocumentValidationManualVerification({
			_id: this.appRegistration.documentValidation._id,
			reason: "name_mismatch",
			timeoutType: "nameValidation",
			elapsedTime: 0,
		}).subscribe({
			next: (response) => {
				// Update local state
				if (response?.data) {
					this.appRegistration.documentValidation.status = response.data.status;
				}

				// Show manual verification banner
				this.showManualVerificationBanner = true;
				this.manualVerificationMessage = this._translocoService.translate(
					"smart_enroll.name_mismatch_manual_review"
				);

				// Clear the name match error so user can continue
				delete this.errors.namesDoNotMatch;
				this.showErrors = Object.keys(this.errors).length > 0;

				this.loading.nameValidation = false;

				// Allow user to continue
				this._smartEnrollService.goToNextStep();
			},
			error: (error) => {
				if (!environment.production) {
					console.error("Failed to set manual verification:", error);
				}
				this.loading.nameValidation = false;
			},
		});
	}

	hasNameMismatch(): boolean {
		return (
			this.projectFlow.onboardingSettings.document.verifyNames &&
			this.appRegistration?.documentValidation?.infoValidationSupported &&
			!this.appRegistration?.documentValidation?.namesMatch &&
			!this.loading.nameValidation
		);
	}

	shouldShowValidationSection(): boolean {
		return (
			!this.hasErrors &&
			(this.verifyNamesEnabled ||
				this.verifyCriminalHistoryEnabled ||
				this.zeroKnowledgeProofEnabled ||
				Boolean(this.appRegistration?.biometricValidation && this.appRegistration?.documentValidation))
		);
	}

	onNextStep(): void {
		if (this.appRegistration.biometricValidation) {
			this._smartEnrollService.skipToStep("result");

			return;
		}

		this._syncAppRegistration("liveness", "ONGOING");

		this._smartEnrollService.goToNextStep();
	}

	onTryAgain(): void {
		this._syncAppRegistration("document", "ONGOING");

		this.onPreviousStep();
	}

	onPreviousStep(): void {
		// If document requires back side and back is not uploaded yet,
		// navigate back to document upload step instead of going to previous step
		const docValidation = this.appRegistration?.documentValidation;
		const requiresBackAndMissing = docValidation?.requiresBackSide && !docValidation?.backUrl;

		if (requiresBackAndMissing) {
			// Go back to document step to upload the back side
			this._smartEnrollService.skipToStep("document");
		} else {
			// Normal previous step navigation
			this._smartEnrollService.goToPreviousStep();
		}
	}
}
