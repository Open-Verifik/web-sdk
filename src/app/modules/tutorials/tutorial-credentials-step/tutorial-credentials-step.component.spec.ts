import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialCredentialsStepComponent } from './tutorial-credentials-step.component';

describe('TutorialCredentialsStepComponent', () => {
  let component: TutorialCredentialsStepComponent;
  let fixture: ComponentFixture<TutorialCredentialsStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TutorialCredentialsStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialCredentialsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
