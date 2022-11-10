import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorialsRoutingRootComponent } from './tutorials-routing-root.component';

describe('TutorialsRoutingRootComponent', () => {
  let component: TutorialsRoutingRootComponent;
  let fixture: ComponentFixture<TutorialsRoutingRootComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TutorialsRoutingRootComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TutorialsRoutingRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
