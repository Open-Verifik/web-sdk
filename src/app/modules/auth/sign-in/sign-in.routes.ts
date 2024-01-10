import { Routes } from "@angular/router";
import { AuthSignInComponent } from "app/modules/auth/sign-in/sign-in.component";
import { passwordlessLoginResolver } from "./passwordless-login.resolver";

export default [
	{
		path: ":id",
		component: AuthSignInComponent,
	},
] as Routes;
