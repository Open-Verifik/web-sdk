import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordlessRootComponent } from './passwordless-root.component';

describe('PasswordlessRootComponent', () => {
  let component: PasswordlessRootComponent;
  let fixture: ComponentFixture<PasswordlessRootComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PasswordlessRootComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordlessRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
