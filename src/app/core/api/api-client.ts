import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Schemas } from './api-types';

interface Envelope<T> {
  readonly data: T;
  readonly meta: Schemas['Meta'];
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

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<Envelope<T>>(this.url(path), body).pipe(map((res) => res.data));
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}
