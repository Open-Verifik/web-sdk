import {
    Injectable
} from '@angular/core';
import {
    FuseMockApiService
} from '@fuse/lib/mock-api';
import {
    ButtonMockService
} from 'app/modules/button-mock/button-mock.service';

import { confirmPhoneValidError, ErrorMap, phoneValidError } from './dataMock';

@Injectable({
    providedIn: 'root'
})
export class PhoneValidationMockApi {

    constructor(private _fuseMockApiService: FuseMockApiService, private _buttonMockService: ButtonMockService) {
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
            this._fuseMockApiService
            .onPost(`mockApi/v2/projects/phone-login`, 600)
            .reply(({
                request
            }) => {
                if (phoneValidError.includes(request.body.codeError)) {
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
                            'phone': request.body.phone,
                            'status': 'sent',
                            'expiresAt': expiredOTP.toISOString(),
                            'expiresIn': 14
                        }
                    }
                ]
            });

        this._fuseMockApiService
            .onPost(`mockApi/v2/projects/phone-login/confirm`, 600)
            .reply(({
                request
            }) => {
                if (confirmPhoneValidError.includes(request.body.codeError)) {
                    this._buttonMockService.codeEnds = request.body.codeError
                    return ErrorMap[request.body.codeError]
                }

                this._buttonMockService.codeEnds = request.body.codeError === 'success' ? 'success' : 'code_error_invalid_success'
                let expiredOTP = new Date()
                expiredOTP.setMinutes(expiredOTP.getMinutes() + 15)
                return [
                    200,
                    {
                        'data': 'fake-phone-token'
                    }
                ]
            });
    }
}
