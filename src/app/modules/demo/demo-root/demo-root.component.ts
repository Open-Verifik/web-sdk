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
import { TranslocoModule } from "@ngneat/transloco";
import { LanguagesComponent } from "app/layout/common/languages/languages.component";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";

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
		TranslocoModule,
		LanguagesComponent,
		MatProgressBarModule,
	],
})
export class DemoRootComponent implements OnInit {
	navigation: any;
	requirementsLoaded: boolean;
	step: number;
	demoData: any;

	constructor(private _demoService: DemoService, private _splashScreenService: FuseSplashScreenService) {
		this.demoData = {};

		this._splashScreenService.show();

		this.navigation = this._demoService.getNavigation();

		this._demoService.getDeviceDetails();

		this.step = Number(localStorage.getItem("step")) || 1;
	}

	async ngOnInit(): Promise<any> {
		this.demoData = this._demoService.getDemoData();

		if (this.step > 1) {
			this.demoData.loading = true;

			await this._loadContent();

			this._demoService.moveToStep(this.step);

			this._splashScreenService.hide();

			return;
		}

		this._demoService.cleanVariables();

		this.requirementsLoaded = true;

		this._splashScreenService.hide();
	}

	async _loadContent(): Promise<any> {
		this._demoService.getDeviceDetails();

		const location = await this._demoService.getAddress();

		this.requirementsLoaded = true;
	}

	talkToSales(): void {
		const url = "https://meetings.hubspot.com/lina-yepes";
		window.open(url, "_blank");
	}

	partnerWithUs(): void {
		const url = "https://verifik.co/en/partners/";

		window.open(url, "_blank");
	}
}
