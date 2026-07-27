import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/** Shape of the gym module health ping (scaffold). */
export interface GymPing {
  readonly module: string;
  readonly status: string;
}

/**
 * GymTracker API seam. Builds on the shared ApiClient (one HTTP seam, SRP) just
 * like ResumeApi, so payloads flow through the same `{ data, meta }` envelope
 * unwrap. Scaffold: only the module ping; exercises/sessions/stats methods are
 * added with the Phase-1 OpenAPI contract and its generated types.
 */
@Injectable({ providedIn: 'root' })
export class GymApi {
  private readonly api = inject(ApiClient);

  ping(): Observable<GymPing> {
    return this.api.get<GymPing>('/api/v1/gym/ping');
  }
}
