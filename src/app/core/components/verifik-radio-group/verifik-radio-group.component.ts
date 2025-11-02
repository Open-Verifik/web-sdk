import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, forwardRef } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Subject } from "rxjs";

@Component({
    providers: [
        {
            multi: true,
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => VerifikRadioGroupComponent),
        },
    ],
    imports: [],
    selector: "verifik-radio-group",
    standalone: true,
    styleUrls: ["./verifik-radio-group.component.scss"],
    templateUrl: "./verifik-radio-group.component.html",
})
export class VerifikRadioGroupComponent implements OnInit, OnDestroy, ControlValueAccessor {
    @Input() disabled: boolean = false;
    @Input() name: string = "";
    @Input() multi: boolean = false; // New input for multi-selection mode
    @Input() hasError: boolean = false; // Input for error state

    private _destroy$ = new Subject<void>();
    private _value: string | string[] | null = null;
    private _onChange = (value: string | string[] | null) => {};
    private _onTouched = () => {};

    constructor(private _changeDetectorRef: ChangeDetectorRef) {}

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    get value(): string | string[] | null {
        return this._value;
    }

    writeValue(value: string | string[] | null): void {
        this._value = value;

        this._changeDetectorRef.detectChanges();
    }

    registerOnChange(fn: (value: string | string[] | null) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;

        this._changeDetectorRef.detectChanges();
    }

    selectValue(value: string): void {
        if (this.disabled) return;

        if (this.multi) {
            this._handleMultiSelection(value);
        } else {
            this._handleSingleSelection(value);
        }
    }

    private _handleSingleSelection(value: string): void {
        this._value = value;
        this._onChange(value);
        this._onTouched();
        this._changeDetectorRef.detectChanges();
    }

    private _handleMultiSelection(value: string): void {
        const currentValues = Array.isArray(this._value) ? this._value : [];

        if (currentValues.includes(value)) {
            this._value = currentValues.filter((v) => v !== value);
        } else {
            this._value = [...currentValues, value];
        }

        this._onChange(this._value);
        this._onTouched();
    }

    isSelected(value: string): boolean {
        if (this.multi) return Array.isArray(this._value) && this._value.includes(value);

        return this._value === value;
    }
}
