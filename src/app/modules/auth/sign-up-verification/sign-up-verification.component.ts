import moment from "moment";
import { interval, Subject, Subscription } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute, Router } from "@angular/router";

import { fuseAnimations } from "@fuse/animations";

import { TranslocoModule } from "@ngneat/transloco";

import { CountriesService } from "app/modules/demo/countries.service";
import { environment } from "environments/environment";

import { KYCService } from "../kyc.service";
import { AppRegistration, Project, ProjectFlow } from "../project";

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	selector: "auth-sign-up-verification",
	standalone: true,
	styleUrls: ["../sign-in/sign-in.scss", 'sign-up-verification.component.scss'],
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

	@ViewChild("otpNgForm") otpNgForm: NgForm;
	@ViewChild("emailNgForm") updateEmailNgForm: NgForm;
	@ViewChild("phoneNgForm") updatePhoneNgForm: NgForm;

    @Input("appRegistration") appRegistration: AppRegistration;
    @Input("project") project: Project;
    @Input("projectFlow") projectFlow: ProjectFlow;

	accessId: string;
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

    constructor(
		private _activatedRoute: ActivatedRoute,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countries: CountriesService,
		private _formBuilder: UntypedFormBuilder,
		private _KYCService: KYCService,
		private _router: Router,
	) {
		this.countries = this._countries.countryCodes;
	}

	ngOnInit(): void {
		this._activatedRoute.queryParams.subscribe((params) => {
			this.accessId = params?.accessId;
			this.token = params?.token;

			this._initValidations();
		});
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
		this.countdownSubscription?.unsubscribe();
	}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.project?.currentValue) {
			const steps = this.projectFlow.onboardingSettings.steps;
			const mandatorySteps = ["basicInformation", "document", "form", "liveness"];

			this.showSkipDoingKYC = !mandatorySteps.some((step) => steps[step] === "mandatory");

			if (steps.document === "skip" && steps.liveness === "skip") {
				this.endstep = true;
			}
        }

		if (changes.appRegistration?.currentValue) {
			this._initForms();
		}
    }

	private _confirmEmailValidation(): void {
		this._KYCService.confirmEmailValidation(this.appRegistration.email, this.otpForm.value.otp).subscribe({
			next: (response) => {
				this.appRegistration.emailValidation = response.data;
			},
			error: () => {
				this.otpForm.reset();
				this.loading = false;
			},
			complete: () => {
				this.otpForm.reset();
				this.loading = false;

				this._initValidations();
			},
		});
	}

	private _confirmPhoneValidation(): void {
		this._KYCService.confirmPhoneValidation(this.currentValidation.countryCode, this.currentValidation.phone, this.otpForm.value.otp).subscribe({
			next: (response) => {
				this.appRegistration.phoneValidation = response.data;
			},
			error: () => {
				this.otpForm.reset();
				this.loading = false;
			},
			complete: () => {
				this.otpForm.reset();
				this.loading = false;

				this._initValidations();
			},
		});
	}

	private _completeAppRegistration(): void {
		if (this.projectFlow.onboardingSettings.signUpForm.emailGateway === "mailgun" && this.appRegistration.emailValidation?.status !== "validated") {
			return;
		}

		if (
			["whatsapp", "sms", "both"].includes(this.projectFlow.onboardingSettings.signUpForm.phoneGateway) &&
			this.appRegistration.phoneValidation?.status !== "validated"
		) {
			return;
		}

		if (this.loading) return;

		this._syncAppRegistration("signUpForm", "ONGOING", "redirect");
	}

	private _initEmailValidation(): void {
		if (this.projectFlow.onboardingSettings.signUpForm.emailGateway !== "mailgun") return;
		if (this.appRegistration.emailValidation?.status === "validated") return;
		if (this.loading) return;

		this.loading = true;

		this._KYCService.sendEmailValidation(this.appRegistration.email).subscribe({
			next: (response) => {
				this.currentValidation = response.data;

				this._initForms();
				this._linkValidation();
				this._startCountdown();

				this.loading = false;
			},
			error: (exception) => {
				this.errorContent = exception.error;
			},
			complete: () => {},
		});
	}

	private _initForms(): void {
		try {
			const emailFields = { email: [this.appRegistration.email, [Validators.email, Validators.required]] };
			const otpFields = { otp: ["", [Validators.required]] };
			const phoneFields = {};

			phoneFields["countryCode"] = [this.location?.countryCode || "+1", [Validators.required]];
			phoneFields["phone"] = [this.appRegistration.phone, [Validators.required]];

			if (environment.production) {
				phoneFields["phone"][1].push(Validators.min(8), Validators.max(10));
			}

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
		this.selectedPhoneGateway = phoneGateway || this.selectedPhoneGateway || this.projectFlow.onboardingSettings.signUpForm.phoneGateway;

		if (this.appRegistration.countryCode === "-1") this.phoneGateway = "both";

		if (this.selectedPhoneGateway === "both" && !this.currentValidation) {
			this.currentValidation = !this.appRegistration.phoneValidation
				? {
						_id: "new",
						countryCode: this.appRegistration.countryCode,
						phone: this.appRegistration.phone,
				  }
				: this.appRegistration.phoneValidation?.status !== "validated"
				? this.appRegistration.phoneValidation
				: null;

			if (this.remainingTime) {
				this.remainingTime = '';
				this.countdownSubscription.unsubscribe();
			}
		}

		if (!["whatsapp", "sms"].includes(this.selectedPhoneGateway)) return;

		if (this.appRegistration.phoneValidation?.status === "validated") return;
		if (this.loading) return;

		this.loading = true;

		this._KYCService.sendPhoneValidation(this.appRegistration.countryCode, this.appRegistration.phone, this.selectedPhoneGateway).subscribe({
			next: (response) => {
				this.currentValidation = response.data;

				this._linkValidation();
				this._startCountdown();

				this.loading = false;
			},
			error: (exception) => {
				this.errorContent = exception.error;

				this.loading = false;
			},
			complete: () => {
				this.loading = false;
			},
		});

		return true;
	}

	private _initValidations(): void {
		this._initEmailValidation();
		this._initPhoneValidation();

		this._completeAppRegistration();
		this._changeDetectorRef.detectChanges();
	}

	private _linkValidation(): void {
		const data = {};

		if (this.currentValidation.email) {
			data["emailValidation"] = this.currentValidation._id;
			this.appRegistration.emailValidation = this.currentValidation;
		} else if (this.currentValidation.phone) {
			data["phoneValidation"] = this.currentValidation._id;
			this.appRegistration.phoneValidation = this.currentValidation;
		}

		this._KYCService.updateAppRegistration(data).subscribe({
			next: (response) => {
				// do something
			},
			error: (exception) => {
				console.error({ exception });
			},
			complete: () => {},
		});
	}

	private _syncAppRegistration(step: string, status: string, action: string) {
		const promise = this._KYCService.syncAppRegistration(step, status);

		promise.subscribe({
			next: (response) => {
				this.currentValidation = null;
				this.syncResponse = response.data;
			},
			error: () => {},
			complete: () => {
				if (status === "COMPLETED_WITHOUT_KYC" && action === "redirect") {
					let redirectUrl = this.projectFlow.redirectUrl;

					if (environment.verifikProject === this.project._id) {
						redirectUrl = `${environment.appUrl}/sign-in`;
					} else if (environment.sandboxProject === this.project._id) {
						redirectUrl = `${environment.sandboxUrl}/sign-in`;
					}

					window.location.href = `${redirectUrl}?type=onboarding&token=${this.syncResponse.token}`;
				}

				if (step === "instructions" && action === "redirect") {
					this._router.navigate(["/kyc"], { queryParams: { token: this.syncResponse.token } });
				}
			},
		});

		return promise;
	}

	private _startCountdown() {
		this.countdownSubscription?.unsubscribe();

		const expiresAt = new Date(moment().add(2, "minute").format("YYYY-MM-DD HH:mm:ss")).getTime();

		this.countdownSubscription = interval(1000).subscribe(() => {
			const now = new Date().getTime();
			const distance = expiresAt - now;

			if (distance < 0) {
				this.remainingTime = "Expired";
				this.countdownSubscription.unsubscribe();

				return;
			}

			const seconds = Math.floor((distance / 1000));

			this.remainingTime = `${seconds}s`;
		});
	}

	canSendOTP(): Boolean {
		return Boolean(!this.sendingOTP && !this.loading);
	}

	canResendOTP(): Boolean {
		return this.canSendOTP() && this.remainingTime === 'Expired';
	}

	canUpdateEmail(): Boolean {
		return this.update && !this.loading && !this.emailForm.invalid;
	}

	canUpdatePhone(): Boolean {
		return this.update && !this.loading && !this.phoneForm.invalid;
	}

	checkSixDigits(): void {
		const isValid = Boolean(this.otpForm.value.otp?.length === 6);

		if (!isValid) return;

		this.confirmValidation();
	}

	confirmValidation(): void {
		if (this.loading) return;

		this.loading = Boolean(this.currentValidation.email || (this.currentValidation.phone && this.selectedPhoneGateway !== "both"));

		if (this.currentValidation.email) {
			this._confirmEmailValidation();
		} else if (this.currentValidation.phone && this.selectedPhoneGateway !== "both") {
			this._confirmPhoneValidation();
		}
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

	resendOTP(): void {
		this._initValidations();
	}

	sendPhoneOTP(_event: Event, phoneGateway: string): void {
		this._initPhoneValidation(phoneGateway);
	}

	setUpdate() {
		this.update = !this.update;
	}

	updateEmail(): void {
		this._KYCService
			.updateAppRegistration({
				_id: this.appRegistration._id,
				email: this.emailForm.value.email,
				replaceEmail: true,
			})
			.subscribe((response) => {
				this.appRegistration.email = response.data.email;
				this.currentValidation.email = response.data.email;

				this._initValidations();
				this._changeDetectorRef.detectChanges();
			});
	}

	updatePhone(): void {
		this._KYCService
			.updateAppRegistration({
				_id: this.appRegistration._id,
				countryCode: this.phoneForm.value.countryCode,
				phone: this.phoneForm.value.phone,
				replacePhone: true,
			})
			.subscribe((response) => {
				this.appRegistration.countryCode = response.data.countryCode;
				this.appRegistration.phone = response.data.phone;

				this.currentValidation.countryCode = response.data.countryCode;
				this.currentValidation.phone = response.data.phone;

				this._initValidations();
				this._changeDetectorRef.detectChanges();
			});
	}
}