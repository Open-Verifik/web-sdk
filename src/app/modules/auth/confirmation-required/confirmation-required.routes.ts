import { Routes } from "@angular/router";
import { AuthConfirmationRequiredComponent } from "app/modules/auth/confirmation-required/confirmation-required.component";

export default [
	{
		path: ":id",
		component: AuthConfirmationRequiredComponent,
	},
] as Routes;
