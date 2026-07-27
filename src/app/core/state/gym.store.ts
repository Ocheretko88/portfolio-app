import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';

export type GymModuleStatus = 'scaffold' | 'ready';

interface GymState {
  readonly status: GymModuleStatus;
}

/**
 * GymTracker feature state as an NgRx SignalStore — same idiom as ThemeStore.
 *
 * Scaffold: holds only a module status for now. The sessions, exercise catalog
 * and dashboard-stats signals (with their `withMethods` loaders over GymApi)
 * arrive alongside the Phase-1 endpoints.
 */
export const GymStore = signalStore(
  { providedIn: 'root' },
  withState<GymState>({ status: 'scaffold' }),
  withComputed(({ status }) => ({
    isReady: computed(() => status() === 'ready'),
  })),
);
