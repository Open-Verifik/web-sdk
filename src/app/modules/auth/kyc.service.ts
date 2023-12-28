import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { HttpWrapperService } from "../demo/http-wrapper.service";
import { TranslocoService } from "@ngneat/transloco";
import { Observable, tap } from "rxjs";
import { Project, ProjectModel } from "./project";

@Injectable({
	providedIn: "root",
})
export class KYCService {
	baseUrl: String = environment.apiUrl;
	currentProject: Project;

	constructor(private _httpWrapper: HttpWrapperService, private _translocoService: TranslocoService) {}

	getProject(): Project {
		return this.currentProject;
	}

	getAppRegistration(id: string, data: any): Observable<any> {
		return this._httpWrapper.sendRequest("get", `${this.baseUrl}/v2/app-registrations/${id}`, data);
	}

	createAppRegistration(data: any): Observable<any> {
		return this._httpWrapper.sendRequest("post", `${this.baseUrl}/v2/app-registrations`, data);
	}
}
