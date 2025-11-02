import { Routes } from "@angular/router";
import { DemoComponentsTestComponent } from "./demo-components-test.component";
import { SmartLivenessTestComponent } from "./smart-liveness-test.component";
import { ThemeTestComponent } from "./theme-test/theme-test.component";

export default [
    {
        path: "",
        children: [
            {
                path: "smart-liveness",
                component: SmartLivenessTestComponent,
                data: {
                    title: "Smart Liveness Test",
                },
            },
            {
                path: "theme-test",
                component: ThemeTestComponent,
                data: {
                    title: "Theme Test",
                },
            },
            {
                path: "demo-components",
                component: DemoComponentsTestComponent,
                data: {
                    title: "Demo Components Test",
                },
            },
            {
                path: "",
                redirectTo: "demo-components",
                pathMatch: "full",
            },
        ],
    },
] as Routes;
