import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { RouterLink } from "@angular/router";
import { DemoService } from "../demo.service";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "demo-step-one",
	templateUrl: "./demo-step-one.component.html",
	styleUrls: ["./demo-step-one.component.scss", "../demo-root/demo-root.component.scss"],
	exportAs: "demo-step-one",
	standalone: true,
	imports: [FlexLayoutModule, RouterLink, MatCheckboxModule, MatButtonModule, TranslocoModule],
})
export class DemoStepOneComponent {
	canStartDemo: Boolean;

	constructor(private _demoService: DemoService) {
		this.canStartDemo = false;
	}

	agreeToTerms(): void {
		this.canStartDemo = !Boolean(this.canStartDemo);
	}

	startDemo(): void {
		if (!this.canStartDemo) return;

		this._demoService.moveToStep(2);
	}
}
