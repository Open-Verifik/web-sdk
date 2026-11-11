import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@ngneat/transloco";

import { VerifyBusinessSessionService } from "../verify-business-session.service";
import { CorporateDocumentCategory } from "../verify-business.types";

@Component({
	selector: "business-review-submit",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule],
	templateUrl: "./business-review-submit.component.html",
	styleUrls: ["./business-review-submit.component.scss"],
})
export class BusinessReviewSubmitComponent {
	constructor(public session: VerifyBusinessSessionService) {}

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
		if (!this.canSubmit() || this.session.busy) return;
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
