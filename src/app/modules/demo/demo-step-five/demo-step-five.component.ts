import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { StepperComponent } from "../stepper/stepper.component";

@Component({
	selector: "demo-step-five",
	templateUrl: "./demo-step-five.component.html",
	styleUrls: ["./demo-step-five.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, StepperComponent, MatButtonModule],
})
export class DemoStepFiveComponent {}
