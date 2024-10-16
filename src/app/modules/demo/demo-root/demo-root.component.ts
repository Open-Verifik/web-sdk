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
import Hotjar from "@hotjar/browser";
import { Lead, Session } from "../lead";

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
	lead: Lead;
	session: Session;

	constructor(private _demoService: DemoService, private _splashScreenService: FuseSplashScreenService) {
		this.demoData = {};

		this.demoData.loading = true;

		this._splashScreenService.show();

		this.navigation = this._demoService.getNavigation();

		this._demoService.getDeviceDetails();

		this.step = Number(localStorage.getItem("step")) || 1;

		// const siteId = 3732219;

		// const hotjarVersion = 6;

		// Hotjar.init(siteId, hotjarVersion);
	}

	async ngOnInit(): Promise<any> {
		this.demoData = this._demoService.getDemoData();

		this.lead = this._demoService.getLead();

		this.session = this._demoService.getSession();

		if (this.step > 1) {
			this.demoData.loading = true;

			await this._loadContent();

			this._demoService.moveToStep(this.step);

			this.demoData.loading = false;

			this._splashScreenService.hide();

			return;
		}

		this._demoService.cleanVariables();

		this.requirementsLoaded = true;

		this._splashScreenService.hide();
	}

	async _loadContent(): Promise<any> {
		this._demoService.getDeviceDetails();

		await this._demoService.getAddress();

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

	restartDemo(): void {
		this._demoService.cleanVariables();

		this._demoService.moveToStep(1);
	}
}
