import {
    NgModule
} from '@angular/core';
import {
    CommonModule
} from '@angular/common';
import {
    PasswordlessLoginComponent
} from './passwordless-login/passwordless-login.component';
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
    MatDatepickerModule
} from '@angular/material/datepicker';
import {
    MatNativeDateModule
} from '@angular/material/core';
import {
    PasswordlessRootComponent
} from './passwordless-root/passwordless-root.component';
import {
    PasswordlessRoutes
} from './passwordless-routes';
import {
    RouterModule
} from '@angular/router';
import {
    FuseAlertModule
} from '@fuse/components/alert';

@NgModule({
    declarations: [
        PasswordlessLoginComponent,
        PasswordlessRootComponent,
    ],
    imports: [
        RouterModule.forChild(PasswordlessRoutes),
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
        FuseAlertModule
    ]
})
export class PasswordlessModule {}