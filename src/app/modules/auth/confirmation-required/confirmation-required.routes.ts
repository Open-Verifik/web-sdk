import { Routes } from "@angular/router";

import { AuthConfirmationRequiredComponent } from "app/modules/auth/confirmation-required/confirmation-required.component";

import { environment } from "environments/environment";

const defaultPath = `/sign-in/${environment.verifikProject}`;

export default [
	{ path: "", pathMatch: "full", redirectTo: defaultPath },
	{
		path: ":id",
		component: AuthConfirmationRequiredComponent,
	},
] as Routes;
