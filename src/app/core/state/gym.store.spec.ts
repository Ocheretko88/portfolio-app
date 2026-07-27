import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { ExerciseDto, StatsOverviewDto } from '../api/api-types';
import { GymStore } from './gym.store';

describe('GymStore', () => {
  let store: InstanceType<typeof GymStore>;
  let httpMock: HttpTestingController;

  const exercise: ExerciseDto = {
    id: 1,
    name: 'Присід',
    slug: 'squat',
    category: 'compound',
    isBodyweight: false,
    defaultUnit: 'kg',
  };

  const stats: StatsOverviewDto = {
    totalVolumeAllTimeGrams: 980000,
    totalVolumeThisWeekGrams: 780000,
    volumeDeltaPct: 380,
    prCountThisMonth: 2,
    currentStreakDays: 3,
    sessionsThisWeek: 2,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(GymStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('starts empty: no catalog, no stats, module status unchanged from the P0-8 scaffold', () => {
    expect(store.catalog()).toEqual([]);
    expect(store.hasCatalog()).toBe(false);
    expect(store.stats()).toBeNull();
    expect(store.hasStats()).toBe(false);
    expect(store.isReady()).toBe(false);
  });

  it('loadCatalog() populates the catalog from the generated Exercise contract shape', () => {
    store.loadCatalog();

    httpMock
      .expectOne((req) => req.url.endsWith('/api/v1/gym/exercises'))
      .flush({ data: [exercise], meta: { version: 'v1', generatedAt: '2026-07-27T00:00:00Z' } });

    expect(store.catalog()).toEqual([exercise]);
    expect(store.hasCatalog()).toBe(true);
    expect(store.catalogLoading()).toBe(false);
  });

  it('loadCatalog() falls back to an empty catalog when the API errors', () => {
    store.loadCatalog();

    httpMock
      .expectOne((req) => req.url.endsWith('/api/v1/gym/exercises'))
      .flush('down', { status: 500, statusText: 'Server Error' });

    expect(store.catalog()).toEqual([]);
    expect(store.catalogLoading()).toBe(false);
  });

  it('loadStats() populates stats from the generated StatsOverview contract shape', () => {
    store.loadStats();

    httpMock
      .expectOne((req) => req.url.endsWith('/api/v1/gym/stats/overview'))
      .flush({ data: stats, meta: { version: 'v1', generatedAt: '2026-07-27T00:00:00Z' } });

    expect(store.stats()).toEqual(stats);
    expect(store.hasStats()).toBe(true);
    expect(store.statsLoading()).toBe(false);
  });

  it('loadSessions() sends the from/to/page/perPage filters as query params', () => {
    store.loadSessions({ from: '2026-07-01', to: '2026-07-31', page: 2, perPage: 10 });

    // ApiClient builds the query string into the URL itself (no HttpParams
    // object passed to HttpClient), so the params live in the URL, not
    // req.params — parse it back out to assert on it.
    const req = httpMock.expectOne((r) => r.url.includes('/api/v1/gym/sessions'));
    const query = new URL(req.request.urlWithParams, 'http://test.local').searchParams;
    expect(query.get('from')).toBe('2026-07-01');
    expect(query.get('to')).toBe('2026-07-31');
    expect(query.get('page')).toBe('2');
    expect(query.get('perPage')).toBe('10');

    req.flush({
      data: [],
      meta: {
        version: 'v1',
        generatedAt: '2026-07-27T00:00:00Z',
        page: 2,
        perPage: 10,
        total: 0,
        totalPages: 0,
      },
    });

    expect(store.sessions()).toEqual([]);
    expect(store.sessionsLoading()).toBe(false);
  });

  it('loadSessions() omits filters that were not supplied', () => {
    store.loadSessions();

    const req = httpMock.expectOne((r) => r.url.includes('/api/v1/gym/sessions'));
    const query = new URL(req.request.urlWithParams, 'http://test.local').searchParams;
    expect(Array.from(query.keys())).toEqual([]);

    req.flush({
      data: [],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 20, total: 0, totalPages: 0 },
    });
  });
});
