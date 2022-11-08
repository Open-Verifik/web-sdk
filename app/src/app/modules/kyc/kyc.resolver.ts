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
    throwError
} from 'rxjs';
import {
    KycService
} from './kyc.service';
import {
    catchError
} from 'rxjs/operators';
import {
    ButtonMockService
} from '../button-mock/button-mock.service';
import {
    appRegistrationFake,
    keyMapInformation
} from 'app/mock-api/dataMock';

@Injectable({
    providedIn: 'root'
})
export class KycResolver implements Resolve < boolean > {
    /**
     * Constructor
     */
    constructor(private _router: Router,
        private _kycService: KycService,
        private _buttonMockService: ButtonMockService
    ) {

    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable < any > {
        if (route.queryParams.demo) {
            localStorage.clear()

            this._buttonMockService.isDemo = true
            appRegistrationFake.email = route.queryParams.email
            appRegistrationFake.phone = route.queryParams.phone
            for (const key in route.queryParams) {
                if (keyMapInformation[key]) {
                    appRegistrationFake.informationValidation[key] = route.queryParams[key]
                }
            }
        }
        if (route.queryParams.token) {
            localStorage.setItem('accessToken', route.queryParams.token);
        }

        const projectId = route.params.id;

        const JWT = localStorage.getItem('accessToken');

        if (JWT && route.routeConfig.path === 'start/:id') {
            this._router.navigate(['/kyc/project/', projectId]);
        }

        if (!JWT && route.routeConfig.path === 'project/:id') {
            this._router.navigate(['/kyc/start/', projectId]);
        }

        if (!JWT) {
            return this._kycService.getProjectForNewKYC(projectId).pipe(
                catchError((error) => {
                    // Log the error
                    console.error(error);

                    // Get the parent url
                    const parentUrl = state.url.split('/').slice(0, -1).join('/');

                    // Navigate to there
                    this._router.navigateByUrl(parentUrl);

                    // Throw an error
                    return throwError(error);
                })
            );
        }

        return this._kycService.getAppRegistrationWithJWT(projectId).pipe(
            catchError((error) => {
                // Log the error
                // alert(JSON.stringify(error));

                localStorage.removeItem('accessToken');

                this._router.navigate(['/kyc/start/', projectId]);

                // Throw an error
                return throwError(error);
            })
        );
    }
}