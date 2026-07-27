import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GymStore } from '../../../core/state/gym.store';

/**
 * GymTracker dashboard — scaffold.
 *
 * Standalone, OnPush, reads from the GymStore signal. This is the landing
 * surface for the training dashboard; the volume tile, progression charts and
 * PR markers arrive in Phase 1 (see docs/build/TASKS.md P1-8).
 */
@Component({
  selector: 'app-gym-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="gym" class="section container">
      <h1 class="section-title">GymTracker</h1>
      <p>
        Training dashboard scaffold. Fast workout logging, progress charts and your coach's programs
        land in Phase 1.
      </p>
      <p class="gym-status" role="status">Module status: {{ store.status() }}</p>
    </section>
  `,
})
export class GymDashboard {
  protected readonly store = inject(GymStore);
}
