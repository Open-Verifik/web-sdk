import {
    Route
} from '@angular/router';
import {
    DemoRootComponent
} from './demo-root/demo-root.component';
import {
    DemoResolver
} from './demo.resolver';

export const DemoRoutes: Route[] = [{
        path: '',
        component: DemoRootComponent,
        resolve: {},
    },
    {
        path: ':id',
        component: DemoRootComponent,
        resolve: {
            token: DemoResolver
        }
    }
];