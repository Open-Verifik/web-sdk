import { inject } from "@angular/core";
import { CanActivateChildFn, CanActivateFn } from "@angular/router";
import { AuthService } from "app/core/auth/auth.service";
import { catchError, of, switchMap } from "rxjs";

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = () => {
    return inject(AuthService)
        .check()
        .pipe(
            catchError(() => of(false)),
            switchMap(() => of(true))
        );
};
