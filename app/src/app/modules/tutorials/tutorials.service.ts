import {
    Injectable
} from '@angular/core';
import {
    HttpClient
} from '@angular/common/http';
import {
    BehaviorSubject,
    Observable
} from 'rxjs';
import { Router } from '@angular/router';


@Injectable({
    providedIn: 'root'
})
export class TutorialsService {
    // Private
    tutorials: Array < any > ;
    tutorialsMapping: any;
    navData: any = {
        currentStep: 0,
    };

    private _navigationHandler: BehaviorSubject < any | null > = new BehaviorSubject(null);
    activeTut: any;

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient,
                private _router: Router,
        ) {
        this.tutorials = [{
                category: 'biometrics',
                route: 'liveness',
                duration: 10,
                progress: {
                    completed: true,
                },
                steps: 4
            }, {
                category: 'biometrics',
                route: 'enroll_face',
                duration: 10,
                progress: {
                    completed: true,
                }, 
                steps:4
            }, {
                category: 'biometrics',
                route: 'authenticate_face',
                duration: 5,
                progress: {
                    completed: true,
                }, 
                steps:4
            }, {
                category: 'biometrics',
                route: 'match_face_to_id',
                duration: 10,
                progress: {
                    completed: true,
                },
                steps:4
            }, {
                category: 'biometrics',
                route: 'scan_ocr_id',
                duration: 10,
                progress: {
                    completed: true,
                }, 
                step:4
            }, {
                category: 'biometrics',
                route: 'estimate_age_image',
                duration: 10,
                progress: {
                    completed: true,
                }, 
                step:4
            }, {
                category: 'biometrics',
                route: 'liveness_image',
                duration: 10,
                progress: {
                    completed: true,
                }, step:4
            }, {
                category: 'biometrics',
                route: 'match_2_image',
                duration: 10,
                progress: {
                    completed: true,
                }, 
                step:4
            }, {
                category: 'biometrics',
                route: 'estimate_age',
                duration: 10,
                progress: {
                    completed: true,
                }, 
                step:4
            }, {
                category: 'biometrics',
                route: 'match_image', 
                step:4
            },
            {
                category: 'passwordless',
                route: 'passwordless',
                duration: 10,
                progress: {
                    completed: true,
                },
                steps:1
            }, {
                category: 'kyc',
                route: 'kyc',
                duration: 10,
                progress: {
                    completed: true,
                },
                steps:1
            }
        ];

        this.tutorialsMapping = {
            'tutorials.titles.liveness_detection': {
                route: 'liveness',
                endpoint: 'https://api.verifik.co/v2/biometrics/liveness',
                parameters: {
                    "faceScan": "...",
                    "auditTrailImage": "...",
                    "lowQualityAuditTrailImage": "..."
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.liveness.steps.title_1',
                    subtitle: 'tutorials.liveness.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.liveness.steps.title_2',
                    subtitle: 'tutorials.liveness.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.liveness.steps.title_3',
                    subtitle: 'tutorials.liveness.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.liveness.steps.title_4',
                    subtitle: 'tutorials.liveness.steps.description_4',
                }, ],
                instructions: 'tutorials.instructions.liveness',
                fields: [{
                    key: 'clientToken',
                    label: 'tutorials.credentials.client_token',
                    type: 'textarea',
                    required: true,
                }, ],
            },
            'tutorials.titles.enroll_face': {
                route: 'enroll_face',
                endpoint: 'https://api.verifik.co/v2/biometrics/enroll',
                parameters: {
                    "faceScan": "...",
                    "auditTrailImage": "...",
                    "lowQualityAuditTrailImage": "..."
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.enroll_face.steps.title_1',
                    subtitle: 'tutorials.enroll_face.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.enroll_face.steps.title_2',
                    subtitle: 'tutorials.enroll_face.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.enroll_face.steps.title_3',
                    subtitle: 'tutorials.enroll_face.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.enroll_face.steps.title_4',
                    subtitle: 'tutorials.enroll_face.steps.description_4',
                }, ],
                fields: [{
                        key: 'clientToken',
                        label: 'tutorials.credentials.client_token',
                        type: 'textarea',
                        required: true,
                    },
                    {
                        key: 'externalDatabaseRefId',
                        label: 'tutorials.credentials.external_database_ref_id',
                        type: 'input',
                        required: true,
                    },
                    {
                        key: 'group',
                        label: 'tutorials.credentials.group',
                        type: 'input',
                    },
                ],
            },
            'tutorials.titles.authenticate_face': {
                route: 'authenticate_face',
                endpoint: 'https://api.verifik.co/v2/biometrics/authenticate',
                parameters: {
                    "faceScan": "...",
                    "auditTrailImage": "...",
                    "lowQualityAuditTrailImage": "..."
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.authenticate_face.steps.title_1',
                    subtitle: 'tutorials.authenticate_face.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.authenticate_face.steps.title_2',
                    subtitle: 'tutorials.authenticate_face.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.authenticate_face.steps.title_3',
                    subtitle: 'tutorials.authenticate_face.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.authenticate_face.steps.title_4',
                    subtitle: 'tutorials.authenticate_face.steps.description_4',
                }, ],
                fields: [{
                        key: 'clientToken',
                        label: 'tutorials.credentials.client_token',
                        type: 'textarea',
                        required: true,
                    },
                    {
                        key: 'externalDatabaseRefId',
                        label: 'tutorials.credentials.external_database_ref_id',
                        type: 'input',
                        required: true,
                    }
                ],
            },
            'tutorials.titles.match_face_to_id': {
                route: 'match_face_to_id',
                endpoint: 'https://api.verifik.co/v2/biometrics/match-idscan',
                parameters: {
                    "idScan": "...",
                    "idScanFrontImage": "...",
                    "idScanBackImage": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match_face_to_id.steps.title_1',
                    subtitle: 'tutorials.match_face_to_id.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match_face_to_id.steps.title_2',
                    subtitle: 'tutorials.match_face_to_id.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match_face_to_id.steps.title_3',
                    subtitle: 'tutorials.match_face_to_id.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match_face_to_id.steps.title_4',
                    subtitle: 'tutorials.match_face_to_id.steps.description_4',
                }, ],
                fields: [{
                        key: 'clientToken',
                        label: 'tutorials.credentials.client_token',
                        type: 'textarea',
                        required: true,
                    },
                    {
                        key: 'externalDatabaseRefId',
                        label: 'tutorials.credentials.external_database_ref_id',
                        type: 'input',
                        required: true,
                    },
                    {
                        key: 'group',
                        label: 'tutorials.credentials.group',
                        type: 'input',
                    },
                ],
            },
            'tutorials.titles.scan_ocr_id': {
                route: 'scan_ocr_id',
                endpoint: 'https://api.verifik.co/v2/biometrics/idscan',
                parameters: {
                    "idScan": "...",
                    "idScanFrontImage": "...",
                    "idScanBackImage": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.scan_ocr_id.steps.title_1',
                    subtitle: 'tutorials.scan_ocr_id.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.scan_ocr_id.steps.title_2',
                    subtitle: 'tutorials.scan_ocr_id.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.scan_ocr_id.steps.title_3',
                    subtitle: 'tutorials.scan_ocr_id.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.scan_ocr_id.steps.title_4',
                    subtitle: 'tutorials.scan_ocr_id.steps.description_4',
                }, ],
                fields: [{
                    key: 'clientToken',
                    label: 'tutorials.credentials.client_token',
                    type: 'textarea',
                    required: true,
                }, ],
            },
            'tutorials.titles.estimate_age_image': {
                route: 'estimate_age_image',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/estimate-age-image',
                parameters: {
                    "image": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.estimate_age_image.steps.title_1',
                    subtitle: 'tutorials.estimate_age_image.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.estimate_age_image.steps.title_2',
                    subtitle: 'tutorials.estimate_age_image.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.estimate_age_image.steps.title_3',
                    subtitle: 'tutorials.estimate_age_image.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.estimate_age_image.steps.title_4',
                    subtitle: 'tutorials.estimate_age_image.steps.description_4',
                }, ],
                fields: [{
                    key: 'clientToken',
                    label: 'tutorials.credentials.client_token',
                    type: 'textarea',
                    required: true,
                }, ],
                images: [{
                    key: 'image',
                    label: 'tutorials.credentials.image',
                    required: true,
                }]
            },
            'tutorials.titles.liveness_image': {
                route: 'liveness_image',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/liveness-image',
                parameters: {
                    "image": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.liveness_image.steps.title_1',
                    subtitle: 'tutorials.liveness_image.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.liveness_image.steps.title_2',
                    subtitle: 'tutorials.liveness_image.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.liveness_image.steps.title_3',
                    subtitle: 'tutorials.liveness_image.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.liveness_image.steps.title_4',
                    subtitle: 'tutorials.liveness_image.steps.description_4',
                }, ],
                fields: [{
                    key: 'clientToken',
                    label: 'tutorials.credentials.client_token',
                    type: 'textarea',
                    required: true,
                }, ],
                images: [{
                    key: 'image',
                    label: 'tutorials.credentials.image',
                    required: true,
                }]
            },
            'tutorials.titles.match_2_image': {
                route: 'match_2_image',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/match-2-image',
                parameters: {
                    "image0": "...",
                    "image1": "...",
                    "minMatchLevel": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match_2_image.steps.title_1',
                    subtitle: 'tutorials.match_2_image.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match_2_image.steps.title_2',
                    subtitle: 'tutorials.match_2_image.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match_2_image.steps.title_3',
                    subtitle: 'tutorials.match_2_image.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match_2_image.steps.title_4',
                    subtitle: 'tutorials.match_2_image.steps.description_4',
                }, ],
                fields: [{
                    key: 'clientToken',
                    label: 'tutorials.credentials.client_token',
                    type: 'textarea',
                    required: true,
                }, {
                    key: 'minMatchLevel',
                    label: 'tutorials.credentials.min_match_level',
                    type: 'input',
                    required: false,
                }, ],
                images: [{
                    key: 'image0',
                    label: 'tutorials.credentials.image0',
                    required: true,
                }, {
                    key: 'image1',
                    label: 'tutorials.credentials.image1',
                    required: true,
                }]
            },
            'tutorials.titles.estimate_age': {
                route: 'estimate_age',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/estimate-age',
                parameters: {
                    "externalDatabaseRefID": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.estimate_age.steps.title_1',
                    subtitle: 'tutorials.estimate_age.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.estimate_age.steps.title_2',
                    subtitle: 'tutorials.estimate_age.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.estimate_age.steps.title_3',
                    subtitle: 'tutorials.estimate_age.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.estimate_age.steps.title_4',
                    subtitle: 'tutorials.estimate_age.steps.description_4',
                }, ],
                fields: [{
                    key: 'clientToken',
                    label: 'tutorials.credentials.client_token',
                    type: 'textarea',
                    required: true,
                }, {
                    key: 'externalDatabaseRefId',
                    label: 'tutorials.credentials.external_database_ref_id',
                    type: 'input',
                    required: true,
                }, ],
            },
            'tutorials.titles.match_image': {
                route: 'match_image',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/match-image',
                parameters: {
                    "externalDatabaseRefID": "...",
                    "image": "...",
                    "minMatchLevel": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match_image.steps.title_1',
                    subtitle: 'tutorials.match_image.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match_image.steps.title_2',
                    subtitle: 'tutorials.match_image.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match_image.steps.title_3',
                    subtitle: 'tutorials.match_image.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match_image.steps.title_4',
                    subtitle: 'tutorials.match_image.steps.description_4',
                }, ],
                fields: [{
                        key: 'clientToken',
                        label: 'tutorials.credentials.client_token',
                        type: 'textarea',
                        required: true,
                    },
                    {
                        key: 'externalDatabaseRefId',
                        label: 'tutorials.credentials.external_database_ref_id',
                        type: 'input',
                        required: true,
                    },
                    {
                        key: 'minMatchLevel',
                        label: 'tutorials.credentials.min_match_level',
                        type: 'input',
                        required: false,
                    },
                ],
                images: [{
                    key: 'image',
                    label: 'tutorials.credentials.image',
                    required: true,
                }]
            },
            'tutorials.titles.passwordless': {
                route: 'passwordless',
                params: {},
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.passwordless.steps.title_1',
                    subtitle: 'tutorials.passwordless.steps.description_1',
                }],
            },
            'tutorials.titles.kyc': {
                route: 'kyc',
                params: {},
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.kyc.steps.title_1',
                    subtitle: 'tutorials.kyc.steps.description_1',
                }],
            },

        }
    }

    get navigationHandler$(): Observable < any > {
        return this._navigationHandler.asObservable();
    }

    navigationChange(changes: any): void {
        if (!changes) return;

        if(this.navData.currentStep +1 === this.activeTut.sideMenuSteps.length){
            this._router.navigate(['/'])
            return;  
        }
        this._navigationHandler.next(changes);
    }

    getTutorial(route: string): any {
        for (const title in this.tutorialsMapping) {
            const tutorial = this.tutorialsMapping[title];

            if (tutorial.route === route) {
                this.activeTut =  tutorial;
                return tutorial;
            }
        }
        return null;
    }

    undefineNavigation(): void {
        this._navigationHandler = new BehaviorSubject(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // --------------------------------------------------------------------------------------


}