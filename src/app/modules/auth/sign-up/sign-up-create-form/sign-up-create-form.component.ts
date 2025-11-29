import { CommonModule, NgIf } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { AbstractControl, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { Router, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { FuseAlertType } from "@fuse/components/alert";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import moment from "moment";
import { Subject, takeUntil } from "rxjs";

import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { SmartEnrollProjectFlow } from "app/core/models/smart-enroll-project.model";
import { ApiErrorService, NormalizedApiError } from "app/core/services/api-error.service";
import { CountryCodeOption, CountryOption, CountryService } from "app/core/services/country.service";
import { DemoService } from "app/modules/demo/demo.service";
import { KYCService } from "../../kyc.service";
import { PasswordlessService } from "../../passwordless.service";
import { AppRegistration } from "../../project";
import { SmartEnrollService } from "../../smart-enroll/smart-enroll.service";

declare let dataLayer: any; // Declare the dataLayer for pushing events to GTM.

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	selector: "sign-up-create-form",
	standalone: true,
	styleUrls: ["./sign-up-create-form.component.scss"],
	templateUrl: "./sign-up-create-form.component.html",
	imports: [
		CommonModule,
		FlexLayoutModule,
		MatButtonModule,
		MatCheckboxModule,
		MatDatepickerModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatNativeDateModule,
		MatProgressSpinnerModule,
		MatSelectModule,
		NgIf,
		ReactiveFormsModule,
		RouterLink,
		TranslocoModule,
	],
})
export class SignUpCreateFormComponent implements OnDestroy, OnChanges {
	@ViewChild("countryCodeSearchInput") countryCodeSearchInput: ElementRef<HTMLInputElement>;
	@ViewChild("countrySearchInput") countrySearchInput: ElementRef<HTMLInputElement>;

	@Input("deviceDetails") deviceDetails: any;
	@Input("location") location: any;
	@Input("project") project: Project;
	@Input("projectFlow") projectFlow: ProjectFlow;

	private unsubscriber$: Subject<void> = new Subject<void>();

	alert: { type: FuseAlertType; message: string } = {
		type: "success",
		message: "",
	};

	appRegistration: AppRegistration;
	countries: CountryOption[];
	countryCodes: CountryCodeOption[];
	filteredCountryCodes: CountryCodeOption[];
	filteredCountries: CountryOption[];
	countryCodeSearchTerm: string = "";
	countrySearchTerm: string = "";
	demoData: any;
	fields: any;
	hasLogin: Boolean = false;
	language: string;
	loginProjectFlow: ProjectFlow;
	roles: Array<any>;
	saving: boolean = false;
	showError: boolean = false;
	signUpForm: UntypedFormGroup;
	signUpFormSettings: SmartEnrollProjectFlow["signUpForm"];
	token: string;

	constructor(
		private _apiErrorService: ApiErrorService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countryService: CountryService,
		private _demoService: DemoService,
		private _formBuilder: UntypedFormBuilder,
		private _kycService: KYCService,
		private _passwordlessService: PasswordlessService,
		private _router: Router,
		private _smartEnrollService: SmartEnrollService,
		private _translocoService: TranslocoService
	) {
		this.countryCodes = this._countryService.countryCodes;
		this.filteredCountryCodes = this.countryCodes;

		this.countries = this._countryService.countries;
		this.filteredCountries = this.countries;

		this.fields = {};
		this.roles = this._kycService.roles;

		this.demoData = this._demoService.getDemoData();
		this._demoService.cleanVariables();
	}

	ngOnDestroy(): void {
		localStorage.setItem("signUpData", JSON.stringify({}));

		this.unsubscriber$.next();
		this.unsubscriber$.complete();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.project.currentValue) {
			const data = changes.project.currentValue;

			try {
				this.signUpFormSettings = this.projectFlow.signUpForm;

				this._initForm();
			} catch (exception) {
				console.error({ exception });
			}

			for (let index = 0; index < data.projectFlows.length; index++) {
				const projectFlow = data.projectFlows[index];

				if (projectFlow.status !== "active") continue;
				if (projectFlow.type === "login") this.hasLogin = true;
			}
		}
	}

	get isFormDisabled(): boolean {
		return (
			this.saving ||
			Boolean(this.signUpForm?.invalid || (this.signUpForm?.value.agreements !== undefined && !this.signUpForm?.value.agreements))
		);
	}

	static _dateOfBirthValidator = (control: AbstractControl) => {
		if (!control.value) return null;

		const dob = new Date(control.value);
		const today = new Date();
		const age = today.getFullYear() - dob.getFullYear();
		const m = today.getMonth() - dob.getMonth();
		const day = today.getDate() - dob.getDate();

		let actualAge = age;

		if (m < 0 || (m === 0 && day < 0)) actualAge--;
		if (actualAge < 18) return { minAge: true };
		if (actualAge > 120) return { maxAge: true };

		return null;
	};

	private _initForm(): void {
		const demoData = this._demoService.generateSignUpDemoData(this.location, this.roles);

		this.fields = {};

		if (this._passwordlessService.isVerifikProject) {
			this.fields["company"] = [demoData.company, Validators.required];
			this.fields["role"] = [demoData.role, Validators.required];
		}

		if (this.signUpFormSettings?.fullNameStyle === "together") {
			this.fields["fullName"] = [
				demoData.fullName,
				[Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]+$")],
			];
		}

		if (this.signUpFormSettings?.fullNameStyle === "separate") {
			this.fields["firstName"] = [
				demoData.firstName,
				[Validators.required, Validators.minLength(2), Validators.maxLength(40), Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]+$")],
			];

			this.fields["lastName"] = [
				demoData.lastName,
				[Validators.required, Validators.minLength(2), Validators.maxLength(40), Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]+$")],
			];
		}

		if (this.signUpFormSettings?.email) {
			this.fields["email"] = [demoData.email, [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]];
		}

		if (this.signUpFormSettings?.phone) {
			this.fields["countryCode"] = [this.location?.countryCode || demoData.countryCode, Validators.required];

			const countryCode = this.location?.countryCode || demoData.countryCode;
			const phoneLength = this._countryService.getPhoneLengthForCountryCode(countryCode);

			this.fields["phone"] = [
				demoData.phone,
				[Validators.minLength(phoneLength[0]), Validators.maxLength(phoneLength[1]), Validators.required, Validators.pattern(/^\d+$/)],
			];
		}

		if (this.signUpFormSettings?.showTermsAndConditions || this.signUpFormSettings?.showPrivacyNotice) {
			this.fields["agreements"] = [false, [Validators.requiredTrue]];
		}

		if (this.signUpFormSettings?.allowAdditionalFields && Array.isArray(this.signUpFormSettings?.additionalFields)) {
			for (const field of this.signUpFormSettings.additionalFields) {
				switch (field) {
					case "gender":
						this.fields["gender"] = [demoData.gender, [Validators.required]];

						break;
					case "dateOfBirth":
						this.fields["dateOfBirth"] = [demoData.dateOfBirth, [Validators.required, SignUpCreateFormComponent._dateOfBirthValidator]];

						break;
					case "age":
						this.fields["age"] = [demoData.age, [Validators.required, Validators.min(18), Validators.max(120)]];

						break;
					case "address":
						this.fields["addressLine1"] = [demoData.addressLine1, [Validators.required]];
						this.fields["addressLine2"] = [demoData.addressLine2, [Validators.required]];
						this.fields["city"] = [demoData.city, [Validators.required]];
						this.fields["state"] = [demoData.state, [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÖØ-öø-ÿ\s.'-]{2,40}$/)]];

						break;
					case "postalCode":
						this.fields["postalCode"] = [demoData.postalCode, [Validators.required, Validators.pattern(/^[A-Za-z0-9\s\-]{3,12}$/)]];

						break;
					case "country":
						this.fields["country"] = [demoData.country, [Validators.required]];

						break;
					default:
						this.fields[field] = [demoData[field] || "", [Validators.required]];

						break;
				}
			}
		}

		this.signUpForm = this._formBuilder.group(this.fields);

		const dateOfBirthControl = this.signUpForm.get("dateOfBirth");

		if (dateOfBirthControl) {
			dateOfBirthControl.valueChanges.pipe(takeUntil(this.unsubscriber$)).subscribe((value) => {
				if (!value) return;

				const dob = new Date(value);
				const today = new Date();
				let age = today.getFullYear() - dob.getFullYear();
				const m = today.getMonth() - dob.getMonth();
				const day = today.getDate() - dob.getDate();

				if (m < 0 || (m === 0 && day < 0)) age--;

				const ageControl = this.signUpForm.get("age");

				if (ageControl) {
					ageControl.setValue(age);
				}
			});
		}

		this.signUpForm.valueChanges.pipe(takeUntil(this.unsubscriber$)).subscribe(() => {
			this.showError = false;
			this.alert = null;
		});
	}

	preventInputFocus(event: InputEvent): void {
		event.stopPropagation();
	}

	removeSpacesFromEmail() {
		const emailFormControl = this.signUpForm?.get("email");

		if (!emailFormControl.value) return;

		let cleanedEmail = emailFormControl.value.replace(/\s/g, "");

		if (cleanedEmail.includes("@") && cleanedEmail.indexOf("@") !== cleanedEmail.lastIndexOf("@")) {
			cleanedEmail = cleanedEmail.replace(/@/g, "");
		}

		emailFormControl.patchValue(cleanedEmail);
	}

	removeSpacesFromPhone() {
		const phoneFormControl = this.signUpForm.get("phone");
		const countryCodeFormControl = this.signUpForm.get("countryCode");

		if (!phoneFormControl.value) return;

		const cleanedPhone = phoneFormControl.value.replace(/\s/g, "").replace(/\D/g, "");

		phoneFormControl.patchValue(cleanedPhone);

		if (countryCodeFormControl?.value) {
			const phoneLength = this._countryService.getPhoneLengthForCountryCode(countryCodeFormControl.value);

			phoneFormControl.setValidators([
				Validators.minLength(phoneLength[0]),
				Validators.maxLength(phoneLength[1]),
				Validators.required,
				Validators.pattern(/^\d+$/),
			]);

			phoneFormControl.updateValueAndValidity();
		}

		this._changeDetectorRef.detectChanges();
	}

	onCountryCodeChange() {
		this.removeSpacesFromPhone();

		this._changeDetectorRef.markForCheck();
		this._changeDetectorRef.detectChanges();
	}

	trackByCountryCode(_index: number, country: any): string {
		return country?.code;
	}

	trackByCountry(_index: number, country: any): string {
		return country?.country;
	}

	onCountryCodeSearchChange(searchTerm: string): void {
		this.countryCodeSearchTerm = searchTerm;
		this.filterCountryCodes();
	}

	clearCountryCodeSearch(event?: Event): void {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.countryCodeSearchTerm = "";
		this.filteredCountryCodes = this.countryCodes;
		this._changeDetectorRef.detectChanges();

		// Refocus the search input after clearing
		setTimeout(() => {
			if (this.countryCodeSearchInput?.nativeElement) {
				this.countryCodeSearchInput.nativeElement.focus();
			}
		}, 0);
	}

	private filterCountryCodes(): void {
		if (!this.countryCodeSearchTerm.trim()) {
			this.filteredCountryCodes = this.countryCodes;
		} else {
			const searchTerm = this.countryCodeSearchTerm.toLowerCase().trim();
			this.filteredCountryCodes = this.countryCodes.filter(
				(country) => country.code.toLowerCase().includes(searchTerm) || country.name.toLowerCase().includes(searchTerm)
			);
		}
	}

	onCountryCodeSelectOpened(): void {
		this.countryCodeSearchTerm = "";
		this.filteredCountryCodes = this.countryCodes;
		// Focus the search input after the select panel opens
		setTimeout(() => {
			if (this.countryCodeSearchInput?.nativeElement) {
				this.countryCodeSearchInput.nativeElement.focus();
			}
		}, 100);
	}

	onCountryCodeSelectClosed(): void {
		this.countryCodeSearchTerm = "";
		this.filteredCountryCodes = this.countryCodes;
		this.onCountryCodeChange();
	}

	// Country search methods
	onCountrySearchChange(searchTerm: string): void {
		this.countrySearchTerm = searchTerm;
		this.filterCountries();
	}

	clearCountrySearch(event?: Event): void {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.countrySearchTerm = "";
		this.filteredCountries = this.countries;
		this._changeDetectorRef.detectChanges();

		// Refocus the search input after clearing
		setTimeout(() => {
			if (this.countrySearchInput?.nativeElement) {
				this.countrySearchInput.nativeElement.focus();
			}
		}, 0);
	}

	private filterCountries(): void {
		if (!this.countrySearchTerm.trim()) {
			this.filteredCountries = this.countries;
		} else {
			const searchTerm = this.countrySearchTerm.toLowerCase().trim();
			this.filteredCountries = this.countries.filter(
				(country) => country.country.toLowerCase().includes(searchTerm) || country.name.toLowerCase().includes(searchTerm)
			);
		}
	}

	onCountrySelectOpened(): void {
		this.countrySearchTerm = "";
		this.filteredCountries = this.countries;
		// Focus the search input after the select panel opens
		setTimeout(() => {
			if (this.countrySearchInput?.nativeElement) {
				this.countrySearchInput.nativeElement.focus();
			}
		}, 100);
	}

	onCountrySelectClosed(): void {
		this.countrySearchTerm = "";
		this.filteredCountries = this.countries;
	}

	private _handleSignUpError(exception: HttpErrorResponse): void {
		const normalized: NormalizedApiError = this._apiErrorService.normalize(exception);

		setTimeout(() => {
			this.showError = true;

			this.alert = {
				message: this._translocoService.translate(normalized.userMessageKey),
				type: "error",
			};

			setTimeout(() => {
				this.showError = false;
				this.alert = null;
			}, 5000);
		}, 0);
	}

	signUp(): void {
		if (!this.project || this.signUpForm.invalid) return null;

		this.saving = true;

		dataLayer.push({
			clickId: `form_${this.project._id}`,
			event: "clickEvent",
			eventId: moment().format("HH:mm:ss"), // You can use this to identify different clicks if necessary.
		});

		this.alert = null;
		this.showError = false;

		// Get form values BEFORE disabling, as disabled controls don't appear in form.value
		const formValueBeforeDisable = { ...this.signUpForm.value };

		localStorage.setItem("signUpData", JSON.stringify(formValueBeforeDisable));

		this.signUpForm.disable();

		// Use getRawValue() to get all values including disabled controls
		// Or use the value we captured before disabling
		const formValue = formValueBeforeDisable;

		// Fix: Correct the typeof check and trim string values
		Object.keys(formValue).forEach((key) => {
			if (typeof formValue[key] !== "string") return;

			formValue[key] = formValue[key].trim();
		});

		// Ensure phone is digits only (remove any non-digits that might have been added)
		if (formValue.phone && typeof formValue.phone === "string") {
			formValue.phone = formValue.phone.replace(/\D/g, "");
		}

		// Handle fullName -> firstName/lastName conversion if needed
		// The backend can handle both, but if fullName exists and backend expects separate fields,
		// we should split it. However, the backend also converts 'name' to 'fullName' if needed.
		// For now, we'll ensure both firstName and lastName are sent if they exist in the form
		// Remove empty string values to avoid validation issues
		const signUpData: any = {
			project: this.project._id,
			projectFlow: this.projectFlow._id,
			language: this.language,
			location: this.location,
		};

		// Copy all form values, but remove undefined/empty strings
		Object.keys(formValue).forEach((key) => {
			const value = formValue[key];
			if (value !== undefined && value !== null && value !== "") {
				signUpData[key] = value;
			}
		});

		// Add device information if available
		if (this.deviceDetails) {
			signUpData.deviceInformation = {
				// Device capabilities
				touchSupported: this.deviceDetails.touchSupported,
				maxTouchPoints: this.deviceDetails.maxTouchPoints,
				hardwareConcurrency: this.deviceDetails.hardwareConcurrency,
				deviceMemory: this.deviceDetails.deviceMemory,
				// Device type
				isMobile: this.deviceDetails.isMobile,
				isTablet: this.deviceDetails.isTablet,
				isDesktop: this.deviceDetails.isDesktop,
				// Operating system
				operatingSystem: this.deviceDetails.operatingSystem,
				// Screen information
				screenResolution: this.deviceDetails.screenResolution,
				screenAvailableResolution: this.deviceDetails.screenAvailableResolution,
				colorDepth: this.deviceDetails.colorDepth,
				pixelDepth: this.deviceDetails.pixelDepth,
				devicePixelRatio: this.deviceDetails.devicePixelRatio,
				// Window dimensions
				innerWidth: this.deviceDetails.innerWidth,
				innerHeight: this.deviceDetails.innerHeight,
				outerWidth: this.deviceDetails.outerWidth,
				outerHeight: this.deviceDetails.outerHeight,
			};

			signUpData.browserInformation = {
				// Browser details
				userAgent: this.deviceDetails.userAgent,
				browserName: this.deviceDetails.browserName,
				browserVersion: this.deviceDetails.browserVersion,
				// Language settings
				language: this.deviceDetails.language,
				languages: this.deviceDetails.languages,
				// Browser capabilities
				cookiesEnabled: this.deviceDetails.cookiesEnabled,
				javaEnabled: this.deviceDetails.javaEnabled,
				onLine: this.deviceDetails.onLine,
				onlineStatus: this.deviceDetails.onlineStatus,
				geolocationSupported: this.deviceDetails.geolocationSupported,
				// Network information
				connectionEffectiveType: this.deviceDetails.connectionEffectiveType,
				connectionDownlink: this.deviceDetails.connectionDownlink,
				connectionRtt: this.deviceDetails.connectionRtt,
				// User preferences
				timezoneOffset: this.deviceDetails.timezoneOffset,
				prefersDarkMode: this.deviceDetails.prefersDarkMode,
				prefersReducedMotion: this.deviceDetails.prefersReducedMotion,
				// User-Agent Client Hints (if available)
				userAgentData: this.deviceDetails.userAgentData,
			};
		}

		this._passwordlessService.createAppRegistration(signUpData).subscribe({
			next: (v) => {
				this.saving = false;

				this.appRegistration = v?.data?.appRegistration;
				this.appRegistration.token = v?.data?.token;

				this._router.navigate(["/sign-up", this.project._id], {
					queryParams: { token: this.appRegistration.token },
					queryParamsHandling: "merge",
				});
			},
			error: (exception) => {
				this.saving = false;

				if (exception?.error?.code === "PaymentRequired") {
					this._smartEnrollService.insufficientCreditsTrigger();
					return;
				}

				this.signUpForm.enable();
				this.signUpForm.reset({ countryCode: this.location?.countryCode || "+1" });

				this._handleSignUpError(exception);
			},
		});
	}
}
