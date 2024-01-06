import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { RouterLink } from "@angular/router";
import { StepperComponent } from "../stepper/stepper.component";
import { IdScanningComponent } from "../id-scanning/id-scanning.component";
import { DemoService } from "../demo.service";
import { CommonModule } from "@angular/common";
import { TranslocoModule } from "@ngneat/transloco";
import { UploadFileComponent } from "../upload-file/upload-file.component";
import { MatDialog } from "@angular/material/dialog";
import { IdScanningIOSComponent } from "../id-scanning-ios/id-scanning-ios.component";

@Component({
	selector: "demo-step-two",
	templateUrl: "./demo-step-two.component.html",
	styleUrls: ["./demo-step-two.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [
		FlexLayoutModule,
		RouterLink,
		MatCheckboxModule,
		MatButtonModule,
		StepperComponent,
		IdScanningIOSComponent,
		IdScanningComponent,
		CommonModule,
		TranslocoModule,
		UploadFileComponent,
	],
})
export class DemoStepTwoComponent implements OnInit {
	demoData: any;
	selectOption: string;

	constructor(private _demoService: DemoService, private dialog: MatDialog) {
		this.demoData = this._demoService.getDemoData();
		this.selectOption = "";
	}

	ngOnInit(): void {
		this._demoService.getAddress();
	}

	openUploadFile() {
		const dialogRef = this.dialog.open(UploadFileComponent, {
			width: "900px",
		});

		dialogRef.afterClosed().subscribe((result) => {});
	}

	openCamera() {
		this.selectOption = "idscan";
	}
}
