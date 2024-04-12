import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { KYCService } from "../kyc.service";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { environment } from "environments/environment";
import { ProjectFlowModel, ProjectModel } from "../project";
import { CommonModule, NgIf } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslocoModule } from "@ngneat/transloco";
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { FuseAlertComponent } from "@fuse/components/alert";
import { Subscription, interval } from "rxjs";
import moment from "moment";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { CountriesService } from "app/modules/demo/countries.service";
import { DemoService } from "app/modules/demo/demo.service";
@Component({
	selector: "auth-confirmation-required",
	templateUrl: "./confirmation-required.component.html",
	styleUrls: ["../sign-in/sign-in.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		FlexLayoutModule,
		RouterLink,
		NgIf,
		FuseAlertComponent,
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatIconModule,
		MatCheckboxModule,
		MatProgressSpinnerModule,
		TranslocoModule,
		CommonModule,
		MatSelectModule,
		LanguagesComponent,
	],
})
export class AuthConfirmationRequiredComponent implements OnInit, OnDestroy {
	@ViewChild("otpNgForm") otpNgForm: NgForm;
	@ViewChild("signUpNgForm") signUpNgForm: NgForm;
	isVerifikProject: Boolean;
	onboardingSettings: any;
	appRegistration: any;
	project: any;
	projectFlow: any;
	phoneGateway: string;
	emailGateway: string;
	emailValidation: any;
	phoneValidation: any;
	otpForm: UntypedFormGroup;
	phoneForm: UntypedFormGroup;
	currentValidation: any;
	errorContent: any;
	remainingTime: string;
	loading: boolean;
	syncResponse: any;
	sendingOTP: Boolean;
	activeSendOtp: boolean;
	private countdownSubscription: Subscription;
	token: string;
	showSkipDoingKYC: boolean;
	countries: Array<any>;
	location: any;
	deviceDetails: any;

	/**
	 * Constructor
	 */
	constructor(
		private _KYCService: KYCService,
		private _splashScreenService: FuseSplashScreenService,
		private _activatedRoute: ActivatedRoute,
		private _changeDetectorRef: ChangeDetectorRef,
		private _router: Router,
		private _formBuilder: UntypedFormBuilder,
		private _countries: CountriesService,
		private _demoService: DemoService
	) {
		this._splashScreenService.show();

		this.countries = this._countries.countryCodes;

		this.deviceDetails = this._demoService.getDeviceDetails();
	}

	ngOnInit(): void {
		this._activatedRoute.params.subscribe((params) => {
			this.token = this._router.url.split("?token=")[1];

			localStorage.setItem("accessToken", this.token);

			this._requestAppRegistration();
		});

		this._demoService.geoLocation$.subscribe({
			next: async (response) => {
				if (!response || this.location) return;

				this.location = await this._demoService.extractLocationFromLatLng(response.lat, response.lng);

				this.location.os = this.deviceDetails?.platform;
				this.location.type = "desktop";

				this.location.countryCode = this._countries.findCountryCode(this.location.country);
			},
			error: (exception) => {},
			complete: () => {},
		});
	}

	_requestAppRegistration(): void {
		this._KYCService
			.getAppRegistration({
				populates: ["project", "projectFlow", "emailValidation", "phoneValidation"],
			})
			.subscribe({
				next: (response) => {
					console.log({ appRegistration: this.appRegistration });

					this.appRegistration = response.data;

					this.project = new ProjectModel(this.appRegistration.project);

					this.projectFlow = new ProjectFlowModel(this.appRegistration.projectFlow);

					this._initForm();

					this.isVerifikProject = Boolean(
						this.project._id === environment.verifikProject || this.project._id === environment.sandboxProject
					);

					this.isVerifikProject = false;

					const steps = this.projectFlow.onboardingSettings.steps;

					const mandatorySteps = ["basicInformation", "document", "form", "liveness"];

					this.showSkipDoingKYC = !mandatorySteps.some((step) => steps[step] === "mandatory");

					console.log({ mandatorySteps, showSkipDoingKYC: this.showSkipDoingKYC });
				},
				error: (exception) => {
					this.errorContent = exception.error;

					this._splashScreenService.hide();
				},
				complete: () => {
					this._splashScreenService.hide();

					this._initValidations();
				},
			});
	}

	/**
	 *
	 */
	_initValidations(): void {
		// verify codes
		this.currentValidation = null;

		setTimeout(() => {
			this._initEmailValidation();

			this._initPhoneValidation();

			this._completeAppRegistration();

			this._changeDetectorRef.detectChanges();
		}, 500);
	}

	_initEmailValidation(): void {
		if (this.projectFlow.onboardingSettings.signUpForm.emailGateway !== "mailgun") return;

		if (this.appRegistration.emailValidation?.status === "validated") return;

		if (this.loading) return;

		this.loading = true;

		this._splashScreenService.show();

		this._KYCService.sendEmailValidation(this.appRegistration.email).subscribe({
			next: (response) => {
				this.currentValidation = response.data;

				this._linkValidation();

				this.startCountdown();

				this.loading = false;

				this._splashScreenService.hide();
			},
			error: (exception) => {
				this.errorContent = exception.error;

				this._splashScreenService.hide();
			},
			complete: () => {},
		});
	}

	/**
	 * init phone validation
	 */
	_initPhoneValidation(phoneGateway?: string): boolean {
		this.phoneGateway = phoneGateway || this.projectFlow.onboardingSettings.signUpForm.phoneGateway;

		if (this.appRegistration.countryCode === "-1") this.phoneGateway = "both";

		if (this.phoneGateway === "both" && !this.currentValidation) {
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
				this.remainingTime = null;

				this.countdownSubscription.unsubscribe();
			}
		}

		if (!["whatsapp", "sms"].includes(this.phoneGateway)) return;

		if (this.appRegistration.phoneValidation?.status === "validated") return;

		if (this.loading) return;

		this.loading = true;

		this._splashScreenService.show();

		this._KYCService.sendPhoneValidation(this.appRegistration.countryCode, this.appRegistration.phone, this.phoneGateway).subscribe({
			next: (response) => {
				this.currentValidation = response.data;

				this._linkValidation();

				this.startCountdown();

				this.loading = false;

				this._splashScreenService.hide();
			},
			error: (exception) => {
				this.errorContent = exception.error;

				this.loading = false;

				this._splashScreenService.hide();
			},
			complete: () => {
				this.loading = false;

				this._splashScreenService.hide();
			},
		});

		return true;
	}

	_initForm(): void {
		try {
			this.otpForm = this._formBuilder.group({ otp: ["", [Validators.required]] });

			const fields = {};

			fields["countryCode"] = [this.location?.countryCode || "+1", [Validators.required]];

			fields["phone"] = [this.appRegistration.phone, [Validators.required]];

			if (environment.production) {
				fields["phone"][1].push(Validators.min(8), Validators.max(10));
			}

			this.phoneForm = this._formBuilder.group(fields);
		} catch (exception) {
			console.error({ exception });
		}
	}

	private startCountdown() {
		if (this.countdownSubscription) this.countdownSubscription.unsubscribe();

		const expiresAt = new Date(moment().add(2, "minute").format("YYYY-MM-DD HH:mm:ss")).getTime();

		this.countdownSubscription = interval(1000).subscribe(() => {
			let now = new Date().getTime();

			let distance = expiresAt - now;

			if (distance < 0) {
				this.remainingTime = "Expired";

				this.countdownSubscription.unsubscribe();

				return;
			}

			let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

			let seconds = Math.floor((distance % (1000 * 60)) / 1000);

			this.remainingTime = `${minutes}m ${seconds}s`;
		});
	}

	onInput(event: Event) {
		const input = event.target as HTMLInputElement;

		input.value = input.value.replace(/[^0-9]/g, "");
	}

	checkSixDigits(): void {
		const isValid = Boolean(this.otpForm.value.otp?.length === 6);

		if (!isValid) return;

		this.confirmValidation();
	}

	confirmValidation(): void {
		if (this.loading) return;

		this.loading = Boolean(this.currentValidation.email || (this.currentValidation.phone && this.phoneGateway !== "both"));

		if (this.currentValidation.email) {
			this._splashScreenService.show();

			this._confirmEmailValidation();
		} else if (this.currentValidation.phone && this.phoneGateway !== "both") {
			this._splashScreenService.show();

			this._confirmPhoneValidation();
		}
	}

	_confirmEmailValidation(): void {
		this._KYCService.confirmEmailValidation(this.appRegistration.email, this.otpForm.value.otp).subscribe({
			next: (response) => {
				this.appRegistration.emailValidation = response.data;
			},
			error: (exception) => {
				this.otpForm.reset();

				this.loading = false;

				this._splashScreenService.hide();
			},
			complete: () => {
				this.otpForm.reset();

				this.loading = false;

				this._splashScreenService.hide();

				this._initValidations();
			},
		});
	}

	_confirmPhoneValidation(): void {
		this._KYCService.confirmPhoneValidation(this.currentValidation.countryCode, this.currentValidation.phone, this.otpForm.value.otp).subscribe({
			next: (response) => {
				this.appRegistration.phoneValidation = response.data;
			},
			error: (exception) => {
				this.otpForm.reset();

				this._splashScreenService.hide();

				this.loading = false;
			},
			complete: () => {
				this.otpForm.reset();

				this.loading = false;

				this._splashScreenService.hide();

				this._initValidations();
			},
		});
	}

	canSendOTP(): Boolean {
		return Boolean(!this.sendingOTP && !this.loading);
	}

	canUpdatePhone(): boolean {
		const isValid = Boolean(this.phoneForm.value.phone?.length >= 8 && this.phoneForm.value.countryCode);

		return isValid;
	}

	sendPhoneOTP(event, phoneGateway): void {
		this._initPhoneValidation(phoneGateway);
	}

	_linkValidation(): void {
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

	_completeAppRegistration(): void {
		if (this.projectFlow.onboardingSettings.signUpForm.emailGateway === "mailgun" && this.appRegistration.emailValidation?.status !== "validated")
			return;

		if (
			["whatsapp", "sms", "both"].includes(this.projectFlow.onboardingSettings.signUpForm.phoneGateway) &&
			this.appRegistration.phoneValidation?.status !== "validated"
		)
			return;

		if (this.loading) return;

		localStorage.setItem("accessToken", this.token);

		this._syncAppRegistration("signUpForm", "ONGOING", "redirect");
	}

	_syncAppRegistration(step: string, status: string, action: string) {
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

	startKYC(): void {
		this._syncAppRegistration("instructions", "ONGOING", "redirect");
	}

	continueWithoutKYC(): void {
		this._syncAppRegistration("skipKYC", "COMPLETED_WITHOUT_KYC", "redirect");
	}

	showUpdatePhoneCard(): void {
		if (this.currentValidation) {
			this.currentValidation.countryCode = "-1";
		}

		this._changeDetectorRef.detectChanges();
	}

	updatePhone(event): void {
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

	ngOnDestroy(): void {
		if (this.countdownSubscription) {
			this.countdownSubscription.unsubscribe();
		}
	}
}
