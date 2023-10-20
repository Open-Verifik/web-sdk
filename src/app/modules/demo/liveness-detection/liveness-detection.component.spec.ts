import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivenessDetectionComponent } from './liveness-detection.component';

describe('LivenessDetectionComponent', () => {
  let component: LivenessDetectionComponent;
  let fixture: ComponentFixture<LivenessDetectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LivenessDetectionComponent]
    });
    fixture = TestBed.createComponent(LivenessDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
