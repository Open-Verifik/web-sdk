import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdDetailsComponent } from './id-details.component';

describe('IdDetailsComponent', () => {
  let component: IdDetailsComponent;
  let fixture: ComponentFixture<IdDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IdDetailsComponent]
    });
    fixture = TestBed.createComponent(IdDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
