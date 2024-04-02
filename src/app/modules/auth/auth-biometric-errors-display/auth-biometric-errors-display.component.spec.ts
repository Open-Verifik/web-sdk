import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthBiometricErrorsDisplayComponent } from './auth-biometric-errors-display.component';

describe('AuthBiometricErrorsDisplayComponent', () => {
  let component: AuthBiometricErrorsDisplayComponent;
  let fixture: ComponentFixture<AuthBiometricErrorsDisplayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuthBiometricErrorsDisplayComponent]
    });
    fixture = TestBed.createComponent(AuthBiometricErrorsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
