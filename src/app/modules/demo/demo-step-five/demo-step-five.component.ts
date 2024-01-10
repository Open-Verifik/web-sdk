import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";

import { StepperComponent } from "../stepper/stepper.component";
import { DemoResultsComponent } from "../demo-results/demo-results.component";

@Component({
	selector: "demo-step-five",
	templateUrl: "./demo-step-five.component.html",
	styleUrls: ["./demo-step-five.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, StepperComponent, DemoResultsComponent],
})
export class DemoStepFiveComponent {}
