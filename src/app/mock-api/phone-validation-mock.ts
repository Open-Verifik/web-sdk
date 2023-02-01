import {
    Injectable
} from '@angular/core';
import {
    FuseMockApiService
} from '@fuse/lib/mock-api';

import { confirmPhoneValidError, ErrorMap, phoneValidError } from './dataMock';

@Injectable({
    providedIn: 'root'
})
export class PhoneValidationMockApi {

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
           
    }
}
