import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    ElementRef,
    ViewChild
} from "@angular/core";
import {
    FormBuilder,
    FormGroup,
    Validators,
    ValidatorFn,
    AbstractControl
} from "@angular/forms";
import {
    CountriesService
} from "app/modules/countries/countries.service";
import {
    FuseMediaWatcherService
} from "@fuse/services/media-watcher";
import {
    Subject
} from "rxjs";
import {
    skip,
    takeUntil
} from "rxjs/operators";
import {
    DemoService
} from "../demo.service";

import {
    BiometricService
} from "app/modules/biometrics/biometric.service";
import {
    DemoBiometric
} from "app/modules/biometrics/new-demo-biometric.module";
import {
    Biometric
} from "app/modules/biometrics/biometric.module";
import {
    ProfilePreviewComponent
} from "./profile-preview/profile-preview.component";
import {
    MatDialog
} from "@angular/material/dialog";
import {
    MatSnackBar
} from "@angular/material/snack-bar";
import {
    environment
} from "environments/environment";
import {
    TranslocoService
} from "@ngneat/transloco";
import { ActivatedRoute } from "@angular/router";

@Component({
    selector: "app-demo-root",
    templateUrl: "./demo-root.component.html",
    styleUrls: ["./demo-root.component.scss"],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoRootComponent implements OnInit {
    private _unsubscribeAll: Subject < any > = new Subject < any > ();
    @ViewChild('myDiv') myDiv: ElementRef;
    private _biometric: DemoBiometric;
    biometricsReady: Boolean;

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
    // currentStep: any = 'result';
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
    response: any;

    constructor(
        private _formBuilder: FormBuilder,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
        private translocoService: TranslocoService,
        private _countries: CountriesService,
        private _service: BiometricService,
        private _snackBar: MatSnackBar,
        private _demoService: DemoService,
        private route: ActivatedRoute
    ) {
        this.translocoService.setActiveLang("es");
        // this.init();
        this._demoService.navigationHandler$.subscribe((result) => {
            if (result && result.hasToken) {
                this.loadBiometrics();
                this.currentStep = "select";
                this._changeDetectorRef.markForCheck();
            }
        });
        this._changeDetectorRef.markForCheck();
    }

    init():void{
        if(this.selectedFeature === 'ocr'){
            const response = {
                "idScanUrl": "https://app.verifik.co/api/idCheckImage?tid=a8775295-c9b8-473d-806e-acacc9159809&idCheckImageType=",
                details:{"documentData": {
                    "templateInfo": {
                      "templateName": "Mexico - ID Card (Voter) Fronside - 2020_UC - Horizontal",
                      "templateType": "Government Issued Photo ID"
                    },
                    "scannedValues": {
                      "userInfo": {
                        "firstName": "ANGEL",
                        "dateOfBirth": "29/10/1993",
                        "lastName": "ORTIZ OLIVERA"
                      },
                      "idInfo": {
                        "idNumber": "OROLAN93102920H300",
                        "idNumber2": "OI0A931029HOCRLN00",
                        "dateOfExpiration": "2032"
                      },
                      "addressInfo": {
                        "address1": "CHORTENCIA FRACC HEROICA JARDINES CIUDAD 17 DEL DHUAJUAPAN SUR 69007 DLEON, A"
                      },
                      "secondaryUserInfo": {
                        "sex": ""
                      }
                    },
                    "userConfirmedValues": {
                      "userInfo": {
                        "firstName": "ANGEL",
                        "dateOfBirth": "29/10/1993",
                        "lastName": "ORTIZ OLIVERA"
                      },
                      "idInfo": {
                        "idNumber": "OROLAN93102920H300",
                        "idNumber2": "OI0A931029HOCRLN00",
                        "dateOfExpiration": "2032"
                      },
                      "addressInfo": {
                        "address1": "CHORTENCIA FRACC HEROICA JARDINES CIUDAD 17 DEL DHUAJUAPAN SUR 69007 DLEON, A"
                      },
                      "secondaryUserInfo": {
                        "sex": ""
                      }
                    }
                }}
            }
            this.scannedData = response["details"]["documentData"]["userConfirmedValues"] ? {
                ...response["details"]["documentData"]["userConfirmedValues"]["idInfo"],
                ...response["details"]["documentData"]["userConfirmedValues"]["addressInfo"],
                ...response["details"]["documentData"]["userConfirmedValues"]["userInfo"],
            } : {
                ...response["details"]["documentData"]["scannedValues"]["idInfo"],
                ...response["details"]["documentData"]["scannedValues"]["addressInfo"],
                ...response["details"]["documentData"]["scannedValues"]["userInfo"],
            };

            this.jsonData = response;
            this.idScan = response.idScanUrl;
            console.log(this.scannedData);
            this._changeDetectorRef.markForCheck();
        }
        if(this.selectedFeature === 'liveness'){
            const response ={
                "faceUrl": "https://app.verifik.co/api/liveness/image?tid=db071b13-e6af-4153-8ffb-bd3ad3a8fc01",
                details:{
                    "externalDatabaseRefID": "61a6dbaae72e2ab4fbb4dee9-64c83c8c734d534cbf683ba0",
                    "retryScreenEnumInt": 0,
                    "platformTypeEnumInt": 2,
                    "deviceSDKVersion": "9.6.34",
                    "scanResultBlob": "AAEAAABTAAAAAAAAAPpLSb641k5JrnD+UxmDXGuivFpBw2koHmVEyaFy8B7coneWcl+XP1dILJYtM7z42/Uq3SkuIrfSui7IY9HoKB5i+XXwyjRhjTKoJSYNQ+nnIKro",
                    "isLikelyOnFraudList": false,
                    "isLikelyDuplicate": false,
                    "enrollForSearchAllUserListResult": false,
                    "ageV2GroupEnumInt": 5,
                    "ageEstimateGroupEnumInt": 4,
                    "ageEstimateGroupV2EnumInt": 5,
                    "success": true,
                    "wasProcessed": true,
                },
                "ageEstimateGroup": "Age Over 16",
            }

            this.matchLevel = response.details["matchLevel"];
                    this.maxMatchLevel = response.details["maxMatchLevel"];
                    this.jsonData = response;
                    this.faceScan = response.faceUrl ;
                    // this.idScan = response.idScanUrl;
                    this.ageEstimate = response.ageEstimateGroup;
                    console.log(this.jsonData)
                    this._changeDetectorRef.markForCheck();
        }
    }

    loadBiometrics(): void {
        this._biometric = new DemoBiometric(this._service);

        this._biometric.isReady$
            .pipe(skip(1))
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((isSuccess) => {
                console.log({success:isSuccess});
                this.biometricsReady = isSuccess
            });

        this._biometric.error$
            .pipe(skip(1))
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((error) => {
                console.log({error: error})
                this.biometricsReady = this._biometric.getStatus()
                this._changeDetectorRef.markForCheck();

            });

        this._biometric.onboardingScan$
            .pipe(skip(1))
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                console.log({response: response})
                this.biometricsReady = this._biometric.getStatus()
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
                }
                this._changeDetectorRef.markForCheck();
            });

        this._biometric.auth$
            .pipe(skip(1))
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                this.biometricsReady = this._biometric.getStatus()
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
                this._changeDetectorRef.markForCheck();
            });
    }

    ngOnInit(): void {
        this.idScanCrops = ["frontCrop", "backScan"];
        this.currentImg = {
            crop: this.idScanCrops[0],
            index: 0,
        };
        this._fuseMediaWatcherService.onMediaChange$.pipe(takeUntil(this._unsubscribeAll)).subscribe(({
            matchingAliases
        }) => {
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
        this.biometricsReady = false
        if (this.selectedFeature == "liveness") {
            console.log('we are in liveness')
            this._biometric.startLiveness();
            return;
        }
        console.log('we are in ocr')

        this._biometric.startIdScan();
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
            if (result == "aceptar") {}
        });
        this._changeDetectorRef.markForCheck();

        return false;
    }

    changeSelection(data): void {
        this.selectedFeature = data;
        console.log(data);
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
        if (data === "instructions" && !this.selectedFeature) {
            this.openSnackBar('required_feature');
            return;
        }

        this.currentStep = data;
        if (this.myDiv && this.myDiv.nativeElement) {
            console.log('scrolling');
            this.myDiv.nativeElement.scrollTo({
                behavior: 'smooth',
                // block: 'start',
                top: 0
            });
            this._changeDetectorRef.markForCheck();
        }
        this._changeDetectorRef.markForCheck();
    }

    reviewForm(): Boolean {
        this.loadBiometrics();
        // this.postToHubspot(this.contactForm.value);
        this.currentStep = "select";
        this._changeDetectorRef.markForCheck();
        return;
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
        const message = this.translocoService.translate(`errors.${code}`, {}) || code;
        this._snackBar.open(message);

        if (this.intervalHideSnackBar) {
            clearTimeout(this.intervalHideSnackBar);
        }

        this.intervalHideSnackBar = setTimeout(() => {
            this._snackBar.dismiss();
        }, 3500);
    }

    openConditions(): void {
        window.open('https://docs.verifik.co/docs/terminos-condiciones/ftxz1gulcjg3y-manual-de-politicas-de-privacidad-y-procedimientos-para-la-proteccion-tratamiento-de-datos-personales-y-atencion-de-solicitudes-consultas-y-reclamos', '_blank')
    }


}