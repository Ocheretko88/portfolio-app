import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { CreateSessionRequestDto } from './api-types';
import { GYM_WRITE_TOKEN, GYM_WRITE_TOKEN_HEADER, GymApi } from './gym-api';

/**
 * H-4a — the shared secret reaches mutating requests and nothing else.
 *
 * The token is injected (not read straight off the generated build config) so
 * both branches are asserted here regardless of what this machine's
 * environment happens to set — a spec that silently skips is not a gate.
 */
describe('GymApi write token (ADR-0008)', () => {
  const payload: CreateSessionRequestDto = {
    performedAt: '2026-08-14T10:00:00.000Z',
    sets: [{ exerciseId: 1, reps: 8, weightGrams: 60000, perSide: false, isWarmup: false }],
  };

  const envelope = { data: {}, meta: { version: 'v1', generatedAt: '' } };

  function setup(token: string): { api: GymApi; httpMock: HttpTestingController } {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GYM_WRITE_TOKEN, useValue: token },
      ],
    });
    return {
      api: TestBed.inject(GymApi),
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('sends the token header on a write when one is configured', () => {
    const { api, httpMock } = setup('a-configured-token');

    api.createSession(payload).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/gym/sessions'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get(GYM_WRITE_TOKEN_HEADER)).toBe('a-configured-token');
    req.flush(envelope);
  });

  it('omits the header entirely when no token is configured', () => {
    // An empty header would be indistinguishable from a wrong one at the API,
    // which fails closed either way — but sending it would still be noise.
    const { api, httpMock } = setup('');

    api.createSession(payload).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/gym/sessions'));
    expect(req.request.headers.has(GYM_WRITE_TOKEN_HEADER)).toBe(false);
    req.flush(envelope);
  });

  it('never sends the token on reads, even when one is configured', () => {
    const { api, httpMock } = setup('a-configured-token');

    api.exercises().subscribe();
    api.sessionsPage().subscribe();
    api.statsOverview().subscribe();

    for (const path of ['/gym/exercises', '/gym/sessions', '/gym/stats/overview']) {
      const req = httpMock.expectOne((r) => r.url.includes(path));
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has(GYM_WRITE_TOKEN_HEADER)).toBe(false);
      req.flush({ data: [], meta: { version: 'v1', generatedAt: '' } });
    }
  });
});
