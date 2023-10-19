import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { DemoService } from "../demo.service";
import { CommonModule } from "@angular/common";

@Component({
	selector: "id-details",
	templateUrl: "./id-details.component.html",
	styleUrls: ["./id-details.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, CommonModule],
})
export class IdDetailsComponent implements OnInit {
	demoData: any;

	constructor(private _demoService: DemoService, private _changeDetectorRef: ChangeDetectorRef) {
		this.demoData = this._demoService.getDemoData();

		if (!this.demoData.document?._id) {
			this._getDocumentData();
		}
	}

	ngOnInit(): void {
		console.log({ demoData: this.demoData });

		this._changeDetectorRef.markForCheck();
	}

	_getDocumentData(): void {
		// set fake data again
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
}
