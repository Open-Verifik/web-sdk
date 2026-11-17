export type Mat = any;

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
