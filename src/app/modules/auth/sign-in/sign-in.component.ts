import { CommonModule, NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { fuseAnimations } from "@fuse/animations";
import { FuseAlertComponent, FuseAlertType } from "@fuse/components/alert";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { PasswordlessService } from "../passwordless.service";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "../project";
import { Subject } from "rxjs";
import { MatTabsModule } from "@angular/material/tabs";
import { environment } from "environments/environment";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { CountriesService } from "app/modules/demo/countries.service";
import { MatSelectModule } from "@angular/material/select";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import moment from "moment";
import { DemoService } from "app/modules/demo/demo.service";
import { LivenessDetectionComponent } from "app/modules/demo/liveness-detection/liveness-detection.component";
import { LivenessDetectionIOSComponent } from "app/modules/demo/liveness-detection-ios/liveness-detection-ios.component";
import { BiometricsLoginComponent } from "../biometrics-login/biometrics-login.component";

@Component({
	selector: "auth-sign-in",
	templateUrl: "./sign-in.component.html",
	styleUrls: ["./sign-in.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
		FlexLayoutModule,
		RouterLink,
		FuseAlertComponent,
		NgIf,
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatIconModule,
		MatCheckboxModule,
		MatSelectModule,
		MatProgressSpinnerModule,
		MatTabsModule,
		TranslocoModule,
		CommonModule,
		LanguagesComponent,
		LivenessDetectionComponent,
		LivenessDetectionIOSComponent,
		BiometricsLoginComponent,
	],
})
export class AuthSignInComponent implements OnInit, OnDestroy {
	alert: { type: FuseAlertType; message: string } = {
		type: "success",
		message: "",
	};
	showAlert: boolean = false;
	project: Project;
	projectFlow: ProjectFlow;
	kycProjectFlow: ProjectFlow;
	signInForm: FormGroup;
	countries: Array<any>;
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	emailSent: boolean;
	smsSent: boolean;
	emailValidation: any;
	phoneValidation: any;
	groupFields: any;
	typeLogin: string;
	activeSendOtp: boolean;
	biometricsReady: boolean;
	secondFactorData: any;
	secondFactorForm: any;
	showBiometrics: boolean;
	demoData: any;
	sendingOTP: Boolean;

	/**
	 * Constructor
	 */
	constructor(
		private _activatedRoute: ActivatedRoute,
		private _demoService: DemoService,
		private _formBuilder: UntypedFormBuilder,
		private _splashScreenService: FuseSplashScreenService,
		private _passwordlessService: PasswordlessService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countries: CountriesService
	) {
		this.countries = this._countries.countryCodes;

		this.showBiometrics = false;

		this._splashScreenService.show();

		this.demoData = this._demoService.getDemoData();

		this.sendingOTP = false;
	}

	/**
	 * On init
	 */
	ngOnInit(): void {
		this._activatedRoute.params.subscribe((params) => {
			this.requestProject(params.id);
		});
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
	}

	requestProject(projectId: string): void {
		this._passwordlessService.requestProject(projectId, "login").subscribe({
			next: (v) => {
				this.project = new ProjectModel({ ...v.data, type: "login" });

				this.projectFlow = this.project.currentProjectFlow;

				for (let index = 0; index < v.data.projectFlows.length; index++) {
					const projectFlow = v.data.projectFlows[index];

					if (projectFlow.type === "onboarding") this.kycProjectFlow = new ProjectFlowModel(projectFlow);
				}
			},
			error: (e) => {
				console.info({ errorHERE: e });
				if (e.error.code === "InternalServer") {
					alert("something went wrong, try  again");
				}

				this._splashScreenService.hide();
			},
			complete: () => {
				this.initForm();

				this._changeDetectorRef.markForCheck();

				this._splashScreenService.hide();
			},
		});
	}

	initForm(): void {
		// Create the form
		this.typeLogin = this.projectFlow.email ? "email" : "phone";

		this.buttonSendOtp();

		this.setFieldRequiredInForm();

		this._init2FAForm();
	}

	_init2FAForm(): void {
		this.secondFactorForm = this._formBuilder.group({
			authenticatorOTP: ["", [Validators.required, Validators.minLength(6)]],
		});
	}

	buttonSendOtp() {
		this.activeSendOtp = this.typeLogin === "email" ? this.projectFlow.email && !this.emailSent : this.projectFlow.phone && !this.smsSent;
	}

	setFieldRequiredInForm() {
		this.groupFields = {
			email: [,],
			emailOTP: [,],

			countryCode: [,],
			phone: [,],
			phoneOTP: [,],
		};

		switch (this.typeLogin) {
			case "email":
				this.groupFields["email"][1] = [Validators.required, Validators.email];
				this.groupFields["emailOTP"][1] = [Validators.minLength(6), Validators.maxLength(6)];
				break;

			case "phone":
				this.groupFields["countryCode"][1] = [Validators.required];
				this.groupFields["phone"][1] = [Validators.required, Validators.minLength(8)];
				this.groupFields["phoneOTP"][1] = [Validators.minLength(6), Validators.maxLength(6)];
				break;
		}

		this.signInForm = this._formBuilder.group(this.groupFields);
	}

	selectLogin(event) {
		this.groupFields = {};

		this.typeLogin = event.index ? "phone" : "email";

		this.setFieldRequiredInForm();

		this.buttonSendOtp();

		this._changeDetectorRef.markForCheck();
	}

	canSendOTP(): Boolean {
		return Boolean(!this.sendingOTP && this.activeSendOtp && this.signInForm.valid);
	}

	canUseBiometrics(): boolean {
		const isFormValid =
			this.typeLogin === "email"
				? Boolean(this.signInForm.value.email)
				: Boolean(this.signInForm.value.countryCode && this.signInForm.value.phone);

		return Boolean(isFormValid);
	}

	isFormValid(): boolean {
		const otpField = this.signInForm.value.phoneOTP || this.signInForm.value.emailOTP;

		return Boolean(this.signInForm.valid && otpField && otpField.length === 6);
	}

	onInput(event: Event) {
		const input = event.target as HTMLInputElement;

		input.value = input.value.replace(/[^0-9]/g, "");
	}

	checkSixDigits(field: string): void {
		if (!this.signInForm.value[field] || (this.signInForm.value[field] && this.signInForm.value[field].length !== 6) || this.signInForm.invalid)
			return;

		this.signIn();
	}

	_signInWithEmail(dataForm): void {
		this._passwordlessService
			.confirmEmailValidation(this.project._id, dataForm.email, dataForm.emailOTP, this.secondFactorForm.value.authenticatorOTP)
			.subscribe(
				(response) => {
					if (response.data.message) {
						this.secondFactorData = response.data;

						this.secondFactorData.emailOTP = dataForm.emailOTP;

						return;
					}

					return this.successLogin(response.data);
				},
				(err) => {
					console.log({
						err: err.error.message,
					});

					this.errorLogin(err.error.message);
				}
			);
	}

	_signInWithPhone(dataForm): void {
		this._passwordlessService
			.confirmPhoneValidation(
				this.project._id,
				dataForm.countryCode,
				dataForm.phone,
				dataForm.phoneOTP,
				this.secondFactorForm.value.authenticatorOTP
			)
			.subscribe(
				(response) => {
					if (!response.data) {
						return;
					}

					if (response.data.message) {
						this.secondFactorData = response.data;

						this.secondFactorData.phoneOTP = dataForm.phoneOTP;

						return;
					}

					return this.successLogin(response.data);
				},
				(err) => {
					this.errorLogin(err.error.message);
				}
			);
	}

	signIn(): void {
		const dataForm = this.signInForm.value;

		switch (this.typeLogin) {
			case "email":
				this._signInWithEmail(dataForm);

				break;
			case "phone":
				this._signInWithPhone(dataForm);

				break;
		}
	}

	successLogin(token: any) {
		const redirectUrl = Boolean(environment.sandboxProject === this.project._id) ? `${environment.appUrl}/sign-in` : this.projectFlow.redirectUrl;

		window.location.href = `${redirectUrl}?type=login&token=${token}`;
	}

	errorLogin(error: string) {
		this.alert = {
			type: "error",
			message: `login.${error}`,
		};

		this.showAlert = true;

		this._changeDetectorRef.detectChanges();

		setTimeout(() => {
			this.showAlert = false;

			this._changeDetectorRef.detectChanges();
		}, 10000);
	}

	sendOTP(event, gateway): void {
		event.preventDefault();

		this.sendingOTP = true;

		switch (this.typeLogin) {
			case "email":
				this._passwordlessService.sendEmailValidation(this.project._id, this.signInForm.value.email).subscribe({
					next: (response) => {
						this.emailValidation = response.data;

						this.emailSent = true;

						this.startTimer(this.typeLogin);

						this.sendingOTP = false;
					},
					error: (err) => {
						console.log({ err });

						this.errorLogin(err?.error?.message);

						this.sendingOTP = false;
					},
				});
				break;

			case "phone":
				this._passwordlessService
					.sendPhoneValidation(this.project._id, this.signInForm.value.countryCode, this.signInForm.value.phone, gateway)
					.subscribe(
						(response) => {
							this.phoneValidation = response.data;

							this.smsSent = true;

							this.startTimer(this.typeLogin);

							this.sendingOTP = false;
						},
						(err) => {
							this.errorLogin(err?.error?.message);

							this.sendingOTP = false;
						}
					);
				break;
		}
	}

	startTimer(field): number {
		let interval;

		switch (field) {
			case "email":
				if (!this.emailValidation) {
					return 0;
				}

				this.emailValidation.diff = moment(this.emailValidation.expiresAt).diff(moment.utc(), "seconds");

				interval = setInterval(() => {
					if (this.emailValidation.diff > 0) {
						this.emailValidation.diff--;
					} else {
						clearInterval(interval);

						this.emailSent = false;

						this.emailValidation = null;
					}
					this.buttonSendOtp();

					this._changeDetectorRef.detectChanges();
				}, 1000);

				break;

			case "phone":
				if (!this.phoneValidation) {
					return 0;
				}

				this.phoneValidation.diff = moment(this.phoneValidation.expiresAt).diff(moment.utc(), "seconds");

				interval = setInterval(() => {
					if (this.phoneValidation.diff > 0) {
						this.phoneValidation.diff--;
					} else {
						clearInterval(interval);

						this.smsSent = false;

						this.phoneValidation = null;
					}
					this.buttonSendOtp();

					this._changeDetectorRef.detectChanges();
				}, 1000);

				break;
		}
	}

	showBiometricsLogin(): void {
		this.showBiometrics = true;
	}

	createAccount(): void {
		window.location.href = `${environment.kycUrl}/kyc/project/${this.project._id}`;
	}
}
