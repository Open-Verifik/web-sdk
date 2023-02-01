import {
    Injectable
} from '@angular/core';
import {
    FuseMockApiService
} from '@fuse/lib/mock-api';

@Injectable({
    providedIn: 'root'
})
export class EmailValidationMockApi {

    constructor(private _fuseMockApiService: FuseMockApiService) {
        this.registerHandlers();
    }

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
       
    }
}