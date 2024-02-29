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
		},
		{
			code: "+595",
			name: "Paraguay",
		},
		{
			code: "+51",
			name: "Peru",
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
	];

	constructor() {}

	findCountryCode(countryName): any {
		const country = this.countryCodes.find((c) => c.name === countryName);

		return country ? country.code : null; // Returns null if no match is found
	}
}
