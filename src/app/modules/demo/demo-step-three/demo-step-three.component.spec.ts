import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoStepThreeComponent } from './demo-step-three.component';

describe('DemoStepThreeComponent', () => {
  let component: DemoStepThreeComponent;
  let fixture: ComponentFixture<DemoStepThreeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DemoStepThreeComponent]
    });
    fixture = TestBed.createComponent(DemoStepThreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
