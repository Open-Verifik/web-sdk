import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { DemoService } from "../demo.service";
import { TranslocoModule } from "@ngneat/transloco";
import { CommonModule } from "@angular/common";
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { CountriesService } from "../countries.service";

@Component({
	selector: "demo-step-one",
	templateUrl: "./demo-step-one.component.html",
	styleUrls: ["./demo-step-one.component.scss", "../demo-root/demo-root.component.scss"],
	exportAs: "demo-step-one",
	standalone: true,
	imports: [
		FlexLayoutModule,
		CommonModule,
		RouterLink,
		MatCheckboxModule,
		MatButtonModule,
		TranslocoModule,
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		ReactiveFormsModule,
		MatSelectModule,
	],
})
export class DemoStepOneComponent {
	canStartDemo: Boolean;
	contactForm: FormGroup;
	showForm: Boolean;
	countries: Array<any>;

	private dataLeads = {
		lina: {
			name: "Lina Yepes",
			companyName: "Verifik",
			website: "verifik.co",
			jobFunction: "Business Manager",
			email: "lina@verifik.co",
			countryCode: "+57",
			phone: "3507408240",
			legalAgreement: true,
		},
		miguel: {
			name: "Juan Miguel Trevino Morales",
			companyName: "Verifik",
			website: "verifik.co",
			jobFunction: "CTO",
			email: "miguel@verifik.co",
			countryCode: "+1",
			phone: "7809133082",
			legalAgreement: true,
		},
		johan: {
			name: "Johan Sebastian Castellanos Barrera",
			companyName: "Verifik",
			website: "verifik.co",
			jobFunction: "CEO",
			email: "johan@verifik.co",
			countryCode: "+507",
			phone: "63139630",
			legalAgreement: true,
		},
		angel: {
			name: "Angel Ortiz Olivera",
			companyName: "Verifik",
			website: "verifik.co",
			jobFunction: "Develper",
			email: "angel2@verifik.co",
			countryCode: "+52",
			phone: "9541607442",
			legalAgreement: true,
		},
	};

	constructor(
		private _demoService: DemoService,
		private _formBuilder: FormBuilder,
		private route: ActivatedRoute,
		private _countries: CountriesService
	) {
		this.canStartDemo = false;

		this.showForm = false;

		this.countries = this._countries.countryCodes;

		console.log({ countryCodes: this.countries });

		this.initForm();
	}

	initForm(): void {
		const name = this.route.snapshot.queryParams?.name?.toLocaleLowerCase();

		const data = this.dataLeads[name] ?? {};

		this.contactForm = this._formBuilder.group({
			companyName: [data.companyName, [Validators.required, Validators.pattern("^[a-zA-Z][a-zA-Z\\s]*$")]],
			name: [data.name, [Validators.required, Validators.pattern("^[a-zA-Z][a-zA-Z\\s]*$")]],
			website: [
				data.website,
				[Validators.required, Validators.pattern("^(https?:\\/\\/)?(www\\.)?([a-zA-Z0-9]+(-?[a-zA-Z0-9])*\\.)+\\w{2,}(\\/?|\\/\\w*)$")],
			],
			jobFunction: [data.jobFunction, [Validators.required, Validators.pattern("^[a-zA-Z][a-zA-Z\\s]*$")]],
			email: [data.email, [Validators.required, Validators.email, this.companyEmailValidator()]],
			countryCode: [data.countryCode, [Validators.required]],
			phone: [data.phone, [Validators.required, this.phoneNumberValidator()]],
			legalAgreement: [data.legalAgreement, [Validators.required]],
		});
	}

	companyEmailValidator(): ValidatorFn {
		return (
			control: AbstractControl
		): {
			[key: string]: any;
		} | null => {
			const forbidden = /.*@(gmail\.com|hotmail\.com|outlook\.com)$/.test(control.value);
			return forbidden
				? {
						forbiddenEmail: {
							value: control.value,
						},
				  }
				: null;
		};
	}

	phoneNumberValidator(): ValidatorFn {
		return (
			control: AbstractControl
		): {
			[key: string]: any;
		} | null => {
			const phoneNumberPattern = /^\d{8,}$/;

			const isValid = phoneNumberPattern.test(control.value);

			return isValid
				? null
				: {
						invalidPhoneNumber: true,
				  };
		};
	}

	agreeToTerms(): void {
		this.canStartDemo = !Boolean(this.canStartDemo);
	}

	showFormView(): void {
		if (!this.canStartDemo) return;

		this.showForm = true;
		// this._demoService.moveToStep(2);
	}
}
