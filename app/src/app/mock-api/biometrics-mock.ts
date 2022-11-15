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
    ) {
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
       
    }
}