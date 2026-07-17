import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-explore',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section id="explore" class="section container">
      <p class="eyebrow">Playground</p>
      <h2 class="section-title">See how it works, not just what it does</h2>

      <div class="explore">
        <a class="card explore__card" routerLink="/xray">
          <i class="pi pi-bolt explore__icon" aria-hidden="true"></i>
          <h3>X-Ray</h3>
          <p class="text-muted">
            Run a request and watch it cross the full Angular → Laravel → PostgreSQL stack, timed
            with real server telemetry.
          </p>
          <span class="explore__go">Open <i class="pi pi-arrow-right" aria-hidden="true"></i></span>
        </a>

        <a class="card explore__card" routerLink="/security-lab">
          <i class="pi pi-shield explore__icon explore__icon--red" aria-hidden="true"></i>
          <h3>Security Lab</h3>
          <p class="text-muted">
            Compare vulnerable vs. hardened code for SQL injection and XSS — a safe, simulated
            sandbox with real escaping.
          </p>
          <span class="explore__go">Open <i class="pi pi-arrow-right" aria-hidden="true"></i></span>
        </a>
      </div>

      <p class="explore__hint text-mono text-muted">
        Tip: press ⌘K / Ctrl-K anywhere to jump around.
      </p>
    </section>
  `,
  styleUrl: './explore.css',
})
export class Explore {}
