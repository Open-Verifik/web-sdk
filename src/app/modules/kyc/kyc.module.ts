import {
  NgModule
} from '@angular/core';
import {
  CommonModule
} from '@angular/common';
import {
  KycRoutesRootComponent
} from './kyc-routes-root/kyc-routes-root.component';
import {
  KycProjectComponent
} from './kyc-project/kyc-project.component';
import {
  KycAccountCreationWithBasicInformationComponent
} from './kyc-account-creation-with-basic-information/kyc-account-creation-with-basic-information.component';
import {
  KycDocumentValidationComponent
} from './kyc-document-validation/kyc-document-validation.component';
import{KycDocumentValidationQrComponent} from './kyc-document-validation/kyc-document-validation-qr.component'
import {
  KycLivenessValidationComponent
} from './kyc-liveness-validation/kyc-liveness-validation.component';
import {
  KycFormFillingComponent
} from './kyc-form-filling/kyc-form-filling.component';
import {
  KYCRoutes
} from './kyc-routing';
import {
  RouterModule
} from '@angular/router';
import {
  TranslocoModule
} from '@ngneat/transloco';
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
  MatSnackBarModule
} from '@angular/material/snack-bar';
import {
  MatCheckboxModule
} from '@angular/material/checkbox';
import {
  MatMenuModule
} from '@angular/material/menu';
import {
  MatChipsModule
} from '@angular/material/chips';
import {
  MatAutocompleteModule
} from '@angular/material/autocomplete';
import {
  FuseDrawerModule
} from '@fuse/components/drawer';
import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';
import {
  MatProgressBarModule
} from '@angular/material/progress-bar';
import {
  MatSelectModule
} from '@angular/material/select';
import {
  LanguagesModule
} from 'app/layout/common/languages/languages.module';
import {
  MatTabsModule
} from '@angular/material/tabs';
import {
  MatSidenavModule
} from '@angular/material/sidenav';
import {
  KycBasicInformationComponent
} from './kyc-basic-information/kyc-basic-information.component';
import {
  MatDatepickerModule
} from '@angular/material/datepicker';
import {
  MatNativeDateModule
} from '@angular/material/core';
import {
  FuseCardModule
} from '@fuse/components/card';
import {
  FuseAlertModule
} from '@fuse/components/alert';
import {
  MatDialogModule
} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {
  MatStepperModule
} from '@angular/material/stepper';


@NgModule({
  declarations: [
    KycRoutesRootComponent,
    KycProjectComponent,
    KycAccountCreationWithBasicInformationComponent,
    KycDocumentValidationComponent,
    KycLivenessValidationComponent,
    KycFormFillingComponent,
    KycBasicInformationComponent,
    KycDocumentValidationQrComponent
  ],
  imports: [
    RouterModule.forChild(KYCRoutes),
    CommonModule,
    TranslocoModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
    FuseFindByKeyPipeModule,
    SharedModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatMenuModule,
    MatChipsModule,
    MatAutocompleteModule,
    FuseDrawerModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    LanguagesModule,
    MatTabsModule,
    MatSidenavModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatStepperModule,
    FuseCardModule,
    FuseAlertModule,
    MatDialogModule,
    MatDividerModule,
  ]
})
export class KycModule {}