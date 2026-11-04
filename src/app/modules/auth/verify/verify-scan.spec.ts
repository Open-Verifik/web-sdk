import { PASSPORT_ASPECT, aspectFor, findDocumentEdges, guideRect, judgeBack, judgeFront, judgeShape, laplacianVariance } from "./verify-scan";

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

	describe("card shape", () => {
		const gridWidth = 256;
		const gridHeight = 160;
		const guideWidth = gridWidth / 1.6;
		const gridGuide = { x: (gridWidth - guideWidth) / 2, y: (gridHeight - guideWidth / 1.586) / 2, width: guideWidth, height: guideWidth / 1.586 };

		/** A bright card on a darker table, with printed text and a photo; `header` adds a band as dark as the table. */
		const scene = (rect: { height: number; width: number; x: number; y: number } | null, options: { angle?: number; header?: boolean; noise?: number } = {}): Float32Array => {
			const luminance = new Float32Array(gridWidth * gridHeight);
			let seed = 1;
			const random = (): number => {
				seed = (seed * 1664525 + 1013904223) % 4294967296;

				return seed / 4294967296;
			};
			const noise = options.noise ?? 10;
			const angle = options.angle ?? 0;
			const box = rect || { x: -999, y: -999, width: 0, height: 0 };
			const cx = box.x + box.width / 2;
			const cy = box.y + box.height / 2;

			for (let y = 0; y < gridHeight; y += 1) {
				for (let x = 0; x < gridWidth; x += 1) {
					let value = 70 + (random() - 0.5) * noise;
					const dx = x - cx;
					const dy = y - cy;
					const ux = dx * Math.cos(-angle) - dy * Math.sin(-angle);
					const uy = dx * Math.sin(-angle) + dy * Math.cos(-angle);

					if (rect && Math.abs(ux) <= box.width / 2 && Math.abs(uy) <= box.height / 2) {
						value = 205 + (random() - 0.5) * noise;

						if (options.header && uy < -box.height * 0.34) value = 78;
						if (Math.floor((uy + box.height / 2) / 6) % 2 === 0 && ux > -box.width * 0.1 && ux < box.width * 0.4 && Math.abs(uy) < box.height * 0.3) value = 120;
						if (ux < -box.width * 0.15 && ux > -box.width * 0.42 && uy > -box.height * 0.3 && uy < box.height * 0.25) value = 90;
					}

					luminance[y * gridWidth + x] = value;
				}
			}

			return luminance;
		};

		const find = (luminance: Float32Array, aspect = 1.586, guide = gridGuide) => findDocumentEdges(luminance, gridWidth, gridHeight, guide, aspect);

		it("picks the frame by document type", () => {
			expect(aspectFor("passport")).toBe(PASSPORT_ASPECT);
			expect(aspectFor("license")).toBeCloseTo(1.586, 3);
			expect(aspectFor("government_id")).toBeCloseTo(1.586, 3);
		});

		it("finds a card and accepts the right shape", () => {
			const result = find(scene({ ...gridGuide }));

			expect(result.found).toBeTrue();
			expect(Math.abs(result.aspect / 1.586 - 1)).toBeLessThan(0.03);
			expect(judgeShape(result, 1.586).ok).toBeTrue();
		});

		it("finds the card edge even when a printed band hides the top border", () => {
			const result = find(scene({ ...gridGuide }, { header: true }));

			expect(result.found).toBeTrue();
			expect(Math.abs(result.aspect / 1.586 - 1)).toBeLessThan(0.05);
		});

		it("tells an ID card from a passport page", () => {
			expect(judgeShape(find(scene({ ...gridGuide })), PASSPORT_ASPECT).ok).toBeFalse();

			const height = guideWidth / PASSPORT_ASPECT;
			const passportGuide = { x: gridGuide.x, y: (gridHeight - height) / 2, width: guideWidth, height };
			const result = find(scene({ ...passportGuide }), PASSPORT_ASPECT, passportGuide);

			expect(judgeShape(result, PASSPORT_ASPECT).ok).toBeTrue();
		});

		it("draws the outline on the real card instead of forcing the expected shape", () => {
			const height = guideWidth / PASSPORT_ASPECT;
			const result = find(scene({ x: gridGuide.x, y: (gridHeight - height) / 2, width: guideWidth, height }));

			expect(result.found).toBeTrue();
			expect(Math.abs(result.aspect / PASSPORT_ASPECT - 1)).toBeLessThan(0.05);
			expect(judgeShape(result, 1.586).state).toBe("flat");
		});

		it("says closer, farther or center", () => {
			const small = find(scene({ x: gridGuide.x + guideWidth * 0.19, y: gridGuide.y + gridGuide.height * 0.19, width: guideWidth * 0.62, height: gridGuide.height * 0.62 }));
			const big = find(scene({ x: gridGuide.x - guideWidth * 0.12, y: gridGuide.y - gridGuide.height * 0.12, width: guideWidth * 1.25, height: gridGuide.height * 1.25 }));
			const shifted = find(scene({ ...gridGuide, x: gridGuide.x + guideWidth * 0.2 }));

			expect(judgeShape(small, 1.586).state).toBe("closer");
			expect(judgeShape(big, 1.586).state).toBe("farther");
			expect(judgeShape(shifted, 1.586).state).toBe("center");
		});

		it("does not accept a tilted card or an empty wall", () => {
			const tilted = find(scene({ ...gridGuide }, { angle: 0.32 }));

			expect(!tilted.found || !judgeShape(tilted, 1.586).ok).toBeTrue();
			expect(find(scene(null, { noise: 14 })).found).toBeFalse();
		});

		it("stays cheap enough to run on every scan", () => {
			const luminance = scene({ ...gridGuide });
			const started = performance.now();

			for (let i = 0; i < 200; i += 1) find(luminance);

			expect((performance.now() - started) / 200).toBeLessThan(5);
		});
	});
});
