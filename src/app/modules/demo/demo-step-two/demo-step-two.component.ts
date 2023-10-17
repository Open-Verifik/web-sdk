import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { RouterLink } from "@angular/router";

@Component({
	selector: "demo-step-two",
	templateUrl: "./demo-step-two.component.html",
	styleUrls: ["./demo-step-two.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, RouterLink, MatCheckboxModule, MatButtonModule],
})
export class DemoStepTwoComponent implements OnInit {
	constructor() {}

	ngOnInit(): void {}
}
