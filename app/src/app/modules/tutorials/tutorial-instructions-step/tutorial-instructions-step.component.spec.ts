import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialInstructionsStepComponent } from './tutorial-instructions-step.component';

describe('TutorialInstructionsStepComponent', () => {
  let component: TutorialInstructionsStepComponent;
  let fixture: ComponentFixture<TutorialInstructionsStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TutorialInstructionsStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialInstructionsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
