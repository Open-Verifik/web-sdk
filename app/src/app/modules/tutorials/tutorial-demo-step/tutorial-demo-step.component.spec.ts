import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialDemoStepComponent } from './tutorial-demo-step.component';

describe('TutorialDemoStepComponent', () => {
  let component: TutorialDemoStepComponent;
  let fixture: ComponentFixture<TutorialDemoStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TutorialDemoStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialDemoStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
