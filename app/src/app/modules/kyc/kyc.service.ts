import {
    Injectable
} from '@angular/core';
import {
    Observable,
    BehaviorSubject
} from 'rxjs';
import {
    HttpWrapperService
} from 'app/core/http-wrapper.service';
import {
    environment
} from 'environments/environment';
import {
    tap
} from 'rxjs/operators';
import {
    ProjectModel,
    AppRegistrationModel
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class KycService {
    baseUrl: String = environment.baseUrl;

    private _projects: BehaviorSubject < ProjectModel[] | null > = new BehaviorSubject(null);

    private _currentProject: BehaviorSubject < ProjectModel | null > = new BehaviorSubject(null);

    private _currentAppRegistration: BehaviorSubject < AppRegistrationModel | null > = new BehaviorSubject(null);

    private _navigationHandler: BehaviorSubject < any | null > = new BehaviorSubject(null);

    currentProject: ProjectModel;

    currentAppRegistration: AppRegistrationModel;

    navData: any = {
        currentStep: 0,
    };

    countryCodes = [{
            code: '+54',
            name: 'Argentina'
        },
        {
            code: '+55',
            name: 'Brazil'
        },
        {
            code: '+1',
            name: 'Canada'
        },
        {
            code: '+56',
            name: 'Chile'
        },
        {
            code: '+57',
            name: 'Colombia'
        },
        {
            code: '+506',
            name: 'Costa Rica'
        },
        {
            code: '+593',
            name: 'Ecuador'
        },
        {
            code: '+503',
            name: 'El Salvador'
        },
        {
            code: '+502',
            name: 'Guatemala'
        },
        {
            code: '+504',
            name: 'Honduras'
        },
        {
            code: '+52',
            name: 'Mexico'
        },
        {
            code: '+505',
            name: 'Nicaragua'
        },
        {
            code: '+507',
            name: 'Panama'
        },
        {
            code: '+595',
            name: 'Paraguay'
        },
        {
            code: '+51',
            name: 'Peru'
        },
        {
            code: '+1',
            name: 'United States'
        },
        {
            code: '+598',
            name: 'Uruguay'
        },
        {
            code: '+58',
            name: 'Venezuela'
        },
        {
            code: '+353',
            name: 'Ireland'
        },
    ];

    constructor(private _httpWrapper: HttpWrapperService) {}

    /**
     * Getter for categories
     */
    get projects$(): Observable < ProjectModel[] > {
        return this._projects.asObservable();
    }

    get currentProject$(): Observable < ProjectModel > {
        return this._currentProject.asObservable();
    }

    get currentAppRegistration$(): Observable < AppRegistrationModel > {
        return this._currentAppRegistration.asObservable();
    }

    get navigationHandler$(): Observable < any > {
        return this._navigationHandler.asObservable();
    }

    navigationChange(step: any): void {
        this._navigationHandler.next(step);
    }

    getAppRegistrationByProjectId(projectId: string): Observable < any > {
        return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/app-registrations/public`, {
            projectId,
        }).pipe(
            tap((response: any) => {
                // console.log({
                //     response
                // });
            })
        );
    }

    getAppRegistrationWithJWT(projectId: string): Observable < any > {
        return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/app-registrations`, {
            where_project: projectId,
            findOne: true,
            populates: [
                'project',
                'projectFlow',
                'informationValidation',
                'documentValidation',
                'biometricValidation',
            ],
        }).pipe(
            tap((response: any) => {
                // console.log({
                //     response
                // });

                this.currentAppRegistration = new AppRegistrationModel(response.data);

                this._currentAppRegistration.next(this.currentAppRegistration);
            })
        );
    }

    resyncAppRegistrationObject(): Observable < any > {
        return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/app-registrations`, {
            id: this.currentAppRegistration._id,
            findOne: true,
            populates: [
                'project',
                'projectFlow',
                'informationValidation',
                'documentValidation',
                'biometricValidation',
            ],
        }).pipe(
            tap((response: any) => {
                for (const key in response.data) {
                    this.currentAppRegistration[key] = response.data[key];
                }
            })
        );
    }

    getProjectForNewKYC(projectId: string, type: string = 'onboarding'): Observable < any > {
        return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/projects/kyc`, {
            id: projectId,
        }).pipe(
            tap((response: any) => {
                this.currentProject = new ProjectModel({
                    ...response.data,
                    type
                });

                this._currentProject.next(this.currentProject);
            })
        );
    }

    createAccount(projectId, data): Observable < any > {
        const url = `${this.baseUrl}v2/app-registrations`
        return this._httpWrapper.sendRequest('post', url, {
            project: projectId,
            ...data,
        }).pipe(
            tap((response: any) => {
                // console.log({
                //     response
                // });
            })
        );
    }

    sendEmailValidation(email: string): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/email-login`, {
            email,
            id: this.currentProject._id,
            type: 'onboarding',
        }).pipe(
            tap((response: any) => {
                // console.log({
                //     response
                // });
            })
        );
    }

    sendPhoneValidation(countryCode: string, phone: string): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/phone-login`, {
            phone,
            countryCode,
            id: this.currentProject._id,
            type: 'onboarding',
        }).pipe(
            tap((response: any) => {
                // console.log({
                //     response
                // });
            })
        );
    }

    updateAppRegistration(appRegistrationId: string, data: any): Observable < any > {
        return this._httpWrapper.sendRequest('put', `${this.baseUrl}v2/app-registrations/${appRegistrationId}`, data);
    }

    getForm(data: any): Observable < any > {
        return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/forms`, data)
    }

    postSubmitionForm(data: any): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/form-submitions`, data)
    }

    getBiometricsV2(): Observable < any > {
        return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/biometrics/config`, {}, {})
    }

    getSessionV2(agent): Observable < any > {
        return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/biometrics/session`, {}, {
            headers: {
                'X-User-Agent': agent
            }
        })
    }

    enrollmentV2(agent: string, body: any): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/biometrics/enroll`, body, {
            headers: {
                'X-User-Agent': agent
            }
        })
    }

    photoIDMatchV2(agent: string, body: any): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/match-idscan`, body, {
            headers: {
                'X-User-Agent': agent
            }
        })

    }

    authenticateV2(agent: string, body: any): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/biometrics/authenticate`, body, {
            headers: {
                'X-User-Agent': agent
            }
        })
    }

    idScanV2(agent: string, body: any): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/biometrics/idscan`, body, {
            headers: {
                'X-User-Agent': agent
            }
        })

    }

    livenessV2(agent: string, body: any): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/biometrics/liveness`, body, {
            headers: {
                'X-User-Agent': agent
            }
        })
    }

    getBiometrics(): Observable < any > {
        return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/projects/biometrics`, {}, {})
    }

    getSession(agent): Observable < any > {
        return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/projects/biometrics/session`, {}, {
            headers: {
                'X-User-Agent': agent
            }
        })
    }

    enrollment(agent: string, body: any): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/biometrics/sign-up`, body, {
            headers: {
                'X-User-Agent': agent
            }
        })
    }

    photoIDMatch(agent: string, body: any): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/photo-id`, body, {
            headers: {
                'X-User-Agent': agent
            }
        })

    }

    authenticate(projectId: string, agent: string, body: any): Observable < any > {
        body.id = projectId

        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/biometrics/sign-in`, body, {
            headers: {
                'X-User-Agent': agent
            }
        })
    }
}