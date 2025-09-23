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
    [countryCode: string]: number;
}

@Injectable({
    providedIn: "root",
})
export class CountryService {
    private _countryMap = new Map<string, CountryOption>();

    constructor() {
        this.countries.forEach((country) => {
            if (this._countryMap.has(country.country)) return;

            this._countryMap.set(country.country, country);
        });
    }

    get countryCodes(): CountryCodeOption[] {
        const countryNameToTranslationKey = new Map<string, string>();

        this.countries.forEach((country) => {
            countryNameToTranslationKey.set(country.country, country.name);
        });

        return [
            {
                code: "+54",
                name: countryNameToTranslationKey.get("Argentina") || "Argentina",
            },
            {
                code: "+61",
                name: countryNameToTranslationKey.get("Australia") || "Australia",
            },
            {
                code: "+43",
                name: countryNameToTranslationKey.get("Austria") || "Austria",
            },
            {
                code: "+32",
                name: countryNameToTranslationKey.get("Belgium") || "Belgium",
            },
            {
                code: "+55",
                name: countryNameToTranslationKey.get("Brazil") || "Brazil",
            },
            {
                code: "+1",
                name: countryNameToTranslationKey.get("Canada") || "Canada",
            },
            {
                code: "+56",
                name: countryNameToTranslationKey.get("Chile") || "Chile",
            },
            {
                code: "+57",
                name: countryNameToTranslationKey.get("Colombia") || "Colombia",
            },
            {
                code: "+506",
                name: countryNameToTranslationKey.get("Costa Rica") || "Costa Rica",
            },
            {
                code: "+593",
                name: countryNameToTranslationKey.get("Ecuador") || "Ecuador",
            },
            {
                code: "+503",
                name: countryNameToTranslationKey.get("El Salvador") || "El Salvador",
            },
            {
                code: "+33",
                name: countryNameToTranslationKey.get("France") || "France",
            },
            {
                code: "+49",
                name: countryNameToTranslationKey.get("Germany") || "Germany",
            },
            {
                code: "+502",
                name: countryNameToTranslationKey.get("Guatemala") || "Guatemala",
            },
            {
                code: "+504",
                name: countryNameToTranslationKey.get("Honduras") || "Honduras",
            },
            {
                code: "+91",
                name: countryNameToTranslationKey.get("India") || "India",
            },
            {
                code: "+353",
                name: countryNameToTranslationKey.get("Ireland") || "Ireland",
            },
            {
                code: "+39",
                name: countryNameToTranslationKey.get("Italy") || "Italy",
            },
            {
                code: "+52",
                name: countryNameToTranslationKey.get("Mexico") || "Mexico",
            },
            {
                code: "+31",
                name: countryNameToTranslationKey.get("Netherlands") || "Netherlands",
            },
            {
                code: "+505",
                name: countryNameToTranslationKey.get("Nicaragua") || "Nicaragua",
            },
            {
                code: "+47",
                name: countryNameToTranslationKey.get("Norway") || "Norway",
            },
            {
                code: "+507",
                name: countryNameToTranslationKey.get("Panama") || "Panama",
            },
            {
                code: "+595",
                name: countryNameToTranslationKey.get("Paraguay") || "Paraguay",
            },
            {
                code: "+51",
                name: countryNameToTranslationKey.get("Peru") || "Peru",
            },
            {
                code: "+351",
                name: countryNameToTranslationKey.get("Portugal") || "Portugal",
            },
            {
                code: "+1-787",
                name: countryNameToTranslationKey.get("Puerto Rico") || "Puerto Rico",
            },
            {
                code: "+1-939",
                name: countryNameToTranslationKey.get("Puerto Rico") || "Puerto Rico",
            },
            {
                code: "+7",
                name: countryNameToTranslationKey.get("Russia") || "Russia",
            },
            {
                code: "+34",
                name: countryNameToTranslationKey.get("Spain") || "Spain",
            },
            {
                code: "+46",
                name: countryNameToTranslationKey.get("Sweden") || "Sweden",
            },
            {
                code: "+41",
                name: countryNameToTranslationKey.get("Switzerland") || "Switzerland",
            },
            {
                code: "+1-868",
                name: countryNameToTranslationKey.get("Trinidad and Tobago") || "Trinidad and Tobago",
            },
            {
                code: "+44",
                name: countryNameToTranslationKey.get("United Kingdom") || "United Kingdom",
            },
            {
                code: "+1",
                name: countryNameToTranslationKey.get("United States") || "United States",
            },
            {
                code: "+598",
                name: countryNameToTranslationKey.get("Uruguay") || "Uruguay",
            },
            {
                code: "+58",
                name: countryNameToTranslationKey.get("Venezuela") || "Venezuela",
            },
            {
                code: "+86",
                name: countryNameToTranslationKey.get("China") || "China",
            },
            {
                code: "+81",
                name: countryNameToTranslationKey.get("Japan") || "Japan",
            },
            {
                code: "+82",
                name: countryNameToTranslationKey.get("South Korea") || "South Korea",
            },
            {
                code: "+62",
                name: countryNameToTranslationKey.get("Indonesia") || "Indonesia",
            },
            {
                code: "+60",
                name: countryNameToTranslationKey.get("Malaysia") || "Malaysia",
            },
            {
                code: "+66",
                name: countryNameToTranslationKey.get("Thailand") || "Thailand",
            },
            {
                code: "+63",
                name: countryNameToTranslationKey.get("Philippines") || "Philippines",
            },
            {
                code: "+92",
                name: countryNameToTranslationKey.get("Pakistan") || "Pakistan",
            },
            {
                code: "+65",
                name: countryNameToTranslationKey.get("Singapore") || "Singapore",
            },
            {
                code: "+971",
                name: countryNameToTranslationKey.get("United Arab Emirates") || "United Arab Emirates",
            },
            {
                code: "+90",
                name: countryNameToTranslationKey.get("Turkey") || "Turkey",
            },
            {
                code: "+880",
                name: countryNameToTranslationKey.get("Bangladesh") || "Bangladesh",
            },
            {
                code: "+94",
                name: countryNameToTranslationKey.get("Sri Lanka") || "Sri Lanka",
            },
            {
                code: "+976",
                name: countryNameToTranslationKey.get("Mongolia") || "Mongolia",
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
            "+507": 8, // Panama
            "+1": 10, // USA
            "+44": 10, // United Kingdom
            "+91": 10, // India
            "+81": 10, // Japan
            "+49": 11, // Germany
            "+33": 9, // France
            "+39": 10, // Italy
            "+86": 11, // China
            "+7": 10, // Russia
            "+55": 11, // Brazil
            "+61": 9, // Australia
            "+34": 9, // Spain
            "+82": 10, // South Korea
            "+62": 10, // Indonesia
            "+52": 10, // Mexico
            "+27": 9, // South Africa
            "+90": 10, // Turkey
            "+31": 9, // Netherlands
            "+46": 10, // Sweden
            "+63": 10, // Philippines
            "+54": 10, // Argentina
            "+56": 9, // Chile
            "+57": 10, // Colombia
            "+506": 8, // Costa Rica
            "+593": 9, // Ecuador
            "+503": 8, // El Salvador
            "+502": 8, // Guatemala
            "+504": 8, // Honduras
            "+595": 9, // Paraguay
            "+51": 9, // Peru
            "+598": 9, // Uruguay
            "+58": 10, // Venezuela
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

    getPhoneLengthForCountryCode(countryCode: string): number {
        return this.phoneLengthMapping[countryCode] || 10;
    }
}
