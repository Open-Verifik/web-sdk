import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { StepperComponent } from "../stepper/stepper.component";
import { DemoService } from "../demo.service";
import { MatButtonModule } from "@angular/material/button";
import { FaceComponent } from "app/modules/web-sdk/face/face.component";

@Component({
	selector: "demo-step-four",
	templateUrl: "./demo-step-four.component.html",
	styleUrls: ["./demo-step-four.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, StepperComponent, MatButtonModule, FaceComponent],
})
export class DemoStepFourComponent implements OnInit {
	constructor(private _demoService: DemoService) {}

	ngOnInit(): void {}

	goBack(): void {
		this._demoService.moveToStep(3);
	}

	continue(): void {
		this._demoService.moveToStep(5);
	}
}
