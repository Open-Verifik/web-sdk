import {
  Injectable
} from '@angular/core';
import {
  environment
} from 'environments/environment';
import {
  HttpWrapperService
} from 'app/core/http-wrapper.service';
import {
  Observable
} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CoreService {
  baseUrl: String = environment.baseUrl;


  constructor(private _httpWrapper: HttpWrapperService) {

  }

  getGeoLocation(): Observable < any > {
    return this._httpWrapper.sendRequest('get', 'https://ipv4.am.i.mullvad.net/json');
  }

}