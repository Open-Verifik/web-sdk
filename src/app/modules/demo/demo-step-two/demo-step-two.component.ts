import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { RouterLink } from "@angular/router";
import { StepperComponent } from "../stepper/stepper.component";
import { IdScanningComponent } from "../id-scanning/id-scanning.component";
import { DemoService } from "../demo.service";

@Component({
	selector: "demo-step-two",
	templateUrl: "./demo-step-two.component.html",
	styleUrls: ["./demo-step-two.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, RouterLink, MatCheckboxModule, MatButtonModule, StepperComponent, IdScanningComponent],
})
export class DemoStepTwoComponent implements OnInit {
	demoData: any;

	constructor(private _demoService: DemoService) {
		this.demoData = this._demoService.getDemoData();
	}

	ngOnInit(): void {
		this._demoService.getAddress(this.demoData.lat, this.demoData.lng);
	}
}
