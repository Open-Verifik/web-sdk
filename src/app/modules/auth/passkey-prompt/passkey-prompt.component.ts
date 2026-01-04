import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
	selector: "auth-passkey-prompt",
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule, TranslocoModule],
	templateUrl: "./passkey-prompt.component.html",
	styleUrls: ["./passkey-prompt.component.scss"],
})
export class PasskeyPromptComponent {
	@Output() choice = new EventEmitter<boolean>();
	@Input() title: string;
	@Input() description: string;

	onConfirm(): void {
		this.choice.emit(true);
	}

	onCancel(): void {
		this.choice.emit(false);
	}
}
