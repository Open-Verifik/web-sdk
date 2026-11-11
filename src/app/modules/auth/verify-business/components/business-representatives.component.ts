import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@ngneat/transloco";

import { VerifyBusinessSessionService } from "../verify-business-session.service";
import { CompanyRepresentative, RepresentativeRole } from "../verify-business.types";
import { canProceedFromRepresentatives, isUBOByOwnership } from "../verify-business-flow";

@Component({
	selector: "business-representatives",
	standalone: true,
	imports: [CommonModule, FormsModule, TranslocoModule],
	templateUrl: "./business-representatives.component.html",
	styleUrls: ["./business-representatives.component.scss"],
})
export class BusinessRepresentativesComponent {
	isAddingMember = false;
	selectedRole: RepresentativeRole = "legal_representative";

	newMember: CompanyRepresentative = this._emptyMember();

	roles: Array<{ value: RepresentativeRole; label: string }> = [
		{ value: "legal_representative", label: "Representante Legal Principal" },
		{ value: "beneficial_owner", label: "Beneficiario Final (UBO >= 25%)" },
		{ value: "shareholder", label: "Accionista / Socio" },
		{ value: "director", label: "Miembro de Junta / Director" },
	];

	docTypes = [
		{ value: "CC", label: "Cédula de Ciudadanía" },
		{ value: "CE", label: "Cédula de Extranjería" },
		{ value: "PASSPORT", label: "Pasaporte" },
		{ value: "ID", label: "Documento Nacional de Identidad" },
	];

	constructor(public session: VerifyBusinessSessionService) {}

	get totalOwnership(): number {
		return this.session.representatives.reduce(
			(sum, r) => sum + (Number(r.ownershipPercentage) || 0),
			0
		);
	}

	canProceed(): boolean {
		return canProceedFromRepresentatives(this.session.representatives);
	}

	openAddMember(): void {
		this.newMember = this._emptyMember();
		this.isAddingMember = true;
	}

	cancelAddMember(): void {
		this.isAddingMember = false;
		this.newMember = this._emptyMember();
	}

	onOwnershipChange(): void {
		const pct = Number(this.newMember.ownershipPercentage) || 0;
		if (isUBOByOwnership(pct)) {
			this.newMember.isUBO = true;
		}
	}

	saveNewMember(): void {
		if (
			!this.newMember.firstName?.trim() ||
			!this.newMember.lastName?.trim() ||
			!this.newMember.documentNumber?.trim() ||
			!this.newMember.email?.trim()
		) {
			this.session.error = "Por favor complete los campos obligatorios del representante.";
			return;
		}

		const pct = Number(this.newMember.ownershipPercentage) || 0;
		if (pct < 0 || pct > 100) {
			this.session.error = "El porcentaje de participación debe estar entre 0% y 100%.";
			return;
		}

		if (this.totalOwnership + pct > 100) {
			this.session.error = `La suma total de participación no puede exceder el 100% (actual: ${this.totalOwnership}%).`;
			return;
		}

		this.newMember.isUBO = this.newMember.isUBO || isUBOByOwnership(pct);

		this.session.saveRepresentative(this.newMember).subscribe({
			next: (ok) => {
				if (ok) {
					this.isAddingMember = false;
					this.newMember = this._emptyMember();
				}
			},
		});
	}

	removeMember(index: number): void {
		this.session.removeRepresentative(index);
	}

	verifyIdentity(rep: CompanyRepresentative): void {
		this.session.openKycModal(rep);
	}

	dispatchInvite(rep: CompanyRepresentative): void {
		this.session.dispatchRepInvite(rep, "email").subscribe();
	}

	getRoleLabel(role: RepresentativeRole): string {
		const found = this.roles.find((r) => r.value === role);
		return found ? found.label : role;
	}

	next(): void {
		if (this.canProceed()) {
			this.session.goTo("review");
		}
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
