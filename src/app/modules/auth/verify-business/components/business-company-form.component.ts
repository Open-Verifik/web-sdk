import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@ngneat/transloco";
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
	jurisdictions: CountryJurisdiction[] = COUNTRY_JURISDICTIONS;
	currentJurisdiction: CountryJurisdiction = COUNTRY_JURISDICTIONS[0];
	private _destroy$ = new Subject<void>();

	constructor(public session: VerifyBusinessSessionService) {}

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
		this.selectJurisdiction(countryCode);
	}

	private _syncAllowedJurisdictions(): void {
		const docTypeCountries: string[] = Array.isArray(this.session.projectFlow?.business?.documentTypes)
			? this.session.projectFlow.business.documentTypes
					.map((dt: any) => String(dt?.country || "").trim())
					.filter((c: string) => Boolean(c) && c !== "World")
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

	selectJurisdiction(code: string): void {
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

		// Select default entity type if current is not in list
		const exists = found.entityTypes.some((e) => e.value === this.session.company.entityType);
		if (!exists && found.entityTypes.length > 0) {
			this.session.company.entityType = found.entityTypes[0].value;
		}

		if (found.code === "CO" && this.session.company.taxId) {
			this.onTaxIdChange();
		}
	}

	onTaxIdChange(): void {
		if (this.currentJurisdiction.code === "CO") {
			const dv = calculateCheckDigit(this.session.company.taxId);
			this.session.company.checkDigit = dv;
		}
	}

	canProceed(): boolean {
		return canProceedFromCompany(this.session.company);
	}

	submit(): void {
		if (!this.canProceed() || this.session.busy) return;
		this.session.saveCompany(this.session.company).subscribe();
	}
}
