import { Routes } from "@angular/router";

import { AuthSignInComponent } from "app/modules/auth/sign-in/sign-in.component";

import { environment } from "environments/environment";

const defaultPath = `/sign-in/${environment.verifikProject}`;

export default [
	{ path: "", pathMatch: "full", redirectTo: defaultPath },
	{
		path: ":id",
		component: AuthSignInComponent,
	},
] as Routes;
