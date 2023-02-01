import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycProjectComponent } from './kyc-project.component';

describe('KycProjectComponent', () => {
  let component: KycProjectComponent;
  let fixture: ComponentFixture<KycProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KycProjectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KycProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
