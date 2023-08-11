import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	OnDestroy,
	OnInit,
	ViewEncapsulation
} from '@angular/core';
import {
	TranslocoService
} from '@ngneat/transloco';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector       : 'profile-preview',
    templateUrl    : './profile-preview.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfilePreviewComponent implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<ProfilePreviewComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ){

    }

    ngOnInit(): void {
        
    }
}