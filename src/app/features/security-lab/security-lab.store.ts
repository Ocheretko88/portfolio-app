import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { SecurityLabApi } from '../../core/api/security-lab-api';
import type { SqlInjectionResultDto, XssResultDto } from '../../core/api/api-types';

interface SecurityLabState {
  readonly sql: SqlInjectionResultDto | null;
  readonly xss: XssResultDto | null;
  readonly pending: 'sql' | 'xss' | null;
  readonly error: string | null;
}

const INITIAL: SecurityLabState = { sql: null, xss: null, pending: null, error: null };
const OFFLINE = 'API unreachable — the free-tier backend may be waking up. Try again in a moment.';

/** State for the (simulated) security lab. Provided per-component. */
export const SecurityLabStore = signalStore(
  withState<SecurityLabState>(INITIAL),
  withMethods((store, api = inject(SecurityLabApi)) => ({
    runSql(input: string): void {
      patchState(store, { pending: 'sql', error: null });
      api.sqlInjection(input).subscribe({
        next: (sql) => patchState(store, { sql, pending: null }),
        error: () => patchState(store, { pending: null, error: OFFLINE }),
      });
    },
    runXss(input: string): void {
      patchState(store, { pending: 'xss', error: null });
      api.xss(input).subscribe({
        next: (xss) => patchState(store, { xss, pending: null }),
        error: () => patchState(store, { pending: null, error: OFFLINE }),
      });
    },
  })),
);
