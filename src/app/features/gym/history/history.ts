import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GymStore } from '../../../core/state/gym.store';
import type { SetEntryDto, WorkoutSessionDto } from '../../../core/api/api-types';

const PER_PAGE = 10;

/** `DD.MM.YYYY` — day-first, matching the athlete's own notation (PARSING.md). */
function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Grams → a display-friendly kg string (integer grams stay canonical, ADR-0007). */
function formatWeight(grams: number): string {
  return `${(grams / 1000).toFixed(1)} kg`;
}

/** Total volume for one session — `SUM(reps * weightGrams)` over its sets. */
function sessionVolumeGrams(sets: readonly SetEntryDto[]): number {
  return sets.reduce((total, set) => total + (set.reps ?? 0) * set.weightGrams, 0);
}

/**
 * GymTracker history — session list + detail (P1-7, spec §6 `history/`).
 *
 * A single accordion list (same expand/collapse idiom as `Experience`):
 * each row summarizes a session, expanding to its full set-by-set detail
 * (exercise, weight, reps, cycle day, notes) — the list endpoint already
 * returns each session's nested `sets`, so no extra request is needed to
 * show the detail. Loading / empty / error are three distinct, visibly
 * different states (P1-7's audit finding) — and once a page has loaded once,
 * a later page change or retry never unmounts what's already on screen: the
 * list (or the empty message) and the pagination nav stay mounted, a failure
 * renders as its own inline alert alongside them rather than masquerading as
 * "no sessions", and the Prev/Next buttons use `aria-disabled` (not the
 * native `disabled` attribute) at their bounds/while loading so they stay
 * focusable — a keyboard user's focus on the button they just pressed and
 * the "Page X of Y" live region both survive the refetch instead of being
 * torn down, recreated, or (with a native `disabled`) blurred to `<body>`.
 */
@Component({
  selector: 'app-gym-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class GymHistory {
  protected readonly store = inject(GymStore);

  protected readonly page = signal(1);
  protected readonly perPage = PER_PAGE;
  protected readonly openId = signal<number | null>(null);

  protected readonly totalPages = computed(() => this.store.sessionsMeta()?.totalPages ?? 1);
  protected readonly totalSessions = computed(() => this.store.sessionsMeta()?.total ?? 0);

  /**
   * The page number to *display* — the server's `sessionsMeta().page` for
   * whatever is actually on screen, falling back to the locally-requested
   * `page()` only before the very first successful load (when there's no
   * meta yet to read). `page()` itself is "the page we last asked for," which
   * is what drives the next fetch (including a retry re-requesting the same
   * page that failed) — it is deliberately NOT what's rendered, so a failed
   * page change can't make the live region announce a page number that
   * doesn't match the rows still on screen (P1-7 review).
   */
  protected readonly displayedPage = computed(() => this.store.sessionsMeta()?.page ?? this.page());

  /**
   * Whether a `loadSessions()` call has ever resolved successfully —
   * `sessionsMeta` is only ever set on success (see `GymStore`), so this is
   * strictly "do we have real data to show". Before that, a full-page
   * loading/error state makes sense; after that, the list + pagination stay
   * mounted for good (see the class doc) and only their content or an inline
   * status/error changes.
   */
  protected readonly hasLoadedOnce = computed(() => this.store.sessionsMeta() !== null);

  protected readonly catalogById = computed(() => {
    const map = new Map<number, string>();
    for (const exercise of this.store.catalog()) {
      map.set(exercise.id, exercise.name);
    }
    return map;
  });

  constructor() {
    if (!this.store.hasCatalog()) {
      this.store.loadCatalog();
    }
    this.fetch();
  }

  protected isOpen(sessionId: number): boolean {
    return this.openId() === sessionId;
  }

  protected toggle(sessionId: number): void {
    this.openId.update((current) => (current === sessionId ? null : sessionId));
  }

  protected exerciseName(exerciseId: number): string {
    return this.catalogById().get(exerciseId) ?? `Exercise #${exerciseId}`;
  }

  protected sessionSubtitle(session: WorkoutSessionDto): string {
    const parts = [formatDate(session.performedAt), formatTime(session.performedAt)];
    if (session.cycleDay != null) {
      parts.push(`day ${session.cycleDay} of cycle`);
    }
    return parts.join(' · ');
  }

  protected volume(session: WorkoutSessionDto): string {
    return formatWeight(sessionVolumeGrams(session.sets));
  }

  protected weight(grams: number): string {
    return formatWeight(grams);
  }

  protected retry(): void {
    if (!this.store.sessionsLoading()) {
      this.fetch();
    }
  }

  protected nextPage(): void {
    if (!this.store.sessionsLoading() && this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.fetch();
    }
  }

  protected prevPage(): void {
    if (!this.store.sessionsLoading() && this.page() > 1) {
      this.page.update((p) => p - 1);
      this.fetch();
    }
  }

  private fetch(): void {
    this.store.loadSessions({ page: this.page(), perPage: this.perPage });
  }
}
