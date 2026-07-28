import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ExerciseDto, WorkoutSessionDto } from '../../../core/api/api-types';
import { GymHistory } from './history';

describe('GymHistory', () => {
  let httpMock: HttpTestingController;

  const exercise: ExerciseDto = {
    id: 1,
    name: 'Присід',
    slug: 'squat',
    category: 'compound',
    isBodyweight: false,
    defaultUnit: 'kg',
  };

  const session: WorkoutSessionDto = {
    id: 7,
    performedAt: '2026-07-20T18:30:00Z',
    title: 'Push day',
    cycleDay: 3,
    durationMin: 45,
    notes: 'Felt strong',
    sets: [
      {
        id: 100,
        exerciseId: 1,
        setNumber: 1,
        reps: 8,
        weightGrams: 60000,
        perSide: false,
        rpe: 8,
        tempo: null,
        restSeconds: 90,
        isWarmup: false,
        isPr: true,
        notes: null,
      },
    ],
  };

  function flushCatalog(mock: HttpTestingController, data: ExerciseDto[] = [exercise]): void {
    mock
      .expectOne((req) => req.url.endsWith('/api/v1/gym/exercises'))
      .flush({ data, meta: { version: 'v1', generatedAt: '2026-07-27T00:00:00Z' } });
  }

  function sessionsRequest(mock: HttpTestingController) {
    return mock.expectOne((req) => req.url.includes('/api/v1/gym/sessions'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GymHistory],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows a loading state before the sessions request resolves', () => {
    const fixture = TestBed.createComponent(GymHistory);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Loading sessions');

    flushCatalog(httpMock);
    sessionsRequest(httpMock).flush({
      data: [],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 10, total: 0, totalPages: 0 },
    });
  });

  it('shows a distinct empty state (not the same as an error) when there are no sessions', () => {
    const fixture = TestBed.createComponent(GymHistory);
    fixture.detectChanges();
    flushCatalog(httpMock);
    sessionsRequest(httpMock).flush({
      data: [],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 10, total: 0, totalPages: 0 },
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.textContent).toContain('No sessions logged yet.');
    expect(el.querySelector('a[href="/gym/log"]')).toBeTruthy();
  });

  it('shows a distinct error state (not the empty state) when the request fails, with a working retry', () => {
    const fixture = TestBed.createComponent(GymHistory);
    fixture.detectChanges();
    flushCatalog(httpMock);
    sessionsRequest(httpMock).flush('down', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const alert = el.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Could not load workout sessions');
    expect(el.textContent).not.toContain('No sessions logged yet.');

    const retryBtn = alert!.querySelector('button') as HTMLButtonElement;
    retryBtn.focus();
    retryBtn.click();
    fixture.detectChanges();

    // Mid-retry: `GymStore.loadSessions()` deliberately leaves `sessionsError`
    // set until the retry resolves, so this exact alert (and the button the
    // user just pressed) must still be in the DOM and focused — not torn
    // down the instant the click handler ran.
    expect(el.querySelector('[role="alert"]')).toBe(alert);
    expect(document.activeElement).toBe(retryBtn);

    sessionsRequest(httpMock).flush({
      data: [session],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 10, total: 1, totalPages: 1 },
    });
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.textContent).toContain('Push day');
  });

  it('renders a logged session and expands it to show its sets, incl. cycle day and notes', () => {
    const fixture = TestBed.createComponent(GymHistory);
    fixture.detectChanges();
    flushCatalog(httpMock);
    sessionsRequest(httpMock).flush({
      data: [session],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 10, total: 1, totalPages: 1 },
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Push day');
    expect(el.textContent).toContain('day 3 of cycle');

    const toggle = el.querySelector('.session__head') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(el.textContent).toContain('Присід');
    expect(el.textContent).toContain('Felt strong');
    expect(el.textContent).toContain('PR');
  });

  it('drives pagination from the server-returned PaginationMeta, not a client-derived count', () => {
    const fixture = TestBed.createComponent(GymHistory);
    fixture.detectChanges();
    flushCatalog(httpMock);
    sessionsRequest(httpMock).flush({
      data: [session],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 10, total: 25, totalPages: 3 },
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Page 1 of 3 · 25 sessions');
    const [prevBtn, nextBtn] = Array.from(el.querySelectorAll('.history-pagination button'));
    // `aria-disabled`, not the native `disabled` attribute — see the focus
    // test below for why: a natively-disabled button can't hold focus.
    expect((prevBtn as HTMLButtonElement).getAttribute('aria-disabled')).toBe('true');
    expect((nextBtn as HTMLButtonElement).getAttribute('aria-disabled')).toBeNull();

    (nextBtn as HTMLButtonElement).click();
    const req = sessionsRequest(httpMock);
    const query = new URL(req.request.urlWithParams, 'http://test.local').searchParams;
    expect(query.get('page')).toBe('2');
    req.flush({
      data: [session],
      meta: { version: 'v1', generatedAt: 'x', page: 2, perPage: 10, total: 25, totalPages: 3 },
    });
    fixture.detectChanges();
    expect(el.textContent).toContain('Page 2 of 3');
  });

  it('keeps the list and pagination nav mounted (and focus intact) across a page change, instead of tearing them down while the request is in flight', () => {
    const fixture = TestBed.createComponent(GymHistory);
    fixture.detectChanges();
    flushCatalog(httpMock);
    sessionsRequest(httpMock).flush({
      data: [session],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 10, total: 25, totalPages: 3 },
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const nextBtn = Array.from(el.querySelectorAll('.history-pagination button')).find((btn) =>
      btn.textContent?.includes('Next'),
    ) as HTMLButtonElement;
    nextBtn.focus();
    nextBtn.click();
    fixture.detectChanges();

    // Mid-flight: the old page's rows and the pagination nav must still be
    // in the DOM, and the button the user just activated must still hold
    // focus — nothing has been unmounted just because a fetch is pending.
    // Crucially the button must still be *natively enabled* (not the
    // `disabled` attribute): a `disabled` button is unfocusable and every
    // real browser blurs it immediately, which is exactly the bug this test
    // guards against — jsdom/happy-dom do NOT reproduce that blur, so
    // asserting `activeElement` alone here would pass even with a real
    // `[disabled]` binding. `aria-disabled` communicates the same state to
    // assistive tech without giving up focusability.
    expect(el.querySelector('.sessions')).toBeTruthy();
    expect(el.querySelector('.history-pagination')).toBeTruthy();
    expect(nextBtn.disabled).toBe(false);
    expect(nextBtn.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(nextBtn);
    expect(el.querySelector('.sessions')?.getAttribute('aria-busy')).toBe('true');

    const req = sessionsRequest(httpMock);
    req.flush({
      data: [session],
      meta: { version: 'v1', generatedAt: 'x', page: 2, perPage: 10, total: 25, totalPages: 3 },
    });
    fixture.detectChanges();

    // The same live-region element updates in place rather than being
    // recreated, and focus is undisturbed.
    expect(el.querySelector('.history-pagination__status')?.textContent).toContain('Page 2 of 3');
    expect(document.activeElement).toBe(nextBtn);
    expect(nextBtn.getAttribute('aria-disabled')).toBeNull();
  });

  it('shows an inline error (not a silent "no sessions") when a refetch fails on an already-empty page', () => {
    const fixture = TestBed.createComponent(GymHistory);
    fixture.detectChanges();
    flushCatalog(httpMock);
    // First load succeeds, but genuinely has zero sessions.
    sessionsRequest(httpMock).flush({
      data: [],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 10, total: 0, totalPages: 0 },
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No sessions logged yet.');
    expect(el.querySelector('[role="alert"]')).toBeNull();

    // A later refetch (e.g. the user hits retry, or a background refresh)
    // fails. The empty message may still be technically true, but the error
    // must be visible and distinct — not swallowed by the empty state.
    fixture.componentInstance['retry']();
    sessionsRequest(httpMock).flush('down', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const alert = el.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Could not load workout sessions');
    const retryBtn = alert!.querySelector('button') as HTMLButtonElement;
    expect(retryBtn.textContent).toContain('Retry');

    retryBtn.focus();
    retryBtn.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')).toBe(alert);
    expect(document.activeElement).toBe(retryBtn);

    sessionsRequest(httpMock).flush({
      data: [session],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 10, total: 1, totalPages: 1 },
    });
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.textContent).toContain('Push day');
  });

  it('shows a failed refetch inline next to the still-mounted list, rather than replacing it with the empty state', () => {
    const fixture = TestBed.createComponent(GymHistory);
    fixture.detectChanges();
    flushCatalog(httpMock);
    sessionsRequest(httpMock).flush({
      data: [session],
      meta: { version: 'v1', generatedAt: 'x', page: 1, perPage: 10, total: 25, totalPages: 3 },
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const nextBtn = Array.from(el.querySelectorAll('.history-pagination button')).find((btn) =>
      btn.textContent?.includes('Next'),
    ) as HTMLButtonElement;
    nextBtn.click();
    sessionsRequest(httpMock).flush('down', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    // The page-1 list is still there (not wiped to the empty state) and an
    // inline, distinguishable error with a retry sits alongside it.
    expect(el.textContent).toContain('Push day');
    expect(el.textContent).not.toContain('No sessions logged yet.');
    const alert = el.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Could not load workout sessions');

    // The failed page-2 attempt must not desync the live region from what's
    // actually on screen: the rows are still page 1's, so the status text
    // must say "Page 1 of 3" (read from `sessionsMeta().page`), not "Page 2
    // of 3" from the locally-requested (but never-confirmed) page number.
    expect(el.querySelector('.history-pagination__status')?.textContent).toContain('Page 1 of 3');

    const retryBtn = alert!.querySelector('button') as HTMLButtonElement;
    retryBtn.focus();
    retryBtn.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')).toBe(alert);
    expect(document.activeElement).toBe(retryBtn);

    sessionsRequest(httpMock).flush({
      data: [session],
      meta: { version: 'v1', generatedAt: 'x', page: 2, perPage: 10, total: 25, totalPages: 3 },
    });
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.querySelector('.history-pagination__status')?.textContent).toContain('Page 2 of 3');
  });
});
