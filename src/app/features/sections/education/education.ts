import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ResumeService } from '../../../core/services/resume.service';

@Component({
  selector: 'app-education',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="education" class="section container">
      <p class="eyebrow">Background</p>
      <h2 class="section-title">Education &amp; certifications</h2>

      <div class="edu">
        <div class="edu__col">
          <h3 class="edu__heading">Education</h3>
          <ul class="edu__list">
            @for (item of education(); track item.institution + item.qualification) {
              <li class="card edu__item">
                <p class="edu__institution">{{ item.institution }}</p>
                <p class="edu__qualification">{{ item.qualification }}</p>
                @if (item.period) {
                  <p class="edu__period text-mono">{{ item.period }}</p>
                }
              </li>
            }
          </ul>
        </div>

        <div class="edu__col">
          <h3 class="edu__heading">Certifications</h3>
          <ul class="edu__list">
            @for (cert of certifications(); track cert.name) {
              <li class="card edu__item">
                <p class="edu__institution">{{ cert.name }}</p>
                <p class="edu__qualification">{{ cert.issuer }} · {{ cert.issued }}</p>
                @if (cert.credentialUrl) {
                  <a
                    class="edu__credential"
                    [href]="cert.credentialUrl"
                    target="_blank"
                    rel="noopener"
                  >
                    View credential
                    <i class="pi pi-external-link" aria-hidden="true"></i>
                  </a>
                }
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
  styleUrl: './education.css',
})
export class Education {
  private readonly resume = inject(ResumeService);
  protected readonly education = computed(() => this.resume.data().education);
  protected readonly certifications = computed(() => this.resume.data().certifications);
}
