import {
    KycRoutesRootComponent
} from './kyc-routes-root/kyc-routes-root.component';
import {
    KycProjectComponent
} from './kyc-project/kyc-project.component';
import {
    KycResolver
} from './kyc.resolver';
import {
    Route
} from '@angular/router';
import {
    KycAccountCreationWithBasicInformationComponent
} from './kyc-account-creation-with-basic-information/kyc-account-creation-with-basic-information.component';

// default route /verifik/passwordless
export const KYCRoutes: Route[] = [{
    path: '',
    component: KycRoutesRootComponent,
    resolve: {},
    children: [{
        path: 'project/:id',
        pathMatch: 'full',
        component: KycProjectComponent,
        resolve: {
            project: KycResolver,
        },
    }, {
        path: 'start/:id',
        pathMatch: 'full',
        component: KycAccountCreationWithBasicInformationComponent,
        resolve: {
            project: KycResolver,
        },
    }]
}];