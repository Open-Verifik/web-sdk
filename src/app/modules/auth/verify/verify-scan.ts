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
}

/** Same ratio as a bank card / ID-1 document. */
export const ID_ASPECT = 1.586;
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
export const guideRect = (videoWidth: number, videoHeight: number): Rect => {
	const visible = visibleRect(videoWidth, videoHeight);
	const width = visible.width * GUIDE_WIDTH_RATIO;
	const height = width / ID_ASPECT;

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

export const biggest = (boxes: Rect[]): Rect | undefined =>
	boxes.reduce<Rect | undefined>((best, box) => (!best || box.width * box.height > best.width * best.height ? box : best), undefined);

export interface FrontInput {
	/** Face boxes in video pixels. `null` means the face model is not available. */
	faces: Rect[] | null;
	guide: Rect;
	/** Frames in a row with no face at all (drives the "fill the frame" message). */
	missesInARow: number;
	region: { contrast: number; sharpness: number };
}

/** After this many empty frames (about 4 seconds) we stop saying "looking" and explain what is missing. */
export const MISSES_BEFORE_HELP = 11;

export const judgeFront = ({ faces, guide, missesInARow, region }: FrontInput): ScanVerdict => {
	// Without the face model we can only say "something with detail is in the frame".
	if (faces === null) {
		if (region.contrast < MIN_CONTRAST) return verdict("light");
		if (region.sharpness < MIN_SHARPNESS) return verdict("blurry");

		return verdict("steady", true);
	}

	if (!faces.length) return verdict(missesInARow >= MISSES_BEFORE_HELP ? "noFace" : "searching");

	const inside = faces.filter((face) => contains(guide, centerOf(face), 0.05));
	const face = biggest(inside);

	if (!face) return verdict("center");

	const ratio = face.height / guide.height;

	if (ratio > FACE_MAX_RATIO) return verdict("notFace");
	if (ratio < FACE_MIN_RATIO) return verdict("closer");
	if (region.contrast < MIN_CONTRAST) return verdict("light");
	if (region.sharpness < MIN_SHARPNESS) return verdict("blurry");

	return verdict("steady", true);
};

export const judgeBack = (region: { contrast: number; sharpness: number }): ScanVerdict => {
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
