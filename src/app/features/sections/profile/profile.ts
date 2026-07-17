import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="about" class="section container">
      <p class="eyebrow">About</p>
      <h2 class="section-title">Owning features across the whole stack</h2>

      <div class="profile">
        <p class="profile__summary">{{ profile().summary }}</p>

        <dl class="stats">
          @for (stat of stats(); track stat.label) {
            <div class="stat card">
              <dt class="stat__value">{{ stat.value }}</dt>
              <dd class="stat__label">{{ stat.label }}</dd>
            </div>
          }
        </dl>
      </div>
    </section>
  `,
  styleUrl: './profile.css',
})
export class Profile {
  private readonly resume = inject(ResumeService);
  protected readonly profile = computed(() => this.resume.data().profile);
  protected readonly stats = computed(() => this.resume.data().stats);
}
