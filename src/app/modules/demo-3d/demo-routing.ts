import {
    Route
} from '@angular/router';
import { DemoRootComponent } from './demo-root/demo-root.component';

export const DemoRoutes: Route[] = [{
    path: '',
    component: DemoRootComponent,
    resolve: {},
    // children: [{
    //         path: '',
    //         pathMatch: 'full',
    //         component: TutorialsListComponent,
    //         resolve: {}
    //     },
    //     {
    //         path: ':id',
    //         component: TutorialComponent,
    //         resolve: {}
    //     }
    // ]
}];