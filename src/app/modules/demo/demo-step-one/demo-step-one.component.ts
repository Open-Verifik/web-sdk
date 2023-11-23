import { Component, OnInit } from "@angular/core";
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
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { Lead, Session } from "../lead";

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
export class DemoStepOneComponent implements OnInit {
	canStartDemo: Boolean;
	contactForm: FormGroup;
	showForm: Boolean;
	countries: Array<any>;
	lead: Lead;
	session: Session;
	errorScreen: Object = { showError: Boolean, errorMessage: String };

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
		daniel: {
			name: "Daniel Gallardo",
			companyName: "Verifik",
			website: "verifik.co",
			jobFunction: "Developer",
			email: "daniel@verifik.co",
			countryCode: "+52",
			phone: "8333114871",
			legalAgreement: true,
		},
	};

	constructor(
		private _demoService: DemoService,
		private _formBuilder: FormBuilder,
		private route: ActivatedRoute,
		private _countries: CountriesService,
		private _splashScreenService: FuseSplashScreenService
	) {
		this.canStartDemo = false;

		this.showForm = false;

		this.errorScreen["showError"] = false;

		this.countries = this._countries.countryCodes;
	}

	ngOnInit(): void {
		this.initForm();
	}

	initForm(): void {
		const name = this.route.snapshot.queryParams?.name?.toLocaleLowerCase();

		const data = this.dataLeads[name] ?? {};

		this.contactForm = this._formBuilder.group({
			companyName: [data.companyName, [Validators.required]],
			name: [data.name, [Validators.required]],
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
			const forbidden =
				/.*@(gmail\.com|hotmail\.com|outlook\.com|test\.com|yahoo\.com|aol\.com|protonmail\.com|icloud\.com|zoho\.com|gmx\.com)$/.test(
					control.value
				);
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

	showFormView(): void {
		this.lead = this._demoService.getLead();

		if (this.lead) {
			this._demoService.moveToStep(2);

			return;
		}

		this.showForm = true;
	}

	submitForm(): void {
		if (!this.contactForm.valid) return;

		this.errorScreen["showError"] = false;

		this._splashScreenService.show();

		this._demoService.createLead(this.contactForm.value).subscribe(
			(response) => {
				this._demoService.setLead(response.data);

				this._createSession();
			},
			(err) => {
				this.errorScreen["errorMessage"] = `${err.status}: ${err.error.message}`;

				this.errorScreen["showError"] = true;

				this._splashScreenService.hide();
			}
		);
	}

	_createSession(): void {
		this._demoService
			.createSession({
				identifier: this._demoService.generateUniqueId(),
			})
			.subscribe((response) => {
				this._demoService.setSession(response.data);

				this._demoService.moveToStep(2);
			});

		this._splashScreenService.hide();
	}
}
