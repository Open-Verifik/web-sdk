import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { DemoService } from "../demo.service";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "app-stepper",
	templateUrl: "./stepper.component.html",
	styleUrls: ["./stepper.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, TranslocoModule],
})
export class StepperComponent implements OnInit {
	navigation: any;

	constructor(private _demoService: DemoService) {
		this.navigation = this._demoService.getNavigation();
	}

	ngOnInit(): void {}
}
