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
    confirmEmailValidError,
    emailValidError,
    ErrorMap,
} from './dataMock';

@Injectable({
    providedIn: 'root'
})
export class EmailValidationMockApi {

    constructor(private _fuseMockApiService: FuseMockApiService, private _buttonMockService: ButtonMockService) {
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        this._fuseMockApiService
            .onPost(`mockApi/v2/projects/email-login`, 600)
            .reply(({
                request
            }) => {
                // console.log(request.body.codeError )
                if (emailValidError.includes(request.body.codeError)) {
                    this._buttonMockService.codeEnds = request.body.codeError
                    return ErrorMap[request.body.codeError]
                }

                this._buttonMockService.codeEnds = request.body.codeError === 'success' ? 'success' : 'code_error_invalid_success'
                let expiredOTP = new Date()
                expiredOTP.setMinutes(expiredOTP.getMinutes() + 15)
                return [
                    200,
                    {
                        'data': {
                            'id': 'fake-id-emailConfirmation',
                            'email': request.body.email,
                            'status': 'sent',
                            'expiresAt': expiredOTP.toISOString(),
                            'expiresIn': 14
                        }
                    }
                ]
            });

        this._fuseMockApiService
            .onPost(`mockApi/v2/projects/email-login/confirm`, 600)
            .reply(({
                request
            }) => {
                // console.log(request.body.codeError )
                if (confirmEmailValidError.includes(request.body.codeError)) {
                    this._buttonMockService.codeEnds = request.body.codeError
                    return ErrorMap[request.body.codeError]
                }

                this._buttonMockService.codeEnds = request.body.codeError === 'success' ? 'success' : 'code_error_invalid_success'
                let expiredOTP = new Date()
                expiredOTP.setMinutes(expiredOTP.getMinutes() + 15)
                return [
                    200,
                    {
                        'data': 'fake-email-token'
                    }
                ]
            });

    }
}