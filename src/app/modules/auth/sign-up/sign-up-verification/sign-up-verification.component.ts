import moment from "moment";
import { debounce } from "lodash";
import { interval, Subject, Subscription } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";

import {
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChanges,
	ViewChild,
	ViewEncapsulation,
} from "@angular/core";

import { FlexLayoutModule } from "@angular/flex-layout";
import { NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute } from "@angular/router";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";

import { CountriesService } from "app/modules/demo/countries.service";
import { KYCService } from "../../kyc.service";

import { AppRegistration, Project, ProjectFlow } from "../../project";

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	selector: "auth-sign-up-verification",
	standalone: true,
	styleUrls: ["../../sign-in/sign-in.scss"],
	templateUrl: "./sign-up-verification.component.html",
	imports: [
		CommonModule,
		FlexLayoutModule,
		MatButtonModule,
		MatChipsModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatProgressSpinnerModule,
		MatSelectModule,
		NgIf,
		ReactiveFormsModule,
		TranslocoModule,
	],
})
export class AuthSignUpVerificationComponent implements OnInit, OnChanges, OnDestroy {
	private _unsubscribeAll: Subject<any> = new Subject<any>();

	private countdownSubscription: Subscription;
	private _validatingPhone: boolean;
	private _validatingEmail: boolean;

	@ViewChild("otpNgForm") otpNgForm: NgForm;
	@ViewChild("emailNgForm") updateEmailNgForm: NgForm;
	@ViewChild("phoneNgForm") updatePhoneNgForm: NgForm;

	@Input("appRegistration") appRegistration: AppRegistration;
	@Input("project") project: Project;
	@Input("projectFlow") projectFlow: ProjectFlow;

	@Output("changeStep") readonly changeStep: EventEmitter<string> = new EventEmitter<string>();

	countries: Array<any>;
	currentValidation: any;
	deviceDetails: any;
	emailForm: UntypedFormGroup;
	emailGateway: string;
	endstep: boolean;
	errorContent: string;
	isVerifikProject: Boolean;
	loading: Boolean;
	location: any;
	otpForm: UntypedFormGroup;
	phoneForm: UntypedFormGroup;
	phoneGateway: string;
	remainingTime: string;
	selectedPhoneGateway: string;
	sendingOTP: Boolean = false;
	showSkipDoingKYC: boolean;
	step: string;
	syncResponse: any;
	token: string;
	update: boolean;
	showError: boolean = false;

	constructor(
		private _activatedRoute: ActivatedRoute,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countries: CountriesService,
		private _formBuilder: UntypedFormBuilder,
		private _KYCService: KYCService
	) {
		this.countries = this._countries.countryCodes;
	}

	ngOnInit(): void {
		this._activatedRoute.queryParams.subscribe((params) => {
			this.token = params?.token;
		});
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
		this.countdownSubscription?.unsubscribe();
	}

	ngOnChanges(changes: SimpleChanges): void {
		this._initForms();

		if (changes.project?.currentValue) {
			const steps = this.projectFlow.onboardingSettings.steps;
			const mandatorySteps = ["basicInformation", "document", "form", "liveness"];

			this.showSkipDoingKYC = !mandatorySteps.some((step) => steps[step] === "mandatory");

			if (steps.document === "skip" && steps.liveness === "skip") {
				this.endstep = true;
			}
		}

		if (changes.appRegistration?.currentValue) {
			debounce(() => this._initValidations())();
		}
	}

	private _confirmEmailValidation(): void {
		if (this._validatingEmail) return;

		if (!this.projectFlow.onboardingSettings.signUpForm.email || this.projectFlow.onboardingSettings.signUpForm.emailGateway === 'none') {
			return;
		}

		this._validatingEmail = true;

		this._KYCService.confirmEmailValidation(this.appRegistration.email, this.otpForm.value.otp).subscribe({
			next: (response) => {
				this.appRegistration.emailValidation = response.data;
			},
			error: (exception) => {
				this.otpForm.enable();
				this.otpNgForm.resetForm();

				this.showError = true;
				this.errorContent = exception?.error?.message;

				this.loading = false;
				this.sendingOTP = false;
				this.update = false;
				this._validatingEmail = false;
			},
			complete: () => {
				this._validatingEmail = false;

				this._initValidations();
			},
		});
	}

	private _confirmPhoneValidation(): void {
		if (this._validatingPhone) return;

		if (!this.projectFlow.onboardingSettings.signUpForm.phone || this.projectFlow.onboardingSettings.signUpForm.phoneGateway === 'none') {
			return;
		}

		this._validatingPhone = true;

		this._KYCService.confirmPhoneValidation(this.currentValidation.countryCode, this.currentValidation.phone, this.otpForm.value.otp).subscribe({
			next: (response) => {
				this.appRegistration.phoneValidation = response.data;
			},
			error: () => {
				this.otpForm.enable();
				this.otpNgForm.resetForm();

				this.loading = false;
				this.sendingOTP = false;
				this.update = false;
				this._validatingPhone = false;
			},
			complete: () => {
				this._validatingPhone = false;

				this._initValidations();
			},
		});
	}

	private _confirmValidation(): void {
		if (this.sendingOTP || this.loading) return;

		this.otpForm?.disable();

		if (this.currentValidation.email) {
			this._confirmEmailValidation();
		} else if (this.currentValidation.phone && this.selectedPhoneGateway !== "both") {
			this._confirmPhoneValidation();
		}
	}

	private _completeAppRegistration(): void {
		const { emailGateway, phoneGateway } = this.projectFlow.onboardingSettings.signUpForm;

		const emailStatus = this.appRegistration.emailValidation?.status;
		const phoneStatus = this.appRegistration.phoneValidation?.status;

		if (emailGateway !== "none" && emailStatus !== "validated") return;
		if (phoneGateway !== "none" && phoneStatus !== "validated") return;

		if (this.appRegistration.status === "ONGOING" || this.appRegistration.status === "STARTED") {
			this._syncAppRegistration("signUpForm", "ONGOING");
		}

		this.otpForm?.enable();
	}

	private _initEmailValidation(): void {
		if (this.sendingOTP) return;

		if (
			!this.projectFlow.onboardingSettings.signUpForm.email ||
			this.projectFlow.onboardingSettings.signUpForm.emailGateway === 'none'
		) return;

		if (this.appRegistration.emailValidation?.status === "validated") return;

		this.changeStep.next("verify_email");

		this.currentValidation = {
			_id: "new",
			email: this.appRegistration.email,
		};

		this.update = false;
		this.sendingOTP = true;

		this._KYCService.sendEmailValidation(this.appRegistration.email).subscribe({
			next: (response) => {
				this.currentValidation = response.data;

				this._initForms();
				this._startCountdown();
			},
			error: (exception) => {
				this.showError = true;
				this.errorContent = exception?.error?.message;

				this.loading = false;
				this.sendingOTP = false;

				this.otpForm?.enable();
			},
			complete: () => {
				this.loading = false;
				this.sendingOTP = false;

				this.otpForm?.enable();
			},
		});
	}

	private _initForms(): void {
		try {
			const emailFields = { email: [this.appRegistration?.email || "", [Validators.email, Validators.required]] };
			const otpFields = { otp: ["", [Validators.required]] };
			const phoneFields = {};

			phoneFields["countryCode"] = [this.location?.countryCode || "+1", [Validators.required]];
			phoneFields["phone"] = [this.appRegistration?.phone || "", [Validators.minLength(4), Validators.maxLength(15), Validators.required]];

			this.emailForm = this._formBuilder.group(emailFields);
			this.otpForm = this._formBuilder.group(otpFields);
			this.phoneForm = this._formBuilder.group(phoneFields);
		} catch (exception) {
			console.error({ exception });
		}
	}

	/**
	 * init phone validation
	 */
	private _initPhoneValidation(phoneGateway?: string): boolean {
		if (this.sendingOTP) return;

		if (
			!this.projectFlow.onboardingSettings.signUpForm.phone ||
			this.projectFlow.onboardingSettings.signUpForm.phoneGateway === 'none'
		) return;

		this.selectedPhoneGateway = phoneGateway || this.selectedPhoneGateway || this.projectFlow.onboardingSettings.signUpForm.phoneGateway;
		this.changeStep.next("verify_phone");

		if (this.appRegistration.phoneValidation?.status === "validated") return;
		if (this.appRegistration.countryCode === "-1") this.selectedPhoneGateway = "both";

		this.currentValidation = {
			_id: "new",
			countryCode: this.appRegistration.countryCode,
			phone: this.appRegistration.phone,
		};

		if (this.selectedPhoneGateway === "both") {
			this.loading = false;
			this.sendingOTP = false;
			this.update = false;

			return;
		}

		this.sendingOTP = true;

		this._KYCService.sendPhoneValidation(this.appRegistration.countryCode, this.appRegistration.phone, this.selectedPhoneGateway).subscribe({
			next: (response) => {
				this.currentValidation = response.data;

				this._initForms();
				this._startCountdown();

				this.otpForm?.enable();
			},
			error: (exception) => {
				this.showError = true;
				this.errorContent = exception?.error?.message;

				this.loading = false;
				this.sendingOTP = false;

				this.otpForm?.enable();
			},
			complete: () => {
				this.loading = false;
				this.sendingOTP = false;

				this.otpForm?.enable();
			},
		});

		return true;
	}

	private _initValidations(): void {
		this.otpForm?.disable();
		this.otpNgForm?.resetForm();

		this.loading = false;
		this.sendingOTP = false;
		this.update = false;
		this.countdownSubscription?.unsubscribe();
		this.remainingTime = "";
		this.update = false;

		this._initEmailValidation();
		this._initPhoneValidation();

		this._completeAppRegistration();
	}

	private _syncAppRegistration(step: string, status: string) {
		const promise = this._KYCService.syncAppRegistration(step, status);

		promise.subscribe({
			next: (response) => {
				this.currentValidation = null;
				this.syncResponse = response.data;
			},
			error: () => {},
			complete: () => {
				this.changeStep.next("complete");
			},
		});

		return promise;
	}

	private _startCountdown() {
		this.countdownSubscription?.unsubscribe();

		const expiresAt = new Date(moment().add(1, "second").format("YYYY-MM-DD HH:mm:ss")).getTime();

		const now = new Date().getTime();
		const distance = expiresAt - now;
		const seconds = Math.floor(distance / 1000);

		this.remainingTime = `${seconds}s`;

		this.countdownSubscription = interval(1000).subscribe(() => {
			const now = new Date().getTime();
			const distance = expiresAt - now;

			if (distance < 0) {
				this.remainingTime = "Expired";
				this.countdownSubscription.unsubscribe();

				return;
			}

			const seconds = Math.floor(distance / 1000);

			this.remainingTime = `${seconds}s`;
		});
	}

	canChooseAnotherOTPMethod(): Boolean {
		return (
			!this.update &&
			!this.loading &&
			!this.sendingOTP &&
			this.currentValidation?.phone &&
			this.projectFlow.onboardingSettings.signUpForm.phoneGateway === "both" &&
			this.selectedPhoneGateway !== "both"
		);
	}

	canSendOTP(): Boolean {
		return !this.sendingOTP && !this.loading && !this.update;
	}

	canResendOTP(): Boolean {
		return this.remainingTime === "Expired" && (this.currentValidation.email || this.selectedPhoneGateway !== "both");
	}

	canUpdateEmailOrPhone(): Boolean {
		return this.update && !this.loading && !this.emailForm.invalid;
	}

	checkSixDigits(): void {
		const isValid = Boolean(this.otpForm.value.otp?.length === 6);

		if (!isValid) return;

		this._confirmValidation();
	}

	chooseAnotherOTPMethod(): void {
		this.countdownSubscription?.unsubscribe();
		this.remainingTime = "";
		this.selectedPhoneGateway = "both";
	}

	onInput(event: Event) {
		const input = event.target as HTMLInputElement;

		input.value = input.value.replace(/[^0-9]/g, "");
	}

	removeSpacesFromEmail() {
		const emailFormControl = this.emailForm?.get("email");

		if (emailFormControl.value) {
			let cleanedEmail = emailFormControl.value.replace(/\s/g, "");

			if (cleanedEmail.includes("@") && cleanedEmail.indexOf("@") !== cleanedEmail.lastIndexOf("@")) {
				cleanedEmail = cleanedEmail.replace(/@/g, "");
			}

			emailFormControl.patchValue(cleanedEmail);
		}
	}

	removeSpacesFromPhone() {
		const phoneFormControl = this.phoneForm.get("phone");

		if (phoneFormControl.value) {
			const cleanedPhone = phoneFormControl.value.replace(/\s/g, "").replace(/\D/g, "");
			phoneFormControl.patchValue(cleanedPhone);
		}
	}

	resendOTP(): void {
		this._initValidations();
	}

	sendPhoneOTP(_event: Event, phoneGateway: string): void {
		this._initPhoneValidation(phoneGateway);
	}

	setUpdate() {
		this.showError = false;
		this.update = !this.update;
	}

	showResendElements(): boolean {
		return !this.update && !this.sendingOTP && !this.loading;
	}

	showCountdown(): Boolean {
		return !this.canResendOTP() && !!this.remainingTime;
	}

	updateEmail(): void {
		this.emailForm?.disable();

		this._KYCService
			.updateAppRegistration({
				_id: this.appRegistration._id,
				email: this.emailForm.value.email,
				replaceEmail: true,
			})
			.subscribe({
				next: (response) => {
					this.update = false;
					this.appRegistration.email = response.data.email;
					this.currentValidation.email = response.data.email;

					this._initValidations();
					this._changeDetectorRef.detectChanges();
				},
				error: (exception) => {
					this.showError = true;
					this.errorContent = exception?.error?.message;

					this.emailForm?.enable();
				},
				complete: () => {
					this.emailForm?.enable();
				}
			});
	}

	updatePhone(): void {
		this.phoneForm?.disable();

		this._KYCService
			.updateAppRegistration({
				_id: this.appRegistration._id,
				countryCode: this.phoneForm.value.countryCode,
				phone: this.phoneForm.value.phone,
				replacePhone: true,
			})
			.subscribe({
				next: (response) => {
					this.update = false;
					this.appRegistration.countryCode = response.data.countryCode;
					this.appRegistration.phone = response.data.phone;

					this.currentValidation.countryCode = response.data.countryCode;
					this.currentValidation.phone = response.data.phone;

					this._initValidations();
					this._changeDetectorRef.detectChanges();
				},
				error: (exception) => {
					this.showError = true;
					this.errorContent = exception?.error?.message;

					this.phoneForm?.enable();
				},
				complete: () => {
					this.phoneForm?.enable();
				}
			});
	}
}
