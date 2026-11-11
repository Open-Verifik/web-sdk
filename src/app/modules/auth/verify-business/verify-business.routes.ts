import { Routes } from "@angular/router";

import { VerifyBusinessShellComponent } from "./verify-business-shell.component";

export default [
	{
		path: ":projectId",
		component: VerifyBusinessShellComponent,
	},
] as Routes;
