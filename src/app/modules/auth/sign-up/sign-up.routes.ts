import { Routes } from "@angular/router";

import { AuthSignUpComponent } from "app/modules/auth/sign-up/sign-up.component";

import { environment } from "environments/environment";

const defaultPath = `/sign-in/${environment.verifikProject}`;

export default [
	{ path: "", pathMatch: "full", redirectTo: defaultPath },
	{
		path: ":id",
		component: AuthSignUpComponent,
	},
] as Routes;
