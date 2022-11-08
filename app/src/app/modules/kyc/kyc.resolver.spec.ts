import { TestBed } from '@angular/core/testing';

import { KycResolver } from './kyc.resolver';

describe('KycResolver', () => {
  let resolver: KycResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(KycResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
