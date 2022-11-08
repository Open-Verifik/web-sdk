import {
    Component,
    Inject
} from '@angular/core';

import {
    MatDialogRef,
    MAT_DIALOG_DATA
} from '@angular/material/dialog';

@Component({
    selector: 'app-kyc-document-validation-qr',
    templateUrl: './kyc-document-validation-qr.component.html',
    styleUrls: ['./kyc-document-validation.component.scss'],
})
export class KycDocumentValidationQrComponent {
    constructor(
        public dialogRef: MatDialogRef < KycDocumentValidationQrComponent > ,
        @Inject(MAT_DIALOG_DATA) public data: string,
    ) {}
}