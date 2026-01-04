import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "auth-passkey-success",
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule, TranslocoModule],
	templateUrl: "./passkey-success.component.html",
	styleUrls: ["./passkey-success.component.scss"],
})
export class PasskeySuccessComponent {
	@Input() title: string;
	@Input() description: string;
	@Input() buttonText: string;
	@Output() continue = new EventEmitter<void>();

	onContinue(): void {
		this.continue.emit();
	}
}
