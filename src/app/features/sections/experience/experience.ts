import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-experience',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="experience" class="section container">
      <p class="eyebrow">Experience</p>
      <h2 class="section-title">Where I've shipped</h2>

      <ol class="timeline">
        @for (role of experience(); track role.company + role.period + role.title) {
          <li class="timeline__item">
            <div class="timeline__marker" aria-hidden="true"></div>
            <article class="card role">
              <header class="role__head">
                <div>
                  <h3 class="role__title">{{ role.title }}</h3>
                  <p class="role__company">{{ role.company }}</p>
                </div>
                <p class="role__period text-mono">{{ role.period }}</p>
              </header>

              @if (role.track) {
                <p class="role__track">{{ role.track }}</p>
              }

              <ul class="role__highlights">
                @for (point of role.highlights; track point) {
                  <li>{{ point }}</li>
                }
              </ul>

              <ul class="role__stack">
                @for (tech of role.stack; track tech) {
                  <li class="chip">{{ tech }}</li>
                }
              </ul>
            </article>
          </li>
        }
      </ol>
    </section>
  `,
  styleUrl: './experience.css',
})
export class Experience {
  private readonly resume = inject(ResumeService);
  protected readonly experience = computed(() => this.resume.data().experience);
}
