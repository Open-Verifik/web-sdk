import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from "@angular/core";

export interface VerifySelectOption {
	label: string;
	value: unknown;
}

let nextId = 0;

/**
 * A listbox dropdown that replaces the native <select>: the arrow keeps its distance from the border, the list
 * follows the active look, and it works with the keyboard (arrows, Home/End, Enter, Escape, type to jump).
 */
@Component({
	selector: "verify-select",
	standalone: true,
	imports: [CommonModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./verify-select.component.html",
	styleUrls: ["./verify-select.component.scss"],
})
export class VerifySelectComponent {
	@Input() options: VerifySelectOption[] = [];
	@Input() value: unknown = null;
	@Input() placeholder = "—";
	@Input() ariaLabel = "";
	@Input() disabled = false;
	@Output() valueChange = new EventEmitter<unknown>();

	readonly listId = `verify-select-${nextId++}`;

	open = false;
	active = -1;

	private _cdr = inject(ChangeDetectorRef);
	private _host = inject<ElementRef<HTMLElement>>(ElementRef);
	private _typed = "";
	private _typedTimer: ReturnType<typeof setTimeout> | null = null;

	get selected(): VerifySelectOption | null {
		return this.options.find((option) => option.value === this.value) || null;
	}

	trackByIndex(index: number): number {
		return index;
	}

	optionId(index: number): string {
		return `${this.listId}-${index}`;
	}

	toggle(): void {
		if (this.disabled) return;

		if (this.open) this._close();
		else this._open();
	}

	choose(option: VerifySelectOption): void {
		this.valueChange.emit(option.value);
		this._close();
	}

	onKeydown(event: KeyboardEvent): void {
		if (this.disabled) return;

		const last = this.options.length - 1;

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				if (!this.open) this._open();
				else this._move(Math.min(this.active + 1, last));
				return;
			case "ArrowUp":
				event.preventDefault();
				if (!this.open) this._open();
				else this._move(Math.max(this.active - 1, 0));
				return;
			case "Home":
				if (!this.open) return;
				event.preventDefault();
				this._move(0);
				return;
			case "End":
				if (!this.open) return;
				event.preventDefault();
				this._move(last);
				return;
			case "Enter":
			case " ":
				event.preventDefault();
				if (!this.open) this._open();
				else if (this.options[this.active]) this.choose(this.options[this.active]);
				return;
			case "Escape":
				if (!this.open) return;
				event.preventDefault();
				event.stopPropagation();
				this._close();
				return;
			case "Tab":
				if (this.open) this._close();
				return;
		}

		if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) this._typeAhead(event.key);
	}

	@HostListener("document:click", ["$event"])
	onDocumentClick(event: MouseEvent): void {
		if (this.open && !this._host.nativeElement.contains(event.target as Node)) this._close();
	}

	private _open(): void {
		const index = this.options.findIndex((option) => option.value === this.value);

		this.open = true;
		this.active = index >= 0 ? index : 0;
		this._cdr.markForCheck();
		setTimeout(() => this._scrollToActive());
	}

	private _close(): void {
		this.open = false;
		this.active = -1;
		this._cdr.markForCheck();
	}

	private _move(index: number): void {
		this.active = index;
		this._cdr.markForCheck();
		this._scrollToActive();
	}

	private _typeAhead(char: string): void {
		if (this._typedTimer) clearTimeout(this._typedTimer);

		this._typed += char.toLowerCase();
		this._typedTimer = setTimeout(() => (this._typed = ""), 600);

		const index = this.options.findIndex((option) => option.label.toLowerCase().startsWith(this._typed));

		if (index < 0) return;
		if (!this.open) this._open();

		this._move(index);
	}

	private _scrollToActive(): void {
		this._host.nativeElement.querySelector(`#${this.optionId(this.active)}`)?.scrollIntoView({ block: "nearest" });
	}
}
