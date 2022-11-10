import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialResultsStepComponent } from './tutorial-results-step.component';

describe('TutorialResultsStepComponent', () => {
  let component: TutorialResultsStepComponent;
  let fixture: ComponentFixture<TutorialResultsStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TutorialResultsStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialResultsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
