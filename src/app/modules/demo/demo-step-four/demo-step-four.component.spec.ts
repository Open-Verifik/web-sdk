import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoStepFourComponent } from './demo-step-four.component';

describe('DemoStepFourComponent', () => {
  let component: DemoStepFourComponent;
  let fixture: ComponentFixture<DemoStepFourComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DemoStepFourComponent]
    });
    fixture = TestBed.createComponent(DemoStepFourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
