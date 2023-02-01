import {
  NgModule
} from '@angular/core';

import {
  TranslocoModule
} from '@ngneat/transloco';

import {
  MatMenuModule
} from '@angular/material/menu';

import {
  MatButtonModule
} from '@angular/material/button';

import {
  ButtonMockComponent,
  NotificationMockComponent
} from './button-mock.component';

import {
  CommonModule
} from '@angular/common';

import {
  MatIconModule
} from '@angular/material/icon';
import {
  MatDividerModule
} from '@angular/material/divider';
import {
  MatSnackBarModule
} from '@angular/material/snack-bar';

@NgModule({
  imports: [
    CommonModule,
    TranslocoModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  declarations: [ButtonMockComponent, NotificationMockComponent],
  exports: [
    ButtonMockComponent
  ],
})
export class ButtonMockModule {}