import { TestBed } from '@angular/core/testing';

import { PasswordlessService } from './passwordless.service';

describe('PasswordlessService', () => {
  let service: PasswordlessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PasswordlessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
