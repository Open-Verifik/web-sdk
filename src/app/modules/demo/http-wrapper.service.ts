import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { onHttpForbiddenClearAppRegistrationSession, shouldClearAppRegistrationSessionOnHttpForbidden } from "app/core/services/app-registration-session.storage";
import { Observable, retry, finalize, catchError, throwError } from "rxjs";

import { SmartEnrollService } from "../auth/smart-enroll/smart-enroll.service";

@Injectable({
    providedIn: "root",
})
export class HttpWrapperService {
    public tail: Array<any> = [];

    get progress(): boolean {
        return !!this.tail.length;
    }

    constructor(
        private _http: HttpClient,
        private _smartEnrollService: SmartEnrollService
    ) {}
    /**
     * send request
     * @param method - to determinate which function we will be using
     * @param url - url that we will requesting information
     * @param params - params that can go into the body or the query string param
     * @param options - headers or some other sort of params
     */
    // tslint:disable-next-line:typedef
    sendRequest(method: string, url: string, params: any = {}, options: any = {}) {
        method = method.toLocaleLowerCase();

        const authToken: string = localStorage.getItem("accessToken");

        const baseHeaders: Record<string, any> = {
            timeout: 20,
        };

        if (authToken) {
            baseHeaders["Authorization"] = `Bearer ${authToken}`;
        }

        const { headers: optionHeaders, ...restOptions } = options || {};
        let headers: Record<string, any> | HttpHeaders = baseHeaders;

        if (optionHeaders instanceof HttpHeaders) {
            let merged = optionHeaders;
            for (const [key, value] of Object.entries(baseHeaders)) {
                if (!merged.has(key)) {
                    merged = merged.set(key, String(value));
                }
            }
            headers = merged;
        } else if (optionHeaders && typeof optionHeaders === "object") {
            const merged: Record<string, any> = { ...baseHeaders };
            for (const [key, value] of Object.entries(optionHeaders)) {
                if (value !== undefined && value !== null && value !== "") {
                    merged[key] = value;
                }
            }
            headers = merged;
        }

        switch (method) {
            case "get":
                return this.request(
                    this._http.get(url, {
                        params,
                        headers,
                        ...restOptions,
                    })
                );
            case "post":
                return this.request(
                    this._http.post(url, params, {
                        headers,
                        ...restOptions,
                    })
                );
            case "put":
                return this.request(
                    this._http.put(url, params, {
                        headers,
                        ...restOptions,
                    })
                );
            case "delete":
                return this.request(
                    this._http.delete(url, {
                        headers,
                        ...restOptions,
                    })
                );
            default:
                throw "method not provided";
        }
    }

    private request(a: Observable<any>): Observable<any> {
        this.tail.push(a);
        return a.pipe(
            retry(0),
            catchError((error) => {
                if (
                    error instanceof HttpErrorResponse &&
                    error.status === 403 &&
                    shouldClearAppRegistrationSessionOnHttpForbidden(error)
                ) {
                    onHttpForbiddenClearAppRegistrationSession(() => this._smartEnrollService.unsetLocalStorage());
                }

                return throwError(() => error);
            }),
            finalize(() => {
                const index = this.tail.indexOf(a);
                this.tail.splice(index, 1);
            })
        );
    }
}
