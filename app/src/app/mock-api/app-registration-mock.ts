import {
    Injectable
} from '@angular/core';
import {
    FuseMockApiService
} from '@fuse/lib/mock-api';
import {
    ButtonMockService
} from 'app/modules/button-mock/button-mock.service';
import {
    ErrorMap,
    newAppRegistrationError,
    appRegistrationFake,
    keyMapInformation
} from './dataMock';

import QRCode from 'qrcode'

import {
    HttpClient
} from '@angular/common/http';
import {
    environment
} from 'environments/environment';
import {
    map
} from 'rxjs/operators';
import {
    Router
} from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AppRegistrationMockApi {
    private _baseUrl: string = environment.baseUrl;

    constructor(
        private _router: Router,
        private _http: HttpClient,
        private _fuseMockApiService: FuseMockApiService,
        private _buttonMockService: ButtonMockService) {
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        this._fuseMockApiService
            .onPost(`mockApi/v2/app-registrations`, 1000)
            .reply(({
                request
            }) => {
                if (newAppRegistrationError.includes(request.body.codeError)) {
                    this._buttonMockService.codeEnds = request.body.codeError
                    return ErrorMap[request.body.codeError]
                }
                this._buttonMockService.codeEnds = request.body.codeError === 'success' ? 'success' : 'code_error_invalid_success'

                appRegistrationFake.email = request.body.email
                appRegistrationFake.phone = request.body.phone

                let params = `?demo=1&token=fake-token-qr&email=${appRegistrationFake.email}&phone=${appRegistrationFake.phone}`
                for (const key in request.body) {
                    if (keyMapInformation[key] && request.body[key]) {
                        appRegistrationFake.informationValidation[key] = request.body[key]
                        params += `&${key}=${request.body[key]}`
                    }
                }

                const qrURL = window.location.href.split('?')[0] + params
                QRCode.toDataURL(qrURL).then((qrData) => {
                    localStorage.setItem('qr', qrData);
                })

                return [200, {
                    'data': {
                        'token': 'token-fake',
                    }
                }]

            });

        this._fuseMockApiService
            .onPut(`mockApi/v2/app-registrations/fake-id-appRegistration`, 1000)
            .reply(({
                request
            }) => {
                if (request.body.codeError === 'restart_demo') {
                    localStorage.clear()

                    this._router.navigate(['/kyc/start/', appRegistrationFake.project._id]);
                    
                    return ErrorMap[request.body.codeError]
                }

                this._buttonMockService.codeEnds = request.body.codeError === 'success' ? 'success' : 'code_error_invalid_success'

                let params = `?demo=1&token=fake-token-qr&email=${appRegistrationFake.email}&phone=${appRegistrationFake.phone}`

                for (const key in request.body.informationValidation) {
                    if (keyMapInformation[key] && request.body.informationValidation[key]) {
                        appRegistrationFake.informationValidation[key] = request.body.informationValidation[key]
                        params += `&${key}=${request.body.informationValidation[key]}`
                    }
                }

                const qrURL = window.location.href.split('?')[0] + params
                QRCode.toDataURL(qrURL).then((qrData) => {
                    localStorage.setItem('qr', qrData);
                })

                if (request.body.status === 'COMPLETED') {
                    appRegistrationFake.token = "token-fake-completed-appRegistgration"
                }

                return [200, {
                    "data": appRegistrationFake
                }]

            });



        this._fuseMockApiService
            .onGet(`mockApi/v2/app-registrations`, 400)
            .reply(({
                request
            }) => {
                if (!request.params.get('where_project')) {
                    return this._http.get(this._baseUrl + 'v2/projects/fake/biometrics', {
                        params: {
                            id: appRegistrationFake.project._id,
                            phone: appRegistrationFake.phone,
                            email: appRegistrationFake.email,
                        }
                    }).pipe(
                        map((result: any) => {
                            if (result.errors && result.errors.length !== 0) {
                                return [result.errors[0].status, result.errors[0]];
                            }

                            if (result.data.biometricValidation) {
                                appRegistrationFake.biometricValidation = result.data.biometricValidation
                            }

                            if (result.data.documentValidation) {
                                appRegistrationFake.documentValidation = result.data.documentValidation
                            }

                            return [200, {
                                data: appRegistrationFake
                            }];
                        }))
                }

                return this._http.get(this._baseUrl + 'v2/projects/kyc', {
                    params: {
                        id: request.params.get('where_project')
                    }
                }).pipe(
                    map((result: any) => {
                        if (result.errors && result.errors.length !== 0) {
                            return [result.errors[0].status, result.errors[0]];
                        }

                        appRegistrationFake.project = result.data
                        appRegistrationFake.projectFlow = result.data.projectFlows.find(projectFlow => projectFlow.type === 'onboarding')

                        return [200, {
                            data: appRegistrationFake
                        }];
                    }))
            });

    }
}