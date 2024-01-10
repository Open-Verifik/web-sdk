import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycFormComponent } from './kyc-form.component';

describe('KycFormComponent', () => {
  let component: KycFormComponent;
  let fixture: ComponentFixture<KycFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycFormComponent]
    });
    fixture = TestBed.createComponent(KycFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
