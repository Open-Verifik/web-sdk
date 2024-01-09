import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycDocumentUploaderComponent } from './kyc-document-uploader.component';

describe('KycDocumentUploaderComponent', () => {
  let component: KycDocumentUploaderComponent;
  let fixture: ComponentFixture<KycDocumentUploaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycDocumentUploaderComponent]
    });
    fixture = TestBed.createComponent(KycDocumentUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
