import {
    Injectable
} from '@angular/core';

import {
    environment
} from 'environments/environment';


@Injectable({
    providedIn: 'root'
})
export class AppRegistrationMockApi {
    private _baseUrl: string = environment.baseUrl;

    constructor() {
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
    }
}