import { CommonModule } from "@angular/common";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { VerifyBusinessSessionService } from "../verify-business-session.service";
import { CorporateDocument, CorporateDocumentCategory } from "../verify-business.types";
import { countVerifiedRepresentatives } from "../verify-business-flow";

@Component({
	selector: "business-review-submit",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule],
	templateUrl: "./business-review-submit.component.html",
	styleUrls: ["./business-review-submit.component.scss"],
})
export class BusinessReviewSubmitComponent {
	@ViewChild("attestationCheckbox") attestationCheckbox?: ElementRef<HTMLInputElement>;
	@ViewChild("tier1KycBtn") tier1KycBtn?: ElementRef<HTMLButtonElement>;

	submittedAttempt = false;
	validationAnnouncement = "";

	constructor(
		public session: VerifyBusinessSessionService,
		private _transloco: TranslocoService,
	) {}

	get activeDocuments(): CorporateDocument[] {
		return (this.session.documents || []).filter((d) => !d.supersededAt);
	}

	get verifiedRepsCount(): number {
		return countVerifiedRepresentatives(this.session.representatives);
	}

	get minVerifiedRequired(): number {
		return this.session.flowPolicy?.minVerifiedRepresentatives ?? 1;
	}

	get isTier1KycIncomplete(): boolean {
		return Boolean(
			this.session.flowPolicy?.enableProgressiveTiers &&
				this.session.flowPolicy?.tier1RequiresRepresentativeKyc &&
				this.verifiedRepsCount < this.minVerifiedRequired,
		);
	}

	get hasCustomerNotes(): boolean {
		return (
			(this.session.missingDocumentNotes?.length || 0) > 0 ||
			Boolean(this.session.submissionNotes?.trim())
		);
	}

	get isPartialSubmission(): boolean {
		return String(this.session.submissionResult?.status || "").toUpperCase() === "SUBMITTED_PARTIAL";
	}

	categoryLabelKey(cat: CorporateDocumentCategory): string {
		const map: Record<CorporateDocumentCategory, string> = {
			business_document: "verifyBusiness.slotBusinessTitle",
			tax_document: "verifyBusiness.slotTaxTitle",
			bank_document: "verifyBusiness.slotBankTitle",
			proof_of_address: "verifyBusiness.slotOtherTitle",
			other: "verifyBusiness.slotOtherTitle",
		};
		return map[cat] || "";
	}

	canSubmit(): boolean {
		return this.session.legalAttestation === true;
	}

	editCompany(): void {
		this.session.goTo("company");
	}

	editDocuments(): void {
		this.session.goTo("documents");
	}

	editRepresentatives(): void {
		this.session.goTo("representatives");
	}

	submit(): void {
		if (this.session.busy) return;
		this.session.error = null;

		if (this.isTier1KycIncomplete) {
			const msg =
				this._transloco.translate("verifyBusiness.errRepresentativeKycRequired") ||
				"At least one legal representative must complete identity verification (KYC) before submitting.";
			this.session.error = msg;
			this.validationAnnouncement = "";
			setTimeout(() => {
				this.validationAnnouncement = msg;
				this.tier1KycBtn?.nativeElement?.focus();
			}, 0);
			return;
		}

		if (!this.canSubmit()) {
			this.submittedAttempt = true;
			const msg =
				this._transloco.translate("verifyBusiness.errAttestationRequired") ||
				"Please accept the sworn attestation declaration before submitting.";
			this.session.error = msg;
			this.validationAnnouncement = "";
			setTimeout(() => {
				this.validationAnnouncement = msg;
				this.attestationCheckbox?.nativeElement?.focus();
			}, 0);
			return;
		}

		this.validationAnnouncement = "";
		this.session.submitRegistration().subscribe();
	}

	get redirectUrl(): string | undefined {
		return this.session.projectFlow?.integrations?.redirectUrl;
	}

	redirectNow(): void {
		if (this.redirectUrl) {
			window.location.href = this.redirectUrl;
		}
	}
}
