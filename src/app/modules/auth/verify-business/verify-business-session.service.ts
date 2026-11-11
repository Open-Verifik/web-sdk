import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { TranslocoService } from "@ngneat/transloco";
import { Observable, Subject, catchError, map, of, takeUntil, timeout } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { PasswordlessService } from "app/modules/auth/passwordless.service";
import { environment } from "environments/environment";
import {
	BusinessRegistrationDossier,
	BusinessScreen,
	BusinessStep,
	CompanyProfile,
	CompanyRepresentative,
	CorporateDocument,
	CorporateDocumentCategory,
} from "./verify-business.types";
import {
	calculateCheckDigit,
	canProceedFromCompany,
	canProceedFromDocuments,
	canProceedFromRepresentatives,
	canSubmitReview,
	resolveResumeStep,
} from "./verify-business-flow";
import { VerifyStyleId } from "../verify/verify-style";

const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
	legalName: "",
	commercialName: "",
	taxId: "",
	checkDigit: "",
	country: "CO",
	entityType: "SAS",
	address: {
		street: "",
		city: "",
		state: "",
		postalCode: "",
		country: "CO",
	},
	email: "",
	phone: "",
	industry: "",
	website: "",
};

@Injectable()
export class VerifyBusinessSessionService implements OnDestroy {
	apiUrl: string = environment.apiUrl;
	busy = false;
	compact = false;
	error: string | null = null;
	history: BusinessScreen[] = [];
	previewStyle: VerifyStyleId | null = null;
	project: Project | null = null;
	projectFlow: ProjectFlow | null = null;
	rawBranding: Record<string, any> = {};
	projectId = "";
	registrationId = "";
	token: string | null = null;
	screen: BusinessScreen = "loading";
	styleId: VerifyStyleId = "a";

	company: CompanyProfile = { ...DEFAULT_COMPANY_PROFILE, address: { ...DEFAULT_COMPANY_PROFILE.address } };
	documents: CorporateDocument[] = [];
	representatives: CompanyRepresentative[] = [];
	legalAttestation = false;
	submissionResult: any = null;
	redirectCountdown = 7;

	activeRepForKyc: CompanyRepresentative | null = null;
	kycModalOpen = false;

	readonly changed = new Subject<void>();
	private _destroy$ = new Subject<void>();
	private _pollTimer: ReturnType<typeof setInterval> | null = null;
	private _redirectTimer: ReturnType<typeof setInterval> | null = null;

	constructor(
		private _http: HttpClient,
		private _passwordless: PasswordlessService,
		private _router: Router,
		private _transloco: TranslocoService,
	) {}

	ngOnDestroy(): void {
		this.stopPolling();
		this._stopRedirectTimer();
		this._destroy$.next();
		this._destroy$.complete();
	}

	get showHeader(): boolean {
		return this.screen !== "loading" && this.screen !== "upgrade" && this.screen !== "submitted";
	}

	get activeLang(): string {
		return this._transloco.getActiveLang() || "es";
	}

	get languages(): Array<{ id: string; label: string }> {
		const langs = this._transloco.getAvailableLangs();
		if (!Array.isArray(langs)) return [];
		return langs.map((lang) => (typeof lang === "string" ? { id: lang, label: lang } : { id: lang.id, label: lang.label || lang.id }));
	}

	setLanguage(lang: string): void {
		this._transloco.setActiveLang(lang);
		this.changed.next();
	}

	private _getAuthHeaders(): HttpHeaders {
		let headers = new HttpHeaders();
		if (this.token) {
			headers = headers.set("Authorization", `Bearer ${this.token}`).set("x-session-token", this.token);
		}
		return headers;
	}

	open(projectId: string, tokenFromQuery?: string): void {
		this.projectId = projectId;
		this.screen = "loading";
		this.error = null;
		this.changed.next();

		const savedToken = this._readSavedToken(projectId);
		const effectiveToken = tokenFromQuery?.trim() || savedToken;

		this._passwordless
			.requestProject(projectId, "onboarding")
			.pipe(takeUntil(this._destroy$))
			.subscribe({
				next: (response) => {
					this.rawBranding = response.data?.branding || {};
					this.project = new Project({ ...response.data, type: "onboarding" });
					this.projectFlow = this.project.getProjectFlowByTarget("business") || this.project.getOnboardingProjectFlow();

					const defaultLang = response.data?.defaultLanguage;
					if (typeof defaultLang === "string" && defaultLang.trim()) {
						const normalized = defaultLang.trim().toLowerCase();
						this._transloco.setActiveLang(normalized);
					}

					if (!response.planCode) {
						this.screen = "upgrade";
						this.changed.next();
						return;
					}

					if (effectiveToken) {
						this._resumeWithToken(effectiveToken);
					} else {
						this._createNewSession();
					}
				},
				error: (err) => {
					this.error = err?.error?.message || "Error al cargar la configuración del proyecto";
					this.screen = "error";
					this.changed.next();
				},
			});
	}

	private _createNewSession(forceNew = false): void {
		const payload = {
			projectId: this.projectId,
			projectFlowId: this.projectFlow?._id,
			forceNew,
		};

		this._http
			.post<any>(`${this.apiUrl}/v2/business-registrations`, payload)
			.pipe(takeUntil(this._destroy$))
			.subscribe({
				next: (res) => {
					if (res?.success && res?.data) {
						this._applyDossier(res.data);
						const regDoc = res.data.businessRegistration || res.data;
						this._applyResumeScreen(regDoc?.currentStep, regDoc?.status);
					} else {
						this.screen = "company";
					}
					this.changed.next();
				},
				error: (err) => {
					// Fallback to local new session if backend sandbox is offline
					this.screen = "company";
					this.changed.next();
				},
			});
	}

	private _resumeWithToken(token: string): void {
		this.token = token;
		this._http
			.get<any>(`${this.apiUrl}/v2/business-registrations/session/${token}`)
			.pipe(takeUntil(this._destroy$))
			.subscribe({
				next: (res) => {
					if (res?.success && res?.data) {
						this._applyDossier(res.data);
						const regDoc = res.data.businessRegistration || res.data;
						this._applyResumeScreen(regDoc?.currentStep, regDoc?.status);
					} else {
						this.screen = "company";
					}
					this.changed.next();
				},
				error: () => {
					this._clearSavedToken(this.projectId);
					this._createNewSession();
				},
			});
	}

	private _applyResumeScreen(currentStep?: string, status?: string): void {
		const resolved = resolveResumeStep(currentStep, status);
		const stepOrder: BusinessStep[] = ["company", "documents", "representatives", "review"];
		const idx = stepOrder.indexOf(resolved as BusinessStep);
		if (idx > 0) {
			this.history = stepOrder.slice(0, idx);
		} else {
			this.history = [];
		}
		this.screen = resolved;
	}

	private _applyDossier(dossier: any): void {
		const regDoc = dossier.businessRegistration || dossier;
		const resolvedToken = dossier.token || dossier.sessionToken || regDoc?.sessionToken;
		if (resolvedToken) {
			this.token = resolvedToken;
			this._saveToken(this.projectId, resolvedToken);
		}
		if (dossier._id || dossier.registrationId || regDoc?._id) {
			this.registrationId = dossier.registrationId || dossier._id || regDoc._id;
		}

		const info = regDoc?.businessDetails || regDoc?.companyInfo;
		if (info && (info.legalName || info.taxId || info.email)) {
			const addrObj = typeof info.address === "object" && info.address !== null ? info.address : null;
			this.company = {
				...DEFAULT_COMPANY_PROFILE,
				legalName: info.legalName || "",
				commercialName: info.commercialName || info.tradeName || "",
				taxId: info.taxId || "",
				checkDigit: info.checkDigit !== undefined && info.checkDigit !== null ? String(info.checkDigit) : "",
				country: info.country || "CO",
				entityType: info.entityType || "SAS",
				email: info.email || "",
				phone: info.phone || "",
				industry: info.industry || info.economicActivityCode || "",
				website: info.website || "",
				address: {
					...DEFAULT_COMPANY_PROFILE.address,
					street: addrObj?.street || info.addressLine1 || (typeof info.address === "string" ? info.address : "") || "",
					city: addrObj?.city || info.city || "",
					state: addrObj?.state || info.state || "",
					postalCode: addrObj?.postalCode || info.postalCode || "",
					country: addrObj?.country || info.country || "CO",
				},
			};
		}

		const rawDocs = Array.isArray(regDoc?.documents)
			? regDoc.documents
			: Array.isArray(regDoc?.corporateDocuments)
				? regDoc.corporateDocuments
				: null;
		if (rawDocs) {
			this.documents = rawDocs.map((d: any) => ({
				_id: d._id,
				category: d.category,
				documentType: d.documentType || d.ocrData?.documentType || "",
				documentTypeName: d.documentTypeName || d.ocrData?.documentTypeName || "",
				promptTemplateId: d.promptTemplate || d.ocrData?.promptTemplateId || "",
				filename: d.filename || d.fileName || "documento",
				fileUrl: d.fileUrl || d.url,
				mimeType: d.mimeType || "application/pdf",
				status: d.status === "APPROVED" ? "verified" : d.status || "uploaded",
				ocrData: d.ocrData,
				uploadedAt: d.uploadedAt,
			}));
		}

		const rawReps = Array.isArray(regDoc?.representatives)
			? regDoc.representatives
			: Array.isArray(regDoc?.companyMembers)
				? regDoc.companyMembers
				: null;
		if (rawReps) {
			this.representatives = rawReps.map((r: any) => {
				const full = String(r.fullName || "").trim();
				const parts = full ? full.split(/\s+/) : [];
				return {
					_id: r._id,
					firstName: r.firstName || parts[0] || "",
					lastName: r.lastName || parts.slice(1).join(" ") || "",
					role: r.role || "legal_representative",
					isUBO: Boolean(r.isUBO),
					ownershipPercentage: Number(r.ownershipPercentage) || 0,
					documentType: r.documentType || "CC",
					documentNumber: r.documentNumber || "",
					email: r.email || "",
					phone: r.phone || "",
					kycStatus: r.kycStatus || "PENDING",
					kycAppRegistration: r.kycAppRegistration,
					kycToken: r.kycToken || r.invitationToken || "",
					inviteSentAt: r.inviteSentAt || r.invitedAt,
				};
			});
		}
	}

	saveCompany(profile: CompanyProfile): Observable<boolean> {
		this.busy = true;
		this.error = null;
		this.company = { ...profile };

		if (this.company.country === "CO" && this.company.taxId && !this.company.checkDigit) {
			this.company.checkDigit = calculateCheckDigit(this.company.taxId);
		}

		if (!this.registrationId) {
			this.busy = false;
			this.goTo("documents");
			return of(true);
		}

		const addr = this.company.address || ({} as any);
		const apiPayload = {
			legalName: this.company.legalName || "",
			commercialName: this.company.commercialName || "",
			taxId: this.company.taxId || "",
			checkDigit: this.company.checkDigit || "",
			country: this.company.country || "CO",
			entityType: this.company.entityType || "SAS",
			address: [addr.street, addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
			addressLine1: addr.street || "",
			city: addr.city || "",
			state: addr.state || "",
			postalCode: addr.postalCode || "",
			email: this.company.email || "",
			phone: this.company.phone || "",
			website: this.company.website || "",
			economicActivityCode: this.company.industry || "",
		};

		return this._http
			.patch<any>(`${this.apiUrl}/v2/business-registrations/${this.registrationId}/company`, apiPayload, { headers: this._getAuthHeaders() })
			.pipe(
				map((res) => {
					this.busy = false;
					if (res?.success && res?.data) {
						this._applyDossier(res.data);
					}
					this.goTo("documents");
					return true;
				}),
				catchError((err) => {
					this.busy = false;
					this.error = err?.error?.message || "Error al guardar el perfil de la compañía";
					this.changed.next();
					return of(false);
				}),
			);
	}

	uploadDocument(
		category: CorporateDocumentCategory,
		file: File,
		fileBase64: string,
		meta?: { documentType?: string; documentTypeName?: string; promptTemplateId?: string },
	): Observable<CorporateDocument | null> {
		this.busy = true;
		this.error = null;

		const payload = {
			category,
			documentType: meta?.documentType || undefined,
			promptTemplateId: meta?.promptTemplateId || undefined,
			fileBase64,
			filename: file.name,
			mimeType: file.type || "application/pdf",
		};

		if (!this.registrationId) {
			this.busy = false;
			const localDoc: CorporateDocument = {
				_id: "local_" + Date.now(),
				category,
				documentType: meta?.documentType,
				documentTypeName: meta?.documentTypeName,
				promptTemplateId: meta?.promptTemplateId,
				filename: file.name,
				mimeType: file.type || "application/pdf",
				size: file.size,
				status: "uploaded",
				uploadedAt: new Date().toISOString(),
			};
			this.documents = [...this.documents, localDoc];
			this.changed.next();
			return of(localDoc);
		}

		return this._http
			.post<any>(`${this.apiUrl}/v2/business-registrations/${this.registrationId}/documents`, payload, { headers: this._getAuthHeaders() })
			.pipe(
				map((res) => {
					this.busy = false;
					if (res?.success && res?.data) {
						const docPayload = res.data.document || res.data;
						const newDoc: CorporateDocument = {
							_id: docPayload._id || "doc_" + Date.now(),
							category: docPayload.category || category,
							documentType: docPayload.documentType || meta?.documentType,
							documentTypeName: docPayload.documentTypeName || docPayload.ocrData?.documentTypeName || meta?.documentTypeName,
							promptTemplateId: docPayload.promptTemplate || docPayload.ocrData?.promptTemplateId || meta?.promptTemplateId,
							filename: docPayload.filename || docPayload.fileName || file.name,
							fileUrl: docPayload.fileUrl || docPayload.url,
							mimeType: docPayload.mimeType || file.type,
							size: file.size,
							status: "uploaded",
							ocrData: docPayload.ocrData,
							uploadedAt: new Date().toISOString(),
						};
						this.documents = [...this.documents, newDoc];
						this.changed.next();
						return newDoc;
					}
					return null;
				}),
				catchError((err) => {
					this.busy = false;
					this.error = err?.error?.message || "Error al subir el documento corporativo";
					this.changed.next();
					return of(null);
				}),
			);
	}

	removeDocument(docIndex: number): void {
		this.documents.splice(docIndex, 1);
		this.changed.next();
	}

	saveRepresentative(rep: CompanyRepresentative): Observable<boolean> {
		this.busy = true;
		this.error = null;

		if (!this.registrationId) {
			this.busy = false;
			const existingIndex = this.representatives.findIndex((r) => r.documentNumber === rep.documentNumber);
			if (existingIndex >= 0) {
				this.representatives[existingIndex] = { ...rep };
			} else {
				this.representatives.push({ ...rep, _id: "local_rep_" + Date.now() });
			}
			this.changed.next();
			return of(true);
		}

		const repPayload = {
			...rep,
			fullName: `${rep.firstName || ""} ${rep.lastName || ""}`.trim() || "Representative",
		};

		return this._http
			.post<any>(`${this.apiUrl}/v2/business-registrations/${this.registrationId}/representatives`, repPayload, {
				headers: this._getAuthHeaders(),
			})
			.pipe(
				map((res) => {
					this.busy = false;
					const updatedRaw = res?.data?.member || res?.data;
					if (res?.success && updatedRaw) {
						const full = String(updatedRaw.fullName || "").trim();
						const parts = full ? full.split(/\s+/) : [];
						const updated: CompanyRepresentative = {
							_id: updatedRaw._id,
							firstName: updatedRaw.firstName || rep.firstName || parts[0] || "",
							lastName: updatedRaw.lastName || rep.lastName || parts.slice(1).join(" ") || "",
							role: updatedRaw.role || rep.role,
							isUBO: Boolean(updatedRaw.isUBO),
							ownershipPercentage: Number(updatedRaw.ownershipPercentage) || 0,
							documentType: updatedRaw.documentType || rep.documentType,
							documentNumber: String(updatedRaw.documentNumber || rep.documentNumber),
							email: updatedRaw.email || rep.email,
							phone: updatedRaw.phone || rep.phone,
							kycStatus: updatedRaw.kycStatus || "PENDING",
							kycAppRegistration: updatedRaw.kycAppRegistration,
							kycToken: updatedRaw.kycToken || updatedRaw.invitationToken || "",
							inviteSentAt: updatedRaw.inviteSentAt || updatedRaw.invitedAt,
						};
						const idx = this.representatives.findIndex(
							(r) => (r._id && r._id === updated._id) || r.documentNumber === updated.documentNumber,
						);
						if (idx >= 0) {
							this.representatives[idx] = updated;
						} else {
							this.representatives.push(updated);
						}
					}
					this.changed.next();
					return true;
				}),
				catchError((err) => {
					this.busy = false;
					this.error = err?.error?.message || "Error al registrar el representante";
					this.changed.next();
					return of(false);
				}),
			);
	}

	removeRepresentative(repIndex: number): void {
		this.representatives.splice(repIndex, 1);
		this.changed.next();
	}

	dispatchRepInvite(rep: CompanyRepresentative, channel: "email" | "phone" = "email"): Observable<boolean> {
		if (!this.registrationId || !rep._id) {
			rep.inviteSentAt = new Date().toISOString();
			this.changed.next();
			return of(true);
		}

		const body = {
			channel,
			origin: typeof window !== "undefined" ? window.location.origin : "https://access.verifik.co",
			language: this.activeLang,
		};

		return this._http
			.post<any>(`${this.apiUrl}/v2/business-registrations/${this.registrationId}/representatives/${rep._id}/dispatch-invite`, body, {
				headers: this._getAuthHeaders(),
			})
			.pipe(
				map((res) => {
					if (res?.success) {
						rep.inviteSentAt = new Date().toISOString();
						if (res?.data?.kycToken) {
							rep.kycToken = res.data.kycToken;
						}
						this.changed.next();
						return true;
					}
					return false;
				}),
				catchError(() => of(false)),
			);
	}

	startPollingRepKyc(): void {
		this.stopPolling();
		this._pollTimer = setInterval(() => {
			if (!this.token) return;
			this._http
				.get<any>(`${this.apiUrl}/v2/business-registrations/session/${this.token}`)
				.pipe(
					timeout(4000),
					catchError(() => of(null)),
				)
				.subscribe((res) => {
					if (res?.success && res?.data) {
						this._applyDossier(res.data);
						if (this.activeRepForKyc) {
							const matched = this.representatives.find(
								(r) => r._id === this.activeRepForKyc?._id || r.documentNumber === this.activeRepForKyc?.documentNumber,
							);
							if (matched) {
								this.activeRepForKyc = matched;
								if (matched.kycStatus === "COMPLETED") {
									this.closeKycModal();
								}
							}
						}
						this.changed.next();
					}
				});
		}, 3000);
	}

	stopPolling(): void {
		if (this._pollTimer) {
			clearInterval(this._pollTimer);
			this._pollTimer = null;
		}
	}

	openKycModal(rep: CompanyRepresentative): void {
		this.activeRepForKyc = rep;
		this.kycModalOpen = true;
		this.startPollingRepKyc();
		this.changed.next();
	}

	closeKycModal(): void {
		this.kycModalOpen = false;
		this.activeRepForKyc = null;
		this.stopPolling();
		this.changed.next();
	}

	submitRegistration(): Observable<boolean> {
		this.busy = true;
		this.error = null;

		const payload = {
			legalAttestation: true,
			signatureDate: new Date().toISOString(),
		};

		if (!this.registrationId) {
			this.busy = false;
			this.screen = "submitted";
			this.submissionResult = {
				status: "COMPLETED",
				registrationId: "REG-" + Date.now().toString().slice(-6),
			};
			this._startRedirectCountdown();
			this.changed.next();
			return of(true);
		}

		return this._http
			.post<any>(`${this.apiUrl}/v2/business-registrations/${this.registrationId}/submit`, payload, { headers: this._getAuthHeaders() })
			.pipe(
				map((res) => {
					this.busy = false;
					this.submissionResult = res?.data || { status: "COMPLETED" };
					this.screen = "submitted";
					this._startRedirectCountdown();
					this.changed.next();
					return true;
				}),
				catchError((err) => {
					this.busy = false;
					this.error = err?.error?.message || "Error al completar la verificación empresarial";
					this.changed.next();
					return of(false);
				}),
			);
	}

	private _startRedirectCountdown(): void {
		const redirectUrl = this.projectFlow?.integrations?.redirectUrl;
		if (!redirectUrl) return;

		this.redirectCountdown = 7;
		this._stopRedirectTimer();
		this._redirectTimer = setInterval(() => {
			this.redirectCountdown--;
			if (this.redirectCountdown <= 0) {
				this._stopRedirectTimer();
				window.location.href = redirectUrl;
			}
			this.changed.next();
		}, 1000);
	}

	private _stopRedirectTimer(): void {
		if (this._redirectTimer) {
			clearInterval(this._redirectTimer);
			this._redirectTimer = null;
		}
	}

	goTo(nextScreen: BusinessScreen): void {
		if (this.screen !== nextScreen && this.screen !== "loading") {
			this.history.push(this.screen);
		}
		this.screen = nextScreen;
		this.error = null;
		this.changed.next();
	}

	jumpToStep(step: BusinessStep): void {
		if (this.screen === "loading" || this.screen === "upgrade" || this.screen === "submitted" || this.screen === step) {
			return;
		}
		const stepOrder: BusinessStep[] = ["company", "documents", "representatives", "review"];
		const idx = stepOrder.indexOf(step);
		if (idx > 0) {
			this.history = stepOrder.slice(0, idx);
		} else {
			this.history = [];
		}
		this.screen = step;
		this.error = null;
		this.changed.next();
	}

	back(): void {
		if (this.history.length > 0) {
			this.screen = this.history.pop() || "company";
			this.error = null;
			this.changed.next();
		}
	}

	canProceedFromStep(step: BusinessStep): boolean {
		switch (step) {
			case "company":
				return canProceedFromCompany(this.company);
			case "documents":
				return canProceedFromDocuments(this.documents);
			case "representatives":
				return canProceedFromRepresentatives(this.representatives);
			case "review":
				return canSubmitReview(this.legalAttestation);
			default:
				return false;
		}
	}

	private _saveToken(projectId: string, token: string): void {
		const key = `verifik_business_token_${projectId}`;
		try {
			localStorage.setItem(key, token);
		} catch {}
		try {
			sessionStorage.setItem(key, token);
		} catch {}
	}

	private _readSavedToken(projectId: string): string | null {
		const key = `verifik_business_token_${projectId}`;
		try {
			const fromLocal = localStorage.getItem(key);
			if (fromLocal) return fromLocal;
		} catch {}
		try {
			const fromSession = sessionStorage.getItem(key);
			if (fromSession) {
				try {
					localStorage.setItem(key, fromSession);
				} catch {}
				return fromSession;
			}
		} catch {}
		return null;
	}

	private _clearSavedToken(projectId: string): void {
		const key = `verifik_business_token_${projectId}`;
		try {
			localStorage.removeItem(key);
		} catch {}
		try {
			sessionStorage.removeItem(key);
		} catch {}
	}
}
