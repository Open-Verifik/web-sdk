import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { Subject, takeUntil } from "rxjs";

import { VerifyBusinessSessionService } from "../verify-business-session.service";
import { COUNTRY_JURISDICTIONS, calculateCheckDigit, canProceedFromCompany } from "../verify-business-flow";
import { CountryJurisdiction, EntityTypeOption } from "../verify-business.types";

@Component({
	selector: "business-company-form",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule],
	templateUrl: "./business-company-form.component.html",
	styleUrls: ["./business-company-form.component.scss"],
})
export class BusinessCompanyFormComponent implements OnInit, OnDestroy {
	@ViewChild("companyFormEl") companyFormEl?: ElementRef<HTMLFormElement>;

	jurisdictions: CountryJurisdiction[] = COUNTRY_JURISDICTIONS;
	currentJurisdiction: CountryJurisdiction = COUNTRY_JURISDICTIONS[0];
	submittedAttempt = false;
	validationAnnouncement = "";

	readonly monthlyVolumeOptions = [
		{ value: "under_10k", labelKey: "verifyBusiness.volumeUnder10k", fallback: "< $10,000 USD / mo" },
		{ value: "10k_50k", labelKey: "verifyBusiness.volume10k50k", fallback: "$10,000 - $50,000 USD / mo" },
		{ value: "50k_250k", labelKey: "verifyBusiness.volume50k250k", fallback: "$50,000 - $250,000 USD / mo" },
		{ value: "250k_1m", labelKey: "verifyBusiness.volume250k1m", fallback: "$250,000 - $1M USD / mo" },
		{ value: "over_1m", labelKey: "verifyBusiness.volumeOver1m", fallback: "> $1M USD / mo" },
	];

	private _destroy$ = new Subject<void>();

	constructor(
		public session: VerifyBusinessSessionService,
		private _transloco: TranslocoService,
	) {}

	ngOnInit(): void {
		this._syncFromSession();
		this.session.changed.pipe(takeUntil(this._destroy$)).subscribe(() => {
			this._syncFromSession();
		});
	}

	ngOnDestroy(): void {
		this._destroy$.next();
		this._destroy$.complete();
	}

	private _syncFromSession(): void {
		this._syncAllowedJurisdictions();
		const countryCode = this.session.company.country || this.jurisdictions[0]?.code || "CO";
		this.selectJurisdiction(countryCode, false);
	}

	private _syncAllowedJurisdictions(): void {
		const docTypeCountries: string[] = Array.isArray(this.session.projectFlow?.business?.documentTypes)
			? this.session.projectFlow.business.documentTypes
					.map((dt: any) => String(dt?.country || "").trim())
					.filter(Boolean)
			: [];
		const allowedProjCountries: string[] = Array.isArray(this.session.project?.allowedCountries)
			? this.session.project.allowedCountries.map((c: any) => String(c || "").trim()).filter(Boolean)
			: [];
		const rawList = docTypeCountries.length > 0 ? docTypeCountries : allowedProjCountries;

		if (rawList.length > 0) {
			const lowerSet = new Set(rawList.map((c) => c.toLowerCase()));
			const filtered = COUNTRY_JURISDICTIONS.filter(
				(j) =>
					lowerSet.has(j.code.toLowerCase()) ||
					lowerSet.has(j.name.toLowerCase()) ||
					(j.countryKey && lowerSet.has(j.countryKey.toLowerCase())),
			);
			if (filtered.length > 0) {
				this.jurisdictions = filtered;
			}
		}
	}

	get availableEntityTypes(): EntityTypeOption[] {
		return this.currentJurisdiction.entityTypes || [];
	}

	onJurisdictionChange(code: string): void {
		this.selectJurisdiction(code, true);
	}

	selectJurisdiction(code: string, reloadConfig = false): void {
		const norm = String(code || "").trim().toLowerCase();
		const found =
			this.jurisdictions.find(
				(j) =>
					j.code.toLowerCase() === norm ||
					j.name.toLowerCase() === norm ||
					(j.countryKey && j.countryKey.toLowerCase() === norm),
			) || this.jurisdictions[0];
		this.currentJurisdiction = found;
		this.session.company.country = found.code;
		this.session.company.address.country = found.code;

		const exists = found.entityTypes.some((e) => e.value === this.session.company.entityType);
		if (!exists && found.entityTypes.length > 0) {
			this.session.company.entityType = found.entityTypes[0].value;
		}

		if (found.code === "CO" && this.session.company.taxId) {
			this.onTaxIdChange();
		}

		if (reloadConfig) {
			this.session.loadFlowConfig(found.code);
		}
	}

	onTaxIdChange(): void {
		if (this.currentJurisdiction.code === "CO") {
			const dv = calculateCheckDigit(this.session.company.taxId);
			this.session.company.checkDigit = dv;
		}
	}

	isFieldInvalid(form: NgForm, name: string): boolean {
		const ctrl = form?.controls?.[name];
		if (!ctrl) return false;
		return ctrl.invalid && (ctrl.touched || this.submittedAttempt);
	}

	canProceed(): boolean {
		return canProceedFromCompany(this.session.company);
	}

	submit(form?: NgForm): void {
		if (this.session.busy) return;

		if (form?.invalid || !this.canProceed()) {
			this.submittedAttempt = true;
			form?.control?.markAllAsTouched();
			const msg =
				this._transloco.translate("verifyBusiness.errCompanyRequiredFields") ||
				"Please complete all required company profile fields before continuing.";
			this.session.error = msg;
			this.validationAnnouncement = "";
			setTimeout(() => {
				this.validationAnnouncement = msg;
				const firstInvalid = this.companyFormEl?.nativeElement?.querySelector<HTMLElement>(
					"input.ng-invalid, select.ng-invalid, textarea.ng-invalid",
				);
				firstInvalid?.focus();
			}, 0);
			return;
		}

		this.validationAnnouncement = "";
		this.session.saveCompany(this.session.company).subscribe();
	}
}
