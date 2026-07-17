# 2. Manage shared state with NgRx SignalStore

Date: 2026-07-17

## Status

Accepted

## Context

Angular 21 gives us signals as the native reactivity primitive. We need a
consistent answer to "where does shared state live?" that does not reach for the
full NgRx global-store/effects machinery, which would be disproportionate for an
app this size.

## Decision

- **Local state** is a plain `signal()`; **derived state** is `computed()`.
- **Genuinely shared state** (currently just the theme) lives in an NgRx
  **SignalStore** (`@ngrx/signals`), which is already a dependency.

`ThemeStore` models this: state is a signal, reads go through `computed`
selectors, transitions are pure `patchState` calls, and the DOM side effect
(writing `data-theme`, persisting the choice) lives in an `onInit` hook.

## Consequences

- One idiom across local and shared state — everything is signals.
- No boilerplate actions/reducers/effects for state that does not need them.
- The store pattern scales: the upcoming game and security-lab state can adopt
  the same `withState` / `withComputed` / `withMethods` shape.
- Trade-off: SignalStore is newer than the classic NgRx store, so there is less
  Stack Overflow lore to lean on. Acceptable given the small surface area.
