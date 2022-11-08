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
    private _unsubscribeAll: Subject < any > = new Subject < any > ();

    isDemo: boolean;
    codeError: string

    routeErrors = {

    }
    menu: any;
    menuErrors: any;

    constructor(
        private _snackBar: MatSnackBar,
        private router: Router,
        private _activeRoute: ActivatedRoute,
        private _buttonMockService: ButtonMockService) {

        this._activeRoute.queryParams
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(params => {
                if (params.demo) {
                    this._buttonMockService.menuErrors = this.router.url
                    this._buttonMockService.isDemo = true
                    this._buttonMockService.codeError = 'success'

                    this.router.events
                        .pipe(takeUntil(this._unsubscribeAll))
                        .pipe(
                            filter(event => event instanceof NavigationStart),
                        ).subscribe((data: NavigationStart) => {
                            this._buttonMockService.menuErrors = data.url
                        })
                }
            });

    }

    ngOnInit(): void {
        this._buttonMockService.menuErrors$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(menuErrors => {
                this.menuErrors = menuErrors
                this._buttonMockService.codeError = 'success'
            })

        this._buttonMockService.codeError$
            .pipe(takeUntil(this._unsubscribeAll))
            .pipe(filter(params => params != null))
            .subscribe(codeError => {
                this.codeError = codeError
            })
        this._buttonMockService.codeEnds$
            .pipe(takeUntil(this._unsubscribeAll))
            .pipe(filter(params => params != null))
            .subscribe(codeError => {
                this._buttonMockService.codeError = 'success'

                this._snackBar.openFromComponent(NotificationMockComponent, {
                    data: codeError,
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',

                    panelClass: [codeError.includes('success') ? 'blueSuccess' : 'redError']
                });
            })
        this._buttonMockService.isDemo$
            .pipe(takeUntil(this._unsubscribeAll))
            .pipe(filter(params => params != null))
            .subscribe(isDemo => {
                this.isDemo = isDemo
            })
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
    }

    mockApi(codeError: string): void {
        this._buttonMockService.codeError = codeError
    }
}