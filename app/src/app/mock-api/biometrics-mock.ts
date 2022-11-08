import {
    HttpClient
} from '@angular/common/http';
import {
    Injectable
} from '@angular/core';
import {
    ActivatedRouteSnapshot
} from '@angular/router';
import {
    FuseMockApiService
} from '@fuse/lib/mock-api';
import {
    ButtonMockService
} from 'app/modules/button-mock/button-mock.service';
import {
    environment
} from 'environments/environment';
import {
    throwError
} from 'rxjs';
import {
    catchError,
    map
} from 'rxjs/operators';
import {
    appRegistrationFake,
    biometricError,
    ErrorMap,
} from './dataMock';

@Injectable({
    providedIn: 'root'
})
export class BiometricMockApi {
    private _baseUrl: string = environment.baseUrl;

    constructor(
        private _fuseMockApiService: FuseMockApiService,
        private _buttonMockService: ButtonMockService,
        private _http: HttpClient,
    ) {
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        this._fuseMockApiService
            .onPost(`mockApi/v2/projects/biometrics/sign-in`, 600)
            .reply(({
                request
            }) => {

                if (biometricError.includes(request.body.codeError)) {
                    this._buttonMockService.codeEnds = request.body.codeError
                    return ErrorMap[request.body.codeError]
                }

                if (request.body.codeError === 'Validate_backend') {

                    return this._http.post(this._baseUrl + 'v2/projects/fake/biometrics', request.body, {
                        headers: {
                            'X-User-Agent': request.headers.get('X-User-Agent')
                        }
                    }).pipe(
                        map((result: any) => {
                            if (result.errors && result.errors.length !== 0) {
                                return [result.errors[0].status, result.errors[0]];
                            }

                            if (result.data.status === 'validated') {
                                result.data.token = 'fake-biometric-validated-token'
                            }

                            return [200, result];
                        }))
                }

                this._buttonMockService.codeEnds = request.body.codeError === 'success' ? 'success' : 'code_error_invalid_success'

                return [
                    200,
                    {
                        'data': {
                            token: 'fake-biometric-token',
                            success: true,
                        }
                    }
                ]
            });

        this._fuseMockApiService
            .onPost(`mockApi/v2/projects/biometrics/sign-up`, 600)
            .reply(({
                request
            }) => {
                if (biometricError.includes(request.body.codeError)) {
                    this._buttonMockService.codeEnds = request.body.codeError
                    return ErrorMap[request.body.codeError]
                }

                request.body.id = appRegistrationFake.project._id
                request.body.type = 'onboarding'
                request.body.email = appRegistrationFake.email
                request.body.phone = appRegistrationFake.phone

                return this._http.post(this._baseUrl + 'v2/projects/fake/biometrics', request.body, {
                    headers: {
                        'X-User-Agent': request.headers.get('X-User-Agent')
                    }
                }).pipe(
                    map((result: any) => {
                        if (result.errors && result.errors.length !== 0) {
                            return [result.errors[0].status, result.errors[0]];
                        }

                        if (result.data.status === 'validated') {
                            appRegistrationFake.biometricValidation = result.data
                        }

                        return [200, result];
                    })
                )

            });

        this._fuseMockApiService
            .onPost(`mockApi/v2/projects/photo-id`, 600)
            .reply(({
                request
            }) => {
                if (biometricError.includes(request.body.codeError)) {
                    this._buttonMockService.codeEnds = request.body.codeError
                    return ErrorMap[request.body.codeError]
                }

                request.body.type = 'scanId'
                request.body.id = appRegistrationFake.project._id
                request.body.informationValidation = appRegistrationFake.informationValidation
                request.body.email = appRegistrationFake.email
                request.body.phone = appRegistrationFake.phone


                return this._http.post(this._baseUrl + 'v2/projects/fake/biometrics', request.body, {
                    headers: {
                        'X-User-Agent': request.headers.get('X-User-Agent')
                    }
                }).pipe(
                    map((result: any) => {
                        if (result.errors && result.errors.length !== 0) {
                            return [result.errors[0].status, result.errors[0]];
                        }

                        appRegistrationFake.documentValidation = result.data

                        return [200, result];
                    })
                )

            });

    }
}