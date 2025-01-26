import { TestBed } from '@angular/core/testing';

import { MediaStreamService } from './media-stream.service';

describe('MediaStreamService', () => {
  let service: MediaStreamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaStreamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
