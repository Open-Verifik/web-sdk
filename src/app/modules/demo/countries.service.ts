import { Injectable } from "@angular/core";

import { CountryService } from "app/core/services/country.service";

/**
 * @deprecated Use {@link CountryService} instead. Retained for backward compatibility only.
 */
@Injectable({
    providedIn: "root",
})
export class CountriesService {
    constructor(private _countryService: CountryService) {}

    get countryCodes() {
        return this._countryService.countryCodes;
    }

    findCountryCode(countryName: string): string | null {
        return this._countryService.findCountryCodeByName(countryName);
    }

    findCountry(countryName: string): string | null {
        const code = this.findCountryCode(countryName);

        if (!code) return null;

        const match = this._countryService.countries.find((c) => this.findCountryCode(c.country) === code);

        return match?.country ?? null;
    }
}
