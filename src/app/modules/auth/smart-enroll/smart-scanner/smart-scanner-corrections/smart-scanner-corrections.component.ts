import { CommonModule, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CorrectionsAngle, CorrectionsBounds, CorrectionsHeightWidth } from '../../smart-enroll.service';

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
    @Input('isLandscape') isLandscape: boolean;
    @Input('width') width: number;
}
