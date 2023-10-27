import { Injectable } from "@angular/core";
import { environment } from "environments/environment";

import { Observable } from "rxjs";
import { HttpWrapperService } from "../demo/http-wrapper.service";

@Injectable({
	providedIn: "root",
})
export class WebSdkService {
	baseUrl: String = environment.apiUrl;

	enviroment: any = environment;

	constructor(private _httpWrapper: HttpWrapperService) {}

	livenessDemo(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/face-recognition/liveness/demo`, data);
	}
}
