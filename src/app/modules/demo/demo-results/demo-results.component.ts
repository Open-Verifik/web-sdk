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

		if (!this.demoData.document?._id) {
			this._getDocumentData();
		}
	}

	ngOnInit(): void {
		this._demoService.getDeviceDetails();

		this._changeDetectorRef.markForCheck();
	}

	_getDocumentData(): void {
		this._demoService.setDemoDocument({
			documentType: "CC",
			status: "ACTIVE_BUT_UNVERIFIED",
			imageValidated: false,
			validationMethod: "SCAN_PROMPT",
			type: "ocr",
			_id: "6530568940e03c18db76f5cc",
			deleted: false,
			documentNumber: "73.180.434",
			url: "https://cdn.verifik.co/ocr/samples/_cc22.png",
			OCRExtraction: {
				firstName: "JOSE ANTONIO",
				lastName: "GUZMAN VELASQUEZ",
				fullName: "JOSE ANTONIO GUZMAN VELASQUEZ",
				documentNumber: "73.180.434",
			},
			updatedAt: "2023-10-18T22:04:57.377Z",
			createdAt: "2023-10-18T22:04:57.377Z",
			__v: 0,
		});
	}

	hasLocation(): boolean {
		if (this.locationLoaded && this.demoData.lat && this.demoData.lng) return true;

		if (this.locationLoading || !this.demoData.lat || !this.demoData.lng) {
			return false;
		}

		this.locationLoading = true;

		this._demoService.reverseGeocodeWithOSM(this.demoData.lat, this.demoData.lng).then((location) => {
			if (!location) return;

			for (const key in location.address) {
				if (Object.prototype.hasOwnProperty.call(location.address, key)) {
					const value = location.address[key];

					this.demoData.location.push({ key, value });
				}
			}

			this.locationLoaded = true;
		});
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
