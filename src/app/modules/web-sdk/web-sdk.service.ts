import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";

import { Observable } from "rxjs";

@Injectable({
	providedIn: "root",
})
export class WebSdkService {
	baseUrl: String = environment.baseUrl;
	enviroment: any = environment;

	constructor(private _http: HttpClient) {}

	addPerson(data: any, options: any = {}): Observable<any> {
		return this._http.post(`${this.baseUrl}v2/face-recognition/persons`, data, {
			timeout: 0,
			...options,
		});
	}

	search(data: any, options: any = {}): Observable<any> {
		return this._http.post(`${this.baseUrl}v2/face-recognition/search`, data, {
			timeout: 0,
			...options,
		});
	}

	searchLiveFace(data: any, options: any = {}): Observable<any> {
		return this._http.post(`${this.baseUrl}v2/face-recognition/search-live-face`, data, {
			timeout: 0,
			...options,
		});
	}

	detect(data: any, options: any = {}): Observable<any> {
		return this._http.post(`${this.baseUrl}v2/face-recognition/detect`, data, {
			timeout: 0,
			...options,
		});
	}

	liveness(data: any, options: any = {}): Observable<any> {
		return this._http.post(`${this.baseUrl}v2/face-recognition/liveness`, data, {
			timeout: 0,
			...options,
		});
	}

	livenessDemo(data: any, options: any = {}): Observable<any> {
		return this._http.post(`${this.baseUrl}v2/face-recognition/liveness`, data, {
			timeout: 0,
			...options,
		});
	}

	verify(data: any, options: any = {}): Observable<any> {
		return this._http.post(`${this.baseUrl}v2/face-recognition/verify`, data, {
			timeout: 0,
			...options,
		});
	}
}
