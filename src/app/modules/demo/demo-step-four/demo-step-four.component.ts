import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { StepperComponent } from "../stepper/stepper.component";
import { DemoService } from "../demo.service";
import { MatButtonModule } from "@angular/material/button";
import { TranslocoModule } from "@ngneat/transloco";
import { LivenessDetectionComponent } from "../liveness-detection/liveness-detection.component";
import { LivenessDetectionIOSComponent } from "../liveness-detection-ios/liveness-detection-ios.component";
import { CommonModule } from "@angular/common";

@Component({
	selector: "demo-step-four",
	templateUrl: "./demo-step-four.component.html",
	styleUrls: ["./demo-step-four.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [
		FlexLayoutModule,
		CommonModule,
		StepperComponent,
		MatButtonModule,
		LivenessDetectionComponent,
		LivenessDetectionIOSComponent,
		TranslocoModule,
	],
})
export class DemoStepFourComponent implements OnInit {
	demoData: any;

	constructor(private _demoService: DemoService) {
		localStorage.removeItem("liveness");

		localStorage.removeItem("livenessResult");

		this.demoData = this._demoService.getDemoData();

		this.demoData.liveness = {};

		this.demoData.livenessResult = [];
	}

	ngOnInit(): void {}

	goBack(): void {
		this._demoService.moveToStep(3);
	}

	continue(): void {}
}
