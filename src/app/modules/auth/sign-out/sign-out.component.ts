import { finalize, Subject, takeUntil, takeWhile, tap, timer } from "rxjs";

import { Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { I18nPluralPipe, NgIf } from "@angular/common";
import { Router, RouterLink } from "@angular/router";

import { AuthService } from "app/core/auth/auth.service";

@Component({
    selector: "auth-sign-out",
    templateUrl: "./sign-out.component.html",
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [NgIf, RouterLink, I18nPluralPipe],
})
export class AuthSignOutComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    countdown: number = 5;
    countdownMapping: any = {
        "=1": "# second",
        other: "# seconds",
    };

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _router: Router
    ) {}

    /**
     * On init
     */
    ngOnInit(): void {
        // Sign out
        this._authService.signOut();

        // Redirect after the countdown
        timer(1000, 1000)
            .pipe(
                finalize(() => {
                    this._router.navigate(["sign-in"]);
                }),
                takeWhile(() => this.countdown > 0),
                takeUntil(this._unsubscribeAll),
                tap(() => this.countdown--)
            )
            .subscribe();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
