export interface KycIpLocation {
	available?: boolean;
	country?: string | null;
}

const normalizeCountry = (value: string): string => value.trim().toLowerCase();

export const countryRestrictionEnabled = (allowedCountries?: string[] | null): boolean => {
	if (!allowedCountries?.length) return false;

	return !allowedCountries.some((country) => normalizeCountry(country) === "all");
};

export const shouldBlockCountry = (
	allowedCountries: string[] | null | undefined,
	location: KycIpLocation | null | undefined
): boolean => {
	if (!countryRestrictionEnabled(allowedCountries)) return false;

	const country = location?.country?.trim();

	if (!location || location.available === false || !country) return false;

	return !allowedCountries.some((allowed) => normalizeCountry(allowed) === normalizeCountry(country));
};
