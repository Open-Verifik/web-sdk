import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoFooterComponent } from './demo-footer.component';

describe('DemoFooterComponent', () => {
  let component: DemoFooterComponent;
  let fixture: ComponentFixture<DemoFooterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DemoFooterComponent]
    });
    fixture = TestBed.createComponent(DemoFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
