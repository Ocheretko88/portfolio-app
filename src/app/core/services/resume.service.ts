import { Injectable, signal, type Signal } from '@angular/core';
import { RESUME } from '../data/resume.data';
import type { Resume } from '../models/resume.models';

/**
 * Exposes resume content to the UI as read-only signals.
 *
 * Today the data is a static, typed constant. Keeping access behind a service
 * means the source can later become an HTTP call to the Laravel API (see the
 * planned `GET /api/v1/resume`) without any change to the components — the
 * signal contract stays the same.
 */
@Injectable({ providedIn: 'root' })
export class ResumeService {
  private readonly resume = signal<Resume>(RESUME);

  readonly data: Signal<Resume> = this.resume.asReadonly();
}
