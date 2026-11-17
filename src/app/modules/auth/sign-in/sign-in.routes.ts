import { Routes } from "@angular/router";

import { AuthSignInComponent } from "app/modules/auth/sign-in/sign-in.component";

import { environment } from "environments/environment";

const defaultPath =
    window.location.hostname.includes("localhost") || window.location.hostname.includes("staging-access.verifik.co")
        ? `/sign-in/${environment.sandboxProject}`
        : `/sign-in/${environment.verifikProject}`;

export default [
    { path: "", pathMatch: "full", redirectTo: defaultPath },
    { path: ":id/biometrics", redirectTo: ":id/human-id", pathMatch: "full" },
    {
        path: ":id/human-id",
        loadComponent: () =>
            import("../human-id-login/human-id-login.component").then(
                (m) => m.HumanIdLoginComponent
            ),
    },
    {
        path: ":id",
        component: AuthSignInComponent,
    },
] as Routes;
