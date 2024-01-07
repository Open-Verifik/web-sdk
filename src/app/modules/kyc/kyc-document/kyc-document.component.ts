import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { fuseAnimations } from "@fuse/animations";
import { FuseSplashScreenService } from "@fuse/services/splash-screen";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";
import { DemoService } from "app/modules/demo/demo.service";

import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { RouterLink } from "@angular/router";
import { IdScanningIOSComponent } from "app/modules/demo/id-scanning-ios/id-scanning-ios.component";
import { IdScanningComponent } from "app/modules/demo/id-scanning/id-scanning.component";
import { StepperComponent } from "app/modules/demo/stepper/stepper.component";
import { UploadFileComponent } from "app/modules/demo/upload-file/upload-file.component";
import { MatDialog } from "@angular/material/dialog";

@Component({
	selector: "kyc-document",
	templateUrl: "./kyc-document.component.html",
	styleUrls: ["./kyc-document.component.scss"],
	animations: fuseAnimations,
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
export class KycDocumentComponent implements OnInit {
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
