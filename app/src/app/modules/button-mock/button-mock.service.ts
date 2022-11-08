import {
    Injectable
} from '@angular/core';
import {
    Observable,
    BehaviorSubject
} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ButtonMockService {
    private _menuErrors: BehaviorSubject < [string] | null > = new BehaviorSubject(null);
    private _codeError: BehaviorSubject < string | null > = new BehaviorSubject(null);
    private _codeEnds: BehaviorSubject < string | null > = new BehaviorSubject(null);
    private _isDemo: BehaviorSubject < boolean | null > = new BehaviorSubject(null);

    private _ErrorsByRoute = {
        '/passwordless/auth/': ['email_could_not_be_validated','emailValidation_has_expired', ,'phone_could_not_be_validated', 'phoneValidation_has_expired', ,'otp_does_not_match','','Fail_login_biometrics','Validate_backend'],

        'kyc/start/': ['otp_does_not_match', 'Already_exists', 'emailValidation_has_expired', 'phoneValidation_has_expired'],

        'kyc/project/': ['restart_demo'],
    }

    constructor() {}

    /**
     * Getter for categories
     */
     get codeEnds$(): Observable < string > {
        return this._codeEnds.asObservable();
    }

    set codeEnds(codeEnds: string) {
        this._codeEnds.next(codeEnds)
    }

    get codeError$(): Observable < string > {
        return this._codeError.asObservable();
    }

    set codeError(codeError: string) {
        this._codeError.next(codeError)
    }

    get menuErrors$(): Observable < [string] | null > {
        return this._menuErrors.asObservable();
    }

    set menuErrors(route: string) {
        let menuErrors: [string] = null

        for (const key in this._ErrorsByRoute) {
            if (route.includes(key)) {
                menuErrors = this._ErrorsByRoute[key]
            }

        }

        this._menuErrors.next(menuErrors)
    }

    get isDemo$(): Observable < boolean > {
        return this._isDemo.asObservable();
    }

    set isDemo(isDemo: boolean) {
        this._isDemo.next(isDemo)
    }


}