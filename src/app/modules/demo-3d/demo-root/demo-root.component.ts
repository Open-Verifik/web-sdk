import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from "@angular/forms";
import { CountriesService } from "app/modules/countries/countries.service";
import { FuseMediaWatcherService } from "@fuse/services/media-watcher";
import { Subject } from "rxjs";
import { skip, takeUntil } from "rxjs/operators";
import { DemoService } from "../demo.service";

import { BiometricService } from "app/modules/biometrics/biometric.service";
import { DemoBiometric } from "app/modules/biometrics/demo-biometric.module";
import { Biometric } from "app/modules/biometrics/biometric.module";
import { ProfilePreviewComponent } from "./profile-preview/profile-preview.component";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { environment } from "environments/environment";
import { TranslocoService } from "@ngneat/transloco";

@Component({
	selector: "app-demo-root",
	templateUrl: "./demo-root.component.html",
	styleUrls: ["./demo-root.component.scss"],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoRootComponent implements OnInit {
	private _unsubscribeAll: Subject<any> = new Subject<any>();
	private _biometric: DemoBiometric;
	biometricLoaded: Boolean;

	contactForm: FormGroup;
	countries: any;
	isScreenSmall: boolean;
	lgScreen: boolean;
	tabletMode: boolean;
	laptopMode: boolean;
	phoneMode: boolean;
	bigScreenMode: boolean;
	selectedFeature: any;
	// selectedFeature: any = 'ocr';
	currentStep: any = "start";
	// currentStep: any = 'end';
	baseColor: any = "#0036E7";
	mapSteps: any = ["start", "form", "select", "instructions", "facetec", "result", "end"];
	idScanCrops: any;
	scannedData: any;
	matchLevel: number;
	jsonData: any;
	previewDialog: any;
	maxMatchLevel: any;
	faceScan: any;
	idScan: any;
	currentImg: any;
	ageEstimate: any;
	qrText: string;
	intervalHideSnackBar: any;

	constructor(
		private _formBuilder: FormBuilder,
		private _fuseMediaWatcherService: FuseMediaWatcherService,
		private _changeDetectorRef: ChangeDetectorRef,
		public dialog: MatDialog,
		private translocoService: TranslocoService,
		private _countries: CountriesService,
		private _service: BiometricService,
		private _snackBar: MatSnackBar,
		private _demoService: DemoService
	) {
		// this.translocoService.setActiveLang("en");
		this._demoService.navigationHandler$.subscribe((result) => {
			if (result && result.hasToken) {
				this.loadBiometrics();
				this.currentStep = "select";
				this._changeDetectorRef.markForCheck();
			}
		});

		if (localStorage.accessToken) {
			this._demoService.getLead().subscribe(
				(lead) => {
					this.qrText = `${environment.redirectUrl + "demo/" + localStorage.accessTokenn}`;
					this.loadBiometrics();
					this.currentStep = "select";
					this._changeDetectorRef.markForCheck();
				},
				(error) => localStorage.removeItem("accessToken")
			);
		}

		this._changeDetectorRef.markForCheck();
		this.countries = this._countries.countryCodes;
		this.initForm();
	}

	loadBiometrics(): void {
		this._biometric = new DemoBiometric(this._service);

		this._biometric.isReady$
			.pipe(skip(1))
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((isSuccess) => {
				console.log({
					biometricsReady: isSuccess,
				});
			});

		this._biometric.session$
			.pipe(skip(1))
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((isSuccess) => {
				this.biometricLoaded = isSuccess;
				this._changeDetectorRef.detectChanges();
			});

		this._biometric.error$
			.pipe(skip(1))
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((error) => {
				this.biometricLoaded = false;
				this._biometric.startSession();
			});

		this._biometric.onboardingScan$
			.pipe(skip(1))
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((response) => {
				if (response.success) {
					//COMPLETED ALL SERVICES

					this.scannedData = response["details"]["documentData"]["userConfirmedValues"] ? {
								...response["details"]["documentData"]["userConfirmedValues"]["idInfo"],
								...response["details"]["documentData"]["userConfirmedValues"]["addressInfo"],
								...response["details"]["documentData"]["userConfirmedValues"]["userInfo"],
						  } : {
								...response["details"]["documentData"]["scannedValues"]["idInfo"],
								...response["details"]["documentData"]["scannedValues"]["addressInfo"],
								...response["details"]["documentData"]["scannedValues"]["userInfo"],
						  };

					this.matchLevel = response.details["matchLevel"];
					this.maxMatchLevel = response.details["maxMatchLevel"];
					this.jsonData = response;
					this.faceScan = response.enrollUrl || response.faceScanUrl;
					this.idScan = response.idScanUrl;

					this.changeStep("result");

					this._changeDetectorRef.markForCheck();
				}

				this.biometricLoaded = false;
				this._biometric.startSession();
			});

		this._biometric.auth$
			.pipe(skip(1))
			.pipe(takeUntil(this._unsubscribeAll))
			.subscribe((response) => {
				if (response.success) {
					//COMPLETED ALL SERVICES
					this.matchLevel = response.details["matchLevel"];
					this.maxMatchLevel = response.details["maxMatchLevel"];
					this.jsonData = response;
					this.faceScan = response.faceUrl || response.enrollUrl;
					// this.idScan = response.idScanUrl;
					this.ageEstimate = response.ageEstimateGroup;
					// this.screenStatus = 'ending'
					// this.step = 'finish'
					this.changeStep("result");
					this._changeDetectorRef.markForCheck();
				}

				this.biometricLoaded = false;
				this._biometric.startSession();
			});
	}

	ngOnInit(): void {
		this.idScanCrops = ["frontCrop", "backScan"];
		this.currentImg = {
			crop: this.idScanCrops[0],
			index: 0,
		};
		this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe(({ matchingAliases }) => {
			this.isScreenSmall = Boolean(!matchingAliases.includes("lg") && matchingAliases.includes("md"));
			this.lgScreen = matchingAliases.includes("lg");
			this.phoneMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && !matchingAliases.includes("sm"));
			this.tabletMode = Boolean(!matchingAliases.includes("lg") && !matchingAliases.includes("md") && matchingAliases.includes("sm"));
			this.laptopMode = Boolean(!matchingAliases.includes("lg") && matchingAliases.includes("md") && matchingAliases.includes("sm"));
			this.bigScreenMode = Boolean(matchingAliases.includes("lg") && matchingAliases.includes("md") && matchingAliases.includes("sm"));

			// Mark for check
			this._changeDetectorRef.markForCheck();
		});
	}

	startBiometric(): void {
		if (this.selectedFeature == "liveness") {
			this._biometric.startAuth();
			return;
		}

		this._biometric.startEnrollmentDocument();
	}

	profilePreviewDialog(object, part): boolean {
		this.previewDialog = this.dialog.open(ProfilePreviewComponent, {
			data: {
				document: {
					url: part != "none" ? object + part : object,
				},
				scan: "none",
			},
		});

		this.previewDialog.afterClosed().subscribe((result) => {
			if (result == "aceptar") {
			}
		});
		this._changeDetectorRef.markForCheck();

		return false;
	}

	initForm(): void {
		this.contactForm = this._formBuilder.group({
			companyName: [, [Validators.required]],
			name: [, [Validators.required]],
			website: [, [Validators.required]],
			jobFunction: [, [Validators.required]],
			email: [, [Validators.required, Validators.email]],
			countryCode: [, [Validators.required]],
			phone: [, [Validators.required, this.phoneNumberValidator()]],
            legalAgreement: [,[Validators.required]],
		});
	}

	changeSelection(data): void {
		this.selectedFeature = data;
		this._changeDetectorRef.markForCheck();
	}

	changeId(displacement): void {
		if (displacement === "back") {
			if (this.currentImg.index == 0) {
				this.currentImg = {
					crop: this.idScanCrops[this.idScanCrops.length - 1],
					index: this.idScanCrops.length - 1,
				};
				return;
			}
			this.currentImg = {
				crop: this.idScanCrops[this.currentImg.index - 1],
				index: this.currentImg.index - 1,
			};
			return;
		}
		if (displacement === "front") {
			if (this.currentImg.index == this.idScanCrops.length - 1) {
				this.currentImg = {
					crop: this.idScanCrops[0],
					index: 0,
				};
				return;
			}
			this.currentImg = {
				crop: this.idScanCrops[this.currentImg.index + 1],
				index: this.currentImg.index + 1,
			};
		}
	}

	changeStep(data): void {
		if (data === "select" && this.currentStep != "instructions") {
			this.reviewForm();
			return;
		}
		if (data === "instructions") {
			this._biometric.startSession();
		}

		this.currentStep = data;
		this._changeDetectorRef.markForCheck();
	}

	reviewForm(): Boolean {
		if (!this.contactForm.valid) {
			this.openSnackBar("required_inputs");
			return false;
		}

		this._demoService.postForm(this.contactForm.value).subscribe(
			(result) => {
				localStorage.setItem("accessToken", result.data.token);

				localStorage.setItem("expiresAt", result.data.tokenExpiresAt);

				if (result.data.token) {
					this.qrText = `${environment.redirectUrl + "demo/" + result.data.token}`;
					this.loadBiometrics();
                    // this.postToHubspot(this.contactForm.value);
					this.currentStep = "select";
					this._changeDetectorRef.markForCheck();
					return;
				}
				this.openSnackBar("Error!");
				// const token = result.data.token
			},
			(err) => {
				console.log({
					err,
				});
				this.openSnackBar(err.error.message);
			}
		);
	}

    postToHubspot(form):void{
        this._demoService.postHubspot({
            "fields":[
                {
                    "objectTypeId": "0-1",
                    "name": "company",
                    "value": form.companyName
                },
                {
                    "objectTypeId": "0-1",
                    "name": "firstname",
                    "value": form.names,
                },
                {
                    "objectTypeId": "0-1",
                    "name": "job_function",
                    "value": form.jobFunction
                },
                {
                    "objectTypeId": "0-1",
                    "name": "email",
                    "value": form.email
                },
                {   
                    "objectTypeId": "0-1",
                    "name": "phone",
                    "value": form.phone
                }
            ],
            // "context": {
            //   "hutk": ":hutk", // include this parameter and set it to the hubspotutk cookie value to enable cookie tracking on your submission
            //   "pageUri": "www.example.com/page",
            //   "pageName": "Example page"
            // },
            // "legalConsentOptions": {
            //   "consent": { // Include this object when GDPR options are enabled
            //     "consentToProcess": true,
            //     "text": "I agree to allow Example Company to store and process my personal data.",
            //     "communications": [
            //       {
            //         "value": true,
            //         "subscriptionTypeId": 999,
            //         "text": "I agree to receive marketing communications from Example Company."
            //       }
            //     ]
            //   }
            // }
        }).subscribe(result =>{
            console.log(result);
        })
    }

	changeDemo(): void {
		this.currentStep = "select";
		this.scannedData = undefined;
		this.matchLevel = undefined;
		this.maxMatchLevel = undefined;
		this.jsonData = undefined;
		this.faceScan = undefined;
		this.idScan = undefined;
		this._changeDetectorRef.markForCheck();
	}

	goToVk(): void {
		window.location.href = "https://auth.verifik.co/kyc/start/6332941ccde4f719d9c00f9e"; // Replace with the URL of the external webpage
	}

	talkToSales(): void {
		let url = "https://meetings.hubspot.com/lina-yepes";
		if (this.translocoService.getActiveLang() == "en") {
			url = "https://meetings.hubspot.com/johan-castellanos";
		}
		window.location.href = url;
	}

	openSnackBar(code: string) {
		const message = this.translocoService.translate(`errors.${code}`, {}) ?? code;
		this._snackBar.open(message);

		if (this.intervalHideSnackBar) {
			clearTimeout(this.intervalHideSnackBar);
		}

		this.intervalHideSnackBar = setTimeout(() => {
			this._snackBar.dismiss();
		}, 5000);
	}

    openConditions():void{
        window.open('https://docs.verifik.co/docs/terminos-condiciones/ftxz1gulcjg3y-manual-de-politicas-de-privacidad-y-procedimientos-para-la-proteccion-tratamiento-de-datos-personales-y-atencion-de-solicitudes-consultas-y-reclamos', '_blank')
    }

	phoneNumberValidator(): ValidatorFn {
		return (
			control: AbstractControl
		): {
			[key: string]: any;
		} | null => {
			const phoneNumberPattern = /^[0-9]{10}$/; // Assuming 10-digit phone number
			const isValid = phoneNumberPattern.test(control.value);
			return isValid
				? null
				: {
						invalidPhoneNumber: true,
				  };
		};
	}
}
