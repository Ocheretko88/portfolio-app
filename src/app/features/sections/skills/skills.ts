import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-skills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="skills" class="section container">
      <h2 class="section-title">Skills</h2>

      <div class="skills">
        @for (group of skillGroups(); track group.name; let last = $last) {
          <div class="skill-group" [class.skill-group--wide]="last">
            <h3 class="skill-group__name">
              <span class="skill-group__dot" aria-hidden="true"></span>
              {{ group.name }}
            </h3>
            <p class="skill-group__items">{{ group.items.join(' · ') }}</p>
          </div>
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
