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
	ViewEncapsulation,
} from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { ActivatedRoute } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import moment from "moment";
import { interval, Subject, Subscription, takeUntil } from "rxjs";

import { DEFAULT_PHONE_COUNTRY_CODE } from "app/core/constants/phone-defaults";
import { ProjectFlow } from "app/core/classes/project-flow.class";
import { Project } from "app/core/classes/project.class";
import { OneTimePasswordInputComponent } from "app/core/components/one-time-password-input/one-time-password-input.component";
import { CountryCodeSelectComponent } from "app/core/components/country-code-select/country-code-select.component";
import { CountryService } from "app/core/services/country.service";
import { KYCService } from "../../kyc.service";
import { AppRegistration } from "../../project";
import { SmartEnrollService } from "../../smart-enroll/smart-enroll.service";
import { ApiErrorService } from "app/core/services/api-error.service";

@Component({
	animations: fuseAnimations,
	encapsulation: ViewEncapsulation.None,
	selector: "sign-up-verification",
	standalone: true,
	styleUrls: ["../../sign-in/sign-in.component.scss", "./sign-up-verification.component.scss"],
	templateUrl: "./sign-up-verification.component.html",
	imports: [
		CommonModule,
		FlexLayoutModule,
		FormsModule,
		MatButtonModule,
		MatChipsModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatProgressSpinnerModule,
		CountryCodeSelectComponent,
		MatSelectModule,
		NgIf,
		OneTimePasswordInputComponent,
		ReactiveFormsModule,
		TranslocoModule,
	],
})
export class SignUpVerificationComponent implements OnInit, OnChanges, OnDestroy {
	private countdownSubscription: Subscription;
	private unsubscriber$: Subject<void> = new Subject<void>();
	private _debounceTimer: any;

	private _validatingPhone: boolean;
	private _validatingEmail: boolean;
	private _validatingOTP: boolean;

	@Input("appRegistration") appRegistration: AppRegistration;
	@Input("project") project: Project;
	@Input("projectFlow") projectFlow: ProjectFlow;

	@Output("changeStep") readonly changeStep: EventEmitter<string> = new EventEmitter<string>();

	currentValidation: any;
	deviceDetails: any;
	emailOtp: string = "";
	emailForm: UntypedFormGroup;
	emailGateway: string;
	endstep: boolean;
	errorContent: string = "";
	isVerifikProject: Boolean;
	loading: Boolean;
	location: any;
	otpForm: UntypedFormGroup;
	phoneForm: UntypedFormGroup;
	phoneGateway: string;
	remainingTime: string;
	selectedPhoneGateway: string;
	sendingOTP: Boolean = false;
	showError: boolean = false;
	showSkipDoingKYC: boolean;
	step: string;
	syncResponse: any;
	token: string;
	update: boolean;

	constructor(
		private _activatedRoute: ActivatedRoute,
		private _apiErrorService: ApiErrorService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countryService: CountryService,
		private _formBuilder: UntypedFormBuilder,
		private _KYCService: KYCService,
		private _smartEnrollService: SmartEnrollService,
		private _translocoService: TranslocoService
	) {
		this.emailOtp = this._activatedRoute.snapshot.queryParams?.otp;
	}

	ngOnInit(): void {
		this._activatedRoute.queryParams.pipe(takeUntil(this.unsubscriber$)).subscribe((params) => {
			this.token = params?.token;
			this.emailOtp = params?.otp || "";
		});
	}

	ngOnDestroy(): void {
		clearTimeout(this._debounceTimer);
		this.countdownSubscription?.unsubscribe();

		this.unsubscriber$.next();
		this.unsubscriber$.complete();
	}

	ngOnChanges(changes: SimpleChanges): void {
		this._initForms();

		if (changes.project?.currentValue) {
			this._KYCService.setProjectData(this.project, this.projectFlow);

			const steps = this.projectFlow.onboardingSettings.steps;
			const mandatorySteps = ["basicInformation", "document", "form", "liveness"];

			this.showSkipDoingKYC = !mandatorySteps.some((step) => steps[step] === "mandatory");

			if (steps.document === "skip" && steps.liveness === "skip") {
				this.endstep = true;
			}
		}

		if (changes.appRegistration?.currentValue) {
			clearTimeout(this._debounceTimer);
			this._debounceTimer = setTimeout(() => {
				this._initValidations();
			}, 300);
		}
	}

	private _confirmEmailValidation(): void {
		if (this._validatingEmail) return;

		if (!this.projectFlow.onboardingSettings.signUpForm.email || this.projectFlow.onboardingSettings.signUpForm.emailGateway === "none") {
			return;
		}

		this.showError = false;
		this._validatingEmail = true;
		this.loading = true;

		this._KYCService.confirmEmailValidation(this.appRegistration.email, this.otpForm.value.otp).subscribe({
			next: (response) => {
				this.otpForm.reset();
				this.appRegistration.emailValidation = response.data;

				this.loading = false;
				this.sendingOTP = false;
				this._validatingEmail = false;
				this._validatingOTP = false;

				this._initValidations();
			},
			error: (exception) => {
				this.otpForm.enable();
				this.otpForm.setErrors({ invalidOTP: true });

				this.showError = true;
				this.errorContent = this._smartEnrollService.errorTranslation(`errors.${exception?.error?.message}`);

				this.loading = false;
				this.sendingOTP = false;
				this.update = false;
				this._validatingEmail = false;
				this._validatingOTP = false;
			},
		});
	}

	private _confirmPhoneValidation(): void {
		if (this._validatingPhone) return;

		if (!this.projectFlow.onboardingSettings.signUpForm.phone || this.projectFlow.onboardingSettings.signUpForm.phoneGateway === "none") {
			return;
		}

		this.showError = false;

		this._validatingPhone = true;

		this.loading = true;

		this._KYCService.confirmPhoneValidation(this.currentValidation.countryCode, this.currentValidation.phone, this.otpForm.value.otp).subscribe({
			next: (response) => {
				this.otpForm.reset();

				this.appRegistration.phoneValidation = response.data;

				this.loading = false;
				this.sendingOTP = false;
				this._validatingPhone = false;
				this._validatingOTP = false;

				this._initValidations();
			},
			error: () => {
				this.otpForm.enable();
				this.otpForm.reset();

				this.loading = false;
				this.sendingOTP = false;
				this.update = false;
				this._validatingPhone = false;
				this._validatingOTP = false;
			},
		});
	}

	private _confirmValidation(): void {
		if (this.sendingOTP || this.loading || this._validatingOTP) return;

		this._validatingOTP = true;

		this.otpForm?.disable();

		if (this.currentValidation.email) {
			this._confirmEmailValidation();
		} else if (this.currentValidation.phone && this.selectedPhoneGateway !== "both") {
			this._confirmPhoneValidation();
		}
	}

	private _completeAppRegistration(): void {
		const { emailGateway, phoneGateway, email, phone } = this.projectFlow.onboardingSettings.signUpForm;

		const emailStatus = this.appRegistration.emailValidation?.status;
		const phoneStatus = this.appRegistration.phoneValidation?.status;

		if (email && emailGateway !== "none" && emailStatus !== "validated") {
			return;
		}

		if (phone && phoneGateway !== "none" && phoneStatus !== "validated") {
			return;
		}

		if (this.appRegistration.status === "ONGOING" || this.appRegistration.status === "STARTED") {
			this._syncAppRegistration("signUpForm", "ONGOING");
		} else {
			this.changeStep.next("complete");
		}

		this.otpForm?.reset();
		this.otpForm?.enable();
	}

	private _initEmailValidation(): void {
		if (this.sendingOTP || this._validatingEmail) return;

		if (!this.projectFlow.onboardingSettings.signUpForm.email || this.projectFlow.onboardingSettings.signUpForm.emailGateway === "none") return;

		if (this.appRegistration.emailValidation?.status === "validated") return;

		this.changeStep.next("verify_email");

		const hasEmail = this.appRegistration.email && String(this.appRegistration.email).trim().length > 0;

		if (!hasEmail) {
			this.currentValidation = {
				_id: "new",
				email: "",
			};

			this._initForms();
			this.update = true;

			return;
		}

		this.currentValidation = {
			_id: "new",
			email: this.appRegistration.email,
		};

		if (this.emailOtp) {
			this.checkSixDigits();
			this.emailOtp = "";

			return;
		}

		this.update = false;
		this.sendingOTP = true;

		this._KYCService.sendAppRegistationEmailValidation(this.appRegistration.email).subscribe({
			next: (response) => {
				this.currentValidation = response.data;

				this._initForms();
				this._startCountdown();
			},
			error: (exception) => {
				if (exception?.error?.code === "PaymentRequired") {
					this._smartEnrollService.insufficientCreditsTrigger();
					return;
				}

				this.loading = false;
				this.sendingOTP = false;

				const statusCode = exception?.status || exception?.error?.statusCode || exception?.error?.status;
				const errorCode = exception?.error?.code || exception?.error?.message;

				if (statusCode === 404 || !hasEmail || errorCode === "NotFound" || errorCode === "EmailNotFound") {
					this.currentValidation = {
						_id: "new",
						email: this.appRegistration.email || "",
					};

					this._initForms();
					this.update = true;
					this.showError = false;
					this.errorContent = "";

					return;
				}

				this.showError = true;

				const normalizedError = this._apiErrorService.normalize(exception);
				this.errorContent = this._translocoService.translate(normalizedError.userMessageKey);

				this.otpForm?.enable();

				setTimeout(() => {
					this.showError = false;
					this.errorContent = "";

					this._startCountdown();
				}, 5000);
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
			const otpFields = { otp: [this.emailOtp, [Validators.required]] };

			const countryCode =
				this.appRegistration?.countryCode ||
				this.projectFlow?.signUpForm?.countryCode ||
				this.location?.countryCode ||
				DEFAULT_PHONE_COUNTRY_CODE;
			const phoneLength = this._countryService.getPhoneLengthForCountryCode(countryCode);

			const phoneFields = {
				countryCode: [countryCode, [Validators.required]],
				phone: [
					this.appRegistration?.phone || "",
					[Validators.required, Validators.minLength(phoneLength[0]), Validators.maxLength(phoneLength[1]), Validators.pattern(/^\d+$/)],
				],
			};

			this.emailForm = this._formBuilder.group(emailFields);
			this.otpForm = this._formBuilder.group(otpFields);
			this.phoneForm = this._formBuilder.group(phoneFields);

			this._subscribeToOtpChanges();
			this._subscribeToCountryCodeChanges();
		} catch (exception) {
			console.error({ exception });
		}
	}

	private _subscribeToCountryCodeChanges(): void {
		this.phoneForm
			.get("countryCode")
			?.valueChanges.pipe(takeUntil(this.unsubscriber$))
			.subscribe((countryCode) => {
				if (!countryCode) return;

				this._updatePhoneValidators(countryCode);
			});
	}

	private _updatePhoneValidators(countryCode: string): void {
		if (!this.phoneForm) return;

		const phoneLength = this._countryService.getPhoneLengthForCountryCode(countryCode);
		const phoneControl = this.phoneForm.get("phone");

		if (!phoneControl) return;

		phoneControl.setValidators([
			Validators.required,
			Validators.minLength(phoneLength[0]),
			Validators.maxLength(phoneLength[1]),
			Validators.pattern(/^\d+$/),
		]);

		phoneControl.updateValueAndValidity();
	}

	/**
	 * init phone validation
	 */
	private _initPhoneValidation(phoneGateway?: string): boolean {
		if (this.sendingOTP || this._validatingEmail || this._validatingPhone) return;

		if (!this.projectFlow.onboardingSettings.signUpForm.phone || this.projectFlow.onboardingSettings.signUpForm.phoneGateway === "none") return;

		if (this.appRegistration.phoneValidation?.status === "validated") return;

		this.selectedPhoneGateway = phoneGateway || this.selectedPhoneGateway || this.projectFlow.onboardingSettings.signUpForm.phoneGateway;
		this.changeStep.next("verify_phone");

		const hasPhone = this.appRegistration.phone && String(this.appRegistration.phone).trim().length > 0;
		const hasCountryCode = this.appRegistration.countryCode && String(this.appRegistration.countryCode).trim().length > 0;

		if (!hasPhone || !hasCountryCode) {
			this.currentValidation = {
				_id: "new",
				countryCode:
					this.appRegistration.countryCode ||
					this.projectFlow?.signUpForm?.countryCode ||
					this.location?.countryCode ||
					DEFAULT_PHONE_COUNTRY_CODE,
				phone: this.appRegistration.phone || "",
			};

			this._initForms();
			this.update = true;

			return;
		}

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

		this._KYCService
			.sendAppRegistrationPhoneValidation(this.appRegistration.countryCode, this.appRegistration.phone, this.selectedPhoneGateway)
			.subscribe({
				next: (response) => {
					this.currentValidation = response.data;

					this._initForms();
					this._startCountdown();

					this.otpForm?.enable();
				},
				error: (exception) => {
					if (exception?.error?.code === "PaymentRequired") {
						this._smartEnrollService.insufficientCreditsTrigger();

						return;
					}

					this.loading = false;
					this.sendingOTP = false;

					const statusCode = exception?.status || exception?.error?.statusCode || exception?.error?.status;
					const errorCode = exception?.error?.code || exception?.error?.message;

					if (statusCode === 404 || !hasPhone || !hasCountryCode || errorCode === "NotFound" || errorCode === "PhoneNotFound") {
						this.currentValidation = {
							_id: "new",
							countryCode:
								this.appRegistration.countryCode ||
								this.projectFlow?.signUpForm?.countryCode ||
								this.location?.countryCode ||
								DEFAULT_PHONE_COUNTRY_CODE,
							phone: this.appRegistration.phone || "",
						};

						this._initForms();
						this.update = true;
						this.showError = false;
						this.errorContent = "";

						return;
					}

					this.showError = true;

					const normalizedError = this._apiErrorService.normalize(exception);
					this.errorContent = this._translocoService.translate(normalizedError.userMessageKey);

					this.otpForm?.enable();

					setTimeout(() => {
						this.showError = false;
						this.errorContent = "";

						this._startCountdown();
					}, 5000);
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
		this.otpForm?.reset();

		this.loading = false;
		this.sendingOTP = false;
		this.update = false;
		this.countdownSubscription?.unsubscribe();
		this.remainingTime = "";
		this.update = false;

		this._initEmailValidation();

		this._initPhoneValidation();

		if (this._validatingEmail || this._validatingPhone) return;

		this._completeAppRegistration();
	}

	private _subscribeToOtpChanges(): void {
		this.otpForm.get("otp")?.valueChanges.pipe(takeUntil(this.unsubscriber$)).subscribe(this.checkSixDigits.bind(this));
	}

	private _syncAppRegistration(step: string, status: string) {
		this.loading = true;

		this._KYCService.syncAppRegistration(step, status).subscribe({
			next: (response) => {
				this.currentValidation = null;
				this.syncResponse = response.data;
			},
			error: () => {
				this.loading = false;
			},
			complete: () => {
				this.loading = false;
				this.changeStep.next("complete");
			},
		});
	}

	private _startCountdown() {
		this.countdownSubscription?.unsubscribe();

		const expiresAt = new Date(moment().add(2, "minutes").format("YYYY-MM-DD HH:mm:ss")).getTime();

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
		return this.remainingTime === "Expired" && (this.currentValidation.email || this.selectedPhoneGateway !== "both") && !this.update;
	}

	canUpdateEmailOrPhone(): Boolean {
		if (!this.update || this.loading) return false;

		if (this.currentValidation?.email && this.emailForm?.invalid) return false;
		if (this.currentValidation?.phone && this.phoneForm?.invalid) return false;

		return true;
	}

	checkSixDigits(): void {
		const otpValue = this.otpForm.get("otp")?.value || "";
		const isValid = Boolean(otpValue.length === 6);

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

	onCountryCodeChangeFromSelect(countryCode: string): void {
		if (!countryCode) return;

		this._updatePhoneValidators(countryCode);
	}

	preventInputFocus(event: InputEvent): void {
		event.stopPropagation();
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

		if (!phoneFormControl.value) return;

		const cleanedPhone = phoneFormControl.value.replace(/\s/g, "").replace(/\D/g, "");

		phoneFormControl.patchValue(cleanedPhone);
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
					this.showError = false;
					this.errorContent = "";
					this.appRegistration.email = response.data.email;

					this.currentValidation = null;

					this._initEmailValidation();
					this._changeDetectorRef.detectChanges();
				},
				error: (exception) => {
					this.showError = true;
					const normalizedError = this._apiErrorService.normalize(exception);
					this.errorContent = this._translocoService.translate(normalizedError.userMessageKey);

					this.emailForm?.enable();
				},
				complete: () => {
					this.emailForm?.enable();
				},
			});
	}

	updatePhone(): void {
		if (!this.phoneForm || this.phoneForm.invalid) return;

		const countryCode = this.phoneForm.value.countryCode;
		const phone = this.phoneForm.value.phone;

		if (!countryCode || !phone) {
			this.showError = true;
			this.errorContent = this._translocoService.translate("signup.phone_and_country_code_required");

			return;
		}

		this.phoneForm?.disable();

		this._KYCService
			.updateAppRegistration({
				_id: this.appRegistration._id,
				countryCode: countryCode,
				phone: phone,
				replacePhone: true,
			})
			.subscribe({
				next: (response) => {
					this.appRegistration.countryCode = response.data.countryCode || countryCode;
					this.appRegistration.phone = response.data.phone || phone;

					this.update = false;
					this.showError = false;
					this.errorContent = "";

					const phoneGateway = this.selectedPhoneGateway || this.projectFlow.onboardingSettings.signUpForm.phoneGateway || "sms";

					this.sendingOTP = true;
					this.loading = true;

					// Create a NEW phoneValidation (via insert endpoint) and link it to appRegistration
					// If no phoneValidation exists, this creates one; backend automatically links it
					this._KYCService.sendAppRegistrationPhoneValidation(countryCode, phone, phoneGateway).subscribe({
						next: (validationResponse) => {
							this.currentValidation = validationResponse.data;

							this._initForms();
							this._startCountdown();

							this.otpForm?.enable();
							this.loading = false;
							this.sendingOTP = false;
							this.update = false;

							this._changeDetectorRef.detectChanges();
						},
						error: (exception) => {
							if (exception?.error?.code === "PaymentRequired") {
								this._smartEnrollService.insufficientCreditsTrigger();
								return;
							}

							this.showError = true;
							const normalizedError = this._apiErrorService.normalize(exception);
							this.errorContent = this._translocoService.translate(normalizedError.userMessageKey);

							this.loading = false;
							this.sendingOTP = false;
							this.otpForm?.enable();
							this._changeDetectorRef.detectChanges();
						},
						complete: () => {
							this.loading = false;
							this.sendingOTP = false;
							this.otpForm?.enable();
							this._changeDetectorRef.detectChanges();
						},
					});
				},
				error: (exception) => {
					this.showError = true;
					const normalizedError = this._apiErrorService.normalize(exception);
					this.errorContent = this._translocoService.translate(normalizedError.userMessageKey);

					this.phoneForm?.enable();
				},
				complete: () => {
					this.phoneForm?.enable();
				},
			});
	}
}
