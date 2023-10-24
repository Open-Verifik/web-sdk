import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { DemoService } from "../demo.service";
import { CommonModule } from "@angular/common";

@Component({
	selector: "demo-results",
	templateUrl: "./demo-results.component.html",
	styleUrls: ["./demo-results.component.scss", "../demo-root/demo-root.component.scss", "../id-details/id-details.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, MatButtonModule, CommonModule],
})
export class DemoResultsComponent implements OnInit {
	demoData: any;
	generalInfoLoaded: boolean;
	locationLoaded: boolean;
	locationLoading: boolean;

	constructor(private _demoService: DemoService, private _changeDetectorRef: ChangeDetectorRef) {
		this.demoData = this._demoService.getDemoData();

		this.generalInfoLoaded = false;

		this.locationLoaded = false;

		this.locationLoading = false;
	}

	ngOnInit(): void {
		if (!this.demoData.document?._id && localStorage.getItem("documentId")) {
			this._getDocumentData();
		}

		if (!this.demoData.liveness?._id && localStorage.getItem("liveness")) {
			this._getLivenessData();
		}

		this._changeDetectorRef.markForCheck();

		if (!this.demoData.liveness?._id || !this.demoData.document?._id) {
			this._demoService.moveToStep(1);

			return;
		}
	}

	_getDocumentData(): void {
		let document = localStorage.getItem("document");

		if (document) {
			this.demoData.document = JSON.parse(document);

			this.demoData.extractedData = JSON.parse(localStorage.getItem("extractedData"));

			return;
		}

		this._changeDetectorRef.markForCheck();
	}

	_getLivenessData(): void {
		let liveness = localStorage.getItem("liveness");

		if (liveness) {
			this.demoData.liveness = JSON.parse(liveness);

			this.demoData.livenessResult = JSON.parse(localStorage.getItem("livenessResult"));

			return;
		}

		console.log({ liveness });

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
		this._demoService.moveToStep(1);
	}
}
