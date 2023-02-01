import {
  NgModule
} from '@angular/core';
import {
  CommonModule
} from '@angular/common';
import {
  TutorialsListComponent
} from './tutorials-list/tutorials-list.component';
import {
  TutorialComponent
} from './tutorial/tutorial.component';
import {
  TutorialsRoutingRootComponent
} from './tutorials-routing-root/tutorials-routing-root.component';
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
  TutorialsRoutes
} from './tutorials-routing';
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
  TutorialInstructionsStepComponent
} from './tutorial-instructions-step/tutorial-instructions-step.component';
import {
  TutorialCredentialsStepComponent
} from './tutorial-credentials-step/tutorial-credentials-step.component';
import {
  TutorialDemoStepComponent
} from './tutorial-demo-step/tutorial-demo-step.component';
import {
  TutorialResultsStepComponent
} from './tutorial-results-step/tutorial-results-step.component';
import {
  FuseHighlightModule
} from '@fuse/components/highlight';
import { LanguagesModule } from 'app/layout/common/languages/languages.module';
@NgModule({
  declarations: [
    TutorialsListComponent,
    TutorialComponent,
    TutorialsRoutingRootComponent,
    TutorialInstructionsStepComponent,
    TutorialCredentialsStepComponent,
    TutorialDemoStepComponent,
    TutorialResultsStepComponent
  ],
  imports: [
    RouterModule.forChild(TutorialsRoutes),
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
    LanguagesModule
  ]
})
export class TutorialsModule {}