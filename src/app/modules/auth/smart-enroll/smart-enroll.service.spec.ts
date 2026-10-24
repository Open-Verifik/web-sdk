import { DocumentImageState, documentRequiresBackSide, hasSide, isBackSideMissing, isDocumentPurged, resumeDocumentSide } from "./smart-enroll.service";

/**
 * Enrollee reload in none mode, copied from the two-sided end-to-end case:
 * addresses are stripped, the front flag is set, and the back flag is omitted.
 */
const noneModeReload: DocumentImageState = {
    backUrl: null,
    hasBackImage: undefined,
    hasFrontImage: true,
    requiresBackSide: true,
    url: null,
};

describe("document image retention helpers", () => {
    describe("isDocumentPurged", () => {
        it("is false when the record is missing", () => {
            expect(isDocumentPurged(null)).toBeFalse();
            expect(isDocumentPurged(undefined)).toBeFalse();
        });

        it("reads the enrollee flag", () => {
            expect(isDocumentPurged({ isPurged: true })).toBeTrue();
            expect(isDocumentPurged({ isPurged: false })).toBeFalse();
        });

        it("reads the purge stamp when the flag is omitted", () => {
            expect(isDocumentPurged({ retention: { purgedAt: "2026-10-24T00:00:00.000Z" } })).toBeTrue();
            expect(isDocumentPurged({ retention: { purgedAt: "   " } })).toBeFalse();
            expect(isDocumentPurged({ retention: { purgedAt: null } })).toBeFalse();
        });
    });

    describe("hasSide", () => {
        it("trusts an explicit flag and ignores a missing address", () => {
            expect(hasSide({ hasFrontImage: true, url: null }, "front")).toBeTrue();
            expect(hasSide({ hasBackImage: true, backUrl: null }, "back")).toBeTrue();
            expect(hasSide({ hasBackImage: false, backUrl: "https://cdn.example/back.jpg" }, "back")).toBeFalse();
        });

        it("treats a purged record as having no images", () => {
            expect(hasSide({ hasFrontImage: true, hasBackImage: true, isPurged: true }, "front")).toBeFalse();
            expect(hasSide({ hasBackImage: true, retention: { purgedAt: new Date() } }, "back")).toBeFalse();
        });

        it("does not ask again for the back after a none-mode reload when the flag is omitted", () => {
            expect(hasSide(noneModeReload, "front")).toBeTrue();
            expect(hasSide(noneModeReload, "back")).toBeTrue();
            expect(isBackSideMissing(noneModeReload)).toBeFalse();
            expect(resumeDocumentSide(noneModeReload, true)).toBe("front");
        });

        it("does the same for ephemeral mode when both flags are omitted", () => {
            const dv: DocumentImageState = {
                backUrl: null,
                requiresBackSide: true,
                retention: { mode: "Ephemeral" },
                url: null,
            };

            expect(hasSide(dv, "back")).toBeTrue();
            expect(isBackSideMissing(dv)).toBeFalse();
        });

        it("still asks for the back when the flag is explicitly false", () => {
            const dv: DocumentImageState = {
                ...noneModeReload,
                hasBackImage: false,
                retention: { mode: "none" },
            };

            expect(hasSide(dv, "back")).toBeFalse();
            expect(isBackSideMissing(dv)).toBeTrue();
            expect(resumeDocumentSide(dv, true)).toBe("back");
        });

        it("falls back to the address when the flag is omitted and URLs are not hidden", () => {
            const frontOnly: DocumentImageState = {
                backUrl: null,
                requiresBackSide: true,
                url: "https://cdn.example/front.jpg",
            };

            expect(hasSide(frontOnly, "front")).toBeTrue();
            expect(hasSide(frontOnly, "back")).toBeFalse();
            expect(resumeDocumentSide(frontOnly, true)).toBe("back");

            expect(hasSide({ backUrl: "https://cdn.example/back.jpg" }, "back")).toBeTrue();
            expect(hasSide({ url: "   " }, "front")).toBeFalse();
        });
    });

    describe("documentRequiresBackSide", () => {
        it("does not turn a one-sided document into a back scan when the back flag is omitted", () => {
            expect(
                documentRequiresBackSide({
                    hasFrontImage: true,
                    requiresBackSide: false,
                    retention: { mode: "none" },
                    url: null,
                })
            ).toBeFalse();
        });

        it("follows the document flag, a stored back image, or the prompt", () => {
            expect(documentRequiresBackSide({ requiresBackSide: true })).toBeTrue();
            expect(documentRequiresBackSide({ hasBackImage: true })).toBeTrue();
            expect(documentRequiresBackSide({ backUrl: "https://cdn.example/back.jpg" })).toBeTrue();
            expect(documentRequiresBackSide(null, true)).toBeTrue();
            expect(documentRequiresBackSide(null)).toBeFalse();
        });
    });

    describe("resumeDocumentSide", () => {
        it("starts a purged two-sided document on the front", () => {
            const dv: DocumentImageState = {
                hasBackImage: true,
                hasFrontImage: true,
                isPurged: true,
                requiresBackSide: true,
            };

            expect(isBackSideMissing(dv)).toBeFalse();
            expect(resumeDocumentSide(dv, true)).toBe("front");
        });

        it("stays on the front when a back side is not required", () => {
            expect(resumeDocumentSide({ url: "https://cdn.example/front.jpg" }, false)).toBe("front");
        });
    });
});
