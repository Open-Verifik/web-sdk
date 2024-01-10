import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycEndComponent } from './kyc-end.component';

describe('KycEndComponent', () => {
  let component: KycEndComponent;
  let fixture: ComponentFixture<KycEndComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KycEndComponent]
    });
    fixture = TestBed.createComponent(KycEndComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
