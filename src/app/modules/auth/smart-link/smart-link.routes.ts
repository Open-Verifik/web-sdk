import { Routes } from "@angular/router";

import { SmartLinkReceiptComponent } from "./smart-link-receipt.component";
import { SmartLinkResolverComponent } from "./smart-link-resolver.component";

export default [
	{
		path: ":slugOrToken/receipt",
		component: SmartLinkReceiptComponent,
	},
	{
		path: ":slugOrToken",
		component: SmartLinkResolverComponent,
	},
] as Routes;
