import { Routes } from "@angular/router";

import { VerifyShellComponent } from "./verify-shell.component";

export default [
	{
		path: ":projectId",
		component: VerifyShellComponent,
	},
] as Routes;
