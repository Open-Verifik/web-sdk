import {
	Injectable
} from '@angular/core';
import { Router,RouterStateSnapshot,
    ActivatedRouteSnapshot, 
	ActivatedRoute} from '@angular/router';
import {
	HttpWrapperService
} from 'app/core/http-wrapper.service';
import {
	environment
} from 'environments/environment';
import {
	BehaviorSubject,
	Observable
} from 'rxjs';
import {
	tap
} from 'rxjs/operators';


@Injectable({
	providedIn: 'root'
})
export class DemoService {
	baseUrl: String = environment.baseUrl;
	private _navigationHandler: BehaviorSubject < any | null > = new BehaviorSubject(null);


	constructor(private _httpWrapper: HttpWrapperService,
		private _router: Router,
		private route: ActivatedRoute, 
		) {}

	get navigationHandler$(): Observable < any > {
		return this._navigationHandler.asObservable();
	}

	navigationChange(step: any): void {
		this._navigationHandler.next(step);
	}

	getLead():Observable < any > {
		return this._httpWrapper.sendRequest('get', `${this.baseUrl}v2/leads`)
		// .pipe(
		// 	tap((response:any)=>{
				// if(response.data){
				// 	console.log(this.route.paramMap)
				// 	this.navigationChange({hasToken:true, token: this.route.paramMap[1]});
        
                    // const parentUrl = this.state.url.split('/').slice(0, -1).join('/');
        
                    // this._router.navigateByUrl(parentUrl);
				// }
		// 		console.log(response);
		// 	})
		// )
	}

	postForm(data: any): Observable < any > {
		return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/leads`, data)
	}

	postHubspot(data: any): Observable < any > {
		return this._httpWrapper.sendRequest('post', `https://api.hsforms.com/submissions/v3/integration/submit/22733348/5d95b7db-79d7-47dc-a338-82f1b22a4a98`, data)
	}

}