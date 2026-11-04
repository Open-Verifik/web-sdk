/**
 * Auto-capture decisions for the ID camera. Everything here is pure (numbers in, verdict out) so it can be tested
 * without a camera. The camera component feeds it video pixels and shows the verdict to the person.
 */

export type ScanState =
	| "starting"
	| "searching"
	| "noFace"
	| "notFace"
	| "closer"
	| "farther"
	| "center"
	| "light"
	| "blurry"
	| "flat"
	| "edges"
	| "back"
	| "steady"
	| "manual";

export interface Rect {
	height: number;
	width: number;
	x: number;
	y: number;
}

export interface ScanVerdict {
	hintKey: string;
	ready: boolean;
	state: ScanState;
	/** The face model was not run this round to save CPU; the camera keeps the last hint instead of flipping it. */
	skipped?: boolean;
	/** Everything but the card outline looks right. The camera waits longer before shooting on these. */
	weak?: boolean;
}

/** Same ratio as a bank card / ID-1 document. */
export const ID_ASPECT = 1.586;
/** The data page of a passport (ID-3, 125 x 88 mm). */
export const PASSPORT_ASPECT = 125 / 88;

/** Width over height of the document the person picked, so the frame and the shape check match what they hold. */
export const aspectFor = (category: string | null | undefined): number => (String(category || "").toLowerCase() === "passport" ? PASSPORT_ASPECT : ID_ASPECT);
/** The camera well is 3:4 and the video is cropped to fill it (object-fit: cover). */
export const WELL_ASPECT = 3 / 4;
/** The on-screen guide is 84% of the well width. */
export const GUIDE_WIDTH_RATIO = 0.84;

/** The ID photo is small next to the card; a face bigger than this share of the guide is a person, not an ID. */
export const FACE_MAX_RATIO = 0.62;
export const FACE_MIN_RATIO = 0.16;
export const MIN_CONTRAST = 200;
export const MIN_SHARPNESS = 15;
export const BACK_MIN_CONTRAST = 350;

export const HINT_KEYS: Record<ScanState, string> = {
	starting: "verify.scanSearching",
	searching: "verify.scanSearching",
	noFace: "verify.scanFillFrame",
	notFace: "verify.scanNotFace",
	closer: "verify.scanCloser",
	farther: "verify.scanFarther",
	center: "verify.scanCenter",
	light: "verify.scanLight",
	blurry: "verify.scanBlurry",
	flat: "verify.scanFlat",
	edges: "verify.scanEdges",
	back: "verify.scanBackShow",
	steady: "verify.scanSteady",
	manual: "verify.moveId",
};

const verdict = (state: ScanState, ready = false, hintKey?: string): ScanVerdict => ({
	hintKey: hintKey || HINT_KEYS[state],
	ready,
	state,
});

/** The part of the video the person actually sees inside the 3:4 well. */
export const visibleRect = (videoWidth: number, videoHeight: number): Rect => {
	if (videoWidth / videoHeight > WELL_ASPECT) {
		const width = videoHeight * WELL_ASPECT;

		return { x: (videoWidth - width) / 2, y: 0, width, height: videoHeight };
	}

	const height = videoWidth / WELL_ASPECT;

	return { x: 0, y: (videoHeight - height) / 2, width: videoWidth, height };
};

/** Where the dashed ID frame sits, in video pixels. */
export const guideRect = (videoWidth: number, videoHeight: number, aspect = ID_ASPECT): Rect => {
	const visible = visibleRect(videoWidth, videoHeight);
	const width = visible.width * GUIDE_WIDTH_RATIO;
	const height = width / aspect;

	return {
		x: visible.x + (visible.width - width) / 2,
		y: visible.y + (visible.height - height) / 2,
		width,
		height,
	};
};

export const centerOf = (box: Rect): { x: number; y: number } => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

export const contains = (outer: Rect, point: { x: number; y: number }, margin = 0): boolean =>
	point.x >= outer.x - outer.width * margin &&
	point.x <= outer.x + outer.width * (1 + margin) &&
	point.y >= outer.y - outer.height * margin &&
	point.y <= outer.y + outer.height * (1 + margin);

/** True when all four sides of `inner` sit inside `outer` (negative `margin` requires an inset from the border). */
export const boxInside = (outer: Rect, inner: Rect, margin = 0): boolean =>
	inner.x >= outer.x - outer.width * margin &&
	inner.y >= outer.y - outer.height * margin &&
	inner.x + inner.width <= outer.x + outer.width * (1 + margin) &&
	inner.y + inner.height <= outer.y + outer.height * (1 + margin);

export const biggest = (boxes: Rect[]): Rect | undefined =>
	boxes.reduce<Rect | undefined>((best, box) => (!best || box.width * box.height > best.width * best.height ? box : best), undefined);

export interface FrontInput {
	/** Document aspect the person is holding; drives the shape check. */
	aspect?: number;
	/** Detected card rectangle in the same pixel space as `guide` and `faces`, when found. */
	cardRect?: Rect | null;
	/** Face boxes in video pixels. `null`: the face model is not available. `undefined`: skipped this round to save CPU. */
	faces: Rect[] | null | undefined;
	guide: Rect;
	/** Frames in a row with no face at all (drives the "fill the frame" message). */
	missesInARow: number;
	region: { contrast: number; sharpness: number };
	/** Outline of the card found in the frame, when edge detection ran. */
	shape?: ShapeResult | null;
}

/** After this many empty frames (about 4 seconds) we stop saying "looking" and explain what is missing. */
export const MISSES_BEFORE_HELP = 11;

export const judgeFront = ({ aspect = ID_ASPECT, cardRect, faces, guide, missesInARow, region, shape }: FrontInput): ScanVerdict => {
	const outline = shape ? judgeShape(shape, aspect) : null;

	// A card outline that is clearly wrong beats everything else: it tells the person exactly how to move.
	if (outline?.found && !outline.ok && outline.state) return verdict(outline.state);

	// Without the face model we can only say "something with detail is in the frame".
	if (faces === null) {
		if (region.contrast < MIN_CONTRAST) return verdict("light");
		if (region.sharpness < MIN_SHARPNESS) return verdict("blurry");

		return outline && !outline.found ? { ...verdict("edges"), weak: true } : verdict("steady", true);
	}

	if (faces === undefined || !faces.length) return verdict(missesInARow >= MISSES_BEFORE_HELP ? "noFace" : "searching");

	const insideGuide = faces.filter((face) => contains(guide, centerOf(face), 0.05));
	const largestInGuide = biggest(insideGuide);

	if (!largestInGuide) return verdict("center");
	if (largestInGuide.height / guide.height > FACE_MAX_RATIO) return verdict("notFace");

	// All four sides of the ID portrait must sit inside the card boundary (not clipped at the edge or peeking behind the card).
	const cardBounds = cardRect || guide;
	const fullyVisible = insideGuide.filter((face) => boxInside(cardBounds, face, -0.01));
	const face = biggest(fullyVisible);

	if (!face) return verdict("center");

	const ratio = face.height / guide.height;

	if (ratio > FACE_MAX_RATIO) return verdict("notFace");
	if (ratio < FACE_MIN_RATIO) return verdict("closer");
	if (region.contrast < MIN_CONTRAST) return verdict("light");
	if (region.sharpness < MIN_SHARPNESS) return verdict("blurry");

	// Face and image quality are fine but the card outline was not found (busy background, glare on an edge).
	if (outline && !outline.found) return { ...verdict("edges"), weak: true };

	return verdict("steady", true);
};

export const judgeBack = (region: { contrast: number; sharpness: number }, shape?: ShapeResult | null, aspect = ID_ASPECT): ScanVerdict => {
	const outline = shape ? judgeShape(shape, aspect) : null;

	// The back of the document does not have a face photo, but it MUST have the document's
	// physical card outline detected inside the guide. Never auto-capture on an empty frame or face.
	if (!outline || !outline.found) return verdict("back");
	if (!outline.ok && outline.state) return verdict(outline.state);
	if (region.contrast < BACK_MIN_CONTRAST) return verdict("back");
	if (region.sharpness < MIN_SHARPNESS) return verdict("blurry");

	return verdict("steady", true);
};

/** Variance of the Laplacian over a luminance grid: low means blurry. */
export const laplacianVariance = (luminance: ArrayLike<number>, width: number, height: number): number => {
	let sum = 0;
	let sumSq = 0;
	let count = 0;

	for (let y = 1; y < height - 1; y += 1) {
		for (let x = 1; x < width - 1; x += 1) {
			const i = y * width + x;
			const value = 4 * luminance[i] - luminance[i - 1] - luminance[i + 1] - luminance[i - width] - luminance[i + width];

			sum += value;
			sumSq += value * value;
			count += 1;
		}
	}

	if (!count) return 0;

	const mean = sum / count;

	return sumSq / count - mean * mean;
};

export const luminanceVariance = (luminance: ArrayLike<number>): number => {
	let sum = 0;
	let sumSq = 0;

	for (let i = 0; i < luminance.length; i += 1) {
		sum += luminance[i];
		sumSq += luminance[i] * luminance[i];
	}

	if (!luminance.length) return 0;

	const mean = sum / luminance.length;

	return sumSq / luminance.length - mean * mean;
};

export interface ShapeResult {
	/** Width over height of the outline. */
	aspect: number;
	/** Outline width as a share of the guide width. */
	coverage: number;
	found: boolean;
	/** Outline centre minus guide centre, as a share of the guide width / height. */
	offsetX: number;
	offsetY: number;
	/** The outline in the same pixels as the luminance grid. */
	rect: Rect;
}

const EMPTY_SHAPE: ShapeResult = { found: false, aspect: 0, coverage: 0, offsetX: 0, offsetY: 0, rect: { x: 0, y: 0, width: 0, height: 0 } };

/** How far from the guide edge we look for the card edge, as a share of the guide size. */
export const EDGE_SEARCH = 0.3;
/** An edge counts when its line is this many times stronger than the typical line in the frame. */
export const EDGE_STRENGTH = 2.4;
/** ...and at least this strong in absolute terms, so a flat wall is not mistaken for a card. */
export const EDGE_MIN = 5;
/** A line counts as a possible edge from this share of the strongest line on its side; faint real borders stay in. */
export const EDGE_CANDIDATE_RATIO = 0.2;
/** Wide enough for edge noise and a slight tilt, narrow enough to tell a passport page from an ID card. */
export const SHAPE_ASPECT_TOLERANCE = 0.14;
export const SHAPE_MIN_COVERAGE = 0.62;
export const SHAPE_MAX_COVERAGE = 1.18;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const median = (values: ArrayLike<number>): number => {
	const sorted = Array.from(values).sort((a, b) => a - b);

	return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

/**
 * Finds the four straight edges of a card near the guide.
 *
 * It only looks at how strongly each column (vertical edges) and each row (horizontal edges) changes brightness along
 * the middle of the guide. A card border is one long line, so it stands out from print, faces and patterns that only
 * produce short edges. It works on a small grayscale grid (about 256 x 160), so one pass costs well under a
 * millisecond, and it needs no extra library or model.
 */
export const findDocumentEdges = (luminance: ArrayLike<number>, width: number, height: number, guide: Rect, expectedAspect = ID_ASPECT): ShapeResult => {
	if (width < 16 || height < 16) return EMPTY_SHAPE;

	const columns = new Float32Array(width);
	const rows = new Float32Array(height);
	const yFrom = clamp(Math.round(guide.y + guide.height * 0.2), 2, height - 3);
	const yTo = clamp(Math.round(guide.y + guide.height * 0.8), yFrom + 1, height - 3);
	const xFrom = clamp(Math.round(guide.x + guide.width * 0.2), 2, width - 3);
	const xTo = clamp(Math.round(guide.x + guide.width * 0.8), xFrom + 1, width - 3);

	for (let y = yFrom; y <= yTo; y += 1) {
		for (let x = 2; x < width - 2; x += 1) columns[x] += Math.abs(luminance[y * width + x + 2] - luminance[y * width + x - 2]);
	}

	for (let x = xFrom; x <= xTo; x += 1) {
		for (let y = 2; y < height - 2; y += 1) rows[y] += Math.abs(luminance[(y + 2) * width + x] - luminance[(y - 2) * width + x]);
	}

	const columnScale = 1 / (yTo - yFrom + 1);
	const rowScale = 1 / (xTo - xFrom + 1);

	for (let x = 0; x < width; x += 1) columns[x] *= columnScale;
	for (let y = 0; y < height; y += 1) rows[y] *= rowScale;

	const typicalColumn = median(columns);
	const typicalRow = median(rows);

	interface Candidate {
		position: number;
		strength: number;
	}

	/**
	 * Up to three strong, separate edge lines near `center`. A card often has printed bands near its border, so the
	 * strongest line is not always the card edge; the caller picks the set that makes the right card shape.
	 */
	const candidates = (profile: Float32Array, typical: number, center: number, radius: number): Candidate[] => {
		const from = clamp(Math.round(center - radius), 3, profile.length - 4);
		const to = clamp(Math.round(center + radius), from, profile.length - 4);
		const smooth = (i: number): number => (profile[i - 1] + profile[i] + profile[i + 1]) / 3;
		const found: Candidate[] = [];
		let strongest = 0;

		for (let i = from; i <= to; i += 1) strongest = Math.max(strongest, smooth(i));

		const floor = Math.max(typical * EDGE_STRENGTH, EDGE_MIN);

		if (strongest < floor) return found;

		for (let i = from; i <= to; i += 1) {
			const value = smooth(i);

			if (value < floor || value < strongest * EDGE_CANDIDATE_RATIO || value < smooth(i - 1) || value < smooth(i + 1)) continue;

			// Sub-pixel position: fit a parabola through the peak and its neighbours.
			const before = smooth(i - 1);
			const after = smooth(i + 1);
			const curve = before - 2 * value + after;
			const position = curve < 0 ? i + clamp((0.5 * (before - after)) / curve, -0.5, 0.5) : i;

			found.push({ position, strength: value / strongest });
		}

		return found.sort((a, b) => b.strength - a.strength).slice(0, 4);
	};

	const radiusX = guide.width * EDGE_SEARCH;
	const radiusY = guide.height * EDGE_SEARCH;
	const lefts = candidates(columns, typicalColumn, guide.x, radiusX);
	const rights = candidates(columns, typicalColumn, guide.x + guide.width, radiusX);
	const tops = candidates(rows, typicalRow, guide.y, radiusY);
	const bottoms = candidates(rows, typicalRow, guide.y + guide.height, radiusY);

	// At least three of the four edges must be real; the fourth may be inferred below.
	if ([lefts, rights, tops, bottoms].filter((list) => list.length > 0).length < 3) return EMPTY_SHAPE;

	/** An edge we could not see (print or glare hid it) is inferred from the other three and the expected shape. */
	const INFERRED_STRENGTH = 0.25;
	const INFERRED_PENALTY = 0.02;
	const INFERRED_SIGNAL = 1.8;
	const withinWindow = (value: number, center: number, radius: number): boolean => value >= center - radius && value <= center + radius;
	/** A guessed edge must at least show a faint step in the image there; empty table or wall does not count. */
	const hasSignal = (profile: Float32Array, typical: number, position: number): boolean => {
		const center = Math.round(position);

		if (center < 3 || center > profile.length - 4) return false;

		let peak = 0;

		for (let i = center - 2; i <= center + 2; i += 1) peak = Math.max(peak, (profile[i - 1] + profile[i] + profile[i + 1]) / 3);

		return peak >= Math.max(typical * INFERRED_SIGNAL, EDGE_MIN * 0.6);
	};

	let best: { bottom: number; left: number; right: number; score: number; top: number } | null = null;

	// Lines printed inside the card (text rows, the photo frame) are strong edges too. The card border is the outermost
	// strong line on each side, so every step inward from it costs, as a share of the guide size.
	const outerLeft = lefts.length ? Math.min(...lefts.map((edge) => edge.position)) : 0;
	const outerRight = rights.length ? Math.max(...rights.map((edge) => edge.position)) : 0;
	const outerTop = tops.length ? Math.min(...tops.map((edge) => edge.position)) : 0;
	const outerBottom = bottoms.length ? Math.max(...bottoms.map((edge) => edge.position)) : 0;

	const consider = (left: number, right: number, top: number, bottom: number, strength: number, inferred: boolean): void => {
		const cardWidth = right - left;
		const cardHeight = bottom - top;

		if (cardWidth < guide.width * 0.3 || cardHeight < guide.height * 0.3) return;

		const aspectError = Math.abs(cardWidth / cardHeight / expectedAspect - 1);
		const inward =
			(lefts.length ? Math.max(0, left - outerLeft) / guide.width : 0) +
			(rights.length ? Math.max(0, outerRight - right) / guide.width : 0) +
			(tops.length ? Math.max(0, top - outerTop) / guide.height : 0) +
			(bottoms.length ? Math.max(0, outerBottom - bottom) / guide.height : 0);
		// The right shape matters most; stronger lines break ties; a guessed edge costs a little so real ones win.
		const score = aspectError - 0.03 * strength + (inferred ? INFERRED_PENALTY : 0) + inward;

		if (!best || score < best.score) best = { left, right, top, bottom, score };
	};

	const lefts_ = [...lefts, null];
	const rights_ = [...rights, null];
	const tops_ = [...tops, null];
	const bottoms_ = [...bottoms, null];

	for (const left of lefts_) {
		for (const right of rights_) {
			for (const top of tops_) {
				for (const bottom of bottoms_) {
					const missing = [left, right, top, bottom].filter((edge) => edge === null).length;

					if (missing > 1) continue;

					let l = left?.position ?? 0;
					let r = right?.position ?? 0;
					let t = top?.position ?? 0;
					let bt = bottom?.position ?? 0;

					if (!left) l = r - (bt - t) * expectedAspect;
					else if (!right) r = l + (bt - t) * expectedAspect;
					else if (!top) t = bt - (r - l) / expectedAspect;
					else if (!bottom) bt = t + (r - l) / expectedAspect;

					// A guessed edge may only move outward, past the real lines we found on that side. Hidden borders sit
					// outside a printed band; a guess inside the card would cut through a card whose edges are all visible.
					if (!left && (!withinWindow(l, guide.x, radiusX) || (lefts.length && l > Math.min(...lefts.map((edge) => edge.position)) + 1))) continue;
					if (!right && (!withinWindow(r, guide.x + guide.width, radiusX) || (rights.length && r < Math.max(...rights.map((edge) => edge.position)) - 1))) continue;
					if (!top && (!withinWindow(t, guide.y, radiusY) || (tops.length && t > Math.min(...tops.map((edge) => edge.position)) + 1))) continue;
					if (!bottom && (!withinWindow(bt, guide.y + guide.height, radiusY) || (bottoms.length && bt < Math.max(...bottoms.map((edge) => edge.position)) - 1))) continue;

					if (!left && !hasSignal(columns, typicalColumn, l)) continue;
					if (!right && !hasSignal(columns, typicalColumn, r)) continue;
					if (!top && !hasSignal(rows, typicalRow, t)) continue;
					if (!bottom && !hasSignal(rows, typicalRow, bt)) continue;

					const strength = ((left?.strength ?? INFERRED_STRENGTH) + (right?.strength ?? INFERRED_STRENGTH) + (top?.strength ?? INFERRED_STRENGTH) + (bottom?.strength ?? INFERRED_STRENGTH)) / 4;

					consider(l, r, t, bt, strength, missing === 1);
				}
			}
		}
	}

	const chosen = best as { bottom: number; left: number; right: number; top: number } | null;

	if (!chosen) return EMPTY_SHAPE;

	const rect = { x: chosen.left, y: chosen.top, width: chosen.right - chosen.left, height: chosen.bottom - chosen.top };

	return {
		found: true,
		rect,
		aspect: rect.width / rect.height,
		coverage: rect.width / guide.width,
		offsetX: (rect.x + rect.width / 2 - (guide.x + guide.width / 2)) / guide.width,
		offsetY: (rect.y + rect.height / 2 - (guide.y + guide.height / 2)) / guide.height,
	};
};

export interface ShapeJudgement {
	found: boolean;
	ok: boolean;
	state: ScanState | null;
}

/** Turns the found outline into one instruction: closer, farther, center or flat (tilted). */
export const judgeShape = (shape: ShapeResult, expectedAspect: number): ShapeJudgement => {
	if (!shape.found) return { found: false, ok: false, state: null };
	if (shape.coverage < SHAPE_MIN_COVERAGE) return { found: true, ok: false, state: "closer" };
	if (shape.coverage > SHAPE_MAX_COVERAGE) return { found: true, ok: false, state: "farther" };
	if (Math.abs(shape.offsetX) > 0.15 || Math.abs(shape.offsetY) > 0.2) return { found: true, ok: false, state: "center" };
	if (Math.abs(shape.aspect / expectedAspect - 1) > SHAPE_ASPECT_TOLERANCE) return { found: true, ok: false, state: "flat" };

	return { found: true, ok: true, state: null };
};

export const OVAL_WIDTH_RATIO = 0.62;
export const OVAL_HEIGHT_RATIO = 0.72;

/** Where the selfie oval sits inside the visible 3:4 well, in video pixels. */
export const ovalRect = (videoWidth: number, videoHeight: number): Rect => {
	const visible = visibleRect(videoWidth, videoHeight);
	const width = visible.width * OVAL_WIDTH_RATIO;
	const height = visible.height * OVAL_HEIGHT_RATIO;

	return {
		x: visible.x + (visible.width - width) / 2,
		y: visible.y + (visible.height - height) / 2,
		width,
		height,
	};
};

export interface SelfieInput {
	angle?: { pitch?: number; roll?: number; yaw?: number } | null;
	contrast?: number;
	faces: Rect[] | null | undefined;
	oval: Rect;
}

/** Evaluates whether the person's face is centered, sized and facing straight inside the selfie oval. */
export const judgeSelfie = ({ angle, contrast, faces, oval }: SelfieInput): ScanVerdict => {
	if (!faces || !faces.length) return verdict("searching", false, "verify.selfieCenter");

	const face = biggest(faces);

	if (!face) return verdict("searching", false, "verify.selfieCenter");

	const heightRatio = face.height / oval.height;
	const widthRatio = face.width / oval.width;

	if (heightRatio < 0.35 && widthRatio < 0.42) return verdict("closer", false, "verify.selfieCloser");
	if (heightRatio > 0.92 || widthRatio > 0.98) return verdict("farther", false, "verify.selfieFarther");

	const faceCenter = centerOf(face);
	const ovalCenter = centerOf(oval);
	const offsetX = Math.abs(faceCenter.x - ovalCenter.x) / oval.width;
	const offsetY = Math.abs(faceCenter.y - ovalCenter.y) / oval.height;

	if (offsetX > 0.18 || offsetY > 0.2 || !boxInside(oval, face, 0.06)) return verdict("center", false, "verify.selfieCenter");

	if (angle) {
		const roll = Math.abs(angle.roll || 0);
		const pitch = Math.abs(angle.pitch || 0);
		const yaw = Math.abs(angle.yaw || 0);

		if (roll > 25 || pitch > 28 || yaw > 45) return verdict("flat", false, "verify.selfieStraight");
	}

	if (contrast !== undefined && contrast < 100) return verdict("light", false, "verify.scanLight");

	return verdict("steady", true, "verify.selfieSteady");
};
