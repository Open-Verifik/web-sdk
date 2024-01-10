import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycInstructionsComponent } from './kyc-instructions.component';

describe('KycInstructionsComponent', () => {
  let component: KycInstructionsComponent;
  let fixture: ComponentFixture<KycInstructionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycInstructionsComponent]
    });
    fixture = TestBed.createComponent(KycInstructionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
