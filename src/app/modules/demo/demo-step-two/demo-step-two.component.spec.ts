import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoStepTwoComponent } from './demo-step-two.component';

describe('DemoStepTwoComponent', () => {
  let component: DemoStepTwoComponent;
  let fixture: ComponentFixture<DemoStepTwoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DemoStepTwoComponent]
    });
    fixture = TestBed.createComponent(DemoStepTwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
