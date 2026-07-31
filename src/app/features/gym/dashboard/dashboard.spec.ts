import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { StatsOverviewDto, WorkoutSessionDto } from '../../../core/api/api-types';
import { GymDashboard } from './dashboard';

describe('GymDashboard', () => {
  let httpMock: HttpTestingController;

  const stats: StatsOverviewDto = {
    totalVolumeAllTimeGrams: 980_000,
    totalVolumeThisWeekGrams: 120_000,
    volumeDeltaPct: 12.5,
    prCountThisMonth: 2,
    currentStreakDays: 3,
    sessionsThisWeek: 2,
  };

  /** Builds a session whose single set's volume (`reps * weightGrams`) equals `volumeGrams` exactly. */
  function session(id: number, performedAt: string, volumeGrams: number): WorkoutSessionDto {
    const reps = 5;
    return {
      id,
      performedAt,
      title: 'Push day',
      cycleDay: null,
      durationMin: 45,
      notes: null,
      sets: [
        {
          id: id * 10,
          exerciseId: 1,
          setNumber: 1,
          reps,
          weightGrams: volumeGrams / reps,
          perSide: false,
          rpe: null,
          tempo: null,
          restSeconds: null,
          isWarmup: false,
          isPr: false,
          notes: null,
        },
      ],
    };
  }

  function statsMeta() {
    return { version: 'v1', generatedAt: 'x' };
  }

  function sessionsMeta(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      version: 'v1',
      generatedAt: 'x',
      page: 1,
      perPage: 20,
      total: 0,
      totalPages: 0,
      ...overrides,
    };
  }

  function statsRequest(mock: HttpTestingController) {
    return mock.expectOne((req) => req.url.includes('/api/v1/gym/stats/overview'));
  }

  function sessionsRequest(mock: HttpTestingController) {
    return mock.expectOne((req) => req.url.includes('/api/v1/gym/sessions'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GymDashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('renders the GymTracker heading', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.section-title')?.textContent).toContain('GymTracker');

    statsRequest(httpMock).flush({ data: stats, meta: statsMeta() });
    sessionsRequest(httpMock).flush({ data: [], meta: sessionsMeta() });
  });

  it('shows a loading state for the stat tile before stats resolve', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.stat-tile')?.textContent).toContain('Loading stats');

    statsRequest(httpMock).flush({ data: stats, meta: statsMeta() });
    sessionsRequest(httpMock).flush({ data: [], meta: sessionsMeta() });
  });

  it('renders real stat-tile numbers from /stats/overview, with an "up" delta', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    statsRequest(httpMock).flush({ data: stats, meta: statsMeta() });
    sessionsRequest(httpMock).flush({ data: [], meta: sessionsMeta() });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.stat-tile__value')?.textContent).toContain('980 kg');
    expect(el.querySelector('.stat-tile__sub')?.textContent).toContain('120 kg');
    const delta = el.querySelector('.stat-tile__delta');
    expect(delta?.classList.contains('stat-tile__delta--up')).toBe(true);
    expect(delta?.textContent).toContain('+12.5%');
  });

  it('shows a stat-tile error with a working retry when /stats/overview fails', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    statsRequest(httpMock).flush('down', { status: 500, statusText: 'Server Error' });
    sessionsRequest(httpMock).flush({ data: [], meta: sessionsMeta() });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const alert = el.querySelector('.stat-tile [role="alert"]');
    expect(alert?.textContent).toContain('Could not load your stats');

    const retryBtn = alert!.querySelector('button') as HTMLButtonElement;
    retryBtn.click();
    statsRequest(httpMock).flush({ data: stats, meta: statsMeta() });
    fixture.detectChanges();

    expect(el.querySelector('.stat-tile [role="alert"]')).toBeNull();
    expect(el.querySelector('.stat-tile__value')?.textContent).toContain('980 kg');
  });

  it('shows a distinct empty state for the trend chart (with a link to log a workout) when there are no sessions', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    statsRequest(httpMock).flush({ data: stats, meta: statsMeta() });
    sessionsRequest(httpMock).flush({ data: [], meta: sessionsMeta() });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.chart-card [role="alert"]')).toBeNull();
    expect(el.textContent).toContain('No sessions logged yet');
    expect(el.querySelector('a[href="/gym/log"]')).toBeTruthy();
  });

  it('shows a distinct trend error (not the empty state) when the sessions request fails, with a working retry', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    statsRequest(httpMock).flush({ data: stats, meta: statsMeta() });
    sessionsRequest(httpMock).flush('down', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const alert = el.querySelector('.chart-card [role="alert"]');
    expect(alert?.textContent).toContain('Could not load workout sessions');
    expect(el.textContent).not.toContain('No sessions logged yet');

    const retryBtn = alert!.querySelector('button') as HTMLButtonElement;
    retryBtn.click();
    sessionsRequest(httpMock).flush({
      data: [session(1, '2026-07-01T10:00:00Z', 100_000)],
      meta: sessionsMeta({ total: 1, totalPages: 1 }),
    });
    fixture.detectChanges();

    expect(el.querySelector('.chart-card [role="alert"]')).toBeNull();
    expect(el.querySelector('.trend-chart')).toBeTruthy();
  });

  it('renders a volume-over-time chart from real logged sessions, oldest to newest, with an accessible summary and per-point labels', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    statsRequest(httpMock).flush({ data: stats, meta: statsMeta() });
    sessionsRequest(httpMock).flush({
      // Server returns newest-first; the chart must still plot oldest→newest.
      data: [
        session(2, '2026-07-10T10:00:00Z', 200_000),
        session(1, '2026-07-01T10:00:00Z', 100_000),
      ],
      meta: sessionsMeta({ total: 2, totalPages: 1 }),
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const svg = el.querySelector('.trend-chart') as SVGSVGElement;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-label')).toContain('2 sessions from 01.07.2026 to 10.07.2026');

    const points = Array.from(svg.querySelectorAll('.trend-chart__hit'));
    expect(points.length).toBe(2);
    // First point (oldest, 01.07) plots at the left; volume 100kg from 100_000g.
    expect(points[0].getAttribute('aria-label')).toContain('01.07.2026');
    expect(points[0].getAttribute('aria-label')).toContain('100 kg');
    expect(points[1].getAttribute('aria-label')).toContain('10.07.2026');
    expect(points[1].getAttribute('aria-label')).toContain('200 kg');
    expect(Number(points[0].getAttribute('cx'))).toBeLessThan(Number(points[1].getAttribute('cx')));
  });

  it('labels a ≥1,000 kg session consistently (tonnes) on the chart end-label, its point aria-label/tooltip, and the table twin', () => {
    // Regression for the P1-8 review finding: the on-chart end label used to
    // stay in bare kg while the aria-label/tooltip/table auto-compacted to
    // tonnes past 1,000 kg, so the same session read as two different
    // numbers depending on which view you looked at.
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    statsRequest(httpMock).flush({ data: stats, meta: statsMeta() });
    sessionsRequest(httpMock).flush({
      data: [session(1, '2026-07-01T10:00:00Z', 8_500_000)], // 8,500 kg
      meta: sessionsMeta({ total: 1, totalPages: 1 }),
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const svg = el.querySelector('.trend-chart') as SVGSVGElement;
    const endLabel = svg.querySelector('.trend-chart__end-label');
    const point = svg.querySelector('.trend-chart__hit');
    expect(endLabel?.textContent?.trim()).toBe('8.5 t');
    expect(point?.getAttribute('aria-label')).toContain('8.5 t');

    const toggle = Array.from(el.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('View as table'),
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(el.querySelector('.trend-table')?.textContent).toContain('8.5 t');
  });

  it('toggles between the chart and its accessible table-view twin', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    statsRequest(httpMock).flush({ data: stats, meta: statsMeta() });
    sessionsRequest(httpMock).flush({
      data: [session(1, '2026-07-01T10:00:00Z', 100_000)],
      meta: sessionsMeta({ total: 1, totalPages: 1 }),
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.trend-chart')).toBeTruthy();
    expect(el.querySelector('.trend-table')).toBeNull();

    const toggle = Array.from(el.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('View as table'),
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('.trend-table')).toBeTruthy();
    expect(el.querySelector('.trend-chart')).toBeNull();
    expect(el.querySelector('.trend-table')?.textContent).toContain('100 kg');
  });
});
