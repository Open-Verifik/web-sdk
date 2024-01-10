import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycBasicInformationComponent } from './kyc-basic-information.component';

describe('KycBasicInformationComponent', () => {
  let component: KycBasicInformationComponent;
  let fixture: ComponentFixture<KycBasicInformationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycBasicInformationComponent]
    });
    fixture = TestBed.createComponent(KycBasicInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
