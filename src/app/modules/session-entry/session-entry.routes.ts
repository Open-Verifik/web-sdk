import { Routes } from "@angular/router";
import { SessionEntryComponent } from "./session-entry.component";

export default [
	{
		path: ":sessionToken",
		component: SessionEntryComponent,
	},
] as Routes;
