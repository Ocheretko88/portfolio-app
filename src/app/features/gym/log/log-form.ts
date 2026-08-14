import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import type { ExerciseDto } from '../../../core/api/api-types';
import { GymApi } from '../../../core/api/gym-api';
import { GymStore } from '../../../core/state/gym.store';

/** kg/lb weight-entry step size, matched to how plates/dumbbells actually load. */
const WEIGHT_STEP: Record<'kg' | 'lb', number> = { kg: 2.5, lb: 5 };
const GRAMS_PER_KG = 1000;
const GRAMS_PER_LB = 453.59237;

interface SetRowSeed {
  readonly search: string;
  readonly exerciseId: number | null;
  readonly weight: number | null;
  readonly reps: number | null;
  readonly perSide: boolean;
  readonly isWarmup: boolean;
  readonly rpe: number | null;
  readonly tempo: string | null;
  readonly restSeconds: number | null;
  readonly notes: string | null;
}

/** Controls of one set row's `FormGroup` — matches `SetRowSeed`'s shape. */
interface SetRowControls {
  search: FormControl<string>;
  exerciseId: FormControl<number | null>;
  weight: FormControl<number | null>;
  reps: FormControl<number | null>;
  perSide: FormControl<boolean>;
  isWarmup: FormControl<boolean>;
  rpe: FormControl<number | null>;
  tempo: FormControl<string | null>;
  restSeconds: FormControl<number | null>;
  notes: FormControl<string | null>;
}

const EMPTY_SET_SEED: SetRowSeed = {
  search: '',
  exerciseId: null,
  weight: null,
  reps: null,
  perSide: false,
  isWarmup: false,
  rpe: null,
  tempo: null,
  restSeconds: null,
  notes: null,
};

/** `datetime-local` needs `YYYY-MM-DDTHH:mm`, no timezone suffix. */
function nowForDateTimeLocal(): string {
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function toGrams(weight: number, unit: 'kg' | 'lb'): number {
  return Math.round(weight * (unit === 'kg' ? GRAMS_PER_KG : GRAMS_PER_LB));
}

/**
 * GymTracker logging form — the "15-second" flow (P1-6, spec §6.1).
 *
 * Everything but notes is selectable/steppable: exercise search-select over
 * the seeded catalog, +/- steppers for weight and reps, toggles for warm-up
 * and per-side, a kg/lb unit switch, and a "repeat last set" shortcut. On
 * submit, weight is converted to canonical integer grams (ADR-0007) and
 * posted via `GymApi.createSession` (P1-2's endpoint).
 *
 * No component library is wired into this app yet (PrimeNG is a
 * `package.json` dependency but has no provider/theme setup) — introducing
 * one is out of this step's scope, so the "search-select" and "stepper"
 * controls are hand-built from native, fully keyboard-operable HTML.
 */
@Component({
  selector: 'app-gym-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './log-form.html',
  styleUrl: './log-form.css',
})
export class GymLogForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(GymApi);
  protected readonly store = inject(GymStore);

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submittedCount = signal(0);

  protected readonly form = this.fb.group({
    performedAt: this.fb.control(nowForDateTimeLocal(), Validators.required),
    title: this.fb.control<string | null>(null),
    cycleDay: this.fb.control<number | null>(null, [Validators.min(1)]),
    durationMin: this.fb.control<number | null>(null, [Validators.min(0)]),
    notes: this.fb.control<string | null>(null),
    unit: this.fb.control<'kg' | 'lb'>('kg'),
    sets: this.fb.array<FormGroup<SetRowControls>>([]),
  });

  protected readonly unit = this.form.controls.unit;

  /**
   * Plain method, not `computed()` — its only input is `FormControl.value`,
   * which is a normal property, not a signal, so a `computed()` here would
   * never invalidate after first read (no tracked dependency) and the
   * stepper would silently stay on the kg increment after switching to lb.
   * Recomputing on every CD pass (same pattern as `filteredCatalog`) keeps
   * it correct.
   */
  protected weightStep(): number {
    return WEIGHT_STEP[this.form.controls.unit.value];
  }

  constructor() {
    if (!this.store.hasCatalog()) {
      this.store.loadCatalog();
    }
    this.addSet();
  }

  protected get sets(): FormArray<FormGroup<SetRowControls>> {
    return this.form.controls.sets;
  }

  protected setGroup(index: number): FormGroup<SetRowControls> {
    return this.sets.at(index);
  }

  private createSetGroup(seed: SetRowSeed = EMPTY_SET_SEED): FormGroup<SetRowControls> {
    return this.fb.group({
      search: this.fb.control(seed.search),
      exerciseId: this.fb.control<number | null>(seed.exerciseId, Validators.required),
      weight: this.fb.control<number | null>(seed.weight, [Validators.required, Validators.min(0)]),
      reps: this.fb.control<number | null>(seed.reps, [Validators.min(0)]),
      perSide: this.fb.control(seed.perSide),
      isWarmup: this.fb.control(seed.isWarmup),
      rpe: this.fb.control<number | null>(seed.rpe, [Validators.min(0), Validators.max(10)]),
      tempo: this.fb.control<string | null>(seed.tempo),
      restSeconds: this.fb.control<number | null>(seed.restSeconds, [Validators.min(0)]),
      notes: this.fb.control<string | null>(seed.notes),
    });
  }

  protected addSet(): void {
    this.sets.push(this.createSetGroup());
  }

  /** Duplicates the last row's selections into a new one — the fast path. */
  protected repeatLastSet(): void {
    const last = this.sets.length > 0 ? this.sets.at(this.sets.length - 1).getRawValue() : null;
    this.sets.push(
      this.createSetGroup(last ? { ...(last as SetRowSeed), notes: null } : EMPTY_SET_SEED),
    );
  }

  protected removeSet(index: number): void {
    if (this.sets.length > 1) {
      this.sets.removeAt(index);
    }
  }

  protected filteredCatalog(query: string): ExerciseDto[] {
    const catalog = this.store.catalog();
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return catalog;
    }
    return catalog.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(needle) ||
        exercise.slug.toLowerCase().includes(needle),
    );
  }

  protected exerciseName(id: number | null): string {
    if (id === null) {
      return '';
    }
    return this.store.catalog().find((exercise) => exercise.id === id)?.name ?? '';
  }

  protected selectExerciseFromOption(event: Event, rowIndex: number): void {
    const value = (event.target as HTMLSelectElement).value;
    const row = this.setGroup(rowIndex);
    if (!value) {
      row.controls['exerciseId'].setValue(null);
      row.controls['exerciseId'].markAsTouched();
      return;
    }
    const exerciseId = Number(value);
    row.patchValue({ exerciseId, search: this.exerciseName(exerciseId) });
    row.controls['exerciseId'].markAsTouched();
  }

  protected stepWeight(rowIndex: number, delta: number): void {
    const control = this.setGroup(rowIndex).controls['weight'];
    const current = (control.value as number | null) ?? 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    control.setValue(next);
  }

  protected stepReps(rowIndex: number, delta: number): void {
    const control = this.setGroup(rowIndex).controls['reps'];
    const current = (control.value as number | null) ?? 0;
    control.setValue(Math.max(0, current + delta));
  }

  protected submit(): void {
    this.submitError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.sets.controls.forEach((row) => row.markAllAsTouched());
      return;
    }

    const raw = this.form.getRawValue();
    const unit = raw.unit;
    this.submitting.set(true);
    this.api
      .createSession({
        performedAt: new Date(raw.performedAt).toISOString(),
        title: raw.title || null,
        cycleDay: raw.cycleDay,
        durationMin: raw.durationMin,
        notes: raw.notes || null,
        sets: raw.sets.map((row, index) => ({
          // `Validators.required` guarantees these are non-null once
          // `form.invalid` is false, but the control type stays nullable —
          // asserted, not `any`.
          exerciseId: row.exerciseId as number,
          setNumber: index + 1,
          reps: row.reps,
          weightGrams: toGrams(row.weight as number, unit),
          perSide: row.perSide,
          rpe: row.rpe,
          tempo: row.tempo || null,
          restSeconds: row.restSeconds,
          isWarmup: row.isWarmup,
          notes: row.notes || null,
        })),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submittedCount.update((count) => count + 1);
          this.resetForm();
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          // 401 means the build is missing GYM_WRITE_TOKEN (ADR-0008/H-4a) —
          // a deployment problem, not a data problem. Telling the athlete to
          // "check your entries" would send them re-typing a correct form
          // forever, so the two cases read differently.
          const status = (err as { status?: number } | null)?.status;
          this.submitError.set(
            status === 401
              ? 'This app is not authorised to save workouts. The gym write token is missing from this build — nothing you typed is wrong.'
              : 'Could not save this session — check your entries and try again.',
          );
        },
      });
  }

  private resetForm(): void {
    const unit = this.form.controls.unit.value;
    this.form.reset({
      performedAt: nowForDateTimeLocal(),
      title: null,
      cycleDay: null,
      durationMin: null,
      notes: null,
      unit,
    });
    this.sets.clear();
    this.addSet();
  }
}
