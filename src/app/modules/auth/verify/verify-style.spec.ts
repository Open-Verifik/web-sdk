import { parseVerifyStyle, resolveVerifyStyle, VERIFY_STYLES } from "./verify-style";

describe("verify-style", () => {
	it("parses only a through f", () => {
		expect(parseVerifyStyle("a")).toBe("a");
		expect(parseVerifyStyle(" F ")).toBe("f");
		expect(parseVerifyStyle(null)).toBeNull();
		expect(parseVerifyStyle("")).toBeNull();
		expect(parseVerifyStyle("g")).toBeNull();
	});

	it("lets the query preview override a saved style", () => {
		expect(resolveVerifyStyle("c", "b", "v2")).toBe("c");
		expect(resolveVerifyStyle("f", undefined, "legacy")).toBe("f");
	});

	it("uses the saved style for v2 and falls back to a without inventing one", () => {
		expect(resolveVerifyStyle(null, "d", "v2")).toBe("d");
		expect(resolveVerifyStyle(null, null, "v2")).toBe("a");
		expect(resolveVerifyStyle(undefined, "d", "legacy")).toBe("a");
		expect(resolveVerifyStyle(undefined, "d", undefined)).toBe("a");
	});

	it("keeps card headlines inside 32–40px", () => {
		expect(Object.keys(VERIFY_STYLES)).toEqual(["a", "b", "c", "d", "e", "f"]);
		for (const style of Object.values(VERIFY_STYLES)) {
			const size = Number.parseInt(style.variables["--style-headline"], 10);

			expect(size).toBeGreaterThanOrEqual(32);
			expect(size).toBeLessThanOrEqual(40);
		}
		expect(VERIFY_STYLES.a.variables["--style-display-weight"]).toBe("900");
		expect(VERIFY_STYLES.b.variables["--style-display-transform"]).toBe("uppercase");
		expect(VERIFY_STYLES.c.variables["--style-headline"]).toBe("32px");
		expect(VERIFY_STYLES.f.variables["--style-cta"]).toBe("#adff02");
	});
});
