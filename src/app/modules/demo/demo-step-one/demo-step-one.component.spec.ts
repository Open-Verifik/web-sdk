import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoStepOneComponent } from './demo-step-one.component';

describe('DemoStepOneComponent', () => {
  let component: DemoStepOneComponent;
  let fixture: ComponentFixture<DemoStepOneComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DemoStepOneComponent]
    });
    fixture = TestBed.createComponent(DemoStepOneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
