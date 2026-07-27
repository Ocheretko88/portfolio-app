import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { catchError, of } from 'rxjs';
import { GymApi, type ListSessionsParams } from '../api/gym-api';
import type { ExerciseDto, StatsOverviewDto, WorkoutSessionDto } from '../api/api-types';

export type GymModuleStatus = 'scaffold' | 'ready';

interface GymState {
  readonly status: GymModuleStatus;
  readonly catalog: ExerciseDto[];
  readonly catalogLoading: boolean;
  readonly sessions: WorkoutSessionDto[];
  readonly sessionsLoading: boolean;
  readonly stats: StatsOverviewDto | null;
  readonly statsLoading: boolean;
}

const initialState: GymState = {
  status: 'scaffold',
  catalog: [],
  catalogLoading: false,
  sessions: [],
  sessionsLoading: false,
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
    /** Loads workout sessions, optionally date-ranged (P1-3). */
    loadSessions(params: ListSessionsParams = {}): void {
      patchState(store, { sessionsLoading: true });
      api
        .sessions(params)
        .pipe(catchError(() => of<WorkoutSessionDto[]>([])))
        .subscribe((sessions) => {
          patchState(store, { sessions, sessionsLoading: false });
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
