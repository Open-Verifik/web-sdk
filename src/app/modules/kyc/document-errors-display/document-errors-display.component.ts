import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "kyc-document-errors-display",
	templateUrl: "./document-errors-display.component.html",
	styleUrls: ["./document-errors-display.component.scss"],
	imports: [CommonModule, FlexLayoutModule, TranslocoModule, MatIconModule, MatButtonModule],
	standalone: true,
})
export class DocumentErrorsDisplayComponent implements OnInit {
	@Input() errorContent: any;
	@Input() attempts: number;
	@Input() attemptsLimit: number;
	@Input() dialogRef: any;
	@Input() callback: any;

	ngOnInit(): void {}

	tryAgain(reset: boolean): void {
		this.dialogRef ? this.dialogRef.close({ addAttempt: 1 }) : "do nothing";

		this.callback ? this.callback({ addAttempt: 1 }) : "do nothing";
	}

	restartDemo(): void {
		this.dialogRef ? this.dialogRef.close({ addAttempt: 1 }) : "do nothing";

		this.callback ? this.callback({ addAttempt: 1 }) : "do nothing";
	}
}
