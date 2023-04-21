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
        children: [
            {
                path: 'tutorials',
                loadChildren: () => import('app/modules/tutorials/tutorials.module').then(m => m.TutorialsModule),
            }
        ]
    },
];