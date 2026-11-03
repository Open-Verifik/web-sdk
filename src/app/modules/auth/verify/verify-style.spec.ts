import { parseVerifyStyle, resolveVerifyStyle, VERIFY_STYLES } from "./verify-style";
import { ProjectFlow, verifyStyleFrom, VERIFY_STYLE_IDS } from "../../../core/classes/project-flow.class";

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

	it("maps all 6 styles (a through f) and defaults invalid or omitted values to a", () => {
		const styles: Array<"a" | "b" | "c" | "d" | "e" | "f"> = ["a", "b", "c", "d", "e", "f"];
		for (const style of styles) {
			expect(resolveVerifyStyle(null, style, "v2")).toBe(style);
			expect(resolveVerifyStyle(undefined, style, "v2")).toBe(style);
		}

		// Invalid values default to 'a'
		expect(resolveVerifyStyle(null, "g", "v2")).toBe("a");
		expect(resolveVerifyStyle(null, "unknown", "v2")).toBe("a");
		expect(resolveVerifyStyle(null, "", "v2")).toBe("a");
		expect(resolveVerifyStyle(null, 123, "v2")).toBe("a");
		expect(resolveVerifyStyle(null, null, "v2")).toBe("a");
		expect(resolveVerifyStyle(null, undefined, "v2")).toBe("a");

		// Non-v2 enrollment clients always default to 'a' unless preview is provided
		for (const style of styles) {
			expect(resolveVerifyStyle(null, style, "legacy")).toBe("a");
			expect(resolveVerifyStyle(null, style, undefined)).toBe("a");
			expect(resolveVerifyStyle(style, style, "legacy")).toBe(style);
		}
	});

	it("defensively resolves verifyStyleFrom from nested onboardingSettings and root object", () => {
		expect(VERIFY_STYLE_IDS).toEqual(["a", "b", "c", "d", "e", "f"]);

		// Nested in onboardingSettings
		expect(verifyStyleFrom({ onboardingSettings: { verifyStyle: "a" } })).toBe("a");
		expect(verifyStyleFrom({ onboardingSettings: { verifyStyle: " B " } })).toBe("b");

		// Root level
		expect(verifyStyleFrom({ verifyStyle: "c" })).toBe("c");
		expect(verifyStyleFrom({ verifyStyle: " F " })).toBe("f");

		// Nested priority over root
		expect(verifyStyleFrom({ onboardingSettings: { verifyStyle: "d" }, verifyStyle: "e" })).toBe("d");

		// Fallback to root when nested is invalid or empty
		expect(verifyStyleFrom({ onboardingSettings: { verifyStyle: "invalid" }, verifyStyle: "e" })).toBe("e");
		expect(verifyStyleFrom({ onboardingSettings: { verifyStyle: "" }, verifyStyle: "b" })).toBe("b");

		// Invalid or omitted values return undefined
		expect(verifyStyleFrom({})).toBe(undefined);
		expect(verifyStyleFrom(null)).toBe(undefined);
		expect(verifyStyleFrom(undefined)).toBe(undefined);
		expect(verifyStyleFrom({ verifyStyle: "z" })).toBe(undefined);
		expect(verifyStyleFrom({ onboardingSettings: { verifyStyle: "xyz" } })).toBe(undefined);
	});

	it("exposes verifyStyle on ProjectFlow.onboardingSettings getter", () => {
		// Nested onboardingSettings verifyStyle
		const flowNested = new ProjectFlow({
			client: "test-client",
			target: "personal",
			type: "onboarding",
			onboardingSettings: {
				enrollmentClient: "v2",
				verifyStyle: "c",
			},
		} as any);

		expect(flowNested.verifyStyle).toBe("c");
		expect(flowNested.onboardingSettings.verifyStyle).toBe("c");
		expect(flowNested.onboardingSettings.enrollmentClient).toBe("v2");
		expect(resolveVerifyStyle(null, flowNested.onboardingSettings.verifyStyle, flowNested.enrollmentClient)).toBe("c");

		// Root level verifyStyle
		const flowRoot = new ProjectFlow({
			client: "test-client",
			target: "personal",
			type: "onboarding",
			enrollmentClient: "v2",
			verifyStyle: "e",
		} as any);

		expect(flowRoot.verifyStyle).toBe("e");
		expect(flowRoot.onboardingSettings.verifyStyle).toBe("e");
		expect(resolveVerifyStyle(null, flowRoot.onboardingSettings.verifyStyle, flowRoot.enrollmentClient)).toBe("e");

		// Unset verifyStyle
		const flowDefault = new ProjectFlow({
			client: "test-client",
			target: "personal",
			type: "onboarding",
			onboardingSettings: {
				enrollmentClient: "v2",
			},
		} as any);

		expect(flowDefault.verifyStyle).toBe(undefined);
		expect(flowDefault.onboardingSettings.verifyStyle).toBe(undefined);
		expect(resolveVerifyStyle(null, flowDefault.onboardingSettings.verifyStyle, flowDefault.enrollmentClient)).toBe("a");
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

