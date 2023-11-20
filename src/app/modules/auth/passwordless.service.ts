import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { HttpWrapperService } from "../demo/http-wrapper.service";
import { TranslocoService } from "@ngneat/transloco";
import { Observable, tap } from "rxjs";
import { Project, ProjectModel } from "./project";

@Injectable({
	providedIn: "root",
})
export class PasswordlessService {
	baseUrl: String = environment.apiUrl;
	currentProject: Project;

	constructor(private _httpWrapper: HttpWrapperService, private _translocoService: TranslocoService) {}

	requestProject(projectId: string, type: string = "onboarding"): Observable<any> {
		return this._httpWrapper
			.sendRequest("get", `${this.baseUrl}/v2/projects/kyc`, {
				id: projectId,
			})
			.pipe(
				tap((response: any) => {
					this.currentProject = new ProjectModel({
						...response.data,
						type,
					});
				})
			);
	}

	getProject(): Project {
		return this.currentProject;
	}

	setProject;
}
