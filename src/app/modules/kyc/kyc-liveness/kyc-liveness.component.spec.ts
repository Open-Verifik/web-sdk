import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycLivenessComponent } from './kyc-liveness.component';

describe('KycLivenessComponent', () => {
  let component: KycLivenessComponent;
  let fixture: ComponentFixture<KycLivenessComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycLivenessComponent]
    });
    fixture = TestBed.createComponent(KycLivenessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
