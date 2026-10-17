import { shouldBlockCountry } from "./kyc-country-restriction";

describe("shouldBlockCountry", () => {
	it("skips the rule when every country is allowed", () => {
		expect(shouldBlockCountry(["All"], { country: "Brazil", available: true })).toBe(false);
	});

	it("allows a country that is on the project list", () => {
		expect(shouldBlockCountry(["Colombia", "Peru"], { country: "colombia", available: true })).toBe(false);
	});

	it("blocks a country that is not on the project list", () => {
		expect(shouldBlockCountry(["Colombia"], { country: "Brazil", available: true })).toBe(true);
	});

	it("allows sign-up when the lookup fails", () => {
		expect(shouldBlockCountry(["Colombia"], { available: false })).toBe(false);
		expect(shouldBlockCountry(["Colombia"], null)).toBe(false);
	});
});
