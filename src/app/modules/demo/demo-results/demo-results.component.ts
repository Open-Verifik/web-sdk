import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { DemoService } from "../demo.service";
import { CommonModule } from "@angular/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "demo-results",
	templateUrl: "./demo-results.component.html",
	styleUrls: ["./demo-results.component.scss", "../demo-root/demo-root.component.scss", "../id-details/id-details.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, MatButtonModule, CommonModule, MatProgressSpinnerModule, TranslocoModule],
})
export class DemoResultsComponent implements OnInit {
	demoData: any;
	generalInfoLoaded: boolean;
	locationLoaded: boolean;
	locationLoading: boolean;
	documentFrontSideUrl: string;

	constructor(private _demoService: DemoService, private _changeDetectorRef: ChangeDetectorRef) {
		this.demoData = this._demoService.getDemoData();

		this.generalInfoLoaded = false;

		this.locationLoaded = false;

		this.locationLoading = false;

		this.documentFrontSideUrl = this.demoData.pro?.url || this.demoData.studio?.url || this.demoData.prompt?.url;
		console.log("got constructor");
	}

	ngOnInit(): void {
		if (!this.demoData.liveness?._id && localStorage.getItem("liveness")) {
			this._getLivenessData();
		}

		this._changeDetectorRef.markForCheck();

		if (!this.demoData.liveness?._id) {
			this._demoService.moveToStep(1);

			return;
		}
	}

	_getLivenessData(): void {
		let liveness = localStorage.getItem("liveness");

		if (liveness) {
			this.demoData.liveness = JSON.parse(liveness);

			this.demoData.livenessResult = JSON.parse(localStorage.getItem("livenessResult"));

			return;
		}

		this._demoService.moveToStep(1);
	}

	hasLocation(): boolean {
		if (this.locationLoaded && this.demoData.lat && this.demoData.lng) return true;

		if (this.locationLoading || !this.demoData.lat || !this.demoData.lng) {
			return false;
		}
	}

	hasGeneralInformation(): boolean {
		if (this.generalInfoLoaded) return true;

		if (this.demoData.generalInformation.length) {
			this.generalInfoLoaded = true;

			return this.generalInfoLoaded;
		}
	}

	restartDemo(): void {
		this._demoService.cleanVariables();

		this._demoService.moveToStep(1);
	}
}
