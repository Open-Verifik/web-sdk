import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { DemoService } from "../demo.service";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";

@Component({
	selector: "id-details",
	templateUrl: "./id-details.component.html",
	styleUrls: ["./id-details.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, CommonModule, MatButtonModule, LeafletModule], // Add this line],
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

		this.documentId = localStorage.getItem("documentId");
	}

	ngOnInit(): void {
		if (!this.demoData.document?._id) {
			if (!this.documentId) {
				this._demoService.moveToStep(1);

				return;
			}

			this._requestDocument();
		}
	}

	_requestDocument(): void {
		this._demoService.requestDocument(this.documentId).subscribe(
			(response) => {
				this._demoService.setDemoDocument(response.data);

				console.log({ documentRequested: response.data });

				this._changeDetectorRef.markForCheck();
			},
			(error) => {
				console.error({ error });
				this._demoService.moveToStep(1);
			}
		);
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

		const location = await this._demoService.getAddress(this.demoData.lat, this.demoData.lng);

		console.log({ location });

		if (location) this.locationLoaded = true;
	}

	continue(): void {
		this._demoService.moveToStep(4);
	}
}
