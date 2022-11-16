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

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
        this.tutorials = [{
            category: 'tutorials.categories.biometrics',
            title: 'tutorials.titles.liveness_detection',
            description: 'tutorials.descriptions.liveness_detection',
            duration: 10,
            progress: {
                completed: true,
            }
        }, {
            category: 'tutorials.categories.biometrics',
            title: 'tutorials.titles.enroll_face',
            description: 'tutorials.descriptions.enroll_face',
            duration: 10,
            progress: {
                completed: true,
            },
        }, {
            category: 'tutorials.categories.biometrics',
            title: 'tutorials.titles.authenticate_face',
            description: 'tutorials.descriptions.authenticate_face',
            duration: 5,
            progress: {
                completed: true,
            },
        }, {
            category: 'tutorials.categories.biometrics',
            title: 'tutorials.titles.match_face_to_id',
            description: 'tutorials.descriptions.match_face_to_id',
            duration: 10,
            progress: {
                completed: true,
            },
        }, {
            category: 'tutorials.categories.biometrics',
            title: 'tutorials.titles.scan_ocr_id',
            description: 'tutorials.descriptions.scan_ocr_id',
            duration: 10,
            progress: {
                completed: true,
            },
        }];

        this.tutorialsMapping = {
            'tutorials.titles.liveness_detection': {
                route: 'liveness',
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
                    }
                ],
            },
            'tutorials.titles.scan_ocr_id': {
                route: 'scan_ocr_id',
                params: {},
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
        }
    }

    get navigationHandler$(): Observable < any > {
        return this._navigationHandler.asObservable();
    }

    navigationChange(changes: any): void {
        if (!changes) return;

        this._navigationHandler.next(changes);
    }

    getTutorial(route: string): any {
        for (const title in this.tutorialsMapping) {
            const tutorial = this.tutorialsMapping[title];

            if (tutorial.route === route) return tutorial;
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