import {
    Route
} from '@angular/router';
import {
    TutorialsRoutingRootComponent
} from './tutorials-routing-root/tutorials-routing-root.component';
import {
    TutorialsListComponent
} from './tutorials-list/tutorials-list.component';
import {
    TutorialComponent
} from './tutorial/tutorial.component';

export const TutorialsRoutes: Route[] = [{
    path: '',
    component: TutorialsRoutingRootComponent,
    resolve: {},
    children: [{
            path: '',
            pathMatch: 'full',
            component: TutorialsListComponent,
            resolve: {}
        },
        {
            path: ':id',
            component: TutorialComponent,
            resolve: {}
        }
    ]
}];