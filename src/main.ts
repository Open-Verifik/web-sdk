import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from 'app/app.component';
import { appConfig } from 'app/app.config';
import adapter from 'webrtc-adapter'; // do not remove - https://github.com/webrtc/adapter?tab=readme-ov-file#javascript

bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error(err));
