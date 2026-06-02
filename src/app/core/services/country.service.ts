import { Injectable } from "@angular/core";

export interface CountryOption {
    name: string;
    code: string;
    country: string;
}

export interface CountryCodeOption {
    code: string;
    name: string;
}

export interface PhoneLengthMapping {
    [countryCode: string]: [min: number, max: number];
}

@Injectable({
    providedIn: "root",
})
export class CountryService {
    private _cachedCountryCodes: CountryCodeOption[] | null = null;
    private _countryMap = new Map<string, CountryOption>();
    private _countryNameToTranslationKey = new Map<string, string>();

    constructor() {
        this.countries.forEach((country) => {
            if (this._countryMap.has(country.country)) return;

            this._countryMap.set(country.country, country);
            this._countryNameToTranslationKey.set(country.name, country.name);
        });
    }

    get countryCodes(): CountryCodeOption[] {
        if (!this._cachedCountryCodes) {
            this._cachedCountryCodes = this._buildCountryCodes();
        }

        return this._cachedCountryCodes;
    }

    filterCountryCodeOptions(options: CountryCodeOption[], searchTerm: string): CountryCodeOption[] {
        if (!searchTerm?.trim()) return options;

        const term = searchTerm.toLowerCase().trim();

        return options.filter(
            (country) => country.code.toLowerCase().includes(term) || country.name.toLowerCase().includes(term),
        );
    }

    private _buildCountryCodes(): CountryCodeOption[] {
        return [
            // North America
            {
                code: "+1",
                name: "country.united_states",
            },
            {
                code: "+1",
                name: "country.canada",
            },
            {
                code: "+52",
                name: this._countryNameToTranslationKey.get("Mexico") || "Mexico",
            },
            // Central America
            {
                code: "+502",
                name: this._countryNameToTranslationKey.get("Guatemala") || "Guatemala",
            },
            {
                code: "+503",
                name: this._countryNameToTranslationKey.get("El Salvador") || "El Salvador",
            },
            {
                code: "+504",
                name: this._countryNameToTranslationKey.get("Honduras") || "Honduras",
            },
            {
                code: "+505",
                name: this._countryNameToTranslationKey.get("Nicaragua") || "Nicaragua",
            },
            {
                code: "+506",
                name: this._countryNameToTranslationKey.get("Costa Rica") || "Costa Rica",
            },
            {
                code: "+507",
                name: this._countryNameToTranslationKey.get("Panama") || "Panama",
            },

            // South America
            {
                code: "+54",
                name: this._countryNameToTranslationKey.get("Argentina") || "Argentina",
            },
            {
                code: "+55",
                name: this._countryNameToTranslationKey.get("Brazil") || "Brazil",
            },
            {
                code: "+56",
                name: this._countryNameToTranslationKey.get("Chile") || "Chile",
            },
            {
                code: "+57",
                name: this._countryNameToTranslationKey.get("Colombia") || "Colombia",
            },
            {
                code: "+593",
                name: this._countryNameToTranslationKey.get("Ecuador") || "Ecuador",
            },
            {
                code: "+595",
                name: this._countryNameToTranslationKey.get("Paraguay") || "Paraguay",
            },
            {
                code: "+51",
                name: this._countryNameToTranslationKey.get("Peru") || "Peru",
            },
            {
                code: "+598",
                name: this._countryNameToTranslationKey.get("Uruguay") || "Uruguay",
            },
            {
                code: "+58",
                name: this._countryNameToTranslationKey.get("Venezuela") || "Venezuela",
            },
            {
                code: "+591",
                name: this._countryNameToTranslationKey.get("Bolivia") || "Bolivia",
            },
            {
                code: "+592",
                name: this._countryNameToTranslationKey.get("Guyana") || "Guyana",
            },
            {
                code: "+597",
                name: this._countryNameToTranslationKey.get("Suriname") || "Suriname",
            },

            // Europe
            {
                code: "+44",
                name: this._countryNameToTranslationKey.get("United Kingdom") || "United Kingdom",
            },
            {
                code: "+33",
                name: this._countryNameToTranslationKey.get("France") || "France",
            },
            {
                code: "+49",
                name: this._countryNameToTranslationKey.get("Germany") || "Germany",
            },
            {
                code: "+39",
                name: this._countryNameToTranslationKey.get("Italy") || "Italy",
            },
            {
                code: "+34",
                name: this._countryNameToTranslationKey.get("Spain") || "Spain",
            },
            {
                code: "+31",
                name: this._countryNameToTranslationKey.get("Netherlands") || "Netherlands",
            },
            {
                code: "+46",
                name: this._countryNameToTranslationKey.get("Sweden") || "Sweden",
            },
            {
                code: "+47",
                name: this._countryNameToTranslationKey.get("Norway") || "Norway",
            },
            {
                code: "+45",
                name: this._countryNameToTranslationKey.get("Denmark") || "Denmark",
            },
            {
                code: "+358",
                name: this._countryNameToTranslationKey.get("Finland") || "Finland",
            },
            {
                code: "+41",
                name: this._countryNameToTranslationKey.get("Switzerland") || "Switzerland",
            },
            {
                code: "+43",
                name: this._countryNameToTranslationKey.get("Austria") || "Austria",
            },
            {
                code: "+32",
                name: this._countryNameToTranslationKey.get("Belgium") || "Belgium",
            },
            {
                code: "+351",
                name: this._countryNameToTranslationKey.get("Portugal") || "Portugal",
            },
            {
                code: "+353",
                name: this._countryNameToTranslationKey.get("Ireland") || "Ireland",
            },
            {
                code: "+7",
                name: this._countryNameToTranslationKey.get("Russia") || "Russia",
            },
            {
                code: "+48",
                name: this._countryNameToTranslationKey.get("Poland") || "Poland",
            },
            {
                code: "+420",
                name: this._countryNameToTranslationKey.get("Czech Republic") || "Czech Republic",
            },
            {
                code: "+421",
                name: this._countryNameToTranslationKey.get("Slovakia") || "Slovakia",
            },
            {
                code: "+36",
                name: this._countryNameToTranslationKey.get("Hungary") || "Hungary",
            },
            {
                code: "+40",
                name: this._countryNameToTranslationKey.get("Romania") || "Romania",
            },
            {
                code: "+359",
                name: this._countryNameToTranslationKey.get("Bulgaria") || "Bulgaria",
            },
            {
                code: "+30",
                name: this._countryNameToTranslationKey.get("Greece") || "Greece",
            },
            {
                code: "+385",
                name: this._countryNameToTranslationKey.get("Croatia") || "Croatia",
            },
            {
                code: "+386",
                name: this._countryNameToTranslationKey.get("Slovenia") || "Slovenia",
            },
            {
                code: "+387",
                name: this._countryNameToTranslationKey.get("Bosnia and Herzegovina") || "Bosnia and Herzegovina",
            },
            {
                code: "+381",
                name: this._countryNameToTranslationKey.get("Serbia") || "Serbia",
            },
            {
                code: "+382",
                name: this._countryNameToTranslationKey.get("Montenegro") || "Montenegro",
            },
            {
                code: "+389",
                name: this._countryNameToTranslationKey.get("North Macedonia") || "North Macedonia",
            },
            {
                code: "+355",
                name: this._countryNameToTranslationKey.get("Albania") || "Albania",
            },
            {
                code: "+380",
                name: this._countryNameToTranslationKey.get("Ukraine") || "Ukraine",
            },
            {
                code: "+375",
                name: this._countryNameToTranslationKey.get("Belarus") || "Belarus",
            },
            {
                code: "+373",
                name: this._countryNameToTranslationKey.get("Moldova") || "Moldova",
            },
            {
                code: "+370",
                name: this._countryNameToTranslationKey.get("Lithuania") || "Lithuania",
            },
            {
                code: "+371",
                name: this._countryNameToTranslationKey.get("Latvia") || "Latvia",
            },
            {
                code: "+372",
                name: this._countryNameToTranslationKey.get("Estonia") || "Estonia",
            },
            {
                code: "+354",
                name: this._countryNameToTranslationKey.get("Iceland") || "Iceland",
            },
            {
                code: "+352",
                name: this._countryNameToTranslationKey.get("Luxembourg") || "Luxembourg",
            },
            {
                code: "+356",
                name: this._countryNameToTranslationKey.get("Malta") || "Malta",
            },
            {
                code: "+357",
                name: this._countryNameToTranslationKey.get("Cyprus") || "Cyprus",
            },

            // Asia
            {
                code: "+86",
                name: this._countryNameToTranslationKey.get("China") || "China",
            },
            {
                code: "+81",
                name: this._countryNameToTranslationKey.get("Japan") || "Japan",
            },
            {
                code: "+82",
                name: this._countryNameToTranslationKey.get("South Korea") || "South Korea",
            },
            {
                code: "+91",
                name: this._countryNameToTranslationKey.get("India") || "India",
            },
            {
                code: "+62",
                name: this._countryNameToTranslationKey.get("Indonesia") || "Indonesia",
            },
            {
                code: "+60",
                name: this._countryNameToTranslationKey.get("Malaysia") || "Malaysia",
            },
            {
                code: "+66",
                name: this._countryNameToTranslationKey.get("Thailand") || "Thailand",
            },
            {
                code: "+63",
                name: this._countryNameToTranslationKey.get("Philippines") || "Philippines",
            },
            {
                code: "+92",
                name: this._countryNameToTranslationKey.get("Pakistan") || "Pakistan",
            },
            {
                code: "+65",
                name: this._countryNameToTranslationKey.get("Singapore") || "Singapore",
            },
            {
                code: "+880",
                name: this._countryNameToTranslationKey.get("Bangladesh") || "Bangladesh",
            },
            {
                code: "+94",
                name: this._countryNameToTranslationKey.get("Sri Lanka") || "Sri Lanka",
            },
            {
                code: "+977",
                name: this._countryNameToTranslationKey.get("Nepal") || "Nepal",
            },
            {
                code: "+93",
                name: this._countryNameToTranslationKey.get("Afghanistan") || "Afghanistan",
            },
            {
                code: "+98",
                name: this._countryNameToTranslationKey.get("Iran") || "Iran",
            },
            {
                code: "+964",
                name: this._countryNameToTranslationKey.get("Iraq") || "Iraq",
            },
            {
                code: "+90",
                name: this._countryNameToTranslationKey.get("Turkey") || "Turkey",
            },
            {
                code: "+971",
                name: this._countryNameToTranslationKey.get("United Arab Emirates") || "United Arab Emirates",
            },
            {
                code: "+966",
                name: this._countryNameToTranslationKey.get("Saudi Arabia") || "Saudi Arabia",
            },
            {
                code: "+974",
                name: this._countryNameToTranslationKey.get("Qatar") || "Qatar",
            },
            {
                code: "+973",
                name: this._countryNameToTranslationKey.get("Bahrain") || "Bahrain",
            },
            {
                code: "+965",
                name: this._countryNameToTranslationKey.get("Kuwait") || "Kuwait",
            },
            {
                code: "+968",
                name: this._countryNameToTranslationKey.get("Oman") || "Oman",
            },
            {
                code: "+972",
                name: this._countryNameToTranslationKey.get("Israel") || "Israel",
            },
            {
                code: "+970",
                name: this._countryNameToTranslationKey.get("Palestine") || "Palestine",
            },
            {
                code: "+961",
                name: this._countryNameToTranslationKey.get("Lebanon") || "Lebanon",
            },
            {
                code: "+962",
                name: this._countryNameToTranslationKey.get("Jordan") || "Jordan",
            },
            {
                code: "+963",
                name: this._countryNameToTranslationKey.get("Syria") || "Syria",
            },
            {
                code: "+967",
                name: this._countryNameToTranslationKey.get("Yemen") || "Yemen",
            },
            {
                code: "+976",
                name: this._countryNameToTranslationKey.get("Mongolia") || "Mongolia",
            },
            {
                code: "+998",
                name: this._countryNameToTranslationKey.get("Uzbekistan") || "Uzbekistan",
            },
            {
                code: "+996",
                name: this._countryNameToTranslationKey.get("Kyrgyzstan") || "Kyrgyzstan",
            },
            {
                code: "+992",
                name: this._countryNameToTranslationKey.get("Tajikistan") || "Tajikistan",
            },
            {
                code: "+993",
                name: this._countryNameToTranslationKey.get("Turkmenistan") || "Turkmenistan",
            },
            {
                code: "+994",
                name: this._countryNameToTranslationKey.get("Azerbaijan") || "Azerbaijan",
            },
            {
                code: "+374",
                name: this._countryNameToTranslationKey.get("Armenia") || "Armenia",
            },
            {
                code: "+995",
                name: this._countryNameToTranslationKey.get("Georgia") || "Georgia",
            },
            {
                code: "+84",
                name: this._countryNameToTranslationKey.get("Vietnam") || "Vietnam",
            },
            {
                code: "+855",
                name: this._countryNameToTranslationKey.get("Cambodia") || "Cambodia",
            },
            {
                code: "+856",
                name: this._countryNameToTranslationKey.get("Laos") || "Laos",
            },
            {
                code: "+95",
                name: this._countryNameToTranslationKey.get("Myanmar") || "Myanmar",
            },
            {
                code: "+673",
                name: this._countryNameToTranslationKey.get("Brunei") || "Brunei",
            },
            {
                code: "+670",
                name: this._countryNameToTranslationKey.get("Timor-Leste") || "Timor-Leste",
            },
            {
                code: "+886",
                name: this._countryNameToTranslationKey.get("Taiwan") || "Taiwan",
            },
            {
                code: "+852",
                name: this._countryNameToTranslationKey.get("Hong Kong") || "Hong Kong",
            },

            // Africa
            {
                code: "+27",
                name: this._countryNameToTranslationKey.get("South Africa") || "South Africa",
            },
            {
                code: "+234",
                name: this._countryNameToTranslationKey.get("Nigeria") || "Nigeria",
            },
            {
                code: "+20",
                name: this._countryNameToTranslationKey.get("Egypt") || "Egypt",
            },
            {
                code: "+254",
                name: this._countryNameToTranslationKey.get("Kenya") || "Kenya",
            },
            {
                code: "+255",
                name: this._countryNameToTranslationKey.get("Tanzania") || "Tanzania",
            },
            {
                code: "+256",
                name: this._countryNameToTranslationKey.get("Uganda") || "Uganda",
            },
            {
                code: "+233",
                name: this._countryNameToTranslationKey.get("Ghana") || "Ghana",
            },
            {
                code: "+251",
                name: this._countryNameToTranslationKey.get("Ethiopia") || "Ethiopia",
            },
            {
                code: "+213",
                name: this._countryNameToTranslationKey.get("Algeria") || "Algeria",
            },
            {
                code: "+212",
                name: this._countryNameToTranslationKey.get("Morocco") || "Morocco",
            },
            {
                code: "+216",
                name: this._countryNameToTranslationKey.get("Tunisia") || "Tunisia",
            },
            {
                code: "+218",
                name: this._countryNameToTranslationKey.get("Libya") || "Libya",
            },
            {
                code: "+249",
                name: this._countryNameToTranslationKey.get("Sudan") || "Sudan",
            },
            {
                code: "+237",
                name: this._countryNameToTranslationKey.get("Cameroon") || "Cameroon",
            },
            {
                code: "+225",
                name: this._countryNameToTranslationKey.get("Ivory Coast") || "Ivory Coast",
            },
            {
                code: "+221",
                name: this._countryNameToTranslationKey.get("Senegal") || "Senegal",
            },
            {
                code: "+223",
                name: this._countryNameToTranslationKey.get("Mali") || "Mali",
            },
            {
                code: "+226",
                name: this._countryNameToTranslationKey.get("Burkina Faso") || "Burkina Faso",
            },
            {
                code: "+227",
                name: this._countryNameToTranslationKey.get("Niger") || "Niger",
            },
            {
                code: "+228",
                name: this._countryNameToTranslationKey.get("Togo") || "Togo",
            },
            {
                code: "+229",
                name: this._countryNameToTranslationKey.get("Benin") || "Benin",
            },
            {
                code: "+220",
                name: this._countryNameToTranslationKey.get("Gambia") || "Gambia",
            },
            {
                code: "+245",
                name: this._countryNameToTranslationKey.get("Guinea-Bissau") || "Guinea-Bissau",
            },
            {
                code: "+224",
                name: this._countryNameToTranslationKey.get("Guinea") || "Guinea",
            },
            {
                code: "+238",
                name: this._countryNameToTranslationKey.get("Cape Verde") || "Cape Verde",
            },
            {
                code: "+239",
                name: this._countryNameToTranslationKey.get("Sao Tome and Principe") || "Sao Tome and Principe",
            },
            {
                code: "+240",
                name: this._countryNameToTranslationKey.get("Equatorial Guinea") || "Equatorial Guinea",
            },
            {
                code: "+241",
                name: this._countryNameToTranslationKey.get("Gabon") || "Gabon",
            },
            {
                code: "+242",
                name: this._countryNameToTranslationKey.get("Congo") || "Congo",
            },
            {
                code: "+243",
                name: this._countryNameToTranslationKey.get("Democratic Republic of the Congo") || "Democratic Republic of the Congo",
            },
            {
                code: "+244",
                name: this._countryNameToTranslationKey.get("Angola") || "Angola",
            },
            {
                code: "+235",
                name: this._countryNameToTranslationKey.get("Chad") || "Chad",
            },
            {
                code: "+236",
                name: this._countryNameToTranslationKey.get("Central African Republic") || "Central African Republic",
            },
            {
                code: "+250",
                name: this._countryNameToTranslationKey.get("Rwanda") || "Rwanda",
            },
            {
                code: "+257",
                name: this._countryNameToTranslationKey.get("Burundi") || "Burundi",
            },
            {
                code: "+258",
                name: this._countryNameToTranslationKey.get("Mozambique") || "Mozambique",
            },
            {
                code: "+260",
                name: this._countryNameToTranslationKey.get("Zambia") || "Zambia",
            },
            {
                code: "+265",
                name: this._countryNameToTranslationKey.get("Malawi") || "Malawi",
            },
            {
                code: "+267",
                name: this._countryNameToTranslationKey.get("Botswana") || "Botswana",
            },
            {
                code: "+264",
                name: this._countryNameToTranslationKey.get("Namibia") || "Namibia",
            },
            {
                code: "+268",
                name: this._countryNameToTranslationKey.get("Eswatini") || "Eswatini",
            },
            {
                code: "+266",
                name: this._countryNameToTranslationKey.get("Lesotho") || "Lesotho",
            },
            {
                code: "+261",
                name: this._countryNameToTranslationKey.get("Madagascar") || "Madagascar",
            },
            {
                code: "+230",
                name: this._countryNameToTranslationKey.get("Mauritius") || "Mauritius",
            },
            {
                code: "+248",
                name: this._countryNameToTranslationKey.get("Seychelles") || "Seychelles",
            },
            {
                code: "+269",
                name: this._countryNameToTranslationKey.get("Comoros") || "Comoros",
            },
            {
                code: "+291",
                name: this._countryNameToTranslationKey.get("Eritrea") || "Eritrea",
            },
            {
                code: "+253",
                name: this._countryNameToTranslationKey.get("Djibouti") || "Djibouti",
            },
            {
                code: "+252",
                name: this._countryNameToTranslationKey.get("Somalia") || "Somalia",
            },
            {
                code: "+232",
                name: this._countryNameToTranslationKey.get("Sierra Leone") || "Sierra Leone",
            },
            {
                code: "+231",
                name: this._countryNameToTranslationKey.get("Liberia") || "Liberia",
            },

            // Oceania
            {
                code: "+61",
                name: this._countryNameToTranslationKey.get("Australia") || "Australia",
            },
            {
                code: "+64",
                name: this._countryNameToTranslationKey.get("New Zealand") || "New Zealand",
            },
            {
                code: "+679",
                name: this._countryNameToTranslationKey.get("Fiji") || "Fiji",
            },
            {
                code: "+675",
                name: this._countryNameToTranslationKey.get("Papua New Guinea") || "Papua New Guinea",
            },
            {
                code: "+677",
                name: this._countryNameToTranslationKey.get("Solomon Islands") || "Solomon Islands",
            },
            {
                code: "+678",
                name: this._countryNameToTranslationKey.get("Vanuatu") || "Vanuatu",
            },
            {
                code: "+685",
                name: this._countryNameToTranslationKey.get("Samoa") || "Samoa",
            },
            {
                code: "+676",
                name: this._countryNameToTranslationKey.get("Tonga") || "Tonga",
            },
            {
                code: "+688",
                name: this._countryNameToTranslationKey.get("Tuvalu") || "Tuvalu",
            },
            {
                code: "+686",
                name: this._countryNameToTranslationKey.get("Kiribati") || "Kiribati",
            },
            {
                code: "+684",
                name: this._countryNameToTranslationKey.get("American Samoa") || "American Samoa",
            },
            {
                code: "+687",
                name: this._countryNameToTranslationKey.get("New Caledonia") || "New Caledonia",
            },
            {
                code: "+689",
                name: this._countryNameToTranslationKey.get("French Polynesia") || "French Polynesia",
            },
        ];
    }

    get countries(): CountryOption[] {
        return [
            { name: "country.afghanistan", code: "af", country: "Afghanistan" },
            { name: "country.albania", code: "al", country: "Albania" },
            { name: "country.algeria", code: "dz", country: "Algeria" },
            { name: "country.andorra", code: "ad", country: "Andorra" },
            { name: "country.angola", code: "ao", country: "Angola" },
            { name: "country.antigua_and_barbuda", code: "ag", country: "Antigua and Barbuda" },
            { name: "country.argentina", code: "ar", country: "Argentina" },
            { name: "country.armenia", code: "am", country: "Armenia" },
            { name: "country.australia", code: "au", country: "Australia" },
            { name: "country.austria", code: "at", country: "Austria" },
            { name: "country.azerbaijan", code: "az", country: "Azerbaijan" },
            { name: "country.bahamas", code: "bs", country: "Bahamas" },
            { name: "country.bahrain", code: "bh", country: "Bahrain" },
            { name: "country.bangladesh", code: "bd", country: "Bangladesh" },
            { name: "country.barbados", code: "bb", country: "Barbados" },
            { name: "country.belarus", code: "by", country: "Belarus" },
            { name: "country.belgium", code: "be", country: "Belgium" },
            { name: "country.belize", code: "bz", country: "Belize" },
            { name: "country.benin", code: "bj", country: "Benin" },
            { name: "country.bhutan", code: "bt", country: "Bhutan" },
            { name: "country.bolivia", code: "bo", country: "Bolivia" },
            { name: "country.bosnia_and_herzegovina", code: "ba", country: "Bosnia and Herzegovina" },
            { name: "country.botswana", code: "bw", country: "Botswana" },
            { name: "country.brazil", code: "br", country: "Brazil" },
            { name: "country.brunei", code: "bn", country: "Brunei" },
            { name: "country.bulgaria", code: "bg", country: "Bulgaria" },
            { name: "country.burkina_faso", code: "bf", country: "Burkina Faso" },
            { name: "country.burundi", code: "bi", country: "Burundi" },
            { name: "country.cambodia", code: "kh", country: "Cambodia" },
            { name: "country.cameroon", code: "cm", country: "Cameroon" },
            { name: "country.canada", code: "ca", country: "Canada" },
            { name: "country.cape_verde", code: "cv", country: "Cape Verde" },
            { name: "country.central_african_republic", code: "cf", country: "Central African Republic" },
            { name: "country.chad", code: "td", country: "Chad" },
            { name: "country.chile", code: "cl", country: "Chile" },
            { name: "country.china", code: "cn", country: "China" },
            { name: "country.colombia", code: "co", country: "Colombia" },
            { name: "country.comoros", code: "km", country: "Comoros" },
            { name: "country.congo", code: "cg", country: "Congo" },
            { name: "country.costa_rica", code: "cr", country: "Costa Rica" },
            { name: "country.croatia", code: "hr", country: "Croatia" },
            { name: "country.cuba", code: "cu", country: "Cuba" },
            { name: "country.cyprus", code: "cy", country: "Cyprus" },
            { name: "country.czech_republic", code: "cz", country: "Czech Republic" },
            { name: "country.denmark", code: "dk", country: "Denmark" },
            { name: "country.djibouti", code: "dj", country: "Djibouti" },
            { name: "country.dominica", code: "dm", country: "Dominica" },
            { name: "country.dominican_republic", code: "do", country: "Dominican Republic" },
            { name: "country.ecuador", code: "ec", country: "Ecuador" },
            { name: "country.egypt", code: "eg", country: "Egypt" },
            { name: "country.el_salvador", code: "sv", country: "El Salvador" },
            { name: "country.equatorial_guinea", code: "gq", country: "Equatorial Guinea" },
            { name: "country.eritrea", code: "er", country: "Eritrea" },
            { name: "country.estonia", code: "ee", country: "Estonia" },
            { name: "country.eswatini", code: "sz", country: "Eswatini" },
            { name: "country.ethiopia", code: "et", country: "Ethiopia" },
            { name: "country.fiji", code: "fj", country: "Fiji" },
            { name: "country.finland", code: "fi", country: "Finland" },
            { name: "country.france", code: "fr", country: "France" },
            { name: "country.gabon", code: "ga", country: "Gabon" },
            { name: "country.gambia", code: "gm", country: "Gambia" },
            { name: "country.georgia", code: "ge", country: "Georgia" },
            { name: "country.germany", code: "de", country: "Germany" },
            { name: "country.ghana", code: "gh", country: "Ghana" },
            { name: "country.greece", code: "gr", country: "Greece" },
            { name: "country.grenada", code: "gd", country: "Grenada" },
            { name: "country.guatemala", code: "gt", country: "Guatemala" },
            { name: "country.guinea", code: "gn", country: "Guinea" },
            { name: "country.guinea_bissau", code: "gw", country: "Guinea-Bissau" },
            { name: "country.guyana", code: "gy", country: "Guyana" },
            { name: "country.haiti", code: "ht", country: "Haiti" },
            { name: "country.honduras", code: "hn", country: "Honduras" },
            { name: "country.hungary", code: "hu", country: "Hungary" },
            { name: "country.iceland", code: "is", country: "Iceland" },
            { name: "country.india", code: "in", country: "India" },
            { name: "country.indonesia", code: "id", country: "Indonesia" },
            { name: "country.iran", code: "ir", country: "Iran" },
            { name: "country.iraq", code: "iq", country: "Iraq" },
            { name: "country.ireland", code: "ie", country: "Ireland" },
            { name: "country.israel", code: "il", country: "Israel" },
            { name: "country.italy", code: "it", country: "Italy" },
            { name: "country.jamaica", code: "jm", country: "Jamaica" },
            { name: "country.japan", code: "jp", country: "Japan" },
            { name: "country.jordan", code: "jo", country: "Jordan" },
            { name: "country.kazakhstan", code: "kz", country: "Kazakhstan" },
            { name: "country.kenya", code: "ke", country: "Kenya" },
            { name: "country.kiribati", code: "ki", country: "Kiribati" },
            { name: "country.kuwait", code: "kw", country: "Kuwait" },
            { name: "country.kyrgyzstan", code: "kg", country: "Kyrgyzstan" },
            { name: "country.laos", code: "la", country: "Laos" },
            { name: "country.latvia", code: "lv", country: "Latvia" },
            { name: "country.lebanon", code: "lb", country: "Lebanon" },
            { name: "country.lesotho", code: "ls", country: "Lesotho" },
            { name: "country.liberia", code: "lr", country: "Liberia" },
            { name: "country.libya", code: "ly", country: "Libya" },
            { name: "country.liechtenstein", code: "li", country: "Liechtenstein" },
            { name: "country.lithuania", code: "lt", country: "Lithuania" },
            { name: "country.luxembourg", code: "lu", country: "Luxembourg" },
            { name: "country.madagascar", code: "mg", country: "Madagascar" },
            { name: "country.malawi", code: "mw", country: "Malawi" },
            { name: "country.malaysia", code: "my", country: "Malaysia" },
            { name: "country.maldives", code: "mv", country: "Maldives" },
            { name: "country.mali", code: "ml", country: "Mali" },
            { name: "country.malta", code: "mt", country: "Malta" },
            { name: "country.marshall_islands", code: "mh", country: "Marshall Islands" },
            { name: "country.mauritania", code: "mr", country: "Mauritania" },
            { name: "country.mauritius", code: "mu", country: "Mauritius" },
            { name: "country.mexico", code: "mx", country: "Mexico" },
            { name: "country.micronesia", code: "fm", country: "Micronesia" },
            { name: "country.moldova", code: "md", country: "Moldova" },
            { name: "country.monaco", code: "mc", country: "Monaco" },
            { name: "country.mongolia", code: "mn", country: "Mongolia" },
            { name: "country.montenegro", code: "me", country: "Montenegro" },
            { name: "country.morocco", code: "ma", country: "Morocco" },
            { name: "country.mozambique", code: "mz", country: "Mozambique" },
            { name: "country.myanmar", code: "mm", country: "Myanmar" },
            { name: "country.namibia", code: "na", country: "Namibia" },
            { name: "country.nauru", code: "nr", country: "Nauru" },
            { name: "country.nepal", code: "np", country: "Nepal" },
            { name: "country.netherlands", code: "nl", country: "Netherlands" },
            { name: "country.new_zealand", code: "nz", country: "New Zealand" },
            { name: "country.nicaragua", code: "ni", country: "Nicaragua" },
            { name: "country.niger", code: "ne", country: "Niger" },
            { name: "country.nigeria", code: "ng", country: "Nigeria" },
            { name: "country.north_korea", code: "kp", country: "North Korea" },
            { name: "country.north_macedonia", code: "mk", country: "North Macedonia" },
            { name: "country.norway", code: "no", country: "Norway" },
            { name: "country.oman", code: "om", country: "Oman" },
            { name: "country.pakistan", code: "pk", country: "Pakistan" },
            { name: "country.palau", code: "pw", country: "Palau" },
            { name: "country.palestine", code: "ps", country: "Palestine" },
            { name: "country.panama", code: "pa", country: "Panama" },
            { name: "country.papua_new_guinea", code: "pg", country: "Papua New Guinea" },
            { name: "country.paraguay", code: "py", country: "Paraguay" },
            { name: "country.peru", code: "pe", country: "Peru" },
            { name: "country.philippines", code: "ph", country: "Philippines" },
            { name: "country.poland", code: "pl", country: "Poland" },
            { name: "country.portugal", code: "pt", country: "Portugal" },
            { name: "country.qatar", code: "qa", country: "Qatar" },
            { name: "country.romania", code: "ro", country: "Romania" },
            { name: "country.russia", code: "ru", country: "Russia" },
            { name: "country.rwanda", code: "rw", country: "Rwanda" },
            { name: "country.saint_kitts_and_nevis", code: "kn", country: "Saint Kitts and Nevis" },
            { name: "country.saint_lucia", code: "lc", country: "Saint Lucia" },
            { name: "country.saint_vincent_and_the_grenadines", code: "vc", country: "Saint Vincent and the Grenadines" },
            { name: "country.samoa", code: "ws", country: "Samoa" },
            { name: "country.san_marino", code: "sm", country: "San Marino" },
            { name: "country.sao_tome_and_principe", code: "st", country: "Sao Tome and Principe" },
            { name: "country.saudi_arabia", code: "sa", country: "Saudi Arabia" },
            { name: "country.senegal", code: "sn", country: "Senegal" },
            { name: "country.serbia", code: "rs", country: "Serbia" },
            { name: "country.seychelles", code: "sc", country: "Seychelles" },
            { name: "country.sierra_leone", code: "sl", country: "Sierra Leone" },
            { name: "country.singapore", code: "sg", country: "Singapore" },
            { name: "country.slovakia", code: "sk", country: "Slovakia" },
            { name: "country.slovenia", code: "si", country: "Slovenia" },
            { name: "country.solomon_islands", code: "sb", country: "Solomon Islands" },
            { name: "country.somalia", code: "so", country: "Somalia" },
            { name: "country.south_africa", code: "za", country: "South Africa" },
            { name: "country.south_korea", code: "kr", country: "South Korea" },
            { name: "country.south_sudan", code: "ss", country: "South Sudan" },
            { name: "country.spain", code: "es", country: "Spain" },
            { name: "country.sri_lanka", code: "lk", country: "Sri Lanka" },
            { name: "country.sudan", code: "sd", country: "Sudan" },
            { name: "country.suriname", code: "sr", country: "Suriname" },
            { name: "country.sweden", code: "se", country: "Sweden" },
            { name: "country.switzerland", code: "ch", country: "Switzerland" },
            { name: "country.syria", code: "sy", country: "Syria" },
            { name: "country.taiwan", code: "tw", country: "Taiwan" },
            { name: "country.hong_kong", code: "hk", country: "Hong Kong" },
            { name: "country.tajikistan", code: "tj", country: "Tajikistan" },
            { name: "country.tanzania", code: "tz", country: "Tanzania" },
            { name: "country.thailand", code: "th", country: "Thailand" },
            { name: "country.timor_leste", code: "tl", country: "Timor-Leste" },
            { name: "country.togo", code: "tg", country: "Togo" },
            { name: "country.tonga", code: "to", country: "Tonga" },
            { name: "country.trinidad_and_tobago", code: "tt", country: "Trinidad and Tobago" },
            { name: "country.tunisia", code: "tn", country: "Tunisia" },
            { name: "country.turkey", code: "tr", country: "Turkey" },
            { name: "country.turkmenistan", code: "tm", country: "Turkmenistan" },
            { name: "country.tuvalu", code: "tv", country: "Tuvalu" },
            { name: "country.uganda", code: "ug", country: "Uganda" },
            { name: "country.ukraine", code: "ua", country: "Ukraine" },
            { name: "country.united_arab_emirates", code: "ae", country: "United Arab Emirates" },
            { name: "country.united_kingdom", code: "gb", country: "United Kingdom" },
            { name: "country.united_states", code: "us", country: "United States" },
            { name: "country.uruguay", code: "uy", country: "Uruguay" },
            { name: "country.uzbekistan", code: "uz", country: "Uzbekistan" },
            { name: "country.vanuatu", code: "vu", country: "Vanuatu" },
            { name: "country.venezuela", code: "ve", country: "Venezuela" },
            { name: "country.vietnam", code: "vn", country: "Vietnam" },
            { name: "country.yemen", code: "ye", country: "Yemen" },
            { name: "country.zambia", code: "zm", country: "Zambia" },
            { name: "country.zimbabwe", code: "zw", country: "Zimbabwe" },
        ];
    }

    get phoneLengthMapping(): PhoneLengthMapping {
        return {
            // North America
            "+1": [10, 10], // USA/Canada
            "+52": [10, 10], // Mexico
            "+1-787": [10, 10], // Puerto Rico
            "+1-939": [10, 10], // Puerto Rico
            "+1-868": [10, 10], // Trinidad and Tobago

            // Central America
            "+502": [8, 8], // Guatemala
            "+503": [8, 8], // El Salvador
            "+504": [8, 8], // Honduras
            "+505": [8, 8], // Nicaragua
            "+506": [8, 8], // Costa Rica
            "+507": [7, 8], // Panama

            // South America
            "+54": [10, 10], // Argentina
            "+55": [10, 11], // Brazil
            "+56": [9, 9], // Chile
            "+57": [10, 10], // Colombia
            "+593": [9, 9], // Ecuador
            "+595": [9, 9], // Paraguay
            "+51": [6, 9], // Peru
            "+598": [8, 9], // Uruguay
            "+58": [10, 10], // Venezuela
            "+591": [8, 8], // Bolivia
            "+592": [7, 7], // Guyana
            "+597": [7, 7], // Suriname

            // Europe
            "+44": [10, 10], // United Kingdom
            "+33": [9, 9], // France
            "+49": [5, 11], // Germany
            "+39": [5, 10], // Italy
            "+34": [9, 9], // Spain
            "+31": [9, 9], // Netherlands
            "+46": [7, 13], // Sweden
            "+47": [8, 8], // Norway
            "+45": [8, 8], // Denmark
            "+358": [5, 12], // Finland
            "+41": [9, 9], // Switzerland
            "+43": [4, 13], // Austria
            "+32": [8, 9], // Belgium
            "+351": [9, 9], // Portugal
            "+353": [7, 9], // Ireland
            "+7": [10, 10], // Russia
            "+48": [9, 9], // Poland
            "+420": [9, 9], // Czech Republic
            "+421": [9, 9], // Slovakia
            "+36": [8, 9], // Hungary
            "+40": [9, 9], // Romania
            "+359": [7, 9], // Bulgaria
            "+30": [10, 10], // Greece
            "+385": [8, 9], // Croatia
            "+386": [8, 9], // Slovenia
            "+387": [8, 9], // Bosnia and Herzegovina
            "+381": [8, 9], // Serbia
            "+382": [8, 9], // Montenegro
            "+389": [8, 9], // North Macedonia
            "+355": [8, 9], // Albania
            "+380": [9, 9], // Ukraine
            "+375": [9, 9], // Belarus
            "+373": [8, 9], // Moldova
            "+370": [8, 9], // Lithuania
            "+371": [8, 9], // Latvia
            "+372": [7, 8], // Estonia
            "+354": [7, 8], // Iceland
            "+352": [6, 9], // Luxembourg
            "+356": [8, 8], // Malta
            "+357": [8, 8], // Cyprus

            // Asia
            "+86": [7, 11], // China
            "+81": [10, 10], // Japan
            "+82": [9, 11], // South Korea
            "+91": [10, 10], // India
            "+62": [7, 11], // Indonesia
            "+60": [7, 9], // Malaysia
            "+66": [8, 9], // Thailand
            "+63": [7, 10], // Philippines
            "+92": [10, 10], // Pakistan
            "+65": [8, 8], // Singapore
            "+880": [7, 10], // Bangladesh
            "+94": [7, 9], // Sri Lanka
            "+977": [7, 10], // Nepal
            "+93": [7, 9], // Afghanistan
            "+98": [7, 10], // Iran
            "+964": [7, 10], // Iraq
            "+90": [10, 10], // Turkey
            "+971": [7, 9], // United Arab Emirates
            "+966": [7, 9], // Saudi Arabia
            "+974": [7, 8], // Qatar
            "+973": [7, 8], // Bahrain
            "+965": [7, 8], // Kuwait
            "+968": [7, 8], // Oman
            "+972": [7, 9], // Israel
            "+970": [7, 9], // Palestine
            "+961": [7, 8], // Lebanon
            "+962": [7, 9], // Jordan
            "+963": [7, 9], // Syria
            "+967": [7, 9], // Yemen
            "+976": [7, 9], // Mongolia
            "+998": [7, 9], // Uzbekistan
            "+996": [7, 9], // Kyrgyzstan
            "+992": [7, 9], // Tajikistan
            "+993": [7, 9], // Turkmenistan
            "+994": [7, 9], // Azerbaijan
            "+374": [7, 9], // Armenia
            "+995": [7, 9], // Georgia
            "+84": [9, 10], // Vietnam
            "+855": [7, 9], // Cambodia
            "+856": [7, 9], // Laos
            "+95": [7, 9], // Myanmar
            "+673": [7, 7], // Brunei
            "+670": [7, 9], // Timor-Leste
            "+886": [9, 9], // Taiwan
            "+852": [8, 8], // Hong Kong

            // Africa
            "+27": [9, 9], // South Africa
            "+234": [7, 10], // Nigeria
            "+20": [7, 10], // Egypt
            "+254": [9, 9], // Kenya
            "+255": [9, 9], // Tanzania
            "+256": [9, 9], // Uganda
            "+233": [9, 9], // Ghana
            "+251": [9, 9], // Ethiopia
            "+213": [8, 9], // Algeria
            "+212": [8, 9], // Morocco
            "+216": [8, 8], // Tunisia
            "+218": [8, 9], // Libya
            "+249": [8, 9], // Sudan
            "+237": [8, 9], // Cameroon
            "+225": [8, 9], // Ivory Coast
            "+221": [8, 9], // Senegal
            "+223": [8, 9], // Mali
            "+226": [8, 9], // Burkina Faso
            "+227": [8, 9], // Niger
            "+228": [8, 9], // Togo
            "+229": [8, 9], // Benin
            "+220": [7, 7], // Gambia
            "+245": [7, 7], // Guinea-Bissau
            "+224": [8, 9], // Guinea
            "+238": [7, 7], // Cape Verde
            "+239": [7, 7], // Sao Tome and Principe
            "+240": [7, 7], // Equatorial Guinea
            "+241": [7, 7], // Gabon
            "+242": [7, 7], // Congo
            "+243": [7, 7], // Democratic Republic of the Congo
            "+244": [7, 7], // Angola
            "+235": [7, 7], // Chad
            "+236": [7, 7], // Central African Republic
            "+250": [9, 9], // Rwanda
            "+257": [8, 8], // Burundi
            "+258": [8, 9], // Mozambique
            "+260": [9, 9], // Zambia
            "+265": [9, 9], // Malawi
            "+267": [7, 8], // Botswana
            "+264": [7, 8], // Namibia
            "+268": [7, 8], // Eswatini
            "+266": [8, 8], // Lesotho
            "+261": [8, 9], // Madagascar
            "+230": [7, 7], // Mauritius
            "+248": [7, 7], // Seychelles
            "+269": [7, 7], // Comoros
            "+291": [7, 7], // Eritrea
            "+253": [7, 7], // Djibouti
            "+252": [7, 7], // Somalia
            "+232": [7, 7], // Sierra Leone
            "+231": [7, 7], // Liberia

            // Oceania
            "+61": [9, 9], // Australia
            "+64": [7, 9], // New Zealand
            "+679": [7, 7], // Fiji
            "+675": [7, 8], // Papua New Guinea
            "+677": [5, 7], // Solomon Islands
            "+678": [5, 7], // Vanuatu
            "+685": [5, 7], // Samoa
            "+676": [5, 7], // Tonga
            "+688": [5, 7], // Tuvalu
            "+686": [5, 7], // Kiribati
            "+684": [7, 7], // American Samoa
            "+687": [6, 6], // New Caledonia
            "+689": [6, 6], // French Polynesia
        };
    }

    findAllowedCountryOptions(countries: string[]): CountryOption[] {
        const allowedCountries = [];

        for (const country of countries) {
            if (!this._countryMap.has(country)) continue;

            allowedCountries.push(this._countryMap.get(country));
        }

        if (!allowedCountries.length) return this.countries;

        return allowedCountries;
    }

    getCountryFromCode(code: string): CountryOption {
        return this._countryMap.get(code);
    }

    getPhoneLengthForCountryCode(countryCode: string): number[] {
        return this.phoneLengthMapping[countryCode] || [5, 15];
    }

    /**
     * Resolve E.164 dial prefix from a geo/IP country name (English or localized).
     */
    findCountryCodeByName(countryName: string): string | null {
        if (!countryName) return null;

        const aliases: Record<string, string> = {
            México: "Mexico",
            Panamá: "Panama",
            Perú: "Peru",
            España: "Spain",
        };

        const normalized = aliases[countryName] || countryName;
        const countryOption = this.countries.find((c) => c.country === normalized);

        if (!countryOption) return null;

        for (const dial of this.countryCodes) {
            const meta = this.countries.find((c) => c.name === dial.name);

            if (meta?.country === normalized) return dial.code;
        }

        const sharedDialByIso: Record<string, string> = {
            kz: "+7",
            pr: "+1",
            tt: "+1",
        };

        return sharedDialByIso[countryOption.code] ?? null;
    }
}
