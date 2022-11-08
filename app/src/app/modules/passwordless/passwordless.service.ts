import {
    Injectable
} from '@angular/core';
import {
    Observable,
    BehaviorSubject
} from 'rxjs';
import {
    environment
} from 'environments/environment';
import {
    ProjectModel
} from '../models';
import {
    HttpWrapperService
} from 'app/core/http-wrapper.service';
import {
    tap
} from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class PasswordlessService {
    baseUrl: String = environment.baseUrl;

    private _currentProject: BehaviorSubject < ProjectModel | null > = new BehaviorSubject(null);

    currentProject: ProjectModel;

    constructor(private _httpWrapper: HttpWrapperService) {}

    get currentProject$(): Observable < ProjectModel > {
        return this._currentProject.asObservable();
    }

    sendEmailValidation(projectId: string, email: string): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/email-login`, {
            email,
            id: projectId,
            type: 'login',
        }).pipe(
            tap((response: any) => {
                // console.log({
                //     response
                // });
            })
        );
    }

    sendPhoneValidation(projectId: string, countryCode: string, phone: string): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/phone-login`, {
            phone,
            countryCode,
            id: projectId,
            type: 'login',
        }).pipe(
            tap((response: any) => {
               
            })
        );
    }

    confirmEmailValidation(projectId: string, email: string, otp: string, authenticatorOTP: string): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/email-login/confirm`, {
            email,
            otp,
            id: projectId,
            authenticatorOTP,
            type: 'login',
            ipData: JSON.parse(localStorage.getItem('ipData')),
        }).pipe(
            tap((response: any) => {
                // console.log({
                //     response
                // });
            })
        );
    }

    confirmPhoneValidation(projectId: string, countryCode: string, phone: string, otp: string, authenticatorOTP: string): Observable < any > {
        return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/projects/phone-login/confirm`, {
            phone,
            otp,
            countryCode,
            id: projectId,
            authenticatorOTP,
            type: 'login',
            ipData: JSON.parse(localStorage.getItem('ipData')),
        }).pipe(
            tap((response: any) => {
                // console.log({
                //     response
                // });
            })
        );
    }
}