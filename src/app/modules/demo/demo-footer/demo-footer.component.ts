import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "app-demo-footer",
	templateUrl: "./demo-footer.component.html",
	styleUrls: ["./demo-footer.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, CommonModule, DemoFooterComponent, TranslocoModule],
})
export class DemoFooterComponent {}
