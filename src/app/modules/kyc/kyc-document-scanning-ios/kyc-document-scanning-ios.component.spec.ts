import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycDocumentScanningIosComponent } from './kyc-document-scanning-ios.component';

describe('KycDocumentScanningIosComponent', () => {
  let component: KycDocumentScanningIosComponent;
  let fixture: ComponentFixture<KycDocumentScanningIosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycDocumentScanningIosComponent]
    });
    fixture = TestBed.createComponent(KycDocumentScanningIosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
