import { CommonModule, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type CorrectionsBounds = { x: string; y: string; };
export type CorrectionsHeightWidth = { height: string; width: string; };
export type CorrectionsAngle = { pitch: string; roll: string; yaw: string };

export type Corrections = {
    angle?: CorrectionsAngle,
    bounds?: CorrectionsBounds,
    document?: CorrectionsBounds,
    documentResolution?: CorrectionsHeightWidth,
    resolution?: CorrectionsHeightWidth,
};

@Component({
    selector: 'smart-scanner-corrections',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        NgIf,
    ],
    templateUrl: './smart-scanner-corrections.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartScannerCorrectionsComponent {
    @Input('angle') angle: CorrectionsAngle;
    @Input('bounds') bounds: CorrectionsBounds;
    @Input('resolution') resolution: CorrectionsHeightWidth;

    @Input('height') height: number;
    @Input('isHorizontal') isHorizontal: boolean;
    @Input('width') width: number;
}
