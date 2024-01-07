import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycDocumentReviewComponent } from './kyc-document-review.component';

describe('KycDocumentReviewComponent', () => {
  let component: KycDocumentReviewComponent;
  let fixture: ComponentFixture<KycDocumentReviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycDocumentReviewComponent]
    });
    fixture = TestBed.createComponent(KycDocumentReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
