import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="top" class="hero container">
      <div class="hero__intro">
        <!-- <p class="eyebrow">Full-Stack Engineer</p> -->

        <h1 class="hero__name">
          {{ profile().name }}<span class="hero__caret" aria-hidden="true"></span>
        </h1>

        <p class="hero__tagline">
          I build <span class="accent">multi-tenant web platforms</span> end to end —
          <span class="accent-2">Angular</span> on the front,
          <span class="accent-2">Python &amp; PHP</span>
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

        <div class="hero__contact">
          <ul class="hero__links">
            @for (link of socialLinks(); track link.href) {
              <li>
                <a [href]="link.href" rel="noopener" target="_blank" [attr.aria-label]="link.label">
                  <i [class]="link.icon" aria-hidden="true"></i>
                  <span>{{ link.handle }}</span>
                </a>
              </li>
            }
          </ul>

          @if (emailLink(); as email) {
            <a
              class="hero__email"
              [href]="email.href"
              rel="noopener"
              target="_blank"
              [attr.aria-label]="email.label"
            >
              <i [class]="email.icon" aria-hidden="true"></i>
              <span>{{ email.handle }}</span>
            </a>
          }
        </div>
      </div>

      <!-- Flat terminal panel — a plain, honest shell session, not a glossy
           mock. No blur, no 3D tilt. Decorative; hidden from assistive tech. -->
      <aside class="hero__term" aria-hidden="true">
        <div class="term">
          <div class="term__bar">
            <span class="term__prompt-tag">iryna@stack</span>
            <span class="term__path">~/portfolio</span>
            <span class="term__shell">zsh</span>
          </div>
          <pre class="term__body"><code><span class="ln"><span class="pr">$</span> whoami</span>
<span class="out">full-stack engineer · owns features across the whole stack</span>

<span class="ln"><span class="pr">$</span> stack --trace ./request</span>
<span class="out">component.click()
  <span class="ar">→</span> signalStore.dispatch()
  <span class="ar">→</span> httpInterceptor
  <span class="ar">→</span> Laravel route
  <span class="ar">→</span> sanctum.middleware()
  <span class="ar">→</span> controller <span class="ar">→</span> eloquent.query
  <span class="ar">→</span> PostgreSQL
  <span class="ar">←</span> json <span class="ar">←</span> signal.set()
  <span class="ar">←</span> onPush.render() <span class="ok">[ok]</span></span>

<span class="ln"><span class="pr">$</span> <span class="cursor">_</span></span></code></pre>
        </div>
      </aside>
    </section>
  `,
  styleUrl: './hero.css',
})
export class Hero {
  private readonly resume = inject(ResumeService);
  protected readonly profile = computed(() => this.resume.data().profile);
  protected readonly socialLinks = computed(() =>
    this.profile().links.filter((link) => !link.href.startsWith('mailto:')),
  );
  protected readonly emailLink = computed(() =>
    this.profile().links.find((link) => link.href.startsWith('mailto:')),
  );
}
