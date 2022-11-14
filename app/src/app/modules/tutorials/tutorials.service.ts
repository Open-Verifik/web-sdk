import {
    Injectable
} from '@angular/core';
import {
    HttpClient
} from '@angular/common/http';


@Injectable({
    providedIn: 'root'
})
export class TutorialsService {
    // Private
    tutorials: Array < any > ;
    tutorialsMapping: any;
    navData: any = {
        currentStep: 2,
    };

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
                params:{},
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
                }, ]
            },
            'tutorials.titles.enroll_face': {
                route: 'enroll_face',
                params:{
                    externalId:true,
                    group: true
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
                }, ]
            },
            'tutorials.titles.authenticate_face': {
                route: 'authenticate_face',
                params:{
                    externalId:true
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
                }, ]
            },
            'tutorials.titles.match_face_to_id': {
                route: 'match_face_to_id',
                params:{
                    externalId:true,
                    group:true
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
                }, ]
            },
            'tutorials.titles.scan_ocr_id': {
                route: 'scan_ocr_id',
                params:{},
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
                }, ]
            },
        }
    }

    getTutorial(route: string): any {
        for (const title in this.tutorialsMapping) {
            const tutorial = this.tutorialsMapping[title];

            if (tutorial.route === route) return tutorial;
        }

        return null;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // --------------------------------------------------------------------------------------


}