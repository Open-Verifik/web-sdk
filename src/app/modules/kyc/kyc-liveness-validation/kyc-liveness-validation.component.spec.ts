import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycLivenessValidationComponent } from './kyc-liveness-validation.component';

describe('KycLivenessValidationComponent', () => {
  let component: KycLivenessValidationComponent;
  let fixture: ComponentFixture<KycLivenessValidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KycLivenessValidationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KycLivenessValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
