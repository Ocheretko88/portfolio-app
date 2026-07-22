import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-experience',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="experience" class="section container">
      <h2 class="section-title">Experience</h2>

      <ol class="roles">
        @for (role of experience(); track role.company + role.period + role.title; let i = $index) {
          <li class="role" [class.role--open]="isOpen(i)">
            <button
              type="button"
              class="role__head"
              [attr.aria-expanded]="isOpen(i)"
              [attr.aria-controls]="'role-panel-' + i"
              (click)="toggle(i)"
            >
              <span class="role__head-main">
                <span class="role__title">{{ role.title }}</span>
                <span class="role__company">{{ role.company }}</span>
              </span>
              <span class="role__period text-mono">{{ role.period }}</span>
              <i class="pi pi-chevron-down role__chevron" aria-hidden="true"></i>
            </button>

            @if (isOpen(i)) {
              <div class="role__panel" [id]="'role-panel-' + i">
                @if (role.track) {
                  <p class="role__track">{{ role.track }}</p>
                }

                <ul class="role__highlights">
                  @for (point of role.highlights; track point) {
                    <li>{{ point }}</li>
                  }
                </ul>

                <p class="role__stack">{{ role.stack.join(' | ') }}</p>
              </div>
            }
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

  private readonly openIndexes = signal<ReadonlySet<number>>(
    new Set(
      this.resume
        .data()
        .experience.flatMap((role, i) => (role.period.includes('Present') ? [i] : [])),
    ),
  );

  protected isOpen(i: number): boolean {
    return this.openIndexes().has(i);
  }

  protected toggle(i: number): void {
    this.openIndexes.update((current) => {
      const next = new Set(current);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  }
}
