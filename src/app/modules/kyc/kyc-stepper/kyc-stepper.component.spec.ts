import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycStepperComponent } from './kyc-stepper.component';

describe('KycStepperComponent', () => {
  let component: KycStepperComponent;
  let fixture: ComponentFixture<KycStepperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycStepperComponent]
    });
    fixture = TestBed.createComponent(KycStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
