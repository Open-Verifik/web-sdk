
import {
  Injectable
} from '@angular/core';
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

  constructor(private _httpWrapper: HttpWrapperService) {}

  postForm(data: any): Observable < any > {
    return this._httpWrapper.sendRequest('post', `${this.baseUrl}v2/leads`, data)
  }

}