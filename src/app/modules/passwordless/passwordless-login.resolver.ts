import {
    Injectable
} from '@angular/core';
import {
    Router,
    Resolve,
    RouterStateSnapshot,
    ActivatedRouteSnapshot
} from '@angular/router';
import {
    Observable,
    of ,
    throwError
} from 'rxjs';
import {
    KycService
} from '../kyc/kyc.service';
import {
    catchError
} from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class PasswordlessLoginResolver implements Resolve < boolean > {

    /**
     * Constructor
     */
    constructor(private _router: Router,
        private _kycService: KycService
    ) {

    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable < any > {
        const projectId = route.params.id;

        return this._kycService.getProjectForNewKYC(projectId, 'login').pipe(
            catchError((error) => {
                // Log the error
                console.error({
                    message: error.message
                });

                // Get the parent url
                const parentUrl = state.url.split('/').slice(0, -1).join('/');

                // Navigate to there
                this._router.navigateByUrl(parentUrl);

                // Throw an error
                return throwError(error);
            })
        );
    }
}