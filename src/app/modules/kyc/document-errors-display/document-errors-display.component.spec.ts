import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentErrorsDisplayComponent } from './document-errors-display.component';

describe('DocumentErrorsDisplayComponent', () => {
  let component: DocumentErrorsDisplayComponent;
  let fixture: ComponentFixture<DocumentErrorsDisplayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentErrorsDisplayComponent]
    });
    fixture = TestBed.createComponent(DocumentErrorsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
