import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { RouterLink } from "@angular/router";

@Component({
	selector: "demo-step-one",
	templateUrl: "./demo-step-one.component.html",
	styleUrls: ["./demo-step-one.component.scss"],
	exportAs: "demo-step-one",
	standalone: true,
	imports: [FlexLayoutModule, RouterLink],
})
export class DemoStepOneComponent {}
