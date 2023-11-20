import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { passwordlessLoginResolver } from './passwordless-login.resolver';

describe('passwordlessLoginResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => passwordlessLoginResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
