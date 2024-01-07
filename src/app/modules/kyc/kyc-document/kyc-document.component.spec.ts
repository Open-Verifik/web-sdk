import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycDocumentComponent } from './kyc-document.component';

describe('KycDocumentComponent', () => {
  let component: KycDocumentComponent;
  let fixture: ComponentFixture<KycDocumentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycDocumentComponent]
    });
    fixture = TestBed.createComponent(KycDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
