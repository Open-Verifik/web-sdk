import { Routes } from "@angular/router";

import { AuthSignUpComponent } from "app/modules/auth/sign-up/sign-up.component";

import { environment } from "environments/environment";

const defaultPath =
    window.location.hostname.includes("localhost") || window.location.hostname.includes("staging-access.verifik.co")
        ? `/sign-in/${environment.sandboxProject}`
        : `/sign-in/${environment.verifikProject}`;

export default [
    { path: "", pathMatch: "full", redirectTo: defaultPath },
    {
        path: ":id",
        component: AuthSignUpComponent,
    },
] as Routes;
