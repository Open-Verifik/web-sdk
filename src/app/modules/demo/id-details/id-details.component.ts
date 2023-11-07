import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { DemoService } from "../demo.service";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "id-details",
	templateUrl: "./id-details.component.html",
	styleUrls: ["./id-details.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, CommonModule, MatButtonModule, LeafletModule, TranslocoModule], // Add this line],
})
export class IdDetailsComponent implements OnInit {
	demoData: any;
	generalInfoLoaded: boolean;
	locationLoaded: boolean;
	locationLoading: boolean;
	documentId: string;

	constructor(private _demoService: DemoService, private _changeDetectorRef: ChangeDetectorRef) {
		this.demoData = this._demoService.getDemoData();

		this.generalInfoLoaded = false;

		this.locationLoaded = false;

		this.locationLoading = false;
	}

	ngOnInit(): void {
		if (this.demoData.extractedData) {
			for (let index = this.demoData.extractedData.length - 1; index >= 0; index--) {
				const extractedRow = this.demoData.extractedData[index];

				if (extractedRow.key === "details") {
					this.demoData.extractedData.splice(index, 1);
				}
			}
		}
	}

	hasGeneralInformation(): boolean {
		if (this.generalInfoLoaded) return true;

		if (this.demoData.generalInformation.length) {
			this.generalInfoLoaded = true;

			return this.generalInfoLoaded;
		}
	}

	async hasLocation(): Promise<boolean> {
		if (this.locationLoaded && this.demoData.lat && this.demoData.lng) return true;

		if (this.locationLoading || !this.demoData.lat || !this.demoData.lng) {
			return false;
		}

		if (this.demoData.location.length) return true;

		this.locationLoading = true;

		const location = await this._demoService.getAddress();

		if (location) this.locationLoaded = true;
	}

	continue(): void {
		this._demoService.moveToStep(4);
	}

	scanAgain(): void {
		localStorage.removeItem("documentId");

		localStorage.removeItem("document");

		localStorage.removeItem("extractedData");

		this.demoData.document = {};

		this.demoData.extractedData = [];

		this._demoService.moveToStep(2);
	}
}
