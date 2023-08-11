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
        redirectTo: `demo`
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
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'demo'
        },
        children: [
            {
                path: 'demo',
                loadChildren: () => import('app/modules/demo-3d/demo-3d.module').then(m => m.Demo3dModule),
            }
        ]
    },
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'demo'
        },
        children: [
            {
                path: 'new-demo',
                loadChildren: () => import('app/modules/new-demo/demo-3d.module').then(m => m.Demo3dModule),
            }
        ]
    },
];