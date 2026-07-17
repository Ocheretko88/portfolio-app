import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="top" class="hero container">
      <div class="hero__intro">
        <p class="eyebrow">Full-Stack Engineer</p>

        <h1 class="hero__name">
          {{ profile().name }}
        </h1>

        <p class="hero__tagline">
          I build <span class="accent">multi-tenant web platforms</span> end to end —
          <span class="accent-blue">Angular</span> on the front,
          <span class="accent-blue">Python &amp; PHP</span>
          APIs behind them, and the data models and security that hold it all together.
        </p>

        <div class="hero__cta">
          <a class="btn" href="assets/Iryna_Ocheretko_CV.pdf" download>
            <i class="pi pi-download" aria-hidden="true"></i>
            Download CV
          </a>
          <a class="btn btn--ghost" href="#contact">
            <i class="pi pi-send" aria-hidden="true"></i>
            Get in touch
          </a>
        </div>

        <ul class="hero__links">
          @for (link of profile().links; track link.href) {
            <li>
              <a [href]="link.href" rel="noopener" target="_blank" [attr.aria-label]="link.label">
                <i [class]="link.icon" aria-hidden="true"></i>
                <span>{{ link.handle }}</span>
              </a>
            </li>
          }
        </ul>
      </div>

      <!-- Decorative "glass mechanism" preview — a nod to the planned
           under-the-hood request visualiser. Hidden from assistive tech. -->
      <aside class="hero__panel" aria-hidden="true">
        <div class="panel">
          <div class="panel__bar">
            <span class="dot dot--red"></span>
            <span class="dot dot--amber"></span>
            <span class="dot dot--blue"></span>
            <span class="panel__title">request.lifecycle.ts</span>
          </div>
          <pre
            class="panel__code"
          ><code><span class="tk-c">// a request travels the full stack</span>
<span class="tk-k">component</span>.click()
  <span class="tk-o">→</span> signalStore.<span class="tk-f">dispatch</span>()
  <span class="tk-o">→</span> httpInterceptor
  <span class="tk-o">→</span> <span class="tk-s">Laravel route</span>
  <span class="tk-o">→</span> sanctum.<span class="tk-f">middleware</span>()
  <span class="tk-o">→</span> controller
  <span class="tk-o">→</span> eloquent<span class="tk-o">.</span>query
  <span class="tk-o">→</span> <span class="tk-s">PostgreSQL</span>
  <span class="tk-o">←</span> json
  <span class="tk-o">←</span> signal.<span class="tk-f">set</span>()
  <span class="tk-o">←</span> onPush.<span class="tk-f">render</span>() <span class="tk-ok">✓</span></code></pre>
        </div>
      </aside>
    </section>
  `,
  styleUrl: './hero.css',
})
export class Hero {
  private readonly resume = inject(ResumeService);
  protected readonly profile = computed(() => this.resume.data().profile);
}
