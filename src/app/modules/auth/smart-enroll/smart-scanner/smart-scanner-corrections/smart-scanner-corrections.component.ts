import { CommonModule, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CorrectionsAngle, CorrectionsBounds, CorrectionsHeightWidth } from '../../smart-enroll.service';
import { TranslocoModule } from '@ngneat/transloco';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
    selector: 'smart-scanner-corrections',
    standalone: true,
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatIconModule,
        NgIf,
        TranslocoModule,
    ],
    styleUrls: ['../../smart-enroll.component.scss'],
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

    getTranslationKey(key1: string, key2: string, value: string): string {
        return `corrections.${key1}.${key2}.${value}`;
    }

    hasCorrections(item: any) {
        return !!Object.values(item).filter((v) => v).length;
    }
}
