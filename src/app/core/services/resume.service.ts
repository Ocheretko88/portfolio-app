import { Injectable, inject, signal, type Signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ResumeApi } from '../api/resume-api';
import { RESUME } from '../data/resume.data';
import type { Resume, SocialLink } from '../models/resume.models';

/** Where the currently-displayed resume came from. */
export type ResumeSource = 'bundled' | 'live';

/** Best-effort primeicons class for a link when the API omits one. */
function iconForLabel(label: string): string {
  const key = label.toLowerCase();
  if (key.includes('github')) return 'pi pi-github';
  if (key.includes('linkedin')) return 'pi pi-linkedin';
  if (key.includes('telegram')) return 'pi pi-telegram';
  if (key.includes('mail')) return 'pi pi-envelope';
  return 'pi pi-link';
}

/** Guarantee every link has a display handle and an icon, whatever the source. */
function normalizeLink(link: SocialLink): SocialLink {
  return {
    ...link,
    handle: link.handle || link.label,
    icon: link.icon || iconForLabel(link.label),
  };
}

/**
 * Serves resume content to the UI as read-only signals.
 *
 * The bundled snapshot (`RESUME`) is the initial value, so the site renders
 * instantly and stays functional even while the free-tier API is cold. In the
 * background we fetch the live payload via the typed API client and, only if it
 * validates, swap it in. Components read the same `data` signal throughout.
 */
@Injectable({ providedIn: 'root' })
export class ResumeService {
  private readonly resumeApi = inject(ResumeApi);

  private readonly resume = signal<Resume>(RESUME);
  private readonly sourceSig = signal<ResumeSource>('bundled');

  readonly data: Signal<Resume> = this.resume.asReadonly();
  readonly source: Signal<ResumeSource> = this.sourceSig.asReadonly();

  constructor() {
    this.loadLive();
  }

  private loadLive(): void {
    this.resumeApi
      .get()
      .pipe(catchError(() => of(null)))
      .subscribe((dto) => {
        const live = dto ? this.parse(dto) : null;
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
      Array.isArray(candidate.profile?.links) &&
      Array.isArray(candidate.stats) &&
      Array.isArray(candidate.skillGroups) &&
      Array.isArray(candidate.experience) &&
      Array.isArray(candidate.education) &&
      Array.isArray(candidate.certifications);

    if (!looksValid) {
      return null;
    }

    const resume = candidate as Resume;
    return {
      ...resume,
      profile: {
        ...resume.profile,
        links: resume.profile.links.map(normalizeLink),
      },
    };
  }
}
