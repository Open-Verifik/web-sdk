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
import {
    Router
} from '@angular/router';


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
                route: 'liveness-3d',
                duration: 10,
                progress: {
                    completed: true,
                },
                steps: 4
            }, {
                category: 'biometrics',
                route: 'enrollment-3d',
                duration: 10,
                progress: {
                    completed: true,
                },
                steps: 4
            }, {
                category: 'biometrics',
                route: 'match-3d-3d',
                duration: 5,
                progress: {
                    completed: true,
                },
                steps: 4
            }, {
                category: 'biometrics',
                route: 'match-3d-2d-idscan',
                duration: 10,
                progress: {
                    completed: true,
                },
                steps: 4
            }, {
                category: 'biometrics',
                route: 'idscan-only',
                duration: 10,
                progress: {
                    completed: true,
                },
                step: 4
            }, {
                category: 'biometrics',
                route: 'estimate-age-2d',
                duration: 10,
                progress: {
                    completed: true,
                },
                step: 4
            }, {
                category: 'biometrics',
                route: 'check-age-2d',
                duration: 10,
                progress: {
                    completed: true,
                },
                step: 4
            }, {
                category: 'biometrics',
                route: 'liveness-2d',
                duration: 10,
                progress: {
                    completed: true,
                },
                step: 4
            }, {
                category: 'biometrics',
                route: 'match-2d-2d',
                duration: 10,
                progress: {
                    completed: true,
                },
                step: 4
            }, {
                category: 'biometrics',
                route: 'estimate-age-3d',
                duration: 10,
                progress: {
                    completed: true,
                },
                step: 4
            }, {
                category: 'biometrics',
                route: 'check-age-3d',
                duration: 10,
                progress: {
                    completed: true,
                },
                step: 4
            }, {
                category: 'biometrics',
                route: 'match-3d-2d-profile-pic',
                step: 4
            }, {
                category: 'biometrics',
                route: 'match-3d-2d-face-portrait',
                step: 4
            }, {
                category: 'biometrics',
                route: 'match-3d-2d-3rdparty-idphoto',
                step: 4
            }, {
                category: 'biometrics',
                route: 'match-3d-2d-3rdparty-idphoto-low-quality',
                step: 4
            },
            {
                category: 'passwordless',
                route: 'passwordless',
                duration: 10,
                progress: {
                    completed: true,
                },
                steps: 1
            }, {
                category: 'kyc',
                route: 'kyc',
                duration: 10,
                progress: {
                    completed: true,
                },
                steps: 1
            }
        ];

        this.tutorialsMapping = {
            'tutorials.titles.liveness_detection': {
                route: 'liveness-3d',
                endpoint: 'https://api.verifik.co/v2/biometrics/liveness-3d',
                parameters: {
                    "faceScan": "...",
                    "auditTrailImage": "...",
                    "lowQualityAuditTrailImage": "..."
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.liveness-3d.steps.title_1',
                    subtitle: 'tutorials.liveness-3d.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.liveness-3d.steps.title_2',
                    subtitle: 'tutorials.liveness-3d.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.liveness-3d.steps.title_3',
                    subtitle: 'tutorials.liveness-3d.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.liveness-3d.steps.title_4',
                    subtitle: 'tutorials.liveness-3d.steps.description_4',
                }, ],
                instructions: 'tutorials.instructions.liveness-3d',
                fields: [{
                    key: 'clientToken',
                    label: 'tutorials.credentials.client_token',
                    type: 'textarea',
                    required: true,
                }, ],
            },
            'tutorials.titles.enrollment-3d': {
                route: 'enrollment-3d',
                endpoint: 'https://api.verifik.co/v2/biometrics/enrollment-3d',
                parameters: {
                    "faceScan": "...",
                    "auditTrailImage": "...",
                    "lowQualityAuditTrailImage": "..."
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.enrollment-3d.steps.title_1',
                    subtitle: 'tutorials.enrollment-3d.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.enrollment-3d.steps.title_2',
                    subtitle: 'tutorials.enrollment-3d.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.enrollment-3d.steps.title_3',
                    subtitle: 'tutorials.enrollment-3d.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.enrollment-3d.steps.title_4',
                    subtitle: 'tutorials.enrollment-3d.steps.description_4',
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
            'tutorials.titles.match-3d-3d': {
                route: 'match-3d-3d',
                endpoint: 'https://api.verifik.co/v2/biometrics/match-3d-3d',
                parameters: {
                    "faceScan": "...",
                    "auditTrailImage": "...",
                    "lowQualityAuditTrailImage": "..."
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match-3d-3d.steps.title_1',
                    subtitle: 'tutorials.match-3d-3d.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match-3d-3d.steps.title_2',
                    subtitle: 'tutorials.match-3d-3d.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match-3d-3d.steps.title_3',
                    subtitle: 'tutorials.match-3d-3d.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match-3d-3d.steps.title_4',
                    subtitle: 'tutorials.match-3d-3d.steps.description_4',
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
            'tutorials.titles.match-3d-2d-idscan': {
                route: 'match-3d-2d-idscan',
                endpoint: 'https://api.verifik.co/v2/biometrics/match-3d-2d-idscan',
                parameters: {
                    "idScan": "...",
                    "idScanFrontImage": "...",
                    "idScanBackImage": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match-3d-2d-idscan.steps.title_1',
                    subtitle: 'tutorials.match-3d-2d-idscan.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match-3d-2d-idscan.steps.title_2',
                    subtitle: 'tutorials.match-3d-2d-idscan.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match-3d-2d-idscan.steps.title_3',
                    subtitle: 'tutorials.match-3d-2d-idscan.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match-3d-2d-idscan.steps.title_4',
                    subtitle: 'tutorials.match-3d-2d-idscan.steps.description_4',
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
            'tutorials.titles.idscan-only': {
                route: 'idscan-only',
                endpoint: 'https://api.verifik.co/v2/biometrics/idscan-only',
                parameters: {
                    "idScan": "...",
                    "idScanFrontImage": "...",
                    "idScanBackImage": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.idscan-only.steps.title_1',
                    subtitle: 'tutorials.idscan-only.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.idscan-only.steps.title_2',
                    subtitle: 'tutorials.idscan-only.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.idscan-only.steps.title_3',
                    subtitle: 'tutorials.idscan-only.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.idscan-only.steps.title_4',
                    subtitle: 'tutorials.idscan-only.steps.description_4',
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
                }],
            },
            'tutorials.titles.estimate-age-2d': {
                route: 'estimate-age-2d',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/estimate-age-2d',
                parameters: {
                    "image": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.estimate-age-2d.steps.title_1',
                    subtitle: 'tutorials.estimate-age-2d.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.estimate-age-2d.steps.title_2',
                    subtitle: 'tutorials.estimate-age-2d.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.estimate-age-2d.steps.title_3',
                    subtitle: 'tutorials.estimate-age-2d.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.estimate-age-2d.steps.title_4',
                    subtitle: 'tutorials.estimate-age-2d.steps.description_4',
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
            'tutorials.titles.check-age-2d': {
                route: 'check-age-2d',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/check-age-2d',
                parameters: {
                    "image": "...",
                    "age": 0
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.check-age-2d.steps.title_1',
                    subtitle: 'tutorials.check-age-2d.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.check-age-2d.steps.title_2',
                    subtitle: 'tutorials.check-age-2d.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.check-age-2d.steps.title_3',
                    subtitle: 'tutorials.check-age-2d.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.check-age-2d.steps.title_4',
                    subtitle: 'tutorials.check-age-2d.steps.description_4',
                }, ],
                fields: [{
                    key: 'clientToken',
                    label: 'tutorials.credentials.client_token',
                    type: 'textarea',
                    required: true,
                },{
                    key: 'age',
                    label: 'tutorials.credentials.age',
                    type: 'select',
                    options:[
                        [0,'13+'],
                        [1,'16+'],
                        [2,'18+'],
                        [3,'21+'],
                        [4,'25+'],
                    ],
                    required: true,
                } ],
                images: [{
                    key: 'image',
                    label: 'tutorials.credentials.image',
                    required: true,
                }]
            },
            'tutorials.titles.liveness-2d': {
                route: 'liveness-2d',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/liveness-2d',
                parameters: {
                    "image": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.liveness-2d.steps.title_1',
                    subtitle: 'tutorials.liveness-2d.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.liveness-2d.steps.title_2',
                    subtitle: 'tutorials.liveness-2d.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.liveness-2d.steps.title_3',
                    subtitle: 'tutorials.liveness-2d.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.liveness-2d.steps.title_4',
                    subtitle: 'tutorials.liveness-2d.steps.description_4',
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
            'tutorials.titles.match-2d-2d': {
                route: 'match-2d-2d',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/match-2d-2d',
                parameters: {
                    "image0": "...",
                    "image1": "...",
                    "minMatchLevel": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match-2d-2d.steps.title_1',
                    subtitle: 'tutorials.match-2d-2d.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match-2d-2d.steps.title_2',
                    subtitle: 'tutorials.match-2d-2d.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match-2d-2d.steps.title_3',
                    subtitle: 'tutorials.match-2d-2d.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match-2d-2d.steps.title_4',
                    subtitle: 'tutorials.match-2d-2d.steps.description_4',
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
            'tutorials.titles.estimate-age-3d': {
                route: 'estimate-age-3d',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/estimate-age-3d',
                parameters: {
                    "externalDatabaseRefID": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.estimate-age-3d.steps.title_1',
                    subtitle: 'tutorials.estimate-age-3d.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.estimate-age-3d.steps.title_2',
                    subtitle: 'tutorials.estimate-age-3d.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.estimate-age-3d.steps.title_3',
                    subtitle: 'tutorials.estimate-age-3d.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.estimate-age-3d.steps.title_4',
                    subtitle: 'tutorials.estimate-age-3d.steps.description_4',
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
            'tutorials.titles.check-age-3d': {
                route: 'check-age-3d',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/check-age-3d',
                parameters: {
                    "externalDatabaseRefID": "...",
                    "age": 0
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.check-age-3d.steps.title_1',
                    subtitle: 'tutorials.check-age-3d.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.check-age-3d.steps.title_2',
                    subtitle: 'tutorials.check-age-3d.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.check-age-3d.steps.title_3',
                    subtitle: 'tutorials.check-age-3d.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.check-age-3d.steps.title_4',
                    subtitle: 'tutorials.check-age-3d.steps.description_4',
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
                }, {
                    key: 'age',
                    label: 'tutorials.credentials.age',
                    type: 'select',
                    options:[
                        [0,'13+'],
                        [1,'16+'],
                        [2,'18+'],
                        [3,'21+'],
                        [4,'25+'],
                    ],
                    required: true,
                }],
            }, 
            'tutorials.titles.match-3d-2d-profile-pic': {
                route: 'match-3d-2d-profile-pic',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/match-3d-2d-profile-pic',
                parameters: {
                    "externalDatabaseRefID": "...",
                    "image": "...",
                    "minMatchLevel": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match-3d-2d-profile-pic.steps.title_1',
                    subtitle: 'tutorials.match-3d-2d-profile-pic.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match-3d-2d-profile-pic.steps.title_2',
                    subtitle: 'tutorials.match-3d-2d-profile-pic.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match-3d-2d-profile-pic.steps.title_3',
                    subtitle: 'tutorials.match-3d-2d-profile-pic.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match-3d-2d-profile-pic.steps.title_4',
                    subtitle: 'tutorials.match-3d-2d-profile-pic.steps.description_4',
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
            'tutorials.titles.match-3d-2d-face-portrait': {
                route: 'match-3d-2d-face-portrait',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/match-3d-2d-face-portrait',
                parameters: {
                    "externalDatabaseRefID": "...",
                    "image": "...",
                    "minMatchLevel": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match-3d-2d-face-portrait.steps.title_1',
                    subtitle: 'tutorials.match-3d-2d-face-portrait.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match-3d-2d-face-portrait.steps.title_2',
                    subtitle: 'tutorials.match-3d-2d-face-portrait.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match-3d-2d-face-portrait.steps.title_3',
                    subtitle: 'tutorials.match-3d-2d-face-portrait.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match-3d-2d-face-portrait.steps.title_4',
                    subtitle: 'tutorials.match-3d-2d-face-portrait.steps.description_4',
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
            'tutorials.titles.match-3d-2d-3rdparty-idphoto': {
                route: 'match-3d-2d-3rdparty-idphoto',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/match-3d-2d-3rdparty-idphoto',
                parameters: {
                    "externalDatabaseRefID": "...",
                    "image": "...",
                    "minMatchLevel": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match-3d-2d-3rdparty-idphoto.steps.title_1',
                    subtitle: 'tutorials.match-3d-2d-3rdparty-idphoto.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match-3d-2d-3rdparty-idphoto.steps.title_2',
                    subtitle: 'tutorials.match-3d-2d-3rdparty-idphoto.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match-3d-2d-3rdparty-idphoto.steps.title_3',
                    subtitle: 'tutorials.match-3d-2d-3rdparty-idphoto.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match-3d-2d-3rdparty-idphoto.steps.title_4',
                    subtitle: 'tutorials.match-3d-2d-3rdparty-idphoto.steps.description_4',
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
            'tutorials.titles.match-3d-2d-3rdparty-idphoto-low-quality': {
                route: 'match-3d-2d-3rdparty-idphoto-low-quality',
                onlyEndpoint: true,
                endpoint: 'https://api.verifik.co/v2/biometrics/match-3d-2d-3rdparty-idphoto-low-quality',
                parameters: {
                    "externalDatabaseRefID": "...",
                    "image": "...",
                    "minMatchLevel": "...",
                },
                sideMenuSteps: [{
                    order: 0,
                    title: 'tutorials.match-3d-2d-3rdparty-idphoto-low-quality.steps.title_1',
                    subtitle: 'tutorials.match-3d-2d-3rdparty-idphoto-low-quality.steps.description_1',
                }, {
                    order: 1,
                    title: 'tutorials.match-3d-2d-3rdparty-idphoto-low-quality.steps.title_2',
                    subtitle: 'tutorials.match-3d-2d-3rdparty-idphoto-low-quality.steps.description_2',
                }, {
                    order: 2,
                    title: 'tutorials.match-3d-2d-3rdparty-idphoto-low-quality.steps.title_3',
                    subtitle: 'tutorials.match-3d-2d-3rdparty-idphoto-low-quality.steps.description_3',
                }, {
                    order: 3,
                    title: 'tutorials.match-3d-2d-3rdparty-idphoto-low-quality.steps.title_4',
                    subtitle: 'tutorials.match-3d-2d-3rdparty-idphoto-low-quality.steps.description_4',
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

        if (this.navData.currentStep + 1 === this.activeTut.sideMenuSteps.length) {
            this._router.navigate(['/'])
            return;
        }
        this._navigationHandler.next(changes);
    }

    getTutorial(route: string): any {
        for (const title in this.tutorialsMapping) {
            const tutorial = this.tutorialsMapping[title];

            if (tutorial.route === route) {
                this.activeTut = tutorial;
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