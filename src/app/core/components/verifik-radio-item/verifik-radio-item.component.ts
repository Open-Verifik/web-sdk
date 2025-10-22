import { NgClass, NgIf, NgTemplateOutlet } from "@angular/common";
import { Component, Input, OnChanges, OnDestroy, OnInit, Optional, SimpleChanges } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { VerifikRadioGroupComponent } from "../verifik-radio-group/verifik-radio-group.component";

@Component({
    imports: [NgIf, NgTemplateOutlet, NgClass, ReactiveFormsModule, MatIconModule],
    selector: "verifik-radio-item",
    standalone: true,
    styleUrls: ["./verifik-radio-item.component.scss"],
    templateUrl: "./verifik-radio-item.component.html",
})
export class VerifikRadioItemComponent implements OnInit, OnDestroy, OnChanges {
    @Input() disabled: boolean = false;
    @Input() formControl: FormControl | null = null;
    @Input() icon: string | null = null;
    @Input() label: string = "";
    @Input() name: string = "";
    @Input() value: string = "";
    @Input() variant: "default" | "pill" | "slab" = "default";

    private _destroy$ = new Subject<void>();

    constructor(@Optional() private _radioGroup: VerifikRadioGroupComponent) {}

    ngOnInit(): void {
        if (this.formControl && !this._radioGroup) {
            this._updateSelectionState();
            this._subscribeToFormControlChanges();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes["formControl"] || changes["value"]) && !this._radioGroup) {
            if (!this.formControl) return;

            this._updateSelectionState();
            this._subscribeToFormControlChanges();
        }
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    get isSelected(): boolean {
        if (this._radioGroup) return this._radioGroup.isSelected(this.value);

        return this.formControl?.value === this.value || false;
    }

    get isDisabled(): boolean {
        if (this._radioGroup) return this._radioGroup.disabled || this.disabled;

        return this.disabled;
    }

    get isMultiMode(): boolean {
        return this._radioGroup?.multi || false;
    }

    get role(): string {
        return this.isMultiMode ? "checkbox" : "radio";
    }

    get ariaChecked(): boolean | string {
        if (this.isMultiMode) return this.isSelected;

        return this.isSelected ? "true" : "false";
    }

    get hasIcon(): boolean {
        return !!this.icon;
    }

    get isIconSvg(): boolean {
        return this.icon?.startsWith("<svg") || false;
    }

    get hasError(): boolean {
        if (this._radioGroup) return this._radioGroup.hasError;

        return !!(this.formControl?.errors && this.formControl.touched);
    }

    private _updateSelectionState(): void {
        if (!this.formControl) return;
        // Remove manual change detection - let Angular handle it naturally
    }

    private _subscribeToFormControlChanges(): void {
        if (!this.formControl) return;

        this._destroy$.next();

        this.formControl.valueChanges.pipe(takeUntil(this._destroy$)).subscribe(() => {
            // Remove manual change detection - let Angular handle it naturally
        });
    }

    onSelect(): void {
        if (this.isDisabled) return;

        if (this._radioGroup) {
            this._radioGroup.selectValue(this.value);
        } else if (this.formControl) {
            this.formControl.setValue(this.value);
        }
        // Remove manual change detection - let Angular handle it naturally
    }

    onKeyDown(event: KeyboardEvent): void {
        if (this.isDisabled) return;

        if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            this.onSelect();
        }
    }

    get combinedClasses(): string {
        return "self-stretch inline-flex justify-between items-center cursor-pointer transition-all duration-200 ease-in-out gap-2 w-full";
    }
}
