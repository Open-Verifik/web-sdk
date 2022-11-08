import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycRoutesRootComponent } from './kyc-routes-root.component';

describe('KycRoutesRootComponent', () => {
  let component: KycRoutesRootComponent;
  let fixture: ComponentFixture<KycRoutesRootComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KycRoutesRootComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KycRoutesRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
