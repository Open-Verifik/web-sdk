import { Component, ViewEncapsulation } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { DemoStepOneComponent } from "../demo-step-one/demo-step-one.component";

@Component({
	selector: "app-demo-root",
	templateUrl: "./demo-root.component.html",
	styleUrls: ["./demo-root.component.scss"],
	standalone: true,
	imports: [MatButtonModule, RouterLink, MatIconModule, FlexLayoutModule, DemoStepOneComponent],
})
export class DemoRootComponent {}
