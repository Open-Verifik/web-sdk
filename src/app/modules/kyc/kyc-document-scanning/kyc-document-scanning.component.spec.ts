import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycDocumentScanningComponent } from './kyc-document-scanning.component';

describe('KycDocumentScanningComponent', () => {
  let component: KycDocumentScanningComponent;
  let fixture: ComponentFixture<KycDocumentScanningComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycDocumentScanningComponent]
    });
    fixture = TestBed.createComponent(KycDocumentScanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
