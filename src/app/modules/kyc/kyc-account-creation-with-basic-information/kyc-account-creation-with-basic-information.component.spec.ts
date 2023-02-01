import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycAccountCreationWithBasicInformationComponent } from './kyc-account-creation-with-basic-information.component';

describe('KycAccountCreationWithBasicInformationComponent', () => {
  let component: KycAccountCreationWithBasicInformationComponent;
  let fixture: ComponentFixture<KycAccountCreationWithBasicInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KycAccountCreationWithBasicInformationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KycAccountCreationWithBasicInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
