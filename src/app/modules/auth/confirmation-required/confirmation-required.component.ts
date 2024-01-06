import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { KYCService } from "../kyc.service";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { environment } from "environments/environment";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "../project";
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
@Component({
	selector: "auth-confirmation-required",
	templateUrl: "./confirmation-required.component.html",
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
	currentValidation: any;
	errorContent: any;
	remainingTime: string;
	loading: boolean;
	syncResponse: any;
	private countdownSubscription: Subscription;

	/**
	 * Constructor
	 */
	constructor(
		private _KYCService: KYCService,
		private _splashScreenService: FuseSplashScreenService,
		private _activatedRoute: ActivatedRoute,
		private _changeDetectorRef: ChangeDetectorRef,
		private _router: Router,
		private _formBuilder: UntypedFormBuilder
	) {
		this._splashScreenService.show();

		localStorage.removeItem("accessToken");
	}

	ngOnInit(): void {
		this._initForm();

		this._activatedRoute.params.subscribe((params) => {
			this.isVerifikProject = Boolean(params.id === environment.verifikProject);

			const token = this._router.url.split("?token=")[1];

			localStorage.setItem("accessToken", token);

			this._requestAppRegistration();
		});
	}

	_requestAppRegistration(): void {
		this._KYCService
			.getAppRegistration({
				populates: ["project", "projectFlow", "emailValidation", "phoneValidation"],
			})
			.subscribe({
				next: (response) => {
					this.appRegistration = response.data;

					this.project = new ProjectModel(this.appRegistration.project);

					this.projectFlow = new ProjectFlowModel(this.appRegistration.projectFlow);
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
				console.error({ exception });
			},
			complete: () => {},
		});
	}

	/**
	 * init phone validation
	 */
	_initPhoneValidation(): void {
		if (!["whatsapp", "sms", "both"].includes(this.projectFlow.onboardingSettings.signUpForm.phoneGateway)) return;

		if (this.appRegistration.phoneValidation?.status === "validated") return;

		if (this.loading) return;

		this.loading = true;

		this._splashScreenService.show();

		this._KYCService.sendPhoneValidation(this.appRegistration.countryCode, this.appRegistration.phone).subscribe({
			next: (response) => {
				this.currentValidation = response.data;

				this._linkValidation();

				this.startCountdown();

				this.loading = false;

				this._splashScreenService.hide();
			},
			complete: () => {
				this.loading = false;

				this._splashScreenService.hide();
			},
		});
	}

	_initForm(): void {
		this.otpForm = this._formBuilder.group({ otp: ["", [Validators.required]] });
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

		this.loading = true;

		this._splashScreenService.show();

		if (this.currentValidation.email) {
			this._confirmEmailValidation();
		} else if (this.currentValidation.phone) {
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
			},
			complete: () => {
				this.otpForm.reset();

				this.loading = false;

				this._splashScreenService.hide();

				this._initValidations();
			},
		});
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
		if (this.projectFlow.onboardingSettings.signUpForm.emailGateway === "mailgun" && !this.appRegistration.emailValidation) return;

		if (
			["whatsapp", "sms", "both"].includes(this.projectFlow.onboardingSettings.signUpForm.phoneGateway) &&
			!this.appRegistration.phoneValidation
		)
			return;

		if (this.loading) return;

		this._KYCService.syncAppRegistration("signUpForm").subscribe({
			next: (response) => {
				this.syncResponse = response.data;
			},
			error: () => {},
			complete: () => {},
		});
	}

	startKYC(): void {
		this._router.navigate(["/kyc"], { queryParams: { token: this.syncResponse.token } });
	}

	continueWitoutKYC(): void {
		const url = `${this.projectFlow.redirectUrl}/sign-in?type=onboarding&token=${this.syncResponse.token}`;

		window.location.href = url;
	}

	ngOnDestroy(): void {
		if (this.countdownSubscription) {
			this.countdownSubscription.unsubscribe();
		}
	}
}
