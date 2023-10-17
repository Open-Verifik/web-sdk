import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoStepFiveComponent } from './demo-step-five.component';

describe('DemoStepFiveComponent', () => {
  let component: DemoStepFiveComponent;
  let fixture: ComponentFixture<DemoStepFiveComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DemoStepFiveComponent]
    });
    fixture = TestBed.createComponent(DemoStepFiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
