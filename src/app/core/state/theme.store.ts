import { computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  readonly mode: ThemeMode;
}

const STORAGE_KEY = 'portfolio.theme';

function resolveInitialMode(doc: Document): ThemeMode {
  const stored = doc.defaultView?.localStorage?.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  // Light is the design's default surface; only honour an explicit dark preference.
  const prefersDark = doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Theme state as an NgRx SignalStore.
 *
 * Chosen over a plain service to lean on the SignalStore pattern the app
 * already depends on: state is a signal, the DOM side effect lives in a hook,
 * and toggling is a pure state transition via patchState. Consumers read
 * through computed selectors and never touch the raw state shape.
 */
export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState<ThemeState>({ mode: 'light' }),
  withComputed(({ mode }) => ({
    isDark: computed(() => mode() === 'dark'),
    nextLabel: computed(() =>
      mode() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
    ),
  })),
  withMethods((store) => ({
    toggle(): void {
      patchState(store, { mode: store.mode() === 'dark' ? 'light' : 'dark' });
    },
    set(mode: ThemeMode): void {
      patchState(store, { mode });
    },
  })),
  withHooks({
    onInit(store) {
      const doc = inject(DOCUMENT);
      store.set(resolveInitialMode(doc));
      effect(() => {
        const mode = store.mode();
        doc.documentElement.dataset['theme'] = mode;
        doc.defaultView?.localStorage?.setItem(STORAGE_KEY, mode);
      });
    },
  }),
);
