import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycLivenessIosComponent } from './kyc-liveness-ios.component';

describe('KycLivenessIosComponent', () => {
  let component: KycLivenessIosComponent;
  let fixture: ComponentFixture<KycLivenessIosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycLivenessIosComponent]
    });
    fixture = TestBed.createComponent(KycLivenessIosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
