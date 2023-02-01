/* eslint-disable @typescript-eslint/explicit-function-return-type */
// import { AuthBioSignUpComponent } from './modules/auth/bio-sign-up/bio-sign-up.component';
import {
    Route
} from '@angular/router';

import {
    LayoutComponent
} from 'app/layout/layout.component';

export const appRoutes: Route[] = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: `tutorials`
    },

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
            },
            {
                path: 'tutorials',
                loadChildren: () => import('app/modules/tutorials/tutorials.module').then(m => m.TutorialsModule),
            }
        ]
    },
];