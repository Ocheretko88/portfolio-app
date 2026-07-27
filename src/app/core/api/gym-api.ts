import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import type {
  ExerciseDto,
  ListExercisesQuery,
  ListSessionsQuery,
  StatsOverviewDto,
  WorkoutSessionDto,
} from './api-types';

/** Shape of the gym module health ping (scaffold). */
export interface GymPing {
  readonly module: string;
  readonly status: string;
}

/**
 * Optional catalog filters for `GET /gym/exercises` and optional date-range +
 * pagination params for `GET /gym/sessions` — both aliased from the generated
 * `operations` map (see api-types.ts) rather than hand-written, so a contract
 * change to these query shapes surfaces at compile time.
 */
export type ListExercisesParams = ListExercisesQuery;
export type ListSessionsParams = ListSessionsQuery;

/**
 * Builds a query string from a params object, dropping any key whose value is
 * missing — an omitted filter must never reach the server as `?key=undefined`.
 * Generic over the caller's param interface so `ListExercisesParams` /
 * `ListSessionsParams` (which have no index signature of their own) can be
 * passed without an unsound cast.
 */
function toQueryString<T extends object>(params: T): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(
    params as Record<string, string | number | undefined>,
  )) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * GymTracker API seam. Builds on the shared ApiClient (one HTTP seam, SRP) just
 * like ResumeApi, so every payload flows through the same `{ data, meta }`
 * envelope unwrap and is typed from the generated OpenAPI contract (P0-7).
 */
@Injectable({ providedIn: 'root' })
export class GymApi {
  private readonly api = inject(ApiClient);

  ping(): Observable<GymPing> {
    return this.api.get<GymPing>('/api/v1/gym/ping');
  }

  /** Seeded exercise catalog, optionally filtered (P1-1). */
  exercises(params: ListExercisesParams = {}): Observable<ExerciseDto[]> {
    return this.api.get<ExerciseDto[]>(`/api/v1/gym/exercises${toQueryString(params)}`);
  }

  /**
   * Workout sessions, newest-first, optionally date-ranged and paginated
   * (P1-3). The `PaginationMeta` (page/perPage/total/totalPages) isn't
   * surfaced yet — `ApiClient` unwraps only `data` — history (P1-7) adds
   * pagination controls when it needs those numbers.
   */
  sessions(params: ListSessionsParams = {}): Observable<WorkoutSessionDto[]> {
    return this.api.get<WorkoutSessionDto[]>(`/api/v1/gym/sessions${toQueryString(params)}`);
  }

  /** Dashboard aggregates — volume, PRs, streak, frequency (P1-4). */
  statsOverview(): Observable<StatsOverviewDto> {
    return this.api.get<StatsOverviewDto>('/api/v1/gym/stats/overview');
  }
}
