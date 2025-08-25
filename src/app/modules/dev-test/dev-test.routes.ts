import { Routes } from '@angular/router';
import { SmartLivenessTestComponent } from './smart-liveness-test.component';

export default [
    {
        path: '',
        children: [
            {
                path: 'smart-liveness',
                component: SmartLivenessTestComponent,
                data: {
                    title: 'Smart Liveness Test'
                }
            },
            {
                path: '',
                redirectTo: 'smart-liveness',
                pathMatch: 'full'
            }
        ]
    }
] as Routes;
