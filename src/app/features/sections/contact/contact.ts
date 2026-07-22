import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="contact" class="section container">
      <h2 class="section-title">Contact</h2>

      <div class="card contact">
        <div class="contact__text">
          <p class="text-muted">
            Open to full-stack roles and interesting problems. The fastest way to reach me is email
            — I usually reply within a day.
          </p>
        </div>

        <div class="contact__actions">
          <a class="btn" [href]="'mailto:' + profile().email">
            <i class="pi pi-envelope" aria-hidden="true"></i>
            {{ profile().email }}
          </a>
          <ul class="contact__links">
            @for (link of profile().links; track link.href) {
              <li>
                <a [href]="link.href" target="_blank" rel="noopener" [attr.aria-label]="link.label">
                  <i [class]="link.icon" aria-hidden="true"></i>
                </a>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
  styleUrl: './contact.css',
})
export class Contact {
  private readonly resume = inject(ResumeService);
  protected readonly profile = computed(() => this.resume.data().profile);
}
