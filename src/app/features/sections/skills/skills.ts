import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-skills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="skills" class="section container">
      <p class="eyebrow">Toolbox</p>
      <h2 class="section-title">Skills across the stack</h2>

      <div class="skills">
        @for (group of skillGroups(); track group.name) {
          <article class="card skill-group">
            <h3 class="skill-group__name">
              <span class="skill-group__dot" aria-hidden="true"></span>
              {{ group.name }}
            </h3>
            <ul class="skill-group__items">
              @for (item of group.items; track item) {
                <li class="chip">{{ item }}</li>
              }
            </ul>
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './skills.css',
})
export class Skills {
  private readonly resume = inject(ResumeService);
  protected readonly skillGroups = computed(() => this.resume.data().skillGroups);
}
