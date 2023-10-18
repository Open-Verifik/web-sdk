import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { DemoStepOneComponent } from "../demo-step-one/demo-step-one.component";
import { DemoService } from "../demo.service";
import { CommonModule } from "@angular/common";
import { DemoStepTwoComponent } from "../demo-step-two/demo-step-two.component";
import { DemoStepThreeComponent } from "../demo-step-three/demo-step-three.component";
import { DemoStepFourComponent } from "../demo-step-four/demo-step-four.component";
import { DemoStepFiveComponent } from "../demo-step-five/demo-step-five.component";
import { DemoFooterComponent } from "../demo-footer/demo-footer.component";

@Component({
	selector: "app-demo-root",
	templateUrl: "./demo-root.component.html",
	styleUrls: ["./demo-root.component.scss"],
	standalone: true,
	imports: [
		MatButtonModule,
		RouterLink,
		MatIconModule,
		FlexLayoutModule,
		DemoStepOneComponent,
		DemoStepTwoComponent,
		DemoStepThreeComponent,
		DemoStepFourComponent,
		DemoStepFiveComponent,
		CommonModule,
		DemoFooterComponent,
	],
})
export class DemoRootComponent implements OnInit {
	navigation: any;

	constructor(private demoService: DemoService) {
		this.navigation = this.demoService.getNavigation();
	}

	ngOnInit(): void {
		console.log({ navigation: this.navigation });
	}
}
