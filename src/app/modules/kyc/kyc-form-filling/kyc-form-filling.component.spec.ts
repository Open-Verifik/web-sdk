import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycFormFillingComponent } from './kyc-form-filling.component';

describe('KycFormFillingComponent', () => {
  let component: KycFormFillingComponent;
  let fixture: ComponentFixture<KycFormFillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KycFormFillingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KycFormFillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
