import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { catchError, of } from 'rxjs';
import { GymApi, type ListSessionsParams } from '../api/gym-api';
import type {
  ExerciseDto,
  PaginationMetaDto,
  StatsOverviewDto,
  WorkoutSessionDto,
} from '../api/api-types';

export type GymModuleStatus = 'scaffold' | 'ready';

interface GymState {
  readonly status: GymModuleStatus;
  readonly catalog: ExerciseDto[];
  readonly catalogLoading: boolean;
  readonly sessions: WorkoutSessionDto[];
  readonly sessionsLoading: boolean;
  /** Page/perPage/total/totalPages for the current `sessions` page (P1-7). */
  readonly sessionsMeta: PaginationMetaDto | null;
  /**
   * Set when `loadSessions()` fails, cleared only once a later attempt
   * *succeeds* (see `loadSessions()` — deliberately NOT cleared when that
   * later attempt starts). On failure, `sessions`/`sessionsMeta` are also
   * left untouched (not reset to `[]`/`null`) — a failed page-2 refetch
   * shouldn't wipe a screen that already has page-1 data on it; the history
   * view shows the stale list plus this error inline rather than losing the
   * user's place. Distinct from an empty `sessions` array either way, so "no
   * sessions yet" and "the request failed" never render the same (P1-7).
   */
  readonly sessionsError: string | null;
  readonly stats: StatsOverviewDto | null;
  readonly statsLoading: boolean;
}

const initialState: GymState = {
  status: 'scaffold',
  catalog: [],
  catalogLoading: false,
  sessions: [],
  sessionsLoading: false,
  sessionsMeta: null,
  sessionsError: null,
  stats: null,
  statsLoading: false,
};

/**
 * GymTracker feature state as an NgRx SignalStore — same idiom as ThemeStore
 * (withState/withComputed/withMethods), but data-driven rather than
 * DOM-driven: loaders are called explicitly by the consuming component
 * (dashboard, history, log form) rather than firing on store construction, so
 * merely injecting `GymStore` never triggers a network call.
 *
 * `status`/`isReady` are the original P0-8 scaffold fields, kept as-is so the
 * existing `GymDashboard` placeholder (P1-8's job to rebuild) keeps working
 * unmodified.
 */
export const GymStore = signalStore(
  { providedIn: 'root' },
  withState<GymState>(initialState),
  withComputed(({ status, catalog, stats }) => ({
    isReady: computed(() => status() === 'ready'),
    hasCatalog: computed(() => catalog().length > 0),
    hasStats: computed(() => stats() !== null),
  })),
  withMethods((store, api = inject(GymApi)) => ({
    /** Loads the seeded exercise catalog (P1-1). Empty catalog on failure. */
    loadCatalog(): void {
      patchState(store, { catalogLoading: true });
      api
        .exercises()
        .pipe(catchError(() => of<ExerciseDto[]>([])))
        .subscribe((catalog) => {
          patchState(store, { catalog, catalogLoading: false });
        });
    },
    /**
     * Loads workout sessions, optionally date-ranged and paginated (P1-3),
     * along with the page's `PaginationMeta` (P1-7). On failure, whatever was
     * already loaded stays put (see `sessionsError` doc) and `sessionsError`
     * is set instead — call `loadSessions()` again (e.g. from a retry
     * button) to clear it.
     *
     * Deliberately does NOT clear `sessionsError` at request start (only the
     * success branch below does). If it did, activating a retry button would
     * make the error — and the very `@if` block the button lives in —
     * disappear the instant the click handler runs, unmounting the button
     * mid-click and throwing keyboard focus to `<body>` before the retry
     * even resolves. Leaving the error in place while `sessionsLoading` is
     * also true keeps that control mounted for the whole round trip; a
     * consuming view can still show "retrying…" from `sessionsLoading()`
     * without tearing anything down (P1-7 review).
     */
    loadSessions(params: ListSessionsParams = {}): void {
      patchState(store, { sessionsLoading: true });
      api
        .sessionsPage(params)
        .pipe(catchError(() => of(null)))
        .subscribe((result) => {
          if (result === null) {
            patchState(store, {
              sessionsLoading: false,
              sessionsError: 'Could not load workout sessions. Please try again.',
            });
            return;
          }
          patchState(store, {
            sessions: result.sessions,
            sessionsMeta: result.meta,
            sessionsLoading: false,
            sessionsError: null,
          });
        });
    },
    /** Loads the dashboard aggregates (P1-4). Null stats on failure. */
    loadStats(): void {
      patchState(store, { statsLoading: true });
      api
        .statsOverview()
        .pipe(catchError(() => of<StatsOverviewDto | null>(null)))
        .subscribe((stats) => {
          patchState(store, { stats, statsLoading: false });
        });
    },
  })),
);
