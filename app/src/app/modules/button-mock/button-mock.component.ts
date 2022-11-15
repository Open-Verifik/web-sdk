import {
    ChangeDetectorRef,
    Component,
    Inject,
    OnDestroy,
    OnInit
} from '@angular/core';
import {
    MatSnackBar
} from '@angular/material/snack-bar';
import {
    ActivatedRoute,
    NavigationStart,
    Router
} from '@angular/router';
import {
    Subject
} from 'rxjs';
import {
    filter,
    takeUntil
} from 'rxjs/operators';
import {
    ButtonMockService
} from './button-mock.service';

import {
    MAT_SNACK_BAR_DATA
} from '@angular/material/snack-bar';

@Component({
    template: `
    <div>
      {{ 'mockApi.notification_prefix' | transloco}}: {{ 'mockApi.' + data  | transloco  }}
    </div>`,
    styleUrls: ["./button-mock.component.scss"],

})
export class NotificationMockComponent {
    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: string) {}
}

@Component({
    selector: 'button-mock',
    templateUrl: './button-mock.component.html',
    styleUrls: ['./button-mock.component.scss']
})
export class ButtonMockComponent implements OnInit, OnDestroy {
    ngOnInit(): void {
        throw new Error('Method not implemented.');
    }
    ngOnDestroy(): void {
        throw new Error('Method not implemented.');
    }

}