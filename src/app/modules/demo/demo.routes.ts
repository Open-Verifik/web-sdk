import { Routes } from "@angular/router";
// import { DemoRootComponent } from "./demo-root/demo-root.component";
// import { WebSdkComponent } from "./web-sdk/web-sdk.component";

export default [
	{
		path: "",
		// component: DemoRootComponent,
		loadComponent: () => import("./demo-root/demo-root.component").then((m) => m.DemoRootComponent),
	},
	{
		path: "start",
		// component: WebSdkComponent,
		loadComponent:() => import("../web-sdk/web-sdk.component").then( m => m.WebSdkComponent ),
	},
	// {
	// 	path: "card",
	// 	// component: WebSdkComponent,
	// 	loadComponent:() => import("../web-sdk/scan/scan.component").then( m => m.ScanComponent ),
	// },
	{
		path: "face",
		// component: WebSdkComponent,
		loadComponent:() => import("../web-sdk/face/face.component").then( m => m.FaceComponent ),
	},
] as Routes;
