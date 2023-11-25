import { ResolveFn } from "@angular/router";
import { Observable } from "rxjs";

export const passwordlessLoginResolver: ResolveFn<any> = async (route, state) => {
	const projectId = route.params.id;

	// return this._kycService.getProjectForNewKYC(projectId, 'login').pipe(
	//     catchError((error) => {
	//         // Log the error
	//         console.error({
	//             message: error.message
	//         });

	//         // Get the parent url
	//         const parentUrl = state.url.split('/').slice(0, -1).join('/');

	//         // Navigate to there
	//         this._router.navigateByUrl(parentUrl);

	//         // Throw an error
	//         return throwError(error);
	//     })
	// );
};
