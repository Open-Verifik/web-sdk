import { guideRect, judgeBack, judgeFront, laplacianVariance } from "./verify-scan";

describe("verify-scan", () => {
	const guide = guideRect(1280, 720);
	const good = { contrast: 900, sharpness: 120 };

	it("places the guide with the ID aspect, centred in the visible crop", () => {
		expect(Math.abs(guide.width / guide.height - 1.586)).toBeLessThan(0.01);
		expect(Math.abs(guide.x + guide.width / 2 - 640)).toBeLessThan(1);
	});

	it("accepts an ID whose small photo sits inside the guide", () => {
		const face = { x: guide.x + guide.width * 0.62, y: guide.y + guide.height * 0.25, width: guide.width * 0.2, height: guide.height * 0.4 };

		expect(judgeFront({ faces: [face], guide, missesInARow: 0, region: good }).ready).toBeTrue();
	});

	it("does not treat a person's own face as the ID", () => {
		const selfie = { x: guide.x - 20, y: guide.y - 60, width: guide.width * 0.7, height: guide.height * 1.4 };
		const result = judgeFront({ faces: [selfie], guide, missesInARow: 0, region: good });

		expect(result.ready).toBeFalse();
		expect(result.state).toBe("notFace");
	});

	it("explains what is missing instead of staying silent", () => {
		expect(judgeFront({ faces: [], guide, missesInARow: 2, region: good }).state).toBe("searching");
		expect(judgeFront({ faces: [], guide, missesInARow: 12, region: good }).state).toBe("noFace");
		expect(judgeFront({ faces: [{ x: 20, y: 20, width: 60, height: 60 }], guide, missesInARow: 0, region: good }).state).toBe("center");
		expect(judgeFront({ faces: [{ x: guide.x + guide.width / 2, y: guide.y + guide.height / 2, width: 20, height: 22 }], guide, missesInARow: 0, region: good }).state).toBe("closer");
	});

	it("flags poor light and blur, and falls back to image detail when the face model is missing", () => {
		const face = { x: guide.x + guide.width * 0.62, y: guide.y + guide.height * 0.25, width: guide.width * 0.2, height: guide.height * 0.4 };

		expect(judgeFront({ faces: [face], guide, missesInARow: 0, region: { contrast: 50, sharpness: 120 } }).state).toBe("light");
		expect(judgeFront({ faces: [face], guide, missesInARow: 0, region: { contrast: 900, sharpness: 3 } }).state).toBe("blurry");
		expect(judgeFront({ faces: null, guide, missesInARow: 0, region: good }).ready).toBeTrue();
	});

	it("judges the back by detail and separates flat from detailed images", () => {
		expect(judgeBack({ contrast: 100, sharpness: 100 }).state).toBe("back");
		expect(judgeBack({ contrast: 800, sharpness: 80 }).ready).toBeTrue();

		const width = 40;
		const height = 30;
		const flat = new Float32Array(width * height).fill(128);
		const checker = flat.map((_, index) => ((index % width) + Math.floor(index / width)) % 2 ? 255 : 0);

		expect(laplacianVariance(flat, width, height)).toBe(0);
		expect(laplacianVariance(checker, width, height)).toBeGreaterThan(1000);
	});
});
