import {
    Route
} from '@angular/router';
import {
    PasswordlessRootComponent
} from './passwordless-root/passwordless-root.component';
import {
    PasswordlessLoginComponent
} from './passwordless-login/passwordless-login.component';
import {
    PasswordlessLoginResolver
} from './passwordless-login.resolver';

export const PasswordlessRoutes: Route[] = [{
    path: '',
    component: PasswordlessRootComponent,
    resolve: {},
    children: [{
        path: 'auth/:id',
        pathMatch: 'full',
        component: PasswordlessLoginComponent,
        resolve: {
            project: PasswordlessLoginResolver,
        },
    }]
}];