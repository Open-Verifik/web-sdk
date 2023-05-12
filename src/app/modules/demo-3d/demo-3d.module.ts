import {
  NgModule
} from '@angular/core';
import {
  CommonModule
} from '@angular/common';
import {
  DemoRootComponent
} from './demo-root/demo-root.component';
import {
  MatButtonModule
} from '@angular/material/button';
import {
  MatFormFieldModule
} from '@angular/material/form-field';
import {
  MatIconModule
} from '@angular/material/icon';
import {
  MatInputModule
} from '@angular/material/input';
import {
  MatProgressBarModule
} from '@angular/material/progress-bar';
import {
  MatSelectModule
} from '@angular/material/select';
import {
  MatSidenavModule
} from '@angular/material/sidenav';
import {
  MatSlideToggleModule
} from '@angular/material/slide-toggle';
import {
  MatTooltipModule
} from '@angular/material/tooltip';
import {
  FuseFindByKeyPipeModule
} from '@fuse/pipes/find-by-key';
import {
  SharedModule
} from 'app/shared/shared.module';
import {
  MatTabsModule
} from '@angular/material/tabs';
import {
  RouterModule
} from '@angular/router';
import {
  FuseCardModule
} from '@fuse/components/card';
import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';
import {
  FuseAlertModule
} from '@fuse/components/alert';
import {
  MatSnackBarModule
} from '@angular/material/snack-bar';
import {
  TranslocoModule
} from '@ngneat/transloco';
import {
  FuseHighlightModule
} from '@fuse/components/highlight';
import {
  LanguagesModule
} from 'app/layout/common/languages/languages.module';
import {
  DemoRoutes
} from './demo-routing';
import { ProfilePreviewComponent } from './demo-root/profile-preview/profile-preview.component';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  declarations: [
    DemoRootComponent,
    ProfilePreviewComponent
  ],
  imports: [
    RouterModule.forChild(DemoRoutes),
    TranslocoModule,
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatTooltipModule,
    FuseFindByKeyPipeModule,
    SharedModule,
    MatTabsModule,
    FuseHighlightModule,
    FuseCardModule,
    MatProgressSpinnerModule,
    FuseAlertModule,
    MatSnackBarModule,
    LanguagesModule,
    QRCodeModule
  ]
})
export class Demo3dModule {}