import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdScanningComponent } from './id-scanning.component';

describe('IdScanningComponent', () => {
  let component: IdScanningComponent;
  let fixture: ComponentFixture<IdScanningComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IdScanningComponent]
    });
    fixture = TestBed.createComponent(IdScanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
