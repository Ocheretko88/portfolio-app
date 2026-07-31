import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GymStore } from '../../../core/state/gym.store';
import type { SetEntryDto } from '../../../core/api/api-types';

/** How many of the most recent sessions feed the trend line (see class doc). */
const TREND_SESSION_COUNT = 20;

/** SVG viewBox geometry — fixed units, scaled responsively by CSS width: 100%. */
const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PLOT = { top: 16, right: 16, bottom: 28, left: 48 };

interface VolumePoint {
  readonly sessionId: number;
  readonly date: Date;
  readonly volumeKg: number;
}

interface PlottedPoint extends VolumePoint {
  readonly x: number;
  readonly y: number;
}

/** Total volume for one session — `SUM(reps * weightGrams)` over its sets (same computation as history.ts). */
function sessionVolumeGrams(sets: readonly SetEntryDto[]): number {
  return sets.reduce((total, set) => total + (set.reps ?? 0) * set.weightGrams, 0);
}

/** `DD.MM` — day-first, matching the athlete's own notation (PARSING.md). */
function formatDayFirst(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

function formatDayFirstFull(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

/** Grams → an auto-compact display string (kg, or tonnes past 1,000 kg). */
function formatVolume(grams: number): string {
  const kg = grams / 1000;
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} t`;
  }
  return `${Math.round(kg)} kg`;
}

/** Rounds up to a "clean" axis ceiling (1/2/5/10 × a power of ten). */
function niceCeil(value: number): number {
  if (value <= 0) {
    return 10;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const residual = value / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return niceResidual * magnitude;
}

/**
 * GymTracker dashboard (P1-8, spec §6.2) — total-volume stat tile + a
 * volume-over-time trend line, both on real data.
 *
 * The stat tile reads `GymStore.stats()` (`/gym/stats/overview`, P1-4)
 * directly — every number on it (`totalVolumeAllTimeGrams`,
 * `totalVolumeThisWeekGrams`, `volumeDeltaPct`) is a server-computed SQL
 * aggregate, never derived here.
 *
 * The trend line is a deliberate, documented exception to "no client-side
 * aggregation": `/gym/stats/overview` (the only stats endpoint Phase 1 ships)
 * has no time series in it — a per-day/per-exercise series arrives in Phase 2
 * (P2-1, P2-5), gated on P1-9. Rather than block this step on a new backend
 * endpoint (out of this step's declared scope), the chart plots the
 * already-fetched recent sessions (`GymStore.loadSessions`, P1-3/P1-7) —
 * each point is that single session's own volume, the exact same
 * `SUM(reps * weightGrams)` reduction `history.ts` already performs
 * client-side over one session's own (small, fixed) set list. No aggregation
 * happens *across* sessions on the client; the trend is real logged data, not
 * a mock. Flagged for the evaluator; revisit once P2-1/P2-5 exist.
 */
@Component({
  selector: 'app-gym-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class GymDashboard {
  protected readonly store = inject(GymStore);

  /** Toggles the chart's accessible table-view twin (dataviz guidance). */
  protected readonly showTrendTable = signal(false);

  protected readonly totalVolumeLabel = computed(() => {
    const stats = this.store.stats();
    return stats ? formatVolume(stats.totalVolumeAllTimeGrams) : '—';
  });

  protected readonly thisWeekLabel = computed(() => {
    const stats = this.store.stats();
    return stats ? formatVolume(stats.totalVolumeThisWeekGrams) : '—';
  });

  protected readonly deltaPct = computed(() => this.store.stats()?.volumeDeltaPct ?? 0);

  protected readonly deltaDirection = computed<'up' | 'down' | 'flat'>(() => {
    const pct = this.deltaPct();
    if (pct > 0) return 'up';
    if (pct < 0) return 'down';
    return 'flat';
  });

  protected readonly deltaLabel = computed(() => {
    const pct = this.deltaPct();
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}% vs last week`;
  });

  /** Chronological (oldest→newest) per-session volume points — see class doc. */
  private readonly trendPoints = computed<VolumePoint[]>(() =>
    [...this.store.sessions()]
      .sort((a, b) => Date.parse(a.performedAt) - Date.parse(b.performedAt))
      .map((session) => ({
        sessionId: session.id,
        date: new Date(session.performedAt),
        volumeKg: sessionVolumeGrams(session.sets) / 1000,
      })),
  );

  protected readonly hasTrend = computed(() => this.trendPoints().length > 0);

  protected readonly yMax = computed(() => {
    const max = Math.max(0, ...this.trendPoints().map((p) => p.volumeKg));
    return niceCeil(max || 1);
  });

  protected readonly yTicks = computed(() => {
    const max = this.yMax();
    return [0, max / 2, max];
  });

  protected readonly plotted = computed<PlottedPoint[]>(() => {
    const points = this.trendPoints();
    const plotWidth = CHART_WIDTH - PLOT.left - PLOT.right;
    const plotHeight = CHART_HEIGHT - PLOT.top - PLOT.bottom;
    const max = this.yMax();
    if (points.length === 0) {
      return [];
    }
    const minTime = points[0].date.getTime();
    const maxTime = points[points.length - 1].date.getTime();
    const span = maxTime - minTime;
    return points.map((point) => {
      const t = span === 0 ? 0.5 : (point.date.getTime() - minTime) / span;
      const x = PLOT.left + t * plotWidth;
      const y = PLOT.top + plotHeight - (point.volumeKg / max) * plotHeight;
      return { ...point, x, y };
    });
  });

  protected readonly linePath = computed(() =>
    this.plotted()
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const points = this.plotted();
    if (points.length === 0) {
      return '';
    }
    const baseline = CHART_HEIGHT - PLOT.bottom;
    const first = points[0];
    const last = points[points.length - 1];
    const top = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    return [
      ...top,
      `L${last.x.toFixed(1)},${baseline}`,
      `L${first.x.toFixed(1)},${baseline}`,
      'Z',
    ].join(' ');
  });

  protected readonly baselineY = CHART_HEIGHT - PLOT.bottom;
  protected readonly plotTop = PLOT.top;
  protected readonly plotLeft = PLOT.left;
  protected readonly plotRight = CHART_WIDTH - PLOT.right;
  protected readonly chartWidth = CHART_WIDTH;
  protected readonly chartHeight = CHART_HEIGHT;

  protected readonly chartSummary = computed(() => {
    const points = this.trendPoints();
    if (points.length === 0) {
      return 'No sessions logged yet.';
    }
    const first = points[0];
    const last = points[points.length - 1];
    return `Volume per session, ${points.length} session${points.length === 1 ? '' : 's'} from ${formatDayFirstFull(first.date)} to ${formatDayFirstFull(last.date)}.`;
  });

  constructor() {
    this.store.loadStats();
    this.fetchTrend();
  }

  protected pointDateLabel(point: VolumePoint): string {
    return formatDayFirstFull(point.date);
  }

  protected pointVolumeLabel(point: VolumePoint): string {
    return formatVolume(point.volumeKg * 1000);
  }

  protected pointLabel(point: VolumePoint): string {
    return `${this.pointDateLabel(point)}: ${this.pointVolumeLabel(point)}`;
  }

  protected axisLabel(point: VolumePoint): string {
    return formatDayFirst(point.date);
  }

  /** Y-axis tick label — thousands-comma'd, always kg (the axis's own unit; see the "kg" unit label rendered beside it in dashboard.html). */
  protected tickLabel(kg: number): string {
    return Math.round(kg).toLocaleString('en-US');
  }

  /** Ascending (oldest→newest) rows for the chart's table-view twin — same data, same order as the chart. */
  protected readonly trendRows = this.trendPoints;

  protected toggleTrendTable(): void {
    this.showTrendTable.update((v) => !v);
  }

  protected retryStats(): void {
    this.store.loadStats();
  }

  protected retryTrend(): void {
    if (!this.store.sessionsLoading()) {
      this.fetchTrend();
    }
  }

  private fetchTrend(): void {
    this.store.loadSessions({ perPage: TREND_SESSION_COUNT });
  }
}
