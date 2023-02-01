import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycBasicInformationComponent } from './kyc-basic-information.component';

describe('KycBasicInformationComponent', () => {
  let component: KycBasicInformationComponent;
  let fixture: ComponentFixture<KycBasicInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KycBasicInformationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KycBasicInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
