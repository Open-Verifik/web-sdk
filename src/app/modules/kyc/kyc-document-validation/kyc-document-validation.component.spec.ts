import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycDocumentValidationComponent } from './kyc-document-validation.component';

describe('KycDocumentValidationComponent', () => {
  let component: KycDocumentValidationComponent;
  let fixture: ComponentFixture<KycDocumentValidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KycDocumentValidationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KycDocumentValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
