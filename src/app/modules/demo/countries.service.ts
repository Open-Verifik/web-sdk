import { Injectable } from "@angular/core";

import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class CountriesService {
    countryCodes = [
        {
            code: "+54",
            name: "Argentina",
        },
        {
            code: "+61",
            name: "Australia",
        },
        {
            code: "+43",
            name: "Austria",
        },
        {
            code: "+32",
            name: "Belgium",
        },
        {
            code: "+55",
            name: "Brazil",
        },
        {
            code: "+1",
            name: "Canada",
        },
        {
            code: "+56",
            name: "Chile",
        },
        {
            code: "+57",
            name: "Colombia",
        },
        {
            code: "+506",
            name: "Costa Rica",
        },
        {
            code: "+593",
            name: "Ecuador",
        },
        {
            code: "+503",
            name: "El Salvador",
        },
        {
            code: "+33",
            name: "France",
        },
        {
            code: "+49",
            name: "Germany",
        },
        {
            code: "+502",
            name: "Guatemala",
        },
        {
            code: "+504",
            name: "Honduras",
        },
        {
            code: "+91",
            name: "India",
        },
        {
            code: "+353",
            name: "Ireland",
        },
        {
            code: "+39",
            name: "Italy",
        },
        {
            code: "+52",
            name: "Mexico",
            nameWithSpecials: "México",
        },
        {
            code: "+31",
            name: "Netherlands",
        },
        {
            code: "+505",
            name: "Nicaragua",
        },
        {
            code: "+47",
            name: "Norway",
        },
        {
            code: "+507",
            name: "Panama",
            nameWithSpecials: "Panamá",
        },
        {
            code: "+595",
            name: "Paraguay",
        },
        {
            code: "+51",
            name: "Peru",
            nameWithSpecials: "Perú",
        },
        {
            code: "+351",
            name: "Portugal",
        },
        {
            code: "+1-787",
            name: "Puerto Rico",
        },
        {
            code: "+1-939",
            name: "Puerto Rico",
        },
        {
            code: "+7",
            name: "Russia",
        },
        {
            code: "+34",
            name: "Spain",
            nameWithSpecials: "España",
        },
        {
            code: "+46",
            name: "Sweden",
        },
        {
            code: "+41",
            name: "Switzerland",
        },
        {
            code: "+1-868",
            name: "Trinidad and Tobago",
        },
        {
            code: "+44",
            name: "United Kingdom",
        },
        {
            code: "+1",
            name: "United States",
        },
        {
            code: "+598",
            name: "Uruguay",
        },
        {
            code: "+58",
            name: "Venezuela",
        },
        {
            code: "+86",
            name: "China",
        },
        {
            code: "+91",
            name: "India",
        },
        {
            code: "+81",
            name: "Japan",
        },
        {
            code: "+82",
            name: "South Korea",
        },
        {
            code: "+62",
            name: "Indonesia",
        },
        {
            code: "+60",
            name: "Malaysia",
        },
        {
            code: "+66",
            name: "Thailand",
        },
        {
            code: "+63",
            name: "Philippines",
        },
        {
            code: "+92",
            name: "Pakistan",
        },
        {
            code: "+65",
            name: "Singapore",
        },
        {
            code: "+971",
            name: "United Arab Emirates",
        },
        {
            code: "+90",
            name: "Turkey",
        },
        {
            code: "+880",
            name: "Bangladesh",
        },
        {
            code: "+94",
            name: "Sri Lanka",
        },
        {
            code: "+976",
            name: "Mongolia",
        },
    ];

    constructor() {}

    findCountryCode(countryName): any {
        const country = this.countryCodes.find((c) => c.name === countryName);

        if (!country) {
            const countrySpecial = this.countryCodes.find((c) => c.nameWithSpecials === countryName);

            return countrySpecial ? countrySpecial.code : null; // Returns null if no match is found
        }
        return country ? country.code : null; // Returns null if no match is found
    }

    findCountry(countryName): any {
        const country = this.countryCodes.find((c) => c.name === countryName);

        if (!country) {
            const countrySpecial = this.countryCodes.find((c) => c.nameWithSpecials === countryName);

            return countrySpecial ? countrySpecial.name : null; // Returns null if no match is found
        }
        return country ? country.name : null; // Returns null if no match is found
    }
}
