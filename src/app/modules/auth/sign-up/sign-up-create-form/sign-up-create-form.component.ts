import moment from "moment";
import { Subject, takeUntil } from "rxjs";

import { CommonModule, NgIf } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { Router, RouterLink } from "@angular/router";

import { fuseAnimations } from "@fuse/animations";
import { FuseAlertType } from "@fuse/components/alert";

import { TranslocoModule } from "@ngneat/transloco";

import { DemoService } from "app/modules/demo/demo.service";
import { environment } from "environments/environment";

import { AppRegistration, Project, ProjectFlow } from "../../project";
import { CountriesService } from "app/modules/demo/countries.service";
import { PasswordlessService } from "../../passwordless.service";
import { SmartEnrollService } from "../../smart-enroll/smart-enroll.service";

declare let dataLayer: any; // Declare the dataLayer for pushing events to GTM.

@Component({
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    selector: "auth-sign-up-create-form",
    standalone: true,
    styleUrls: ["../../sign-in/sign-in.scss"],
    templateUrl: "./sign-up-create-form.component.html",
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        NgIf,
        ReactiveFormsModule,
        RouterLink,
        TranslocoModule,
    ],
})
export class AuthSignUpCreateFormComponent implements OnDestroy, OnChanges {
    @ViewChild("signUpNgForm") signUpNgForm: NgForm;

    @Input("location") location: any;
    @Input("project") project: Project;
    @Input("projectFlow") projectFlow: ProjectFlow;

    private unsubscriber$: Subject<void> = new Subject<void>();

    alert: { type: FuseAlertType; message: string } = {
        type: "success",
        message: "",
    };

    appRegistration: AppRegistration;
    countries: Array<any>;
    demoData: any;
    fields: any;
    hasLogin: Boolean = false;
    language: string;
    loginProjectFlow: ProjectFlow;
    onboardingSignUpForm: any;
    roles: Array<any>;
    showError: boolean = false;
    signUpForm: UntypedFormGroup;
    token: string;
    phoneLengthMapping = {
        "+507": 8, // Panama
        "+1": 10, // USA
        "+44": 10, // United Kingdom
        "+91": 10, // India
        "+81": 10, // Japan
        "+49": 11, // Germany
        "+33": 9, // France
        "+39": 10, // Italy
        "+86": 11, // China
        "+7": 10, // Russia
        "+55": 11, // Brazil
        "+61": 9, // Australia
        "+34": 9, // Spain
        "+82": 10, // South Korea
        "+62": 10, // Indonesia
        "+52": 10, // Mexico
        "+27": 9, // South Africa
        "+90": 10, // Turkey
        "+31": 9, // Netherlands
        "+46": 10, // Sweden
        "+63": 10, // Philippines
        "+54": 10, // Argentina
        "+56": 9, // Chile
        "+57": 10, // Colombia
        "+506": 8, // Costa Rica
        "+593": 9, // Ecuador
        "+503": 8, // El Salvador
        "+502": 8, // Guatemala
        "+504": 8, // Honduras
        "+595": 9, // Paraguay
        "+51": 9, // Peru
        "+598": 9, // Uruguay
        "+58": 10, // Venezuela
        // Add more country codes and their respective phone lengths here
    };

    /**
     * Constructor
     */
    constructor(
        private _countries: CountriesService,
        private _demoService: DemoService,
        private _formBuilder: UntypedFormBuilder,
        private _passwordlessService: PasswordlessService,
        private _router: Router,
        private _smartEnrollService: SmartEnrollService
    ) {
        this.countries = this._countries.countryCodes;
        this.fields = {};

        this.roles = [
            {
                label: "signup.roles.founder",
                code: "founder",
            },
            {
                label: "signup.roles.high_management",
                code: "high_management",
            },
            {
                label: "signup.roles.manager",
                code: "manager",
            },
            {
                label: "signup.roles.developer",
                code: "developer",
            },
            {
                label: "signup.roles.compliance",
                code: "compliance",
            },
            {
                label: "signup.roles.marketing",
                code: "marketing",
            },
            {
                label: "signup.roles.ciso",
                code: "ciso",
            },
        ];

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
                this.onboardingSignUpForm = this.projectFlow.onboardingSettings.signUpForm;

                this.initForm();
            } catch (exception) {
                console.error({ exception });
            }

            for (let index = 0; index < data.projectFlows.length; index++) {
                const projectFlow = data.projectFlows[index];

                if (projectFlow.status !== "active") continue;
                if (projectFlow.type === "login") this.hasLogin = true;
            }

            if (this.projectFlow.systemForm) {
                this._assignRoles(this.projectFlow.systemForm);
            }
        }
    }

    private _assignRoles(systemForm: ProjectFlow["systemForm"]): void {
        let roleField = null;

        for (let index = 0; index < systemForm.formFields.length; index++) {
            const formField = systemForm.formFields[index];

            if (formField.label === "role") {
                roleField = formField;

                break;
            }
        }

        if (!roleField) return;

        this.roles.length = 0;

        for (let index = 0; index < roleField.options.length; index++) {
            const option = roleField.options[index];

            this.roles.push({
                label: `signup.roles.${option}`,
                code: option,
            });
        }
    }

    private _generateRandomPhoneNumber = () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");

    initForm(): void {
        const r1 = environment.production ? 0 : Math.floor(Math.random() * this._demoService.sampleLastNames.length - 1) || 0;
        const r2 = environment.production ? 0 : Math.floor(Math.random() * this._demoService.sampleFirstNames.length - 1) || 0;

        const randomNumber = Math.floor(Math.random() * 1234567);

        const demoData = {
            fullName: environment.production ? "" : `${this._demoService.sampleFirstNames[r2]} ${this._demoService.sampleLastNames[r1]}`,
            firstName: environment.production ? "" : this._demoService.sampleFirstNames[r2],
            lastName: environment.production ? "" : this._demoService.sampleLastNames[r1],
            email: environment.production ? "" : `${this._demoService.sampleFirstNames[r2].toLowerCase()}_${randomNumber}@verifik.co`,
            phone: environment.production ? "" : this._generateRandomPhoneNumber(),
            countryCode: environment.production ? "+1" : "+1",
            company: environment.production ? "" : `company ${randomNumber}`,
            role: environment.production ? this.roles[1].code : this.roles[3].code,
            agreements: !Boolean(environment.production),
        };

        this.fields = {};

        if (this.onboardingSignUpForm && this.onboardingSignUpForm?.fullName && !this.onboardingSignUpForm?.firstName) {
            this.fields["fullName"] = [
                demoData.fullName,
                [Validators.required, Validators.maxLength(50), Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]+$")],
            ];
        }

        if (this.onboardingSignUpForm && this.onboardingSignUpForm?.firstName) {
            this.fields["firstName"] = [
                demoData.firstName,
                [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]+$")],
            ];

            this.fields["lastName"] = [
                demoData.lastName,
                [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern("^[a-zA-ZÀ-ÖØ-öø-ÿ\\s]+$")],
            ];
        }

        if (this.onboardingSignUpForm && this.onboardingSignUpForm?.email) {
            this.fields["email"] = [demoData.email, [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]];
        }

        if (this.onboardingSignUpForm && this.onboardingSignUpForm?.phone) {
            this.fields["countryCode"] = [this.location?.countryCode || demoData.countryCode, Validators.required];

            const countryCode = this.location?.countryCode || demoData.countryCode;
            const phoneLength = this.phoneLengthMapping[countryCode] || 10; // Default to 10 if not mapped

            this.fields["phone"] = [
                demoData.phone,
                [Validators.minLength(phoneLength), Validators.maxLength(phoneLength), Validators.required, Validators.pattern(/^\d+$/)],
            ];
        }

        if (this.onboardingSignUpForm && (this.onboardingSignUpForm?.showTermsAndConditions || this.onboardingSignUpForm?.showPrivacyNotice)) {
            this.fields["agreements"] = ["", Validators.requiredTrue];
        }

        if (this.onboardingSignUpForm && Array.isArray(this.onboardingSignUpForm?.extraFields)) {
            for (const field of this.onboardingSignUpForm?.extraFields) {
                this.fields[field] = [demoData[field] || "", Validators.required];
            }
        }

        // Create the form
        this.signUpForm = this._formBuilder.group(this.fields);
        this.signUpForm.valueChanges.pipe(takeUntil(this.unsubscriber$)).subscribe(() => {
            this.showError = false;
            this.alert = null;
        });
    }

    isFormDisabled(): boolean {
        return Boolean(this.signUpForm?.invalid || (this.signUpForm?.value.agreements !== undefined && !this.signUpForm?.value.agreements));
    }

    preventInputFocus(event: InputEvent): void {
        event.stopPropagation();
    }

    removeSpacesFromEmail() {
        const emailFormControl = this.signUpForm?.get("email");

        if (emailFormControl.value) {
            let cleanedEmail = emailFormControl.value.replace(/\s/g, "");

            if (cleanedEmail.includes("@") && cleanedEmail.indexOf("@") !== cleanedEmail.lastIndexOf("@")) {
                cleanedEmail = cleanedEmail.replace(/@/g, "");
            }

            emailFormControl.patchValue(cleanedEmail);
        }
    }

    removeSpacesFromPhone() {
        const phoneFormControl = this.signUpForm.get("phone");
        const countryCodeFormControl = this.signUpForm.get("countryCode");

        if (phoneFormControl.value) {
            const cleanedPhone = phoneFormControl.value.replace(/\s/g, "").replace(/\D/g, "");
            phoneFormControl.patchValue(cleanedPhone);

            if (countryCodeFormControl?.value) {
                const phoneLength = this.phoneLengthMapping[countryCodeFormControl.value] || 10; // Default to 10 if not mapped
                phoneFormControl.setValidators([
                    Validators.minLength(phoneLength),
                    Validators.maxLength(phoneLength),
                    Validators.required,
                    Validators.pattern(/^\d+$/),
                ]);

                phoneFormControl.updateValueAndValidity();
            }
        }
    }

    signUp(): void {
        if (!this.project || this.signUpForm.invalid) return null;

        dataLayer.push({
            event: "clickEvent",
            clickId: `form_${this.project._id}`,
            eventId: moment().format("HH:mm:ss"), // You can use this to identify different clicks if necessary.
        });

        this.signUpForm.disable();
        this.showError = false;
        this.alert = null;

        localStorage.setItem("signUpData", JSON.stringify(this.signUpForm.value));

        Object.keys(this.signUpForm.value).forEach((key) => {
            if (this.signUpForm.value !== typeof "string") return;

            this.signUpForm.value[key] = this.signUpForm.value[key].trim();
        });

        this._passwordlessService
            .createAppRegistration({
                project: this.project._id,
                projectFlow: this.projectFlow._id,
                language: this.language,
                location: this.location,
                ...this.signUpForm.value,
            })
            .subscribe({
                next: (v) => {
                    this.appRegistration = v?.data?.appRegistration;
                    this.appRegistration.token = v?.data?.token;
                },
                error: (exception) => {
                    this.signUpForm.enable();
                    this.signUpNgForm.resetForm({ countryCode: this.location?.countryCode || "+1" });

                    setTimeout(() => {
                        this.showError = true;
                        this.alert = {
                            type: "error",
                            message:
                                exception.error?.message === "phone, email, projectFlow must be unique"
                                    ? this._smartEnrollService.errorTranslation("errors.phone_or_email_is_not_unique")
                                    : this._smartEnrollService.errorTranslation(`errors.${exception.error?.message}`),
                        };
                    });
                },
                complete: () => {
                    this._router.navigate(["/sign-up", this.project._id], {
                        queryParams: { token: this.appRegistration.token },
                        queryParamsHandling: "merge",
                    });
                },
            });
    }
}
