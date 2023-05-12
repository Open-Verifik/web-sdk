import {
    ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit,
	ViewEncapsulation
} from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ValidatorFn,
    AbstractControl
} from '@angular/forms';
import {
    CountriesService
} from 'app/modules/countries/countries.service';
import {
    FuseMediaWatcherService
} from '@fuse/services/media-watcher';
import {
    Subject
} from 'rxjs';
import {
    skip,
    takeUntil
} from 'rxjs/operators';
import {
    DemoService
} from '../demo.service';

import {
    BiometricService
} from 'app/modules/biometrics/biometric.service';
import {
    DemoBiometric
} from 'app/modules/biometrics/demo-biometric.module';
import {
    Biometric
} from 'app/modules/biometrics/biometric.module';
import {
    ProfilePreviewComponent
} from './profile-preview/profile-preview.component';
import {
    MatDialog
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
	environment
} from 'environments/environment';
import {
	TranslocoService
} from '@ngneat/transloco';

@Component({
    selector: 'app-demo-root',
    templateUrl: './demo-root.component.html',
    styleUrls: ['./demo-root.component.scss'],
    encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemoRootComponent implements OnInit {
    private _unsubscribeAll: Subject < any > = new Subject < any > ();
    private _biometric: DemoBiometric
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
    currentStep: any = 'start';
    // currentStep: any = 'result';
    baseColor: any = '#0036E7'
    mapSteps: any = [
        'start',
        'form',
        'select',
        'instructions',
        'facetec',
        'result',
        'end'
    ];
    idScanCrops: any;
    scannedData: any;
    objectKeys = Object.keys;
    matchLevel: number;
    jsonData: any;
    previewDialog: any;
    maxMatchLevel: any;
    faceScan: any;
    idScan: any;
    currentImg: any;
    ageEstimate: any;
    qrText: string;

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
    ) {

        this.translocoService.setActiveLang('en');
        this._demoService.navigationHandler$.subscribe(
            result=>{
                if(result && result.hasToken){
                    this.loadBiometrics()
                    this.currentStep = 'select'
                    this._changeDetectorRef.markForCheck();
                }
                console.log(result);
            }
        )

        // this.scannedData = {
        //         "firstName": "ANGEL",
        //         "middleName": "ORTIZ",
        //         "lastName": "ORTIZ OLIVERA",
        //         "dateOfBirth": "29/10/1993",
        //         "idNumber": "226310541",
        //         "idNumber2": "010A931029HOCRLN00",
        //         "dateOfExpiration": "31 DEC 2032",
        //         "mrzLine1": "IDMEX2263105418<<0219090916453",
        //         "mrzLine2": "9310298H3212312MEX<01<<02101<0",
        //         "mrzLine3": "ORTIZ<OLIVERA<<ANGEL<<<<<<<<<<"
        //     }
        // this.matchLevel = 7;

        // this.jsonData = {
        //     "type": "enrollment3d",
        //     "fraudData": [],
        //     "_id": "6459f4b9df220dca858e5681",
        //     "deleted": false,
        //     "externalDatabaseRefID": "lead_9541607442_angel@verifik.co",
        //     "success": true,
        //     "faceUrl": "https://app.verifik.co/api/liveness/image?tid=49221632-7559-4cca-a01b-9c5fb8bc9ca5",
        //     "ageEstimateGroup": "Age Over 30",
        //     "updatedAt": "2023-05-09T07:22:33.870Z",
        //     "createdAt": "2023-05-09T07:22:33.870Z",
        //     "__v": 0,
        //     "details": { "platform": "web", "deviceModel": "Ubuntu", "liveness": true },
        //     "scanResultBlob": "AAEAAABTAAAAAAAAALr5TZZNu6MHQBsdyBrfZXyQ6e7Fa6KTA4utBICs7PKAMwxeV581yDCV46RnLpD8JhnWjWTgP9xoKJImj9+jvb9+sTue7WgPHBNRJ2g/Ty9W93R1",
        //     "wasProcessed": true
        // };

        // this.jsonData = {
        //     "type": "match3d2dIdscan",
        //     "fraudData": [],
        //     "_id": "6459f8b03a11e5d54bff90d9",
        //     "deleted": false,
        //     "externalDatabaseRefID": "lead_9541607442_angel@verifik.co",
        //     "lead": "6459ed0a902e52a966151421",
        //     "success": true,
        //     "enrollUrl": "https://app.verifik.co/api/liveness/image?tid=b855a9f9-64e1-499d-97de-5f202a8ecc59",
        //     "idScanUrl": "https://app.verifik.co/api/idCheckImage?tid=a62d1a8e-fb5d-4dee-83de-dc6bf65e7de2&idCheckImageType=",
        //     "updatedAt": "2023-05-09T07:39:29.046Z",
        //     "createdAt": "2023-05-09T07:39:29.046Z",
        //     "__v": 0,
        //     "details": {
        //       "platform": "web",
        //       "deviceModel": "Ubuntu",
        //       "matchLevel": 7,
        //       "documentData": {
        //         "templateInfo": {
        //           "templateName": "Mexico - ID Card (Voter) - 2020_UC - Horizontal",
        //           "templateType": "Government Issued Photo ID"
        //         },
        //         "scannedValues": {
        //           "userInfo": {
        //             "firstName": "ANGEL",
        //             "middleName": "ORTIZ",
        //             "lastName": "ORTIZ OLIVERA",
        //             "dateOfBirth": "29/10/1993"
        //           },
        //           "idInfo": {
        //             "idNumber": "226310541",
        //             "idNumber2": "010A931029HOCRLN00",
        //             "dateOfExpiration": "31 DEC 2032",
        //             "mrzLine1": "IDMEX2263105418<<0219090916453",
        //             "mrzLine2": "9310298H3212312MEX<01<<02101<0",
        //             "mrzLine3": "ORTIZ<OLIVERA<<ANGEL<<<<<<<<<<"
        //           }
        //         },
        //         "userConfirmedValues": {
        //           "userInfo": {
        //             "firstName": "ANGEL",
        //             "middleName": "ORTIZ",
        //             "lastName": "ORTIZ OLIVERA",
        //             "dateOfBirth": "29/10/1993"
        //           },
        //           "idInfo": {
        //             "idNumber": "226310541",
        //             "idNumber2": "010A931029HOCRLN00",
        //             "dateOfExpiration": "31 DEC 2032",
        //             "mrzLine1": "IDMEX2263105418<<0219090916453",
        //             "mrzLine2": "9310298H3212312MEX<01<<02101<0",
        //             "mrzLine3": "ORTIZ<OLIVERA<<ANGEL<<<<<<<<<<"
        //           }
        //         }
        //       },
        //       "maxMatchLevel": 7
        //     },
        //     "scanResultBlob": "AAEAAAAUAQAAAAAAAHX7QsE7x/Cu0esZGxfK8F60yEDEgj9NxaeHz9C/cBSbdI38iK0YpQBui2R+NowkflD2RvepxJ+LAOlePQhdCGybFo9zKKYeDtjtwBLH0BTqxmdMnA5ODvzH29d19Zpzm5T5MJyIvFDP/uoU6x0pd46BY5IX7Wn5yk6IL10RerPDRs66NsYGbBWCY6ZZxRO/BHY9qUAaZbJHsV6uSDrz4uLDhZrFW0qQ42Msik/8U403N58qatdHs/05vR3a5U3SgfKJnEjZZmYIGFQKA1Tj53hZcqtoCcXCq4WKjgq2sK4bDVViKIZsO+L6vRVwUkFrWltvQm6gk5tFoKMlNc5ihUtpdONXPv4AMZVLhXtOb9q6BQGNxQ==",
        //     "wasProcessed": true
        // }

        // this.scannedData = {
        //     ...this.jsonData['details']['documentData']['scannedValues']['addressInfo'],
        //     ...this.jsonData['details']['documentData']['scannedValues']['idInfo'],
        //     ...this.jsonData['details']['documentData']['scannedValues']['userInfo']
        // };
        // this.matchLevel =this.jsonData.details['matchLevel'];
        // this.maxMatchLevel = this.jsonData.details['maxMatchLevel'];
        // this.jsonData = this.jsonData;
        // this.faceScan = this.jsonData.enrollUrl || this.jsonData.faceUrl
        // this.idScan = this.jsonData.idScanUrl
        // this.ageEstimate = this.jsonData.ageEstimateGroup || null
        // console.log(
        //     {match: this.matchLevel,
        //     max: this.maxMatchLevel
        //         }
        // )
        this._changeDetectorRef.markForCheck()
        this.countries = this._countries.countryCodes;
        this.initForm()
    }

    loadBiometrics(): void {
        // console.log('initialize')
        this._biometric = new DemoBiometric(this._service)

        this._biometric.isReady$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((isSuccess) => {
                console.log({
                    isSuccess
                })
            });

        this._biometric.session$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((isSuccess) => {
                this.biometricLoaded = isSuccess
                this._changeDetectorRef.detectChanges()

            });

        this._biometric.error$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((error) => {
                // this.errorLogin(error)
                this.biometricLoaded = false;
                this._biometric.startSession()

            });

        this._biometric.onboardingScan$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                if (response.success) {
                    //COMPLETED ALL SERVICES

                    this.scannedData = {
                        ...response['details']['documentData']['userConfirmedValues']['idInfo'] || response['details']['documentData']['scannedValues']['idInfo'],
                        ...response['details']['documentData']['userConfirmedValues']['addressInfo'] || response['details']['documentData']['scannedValues']['addressInfo'],
                        ...response['details']['documentData']['userConfirmedValues']['userInfo'] || response['details']['documentData']['scannedValues']['userInfo']
                    };
                    this.matchLevel = response.details['matchLevel'];
                    this.maxMatchLevel = response.details['maxMatchLevel'];
                    this.jsonData = response;
                    this.faceScan = response.enrollUrl || response.faceScanUrl
                    this.idScan = response.idScanUrl

                    // this.screenStatus = 'ending'
                    // this.step = 'finish'
                    this.changeStep('result')

                    this._changeDetectorRef.markForCheck()

                }

                this.biometricLoaded = false;
                this._biometric.startSession()
            });

        this._biometric.auth$.pipe(skip(1)).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                if (response.success) {


                    //COMPLETED ALL SERVICES
                    this.matchLevel = response.details['matchLevel'];
                    this.maxMatchLevel = response.details['maxMatchLevel'];
                    this.jsonData = response;
                    this.faceScan = response.enrollUrl || response.faceScanUrl
                    this.idScan = response.idScanUrl;
                    this.ageEstimate = response.ageEstimateGroup
                    // this.screenStatus = 'ending'
                    // this.step = 'finish'
                    this.changeStep('result')
                    this._changeDetectorRef.markForCheck()

                }

                this.biometricLoaded = false;
                this._biometric.startSession()
            });

    }

    ngOnInit(): void {
        this.idScanCrops = [
            'frontCrop',
            'backScan'
        ]
        this.currentImg = {
            crop: this.idScanCrops[0],
            index: 0
        }
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({
                matchingAliases
            }) => {


                this.isScreenSmall = Boolean(!matchingAliases.includes('lg') && matchingAliases.includes('md'));
                this.lgScreen = matchingAliases.includes('lg');
                this.phoneMode = Boolean(!matchingAliases.includes('lg') && !matchingAliases.includes('md') && !matchingAliases.includes('sm'));
                this.tabletMode = Boolean(!matchingAliases.includes('lg') && !matchingAliases.includes('md') && matchingAliases.includes('sm'));
                this.laptopMode = Boolean(!matchingAliases.includes('lg') && matchingAliases.includes('md') && matchingAliases.includes('sm'));
                this.bigScreenMode = Boolean(matchingAliases.includes('lg') && matchingAliases.includes('md') && matchingAliases.includes('sm'));

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

    }

    startBiometric(): void {

        if (this.selectedFeature == 'liveness') {
            this._biometric.startAuth()
            return
        }

        this._biometric.startEnrollmentDocument()
    }

    profilePreviewDialog(object, part): boolean {
        this.previewDialog = this.dialog.open(ProfilePreviewComponent, {
            data: {
                document: {
                    url: part != 'none' ? object + part : object
                },
                scan: 'none'
            }
        });

        this.previewDialog.afterClosed().subscribe(result => {
            if (result == "aceptar") {

            }
        });
        this._changeDetectorRef.markForCheck();

        return false;
    }

    initForm(): void {
        // this.contactForm = this._formBuilder.group({
        //     'companyName': ['verifik', [Validators.required]],
        //     'name': ['angel ortiz', [Validators.required]],
        //     'website': ['verifik.co', [Validators.required]],
        //     'jobFunction': ['delete databases', [Validators.required]],
        //     'email': ['angel@verifik.co', [Validators.required, Validators.email]],
        //     'countryCode': ['+52', [Validators.required]],
        //     'phone': ['9541607442', [Validators.required]],
        // });
        this.contactForm = this._formBuilder.group({
            'companyName': [, [Validators.required]],
            'name': [, [Validators.required]],
            'website': [, [Validators.required]],
            'jobFunction': [, [Validators.required]],
            'email': [, [Validators.required, Validators.email]],
            'countryCode': [, [Validators.required]],
            'phone': [, [Validators.required, this.phoneNumberValidator()]],
        });
    }

    changeSelection(data): void {
        this.selectedFeature = data;
        this._changeDetectorRef.markForCheck();
    }

    changeId(displacement): void {
        if (displacement === 'back') {
            if (this.currentImg.index == 0) {
                this.currentImg = {
                    crop: this.idScanCrops[this.idScanCrops.length - 1],
                    index: this.idScanCrops.length - 1
                }
                return;
            }
            this.currentImg = {
                crop: this.idScanCrops[this.currentImg.index - 1],
                index: this.currentImg.index - 1
            }
            return
        }
        if (displacement === 'front') {
            if (this.currentImg.index == this.idScanCrops.length - 1) {
                this.currentImg = {
                    crop: this.idScanCrops[0],
                    index: 0
                }
                return;
            }
            this.currentImg = {
                crop: this.idScanCrops[this.currentImg.index + 1],
                index: this.currentImg.index + 1
            }
        }
    }

    changeStep(data): void {
        if (data === 'select' && this.currentStep != 'instructions') {
            this.reviewForm();
            return;
        }
        if (data === 'instructions') {

            this._biometric.startSession()
        }

        this.currentStep = data;
        this._changeDetectorRef.markForCheck();
    }

    reviewForm(): Boolean {
        if (!this.contactForm.valid) {
            this.openSnackBar('Fill all required form inputs!')
            return false;
        }

        this._demoService.postForm(this.contactForm.value).subscribe(
            result => {
                localStorage.setItem('accessToken', result.data.token)
                
                localStorage.setItem('expiresAt', result.data.tokenExpiresAt)
                console.log(result.data)
                if (result.data.token) {
                    this.qrText = `${environment.redirectUrl + 'demo/' + result.data.token}`
                    this.loadBiometrics();
                    this.currentStep = 'select';
                    this._changeDetectorRef.markForCheck();
                    return
                }
                this.openSnackBar('Error!');
                // const token = result.data.token
            },err=>{
                console.log(err);
                this.openSnackBar(err);
            }
        )
    }

    changeDemo():void{
        this.currentStep = 'select'
        this.scannedData = undefined;
        this.matchLevel = undefined;
        this.maxMatchLevel = undefined;
        this.jsonData = undefined;
        this.faceScan = undefined;
        this.idScan = undefined;
        this._changeDetectorRef.markForCheck();
    }

    goToVk():void{
        window.location.href = 'https://auth.verifik.co/kyc/start/6332941ccde4f719d9c00f9e'; // Replace with the URL of the external webpage
    }    

    openSnackBar(message: string) {
        this._snackBar.open(message);
      }

    phoneNumberValidator(): ValidatorFn {
        return (control: AbstractControl): {
            [key: string]: any
        } | null => {
            const phoneNumberPattern = /^[0-9]{10}$/; // Assuming 10-digit phone number
            const isValid = phoneNumberPattern.test(control.value);
            return isValid ? null : {
                'invalidPhoneNumber': true
            };
        };
    }

}