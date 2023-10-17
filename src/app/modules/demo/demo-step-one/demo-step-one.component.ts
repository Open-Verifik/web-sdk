import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { RouterLink } from "@angular/router";
import { DemoService } from "../demo.service";

@Component({
	selector: "demo-step-one",
	templateUrl: "./demo-step-one.component.html",
	styleUrls: ["./demo-step-one.component.scss"],
	exportAs: "demo-step-one",
	standalone: true,
	imports: [FlexLayoutModule, RouterLink, MatCheckboxModule, MatButtonModule],
})
export class DemoStepOneComponent {
	canStartDemo: Boolean;

	constructor(private demoService: DemoService) {
		this.canStartDemo = false;
	}

	agreeToTerms(): void {
		this.canStartDemo = !Boolean(this.canStartDemo);
	}

	startDemo(): void {
		if (!this.canStartDemo) return;

		this.demoService.moveToStep(2);
	}
}
