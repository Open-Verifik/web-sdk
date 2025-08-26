import { Route } from "@angular/router";
import { AuthGuard } from "app/core/auth/guards/auth.guard";
import { NoAuthGuard } from "app/core/auth/guards/noAuth.guard";
import { LayoutComponent } from "app/layout/layout.component";
import { environment } from "environments/environment";

// if its https://testing-access.verifik.co it should use sandboxProject
// if its production it should use verifikProject
// if its localhost it should use sandboxProject
const defaultPath =
    window.location.hostname.includes("localhost") || window.location.hostname.includes("staging-access.verifik.co")
        ? `/sign-in/${environment.sandboxProject}`
        : `/sign-in/${environment.verifikProject}`;

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    { path: "", pathMatch: "full", redirectTo: defaultPath },
    { path: "signed-in-redirect", pathMatch: "full", redirectTo: "demo" },
    {
        path: "",
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: "empty",
        },
        children: [
            {
                path: "confirmation-required",
                loadChildren: () => import("app/modules/auth/confirmation-required/confirmation-required.routes"),
            },
            {
                path: "kyc",
                loadChildren: () => import("app/modules/auth/kyc-steps/kyc-steps.routes"),
            },
            {
                path: "reset-password",
                loadChildren: () => import("app/modules/auth/reset-password/reset-password.routes"),
            },
            {
                path: "sign-in",
                loadChildren: () => import("app/modules/auth/sign-in/sign-in.routes"),
            },
            {
                path: "sign-up",
                loadChildren: () => import("app/modules/auth/sign-up/sign-up.routes"),
            },
        ],
    },
    {
        path: "",
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: "empty",
        },
        children: [
            {
                path: "sign-out",
                loadChildren: () => import("app/modules/auth/sign-out/sign-out.routes"),
            },
            {
                path: "unlock-session",
                loadChildren: () => import("app/modules/auth/unlock-session/unlock-session.routes"),
            },
        ],
    },
    {
        path: "",
        component: LayoutComponent,
        data: {
            layout: "empty",
        },
        children: [
            {
                path: "demo",
                loadChildren: () => import("app/modules/demo/demo.routes"),
            },
        ],
    },
    {
        path: "dev-test",
        component: LayoutComponent,
        data: {
            layout: "empty",
        },
        children: [
            {
                path: "",
                loadChildren: () => import("app/modules/dev-test/dev-test.routes"),
            },
        ],
    },
];
