import { Observable } from "rxjs";

import { Injectable } from "@angular/core";

import { environment } from "environments/environment";
import { HttpWrapperService } from "../demo/http-wrapper.service";

@Injectable({
	providedIn: "root",
})
export class OCRService {
    apiUrl: string;

	constructor(private _httpWrapperService: HttpWrapperService,) {
		this.apiUrl = environment.apiUrl;
	}

	scanPrompt(data: any): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/ocr/scan-prompt`, data);
	}

	scanStudio(data: any): Observable<any> {
		return this._httpWrapperService.sendRequest("post", `${this.apiUrl}/v2/ocr/scan-studio`, data);
	}
}
