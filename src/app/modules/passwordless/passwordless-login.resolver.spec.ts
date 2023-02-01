import { TestBed } from '@angular/core/testing';

import { PasswordlessLoginResolver } from './passwordless-login.resolver';

describe('PasswordlessLoginResolver', () => {
  let resolver: PasswordlessLoginResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(PasswordlessLoginResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
