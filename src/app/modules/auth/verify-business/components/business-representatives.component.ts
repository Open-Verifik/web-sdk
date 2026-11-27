import { CommonModule } from "@angular/common";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

import { VerifyBusinessSessionService } from "../verify-business-session.service";
import { CompanyRepresentative, RepresentativeRole } from "../verify-business.types";
import {
	canProceedFromRepresentatives,
	countVerifiedRepresentatives,
	isUBOByOwnership,
} from "../verify-business-flow";

@Component({
	selector: "business-representatives",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule],
	templateUrl: "./business-representatives.component.html",
	styleUrls: ["./business-representatives.component.scss"],
})
export class BusinessRepresentativesComponent {
	@ViewChild("repFormEl") repFormEl?: ElementRef<HTMLFormElement>;
	@ViewChild("addMemberBtn") addMemberBtn?: ElementRef<HTMLButtonElement>;

	isAddingMember = false;
	autoLaunchKycOnSave = false;
	submittedAttempt = false;
	validationAnnouncement = "";

	newMember: CompanyRepresentative = this._emptyMember();

	readonly allRoles: Array<{ value: RepresentativeRole; label: string }> = [
		{ value: "legal_representative", label: "Representante Legal Principal" },
		{ value: "beneficial_owner", label: "Beneficiario Final (UBO >= 25%)" },
		{ value: "signatory", label: "Firmante Autorizado / Apoderado" },
		{ value: "director", label: "Miembro de Junta / Director" },
		{ value: "executive", label: "Ejecutivo / C-Level" },
	];

	docTypes = [
		{ value: "CC", label: "Cédula de Ciudadanía" },
		{ value: "CE", label: "Cédula de Extranjería" },
		{ value: "PASSPORT", label: "Pasaporte" },
		{ value: "ID", label: "Documento Nacional de Identidad" },
	];

	constructor(
		public session: VerifyBusinessSessionService,
		private _transloco: TranslocoService,
	) {}

	get availableRoles(): Array<{ value: RepresentativeRole; label: string }> {
		if (this.session.flowPolicy?.collectUboDeclaration === false) {
			return this.allRoles.filter((r) => r.value !== "beneficial_owner");
		}
		return this.allRoles;
	}

	get totalOwnership(): number {
		return this.session.representatives.reduce(
			(sum, r) => sum + (Number(r.ownershipPercentage) || 0),
			0,
		);
	}

	get verifiedRepsCount(): number {
		return countVerifiedRepresentatives(this.session.representatives);
	}

	get minVerifiedRequired(): number {
		return this.session.flowPolicy?.minVerifiedRepresentatives ?? 1;
	}

	get showTier1Callout(): boolean {
		return Boolean(
			this.session.flowPolicy?.enableProgressiveTiers &&
				this.session.flowPolicy?.tier1RequiresRepresentativeKyc,
		);
	}

	canProceed(): boolean {
		return canProceedFromRepresentatives(this.session.representatives, {
			collectOwnershipPercentage: this.session.flowPolicy?.collectOwnershipPercentage,
		});
	}

	openAddMember(): void {
		this.newMember = this._emptyMember();
		this.autoLaunchKycOnSave = false;
		this.submittedAttempt = false;
		this.isAddingMember = true;
	}

	openSelfAsRepresentative(): void {
		this.newMember = {
			...this._emptyMember(),
			role: "legal_representative",
			email: this.session.company?.email || "",
			phone: this.session.company?.phone || "",
		};
		this.autoLaunchKycOnSave = true;
		this.submittedAttempt = false;
		this.isAddingMember = true;
	}

	cancelAddMember(): void {
		this.isAddingMember = false;
		this.autoLaunchKycOnSave = false;
		this.submittedAttempt = false;
		this.newMember = this._emptyMember();
	}

	onOwnershipChange(): void {
		const pct = Number(this.newMember.ownershipPercentage) || 0;
		if (this.session.flowPolicy?.collectUboDeclaration !== false && isUBOByOwnership(pct)) {
			this.newMember.isUBO = true;
		}
	}

	isFieldInvalid(form: NgForm, name: string): boolean {
		const ctrl = form?.controls?.[name];
		if (!ctrl) return false;
		return ctrl.invalid && (ctrl.touched || this.submittedAttempt);
	}

	saveNewMember(form?: NgForm): void {
		if (this.session.busy) return;

		if (
			form?.invalid ||
			!this.newMember.firstName?.trim() ||
			!this.newMember.lastName?.trim() ||
			!this.newMember.documentNumber?.trim() ||
			!this.newMember.email?.trim()
		) {
			this.submittedAttempt = true;
			form?.control?.markAllAsTouched();
			const msg =
				this._transloco.translate("verifyBusiness.errRequiredRepFields") ||
				"Por favor complete los campos obligatorios del representante.";
			this.session.error = msg;
			this._announceAndFocusFirstInvalid();
			return;
		}

		if (this.session.flowPolicy?.collectOwnershipPercentage !== false) {
			const pct = Number(this.newMember.ownershipPercentage) || 0;
			if (pct < 0 || pct > 100) {
				this.session.error =
					this._transloco.translate("verifyBusiness.errInvalidOwnershipRange") ||
					"El porcentaje de participación debe estar entre 0% y 100%.";
				return;
			}

			if (this.totalOwnership + pct > 100) {
				this.session.error =
					this._transloco.translate("verifyBusiness.errOwnershipExceeds100") ||
					`La suma total de participación no puede exceder el 100% (actual: ${this.totalOwnership}%).`;
				return;
			}

			if (this.session.flowPolicy?.collectUboDeclaration !== false) {
				this.newMember.isUBO = this.newMember.isUBO || isUBOByOwnership(pct);
			}
		} else {
			this.newMember.ownershipPercentage = 0;
			if (this.session.flowPolicy?.collectUboDeclaration === false) {
				this.newMember.isUBO = false;
			}
		}

		const docNum = this.newMember.documentNumber.trim();
		const shouldOpenKyc = this.autoLaunchKycOnSave;

		this.session.saveRepresentative(this.newMember).subscribe({
			next: (ok) => {
				if (ok) {
					this.isAddingMember = false;
					this.autoLaunchKycOnSave = false;
					this.submittedAttempt = false;
					this.newMember = this._emptyMember();
					if (shouldOpenKyc) {
						const saved =
							this.session.representatives.find((r) => r.documentNumber === docNum) ||
							this.session.representatives[this.session.representatives.length - 1];
						if (saved) {
							this.verifyIdentity(saved);
						}
					}
				}
			},
		});
	}

	private _announceAndFocusFirstInvalid(): void {
		this.validationAnnouncement = "";
		setTimeout(() => {
			this.validationAnnouncement = this.session.error || "";
			const firstInvalid = this.repFormEl?.nativeElement?.querySelector<HTMLElement>(
				"input.ng-invalid, select.ng-invalid, textarea.ng-invalid",
			);
			firstInvalid?.focus();
		}, 0);
	}

	removeMember(index: number): void {
		this.session.removeRepresentative(index);
	}

	verifyIdentity(rep: CompanyRepresentative): void {
		this.session.openKycModal(rep);
	}

	dispatchInvite(rep: CompanyRepresentative, channel: "email" | "sms" = "email"): void {
		this.session.dispatchRepInvite(rep, channel).subscribe();
	}

	getRoleLabel(role: RepresentativeRole): string {
		const found = this.allRoles.find((r) => r.value === role);
		return found ? found.label : role;
	}

	next(): void {
		if (this.session.busy) return;
		this.session.error = null;

		if (!this.canProceed()) {
			const msg =
				this.session.representatives.length === 0
					? this._transloco.translate("verifyBusiness.errAtLeastOneRep") ||
						"Please add at least one legal representative before continuing."
					: this._transloco.translate("verifyBusiness.errOwnershipExceeds100") ||
						"Please check representative details and ownership totals.";
			this.session.error = msg;
			this.validationAnnouncement = "";
			setTimeout(() => {
				this.validationAnnouncement = msg;
				this.addMemberBtn?.nativeElement?.focus();
			}, 0);
			return;
		}

		this.validationAnnouncement = "";
		this.session.goTo("review");
	}

	back(): void {
		this.session.goTo("documents");
	}

	private _emptyMember(): CompanyRepresentative {
		return {
			firstName: "",
			lastName: "",
			role: "legal_representative",
			isUBO: false,
			ownershipPercentage: 0,
			documentType: "CC",
			documentNumber: "",
			email: "",
			phone: "",
			kycStatus: "PENDING",
		};
	}
}
