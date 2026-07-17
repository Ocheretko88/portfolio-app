import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { XRayApi } from '../../core/api/xray-api';
import type { TraceDto } from '../../core/api/api-types';

type XRayStatus = 'idle' | 'loading' | 'playing' | 'done' | 'error';

interface XRayState {
  readonly trace: TraceDto | null;
  readonly status: XRayStatus;
  /** -1 = request in flight; 0..n-1 = active server stage; n = response rendered. */
  readonly activeIndex: number;
}

const INITIAL: XRayState = { trace: null, status: 'idle', activeIndex: -1 };
const STEP_MS = 550;

/**
 * Drives the X-Ray visualiser: fetches a real lifecycle trace from the API and
 * walks its stages on a timer so the UI can animate the request travelling the
 * stack. Provided per-component so each visit starts fresh.
 */
export const XRayStore = signalStore(
  withState<XRayState>(INITIAL),
  withComputed(({ trace, status }) => ({
    stages: computed(() => trace()?.stages ?? []),
    totalMs: computed(() => trace()?.totalMs ?? 0),
    payloadBytes: computed(() => trace()?.payloadBytes ?? 0),
    isBusy: computed(() => status() === 'loading' || status() === 'playing'),
  })),
  withMethods((store, api = inject(XRayApi)) => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clear = (): void => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const play = (count: number): void => {
      const step = (i: number): void => {
        if (i >= count) {
          patchState(store, { status: 'done', activeIndex: count });
          return;
        }
        patchState(store, { status: 'playing', activeIndex: i });
        timer = setTimeout(() => step(i + 1), STEP_MS);
      };
      step(0);
    };

    return {
      run(): void {
        clear();
        patchState(store, { status: 'loading', activeIndex: -1, trace: null });
        api.trace().subscribe({
          next: (trace) => {
            patchState(store, { trace });
            play(trace.stages.length);
          },
          error: () => patchState(store, { status: 'error' }),
        });
      },
      reset(): void {
        clear();
        patchState(store, INITIAL);
      },
    };
  }),
);
