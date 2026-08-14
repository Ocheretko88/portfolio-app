import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Schemas } from './api-types';

/**
 * Generic over the `meta` shape so a paginated endpoint (`PaginationMeta`) and
 * a plain one (`Meta`) can both be described by the same envelope — defaults
 * to `Meta` so every existing call site is unaffected.
 */
export interface Envelope<T, M = Schemas['Meta']> {
  readonly data: T;
  readonly meta: M;
}

/**
 * Single HTTP seam for the whole app. Prepends the API base URL and unwraps the
 * `{ data, meta }` envelope so callers work with plain payloads. Per-domain API
 * services build on this (SRP) rather than touching HttpClient directly.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string): Observable<T> {
    return this.http.get<Envelope<T>>(this.url(path)).pipe(map((res) => res.data));
  }

  /**
   * `headers` is opt-in per call rather than a global interceptor on purpose:
   * only the mutating gym routes need the `X-Gym-Token` shared secret
   * (ADR-0008), and an interceptor that matched on URL would quietly attach it
   * to reads too. Making the caller ask keeps the blast radius visible at the
   * call site — see `GymApi.createSession`.
   */
  post<T>(path: string, body: unknown, headers?: Record<string, string>): Observable<T> {
    return this.http
      .post<Envelope<T>>(this.url(path), body, headers ? { headers } : {})
      .pipe(map((res) => res.data));
  }

  /**
   * Same GET as `get()`, but returns the full envelope instead of unwrapping
   * it — for endpoints whose `meta` carries more than `{version,
   * generatedAt}` (e.g. `PaginationMeta`) and whose caller needs those extra
   * fields rather than just `data` (P1-7: history's pagination controls).
   */
  getWithMeta<T, M = Schemas['Meta']>(path: string): Observable<Envelope<T, M>> {
    return this.http.get<Envelope<T, M>>(this.url(path));
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}
