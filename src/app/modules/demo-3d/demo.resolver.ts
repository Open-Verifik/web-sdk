import {
    Injectable
} from '@angular/core';
import {
    Router,
    Resolve,
    RouterStateSnapshot,
    ActivatedRouteSnapshot
} from '@angular/router';
import {
    Observable,
    of ,
    throwError
} from 'rxjs';
import {
    catchError,
    tap
} from 'rxjs/operators';
import { DemoService } from './demo.service';

@Injectable({
    providedIn: 'root'
})
export class DemoResolver implements Resolve < boolean > {
    /**
     * Constructor
     */
    constructor(private _router: Router,
        private _demoService: DemoService
    ) {

    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable < any > {
        localStorage.clear();
        if (route.params.id) {

            console.log(route.params.id)
            localStorage.setItem('accessToken', route.params.id)
            return this._demoService.getLead().pipe(
                tap((response:any)=>{
                    if(response.data){

                        this._demoService.navigationChange({hasToken:true, token: route.params.id});
            
                        const parentUrl = state.url.split('/').slice(0, -1).join('/');
            
                        this._router.navigateByUrl(parentUrl);
                    }
                    console.log(response);
                }),

                catchError((error)=>{
                    
                    this._demoService.navigationChange(undefined);
        
                    const parentUrl = state.url.split('/').slice(0, -1).join('/');
        
                    this._router.navigateByUrl(parentUrl);

                    console.log(error);
                    return of(  Boolean(false))
                })
            )


        }
    }
}