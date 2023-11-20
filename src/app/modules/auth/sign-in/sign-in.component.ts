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
import { AuthService } from "app/core/auth/auth.service";
import { PasswordlessService } from "../passwordless.service";
import { Project, ProjectFlow, ProjectFlowModel, ProjectModel } from "../project";
import { Subject } from "rxjs";
import { MatTabsModule } from "@angular/material/tabs";
import { environment } from "environments/environment";
import { TranslocoModule } from "@ngneat/transloco";
import { CountriesService } from "app/modules/demo/countries.service";
import { MatSelectModule } from "@angular/material/select";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";

@Component({
	selector: "auth-sign-in",
	templateUrl: "./sign-in.component.html",
	styleUrls: ["./sign-in.scss"],
	encapsulation: ViewEncapsulation.None,
	animations: fuseAnimations,
	standalone: true,
	imports: [
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
	],
})
export class AuthSignInComponent implements OnInit, OnDestroy {
	@ViewChild("signInNgForm") signInNgForm: NgForm;

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

	/**
	 * Constructor
	 */
	constructor(
		private _activatedRoute: ActivatedRoute,
		private _authService: AuthService,
		private _formBuilder: UntypedFormBuilder,
		private _router: Router,
		private _splashScreenService: FuseSplashScreenService,
		private _passwordlessService: PasswordlessService,
		private _changeDetectorRef: ChangeDetectorRef,
		private _countries: CountriesService
	) {
		this.countries = this._countries.countryCodes;

		console.log({ countries: this.countries });

		this._splashScreenService.show();
	}

	/**
	 * On init
	 */
	ngOnInit(): void {
		this._activatedRoute.params.subscribe((params) => {
			console.log({ params });

			this.requestProject(params.id);
		});
	}

	ngOnDestroy(): void {
		this._unsubscribeAll.next(null);
	}

	requestProject(projectId: string): void {
		this._passwordlessService.requestProject(projectId, "login").subscribe({
			next: (v) => {
				this.project = new ProjectModel(v.data);
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
				this.groupFields["emailOTP"][1] = [Validators.minLength(6)];
				break;

			case "phone":
				this.groupFields["countryCode"][1] = [Validators.required];
				this.groupFields["phone"][1] = [Validators.required, Validators.minLength(8)];
				this.groupFields["phoneOTP"][1] = [Validators.minLength(6)];
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

	canSendOTP() {
		return this.activeSendOtp && this.signInForm.valid;
	}

	canUseBiometrics(): boolean {
		const isFormValid =
			this.typeLogin === "email"
				? Boolean(this.signInForm.value.email)
				: Boolean(this.signInForm.value.countryCode && this.signInForm.value.phone);

		return Boolean(isFormValid);
	}

	/**
	 * Sign in
	 */
	signIn(): void {
		// Return if the form is invalid
		if (this.signInForm.invalid) {
			return;
		}

		// Disable the form
		this.signInForm.disable();

		// Hide the alert
		this.showAlert = false;

		// Sign in
		this._authService.signIn(this.signInForm.value).subscribe(
			() => {
				// Set the redirect url.
				// The '/signed-in-redirect' is a dummy url to catch the request and redirect the user
				// to the correct page after a successful sign in. This way, that url can be set via
				// routing file and we don't have to touch here.
				const redirectURL = this._activatedRoute.snapshot.queryParamMap.get("redirectURL") || "/signed-in-redirect";

				// Navigate to the redirect url
				this._router.navigateByUrl(redirectURL);
			},
			(response) => {
				// Re-enable the form
				this.signInForm.enable();

				// Reset the form
				this.signInNgForm.resetForm();

				// Set the alert
				this.alert = {
					type: "error",
					message: "Wrong email or password",
				};

				// Show the alert
				this.showAlert = true;
			}
		);
	}

	successLogin(token: any) {
		const redirectUrl = environment.production ? this.projectFlow.redirectUrl : `${environment.appUrl}/sign-in`;

		window.location.href = `${redirectUrl}?type=login&token=${token}`;
	}

	errorLogin(error: string) {
		this.alert = {
			type: "error",
			message: error,
		};

		console.log({
			errorLogin: error,
		});

		this.showAlert = true;

		this._changeDetectorRef.detectChanges();

		setTimeout(() => {
			this.showAlert = false;

			this._changeDetectorRef.detectChanges();
		}, 10000);
	}
}
