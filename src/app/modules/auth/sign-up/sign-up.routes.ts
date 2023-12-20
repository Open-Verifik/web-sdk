import { Routes } from "@angular/router";
import { AuthSignUpComponent } from "app/modules/auth/sign-up/sign-up.component";

export default [
	{
		path: ":id",
		component: AuthSignUpComponent,
	},
] as Routes;
