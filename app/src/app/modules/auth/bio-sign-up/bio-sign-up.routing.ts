import { Route } from '@angular/router';
import { AuthBioSignUpComponent } from 'app/modules/auth/bio-sign-up/bio-sign-up.component';

export const authBioSignUnRoutes: Route[] = [
    {
        path     : '',
        component: AuthBioSignUpComponent
    }
];
