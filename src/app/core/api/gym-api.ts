import { InjectionToken, Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { RUNTIME_CONFIG } from '../../../environments/runtime-config';
import { ApiClient } from './api-client';
import type {
  CreateSessionRequestDto,
  ExerciseDto,
  ListExercisesQuery,
  ListSessionsQuery,
  PaginationMetaDto,
  StatsOverviewDto,
  WorkoutSessionDto,
} from './api-types';

/**
 * Header carrying the shared secret for mutating /gym routes (ADR-0008).
 * Exported so specs assert on the name rather than a duplicated string.
 */
export const GYM_WRITE_TOKEN_HEADER = 'X-Gym-Token';

/**
 * The shared secret itself, injected rather than read straight off
 * `RUNTIME_CONFIG` so a spec can exercise both the configured and the
 * unconfigured branch without depending on what the local build environment
 * happened to set. Defaults to the build-time value.
 */
export const GYM_WRITE_TOKEN = new InjectionToken<string>('GYM_WRITE_TOKEN', {
  providedIn: 'root',
  factory: () => RUNTIME_CONFIG.gymWriteToken,
});

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
  private readonly writeToken = inject(GYM_WRITE_TOKEN);

  ping(): Observable<GymPing> {
    return this.api.get<GymPing>('/api/v1/gym/ping');
  }

  /** Seeded exercise catalog, optionally filtered (P1-1). */
  exercises(params: ListExercisesParams = {}): Observable<ExerciseDto[]> {
    return this.api.get<ExerciseDto[]>(`/api/v1/gym/exercises${toQueryString(params)}`);
  }

  /**
   * Workout sessions, newest-first, optionally date-ranged and paginated
   * (P1-3), with the `PaginationMeta` the server returns
   * (page/perPage/total/totalPages) surfaced alongside the rows via
   * `ApiClient.getWithMeta` — history (P1-7) drives real pagination controls
   * with these numbers instead of re-deriving a page count client-side.
   */
  sessionsPage(
    params: ListSessionsParams = {},
  ): Observable<{ sessions: WorkoutSessionDto[]; meta: PaginationMetaDto }> {
    return this.api
      .getWithMeta<WorkoutSessionDto[], PaginationMetaDto>(
        `/api/v1/gym/sessions${toQueryString(params)}`,
      )
      .pipe(map((envelope) => ({ sessions: envelope.data, meta: envelope.meta })));
  }

  /** Dashboard aggregates — volume, PRs, streak, frequency (P1-4). */
  statsOverview(): Observable<StatsOverviewDto> {
    return this.api.get<StatsOverviewDto>('/api/v1/gym/stats/overview');
  }

  /**
   * Logs a workout session with its set entries (P1-6). Returns the created
   * session with server-computed PR flags — never client-supplied.
   *
   * Carries the `X-Gym-Token` shared secret the API requires on mutating /gym
   * routes (ADR-0008). Reads above deliberately send no such header. The value
   * comes from the build environment via the generated `runtime-config` (see
   * `scripts/generate-runtime-config.mjs`); when it is unset the header is
   * omitted entirely and the API answers 401, which is the intended loud
   * failure rather than a silent no-op.
   */
  createSession(payload: CreateSessionRequestDto): Observable<WorkoutSessionDto> {
    return this.api.post<WorkoutSessionDto>(
      '/api/v1/gym/sessions',
      payload,
      this.writeToken ? { [GYM_WRITE_TOKEN_HEADER]: this.writeToken } : undefined,
    );
  }
}
