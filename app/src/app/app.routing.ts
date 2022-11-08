/* eslint-disable @typescript-eslint/explicit-function-return-type */
// import { AuthBioSignUpComponent } from './modules/auth/bio-sign-up/bio-sign-up.component';
import {
    Route
} from '@angular/router';
import {
    AuthGuard
} from 'app/core/auth/guards/auth.guard';
import {
    NoAuthGuard
} from 'app/core/auth/guards/noAuth.guard';
import {
    LayoutComponent
} from 'app/layout/layout.component';
import {
    InitialDataResolver
} from 'app/app.resolvers';
import { environment } from 'environments/environment';

// @formatter:off
// tslint:disable:max-line-length
export const appRoutes: Route[] = [
    // Redirect empty path to '/login'
    {path: '', pathMatch : 'full', redirectTo: `passwordless/auth/${environment.projectId}`},

    // Auth routes for guests
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [{
            path: 'kyc',
            loadChildren: () => import('app/modules/kyc/kyc.module').then(m => m.KycModule),
        }, {
            path: 'passwordless',
            loadChildren: () => import('app/modules/passwordless/passwordless.module').then(m => m.PasswordlessModule),
        }]
    },
];