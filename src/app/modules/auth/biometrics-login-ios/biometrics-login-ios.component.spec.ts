import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiometricsLoginIosComponent } from './biometrics-login-ios.component';

describe('BiometricsLoginIosComponent', () => {
  let component: BiometricsLoginIosComponent;
  let fixture: ComponentFixture<BiometricsLoginIosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BiometricsLoginIosComponent]
    });
    fixture = TestBed.createComponent(BiometricsLoginIosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
