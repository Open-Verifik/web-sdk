import { Routes } from "@angular/router";

export default [
	{
		path: "",
		loadComponent: () => import("./demo-root/demo-root.component").then((m) => m.DemoRootComponent),
	},
	{
		path: "start",
		loadComponent: () => import("../web-sdk/web-sdk.component").then((m) => m.WebSdkComponent),
	},
	{
		path: "face",
		loadComponent: () => import("../web-sdk/face/face.component").then((m) => m.FaceComponent),
	},
] as Routes;
