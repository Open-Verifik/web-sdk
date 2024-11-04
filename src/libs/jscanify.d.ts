import { Mat } from "mirada/dist/src/types/opencv";

declare class jscanify {
    constructor();

    /**
     * Finds the contour of the paper within the image
     * @param {*} img image to process (cv.Mat)
     * @returns the biggest contour inside the image
     */
    findPaperContour(img: Mat): Mat;

    /**
     * Highlights the paper detected inside the image.
     * @param {*} image image to process
     * @param {*} options options for highlighting. Accepts `color` and `thickness` parameter
     * @returns `HTMLCanvasElement` with original image and paper highlighted
     */
    highlightPaper(
        image: HTMLCanvasElement,
        options?: HighlightOptions
    ): HTMLCanvasElement;

    /**
     * Extracts and undistorts the image detected within the frame.
     * @param {*} image image to process
     * @param {*} resultWidth desired result paper width
     * @param {*} resultHeight desired result paper height
     * @param {*} cornerPoints optional custom corner points, in case automatic corner points are incorrect
     * @returns `HTMLCanvasElement` containing undistorted image
     */
    extractPaper(
        image: HTMLCanvasElement,
        resultWidth: number,
        resultHeight: number,
        cornerPoints: number
    ): HTMLCanvasElement;

    /**
     * Calculates the corner points of a contour.
     * @param {*} contour contour from {@link findPaperContour}
     * @returns object with properties `topLeftCorner`, `topRightCorner`, `bottomLeftCorner`, `bottomRightCorner`, each with `x` and `y` property
     */
    getCornerPoints(contour: Mat): Contour;
}

export interface Contour {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
}

export interface HighlightOptions {
    color?: string;
    thickness?: number;
}

export default jscanify;
