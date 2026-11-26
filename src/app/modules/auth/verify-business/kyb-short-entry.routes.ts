import { Routes } from "@angular/router";
import { KybShortEntryComponent } from "./kyb-short-entry.component";

export default [
	{
		path: ":code",
		component: KybShortEntryComponent,
	},
	{
		path: "",
		component: KybShortEntryComponent,
	},
] as Routes;
