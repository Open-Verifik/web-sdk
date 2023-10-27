import { Component } from "@angular/core";
import { IdDetailsComponent } from "../id-details/id-details.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { StepperComponent } from "../stepper/stepper.component";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "demo-step-three",
	templateUrl: "./demo-step-three.component.html",
	styleUrls: ["./demo-step-three.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, StepperComponent, IdDetailsComponent, TranslocoModule],
})
export class DemoStepThreeComponent {}
