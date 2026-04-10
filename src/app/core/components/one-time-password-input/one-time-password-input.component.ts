import { CommonModule } from "@angular/common";
import { Component, forwardRef, Input, OnInit, ViewChild } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
    selector: "one-time-password-input",
    standalone: true,
    styleUrls: ["./one-time-password-input.component.scss"],
    template: `
        <div class="otp-input-container inline-flex justify-between items-start gap-4 relative w-full">
            <div
                (click)="focusInput(i)"
                [class.otp-digit--active]="i === currentIndex && isFocused"
                [class.otp-digit--disabled]="isDisabled"
                [class.otp-digit--enabled]="!isDisabled"
                [class.otp-digit--error]="hasError"
                *ngFor="let digit of digits; let i = index"
                class="otp-digit sm:w-14 w-10 sm:p-4 p-2 rounded-md border-2 flex justify-center items-center"
            >
                <div class="inline-flex flex-col justify-center items-start relative">
                    <div
                        class="otp-digit-text justify-start text-3xl font-semibold leading-tight"
                        [class.opacity-0]="!digit"
                        [class.otp-digit-text--disabled]="isDisabled"
                    >
                        {{ digit || "8" }}
                    </div>
                    <!-- Cursor indicator -->
                    <div *ngIf="i === currentIndex && isFocused && !isDisabled" class="otp-cursor-blink"></div>
                </div>
            </div>

            <!-- Loading overlay -->
            <div *ngIf="isDisabled" class="absolute inset-0 flex justify-center items-center">
                <mat-progress-spinner diameter="34" mode="indeterminate" color="primary"></mat-progress-spinner>
            </div>
        </div>

        <input
            (blur)="onBlur()"
            (focus)="onFocus()"
            (input)="onInput($event)"
            (keydown)="onKeyDown($event)"
            (paste)="onPaste($event)"
            [id]="inputId"
            #hiddenInput
            autocomplete="one-time-code"
            class="otp-hidden-input"
            inputmode="numeric"
            maxlength="6"
            pattern="[0-9]*"
            type="text"
        />
    `,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => OneTimePasswordInputComponent),
            multi: true,
        },
    ],
})
export class OneTimePasswordInputComponent implements ControlValueAccessor, OnInit {
    @ViewChild("hiddenInput") hiddenInput: any;

    @Input() length: number = 6;
    @Input() hasError: boolean = false;
    @Input() inputId: string = "";
    @Input() projectBranding: any = null;

    private _previousValue: string = "";

    currentIndex: number = -1;
    digits: string[] = [];
    isDisabled: boolean = false;
    isFocused: boolean = false;
    value: string = "";

    ngOnInit(): void {
        this.digits = new Array(this.length).fill("");
        // Auto-focus the first digit when component initializes
        setTimeout(() => this.focusFirstDigit(), 100);
    }

    private onChange = (value: string) => {};

    private onTouched = () => {};

    writeValue(value: string): void {
        this.value = value || "";
        this._previousValue = this.value;
        this.updateDigits();
        queueMicrotask(() => {
            this.syncHiddenInputFromModel();
            this.scheduleCaretToEnd();
        });
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;

        if (isDisabled) {
            this.isFocused = false;
            this.currentIndex = -1;
        } else {
            // When re-enabled, focus the first digit if no value exists
            if (this.value.length === 0) {
                setTimeout(() => this.focusFirstDigit(), 100);
            }
        }

        if (this.hiddenInput) {
            this.hiddenInput.nativeElement.disabled = isDisabled;
        }
    }

    onInput(event: Event): void {
        if (this.isDisabled) return;

        const input = event.target as HTMLInputElement;
        const inputValue = input.value.replace(/[^0-9]/g, "");

        // Early exit if value hasn't changed
        if (inputValue === this._previousValue) return;

        this.value = inputValue;

        this.updateDigits();

        this.currentIndex = Math.min(this.value.length, this.length - 1);

        // Only notify model change when all digits are filled
        if (this.value.length === this.length) {
            this.onChange(this.value);
            this.onTouched();
        }

        this._previousValue = this.value;
        this.scheduleCaretToEnd();
    }

    onKeyDown(event: KeyboardEvent): void {
        const input = event.target as HTMLInputElement;

        // Handle backspace
        if (event.key === "Backspace") {
            if (input.selectionStart === 0 && this.value.length > 0) {
                const newValue = this.value.slice(0, -1);

                if (newValue === this._previousValue) return;

                this.value = newValue;
                this.updateDigits();

                // Only notify if complete
                if (this.value.length === this.length) {
                    this.onChange(this.value);
                }

                this._previousValue = this.value;
                this.syncHiddenInputFromModel();
                this.scheduleCaretToEnd();
            }

            return;
        }

        // Handle arrow keys
        if (event.key === "ArrowLeft") {
            this.currentIndex = Math.max(0, this.currentIndex - 1);

            return;
        }

        if (event.key === "ArrowRight") {
            this.currentIndex = Math.min(this.length - 1, this.currentIndex + 1);

            return;
        }

        // Handle numeric input - let onInput handle this to avoid double processing
        if (event.key >= "0" && event.key <= "9" && this.value.length < this.length) {
            this.currentIndex = Math.min(this.length - 1, this.currentIndex + 1);
        }
    }

    onPaste(event: ClipboardEvent): void {
        event.preventDefault();

        const pastedData = event.clipboardData?.getData("text") || "";
        const numericData = pastedData.replace(/[^0-9]/g, "");

        if (numericData.length === 0) return;

        // Take only the first 'length' characters
        const newValue = numericData.slice(0, this.length);

        if (newValue === this._previousValue) return;

        this.value = newValue;
        this.updateDigits();

        // Only notify model change when all digits are filled
        if (this.value.length === this.length) {
            this.onChange(this.value);
            this.onTouched();
        }

        this._previousValue = this.value;

        this.currentIndex = Math.min(this.value.length, this.length - 1);
        this.syncHiddenInputFromModel();
        this.scheduleCaretToEnd();
    }

    onFocus(): void {
        this.isFocused = true;

        // If no value yet, focus on first digit, otherwise focus on next available position
        this.currentIndex = this.value.length === 0 ? 0 : Math.min(this.value.length, this.length - 1);
    }

    onBlur(): void {
        this.isFocused = false;
        this.currentIndex = -1;

        this.onTouched();
    }

    focusFirstDigit(): void {
        if (this.isDisabled) return;

        this.focusInput(0);
    }

    focusInput(index: number): void {
        if (this.isDisabled) return;

        this.currentIndex = index;
        this.isFocused = true;

        // Clear value from clicked position onwards to allow editing
        if (this.value.length > index) {
            this.value = this.value.substring(0, index);

            this.updateDigits();

            this._previousValue = this.value;
            this.syncHiddenInputFromModel();
        }

        if (!this.hiddenInput) return;

        const el = this.hiddenInput.nativeElement as HTMLInputElement;
        el.focus();
        requestAnimationFrame(() => {
            if (typeof el.setSelectionRange === "function") {
                el.setSelectionRange(index, index);
            }
        });
    }

    private syncHiddenInputFromModel(): void {
        const el = this.hiddenInput?.nativeElement as HTMLInputElement | undefined;
        if (!el || this.isDisabled) return;
        if (el.value !== this.value) {
            el.value = this.value;
        }
    }

    /**
     * iOS Safari resets selection when the value binding fights the DOM; keep caret at end after input.
     */
    private scheduleCaretToEnd(): void {
        const el = this.hiddenInput?.nativeElement as HTMLInputElement | undefined;
        if (!el || this.isDisabled || typeof el.setSelectionRange !== "function") return;
        const len = this.value.length;
        requestAnimationFrame(() => {
            el.setSelectionRange(len, len);
        });
    }

    private updateDigits(): void {
        this.digits = new Array(this.length).fill("");

        for (let i = 0; i < this.value.length && i < this.length; i++) {
            this.digits[i] = this.value[i];
        }
    }
}
