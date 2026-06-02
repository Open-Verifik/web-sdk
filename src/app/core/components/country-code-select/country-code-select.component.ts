import { CommonModule } from "@angular/common";
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation,
} from "@angular/core";
import { Subscription } from "rxjs";
import { AbstractControl, FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { TranslocoModule } from "@ngneat/transloco";

import { CountryCodeOption, CountryService } from "app/core/services/country.service";

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: "app-country-code-select",
    standalone: true,
    styleUrls: ["./country-code-select.component.scss"],
    templateUrl: "./country-code-select.component.html",
    imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, ReactiveFormsModule, TranslocoModule],
})
export class CountryCodeSelectComponent implements OnInit, OnDestroy {
    @ViewChild("countryCodeSearchInput") countryCodeSearchInput: ElementRef<HTMLInputElement>;

    @Input() control!: AbstractControl;
    @Input() disabled = false;
    @Input() fieldClass = "";
    @Input() label = "";
    @Input() readOnly = false;
    @Input() required = true;
    @Input() selectId = "countryCode";

    @Output() selectionChange = new EventEmitter<string>();

    countryCodes: CountryCodeOption[] = [];
    countryCodeSearchTerm = "";
    filteredCountryCodes: CountryCodeOption[] = [];
    selectedOptionId = "";

    private _controlValueSubscription?: Subscription;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _countryService: CountryService,
    ) {}

    get formControl(): FormControl<string | null> {
        return this.control as FormControl<string | null>;
    }

    get selectedCountry(): CountryCodeOption | null {
        if (!this.selectedOptionId) return null;

        return this._countryByOptionId(this.selectedOptionId);
    }

    ngOnInit(): void {
        this.countryCodes = this._countryService.countryCodes;
        this.filteredCountryCodes = this.countryCodes;
        this.syncSelectedOptionIdFromControl();

        this._controlValueSubscription = this.formControl.valueChanges.subscribe(() => {
            this.syncSelectedOptionIdFromControl();
        });
    }

    ngOnDestroy(): void {
        this._controlValueSubscription?.unsubscribe();
    }

    getOptionId(country: CountryCodeOption): string {
        return `${country.code}::${country.name}`;
    }

    compareDialCodeWithOptionId = (optionId: string, dialCode: string): boolean => {
        if (!optionId || !dialCode) return optionId === dialCode;

        if (this.selectedOptionId) return optionId === this.selectedOptionId;

        return this._countryByOptionId(optionId)?.code === dialCode;
    };

    onOptionSelected(optionId: string): void {
        const country = this._countryByOptionId(optionId);

        if (!country) return;

        this.selectedOptionId = optionId;

        if (this.formControl.value !== country.code) {
            this.formControl.setValue(country.code);
        }

        this._changeDetectorRef.markForCheck();
        this.selectionChange.emit(country.code);
    }

    trackByCountryCode(_index: number, country: CountryCodeOption): string {
        return `${country.code}-${country.name}`;
    }

    preventInputFocus(event: Event): void {
        event.stopPropagation();
    }

    onCountryCodeSearchChange(searchTerm: string): void {
        this.countryCodeSearchTerm = searchTerm;
        this.filteredCountryCodes = this._countryService.filterCountryCodeOptions(this.countryCodes, searchTerm);
    }

    clearCountryCodeSearch(event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        this.countryCodeSearchTerm = "";
        this.filteredCountryCodes = this.countryCodes;
        this._changeDetectorRef.detectChanges();

        setTimeout(() => this.countryCodeSearchInput?.nativeElement?.focus(), 0);
    }

    onCountryCodeSelectOpened(): void {
        this.countryCodeSearchTerm = "";
        this.filteredCountryCodes = this.countryCodes;

        setTimeout(() => this.countryCodeSearchInput?.nativeElement?.focus(), 100);
    }

    onCountryCodeSelectClosed(): void {
        this.countryCodeSearchTerm = "";
        this.filteredCountryCodes = this.countryCodes;
    }

    private syncSelectedOptionIdFromControl(): void {
        const dialCode = this.formControl.value;

        if (!dialCode) {
            this.selectedOptionId = "";
            return;
        }

        const current = this._countryByOptionId(this.selectedOptionId);

        if (current?.code === dialCode) return;

        const match = this.countryCodes.find((country) => country.code === dialCode);

        this.selectedOptionId = match ? this.getOptionId(match) : "";
        this._changeDetectorRef.markForCheck();
    }

    private _countryByOptionId(optionId: string): CountryCodeOption | null {
        if (!optionId) return null;

        const separatorIndex = optionId.indexOf("::");

        if (separatorIndex === -1) return null;

        const code = optionId.slice(0, separatorIndex);
        const name = optionId.slice(separatorIndex + 2);

        return this.countryCodes.find((country) => country.code === code && country.name === name) || null;
    }
}
