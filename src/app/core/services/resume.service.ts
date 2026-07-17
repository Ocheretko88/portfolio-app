import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, type Signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { RESUME } from '../data/resume.data';
import type { Resume } from '../models/resume.models';
import { environment } from '../../../environments/environment';

/** Where the currently-displayed resume came from. */
export type ResumeSource = 'bundled' | 'live';

interface ResumeApiResponse {
  readonly data: Resume;
  readonly meta: { readonly version: string; readonly generatedAt: string };
}

/**
 * Serves resume content to the UI as read-only signals.
 *
 * The bundled snapshot (`RESUME`) is the initial value, so the site renders
 * instantly and stays fully functional even while the free-tier API is cold or
 * unreachable. In the background we fetch the live payload from the Laravel API
 * and, only if it validates, swap it in. Components never change — they read
 * the same `data` signal throughout.
 */
@Injectable({ providedIn: 'root' })
export class ResumeService {
  private readonly http = inject(HttpClient);

  private readonly resume = signal<Resume>(RESUME);
  private readonly sourceSig = signal<ResumeSource>('bundled');

  /** The resume to render. Starts as the bundled snapshot, upgrades to live. */
  readonly data: Signal<Resume> = this.resume.asReadonly();

  /** Whether `data` is currently the bundled snapshot or the live API payload. */
  readonly source: Signal<ResumeSource> = this.sourceSig.asReadonly();

  constructor() {
    this.loadLive();
  }

  private loadLive(): void {
    this.http
      .get<ResumeApiResponse>(`${environment.apiUrl}/api/v1/resume`)
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        const live = response ? this.parse(response.data) : null;
        if (live) {
          this.resume.set(live);
          this.sourceSig.set('live');
        }
        // On any failure we simply keep the bundled snapshot.
      });
  }

  /** Accept the payload only if it is well-formed; otherwise keep the fallback. */
  private parse(raw: unknown): Resume | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const candidate = raw as Partial<Resume>;
    const looksValid =
      !!candidate.profile?.name &&
      Array.isArray(candidate.stats) &&
      Array.isArray(candidate.skillGroups) &&
      Array.isArray(candidate.experience) &&
      Array.isArray(candidate.education) &&
      Array.isArray(candidate.certifications);

    return looksValid ? (candidate as Resume) : null;
  }
}
