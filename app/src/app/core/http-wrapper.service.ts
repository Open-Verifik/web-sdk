import {
    Injectable
} from '@angular/core';
import {
    HttpClient
} from '@angular/common/http';
import {
    Observable
} from 'rxjs';
import {
    filter,
    finalize,
    retry,
    takeUntil
} from 'rxjs/operators';
import {
    ButtonMockService
} from 'app/modules/button-mock/button-mock.service';
import {
    environment
} from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class HttpWrapperService {
    private _baseUrl: string = environment.baseUrl;
    public tail: Array < any > = [];
    private isDemo: boolean;
    private codeError: string;
    private omitDemoUrl = ['v2/projects/kyc', 'v2/projects/biometrics', 'v2/projects/biometrics/session']

    get progress(): boolean {
        return !!this.tail.length;
    }

    constructor(private _http: HttpClient, private _buttonMockService: ButtonMockService) {

        this._buttonMockService.isDemo$
            .pipe(filter(params => params != null))
            .subscribe(isDemo => {
                this.isDemo = isDemo
            })

        this._buttonMockService.codeError$
            .pipe(filter(params => params != null))
            .subscribe(codeError => {
                this.codeError = codeError
            })
    }
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

        const authToken: string = localStorage.getItem('accessToken');

        let headers = {
            ...options.headers,
            timeout: 20
        };

        if (authToken && !authToken.includes('fake')) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        delete options.headers

        if (this.isDemo && !this.omitDemoUrl.some(path => this._baseUrl + path === url)) {
            url = url.replace(this._baseUrl, 'mockApi/')
            params.codeError = this.codeError
            // console.log("fakeData", method, url, params.codeError)
        }

        switch (method) {
            case 'get':
                return this.request(this._http.get(url, {
                    params,
                    ...options,
                    headers,

                }));
            case 'post':
                return this.request(this._http.post(url, params, {
                    headers,
                    ...options
                }));
            case 'put':
                return this.request(this._http.put(url, params, {
                    headers,
                    ...options
                }));
            case 'delete':
                return this.request(this._http.delete(url, {
                    headers,
                    ...options
                }));
            default:
                throw "method not provided";
        }
    }

    private request(a: Observable < any > ): Observable < any > {
        this.tail.push(a);
        // console.log('queue',this.tail);
        return a.pipe(
            retry(0),
            finalize(() => {
                const index = this.tail.indexOf(a);
                this.tail.splice(index, 1);
                // console.log('queue',this.tail)
            })
        );
    }
}