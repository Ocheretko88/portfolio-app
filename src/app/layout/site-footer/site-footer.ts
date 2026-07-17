import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ResumeService } from '../../core/services/resume.service';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="container footer__inner">
        <div>
          <p class="footer__name">{{ profile().name }}</p>
          <p class="text-muted">{{ profile().title }} · {{ profile().location }}</p>
        </div>

        <ul class="footer__links">
          @for (link of profile().links; track link.href) {
            <li>
              <a [href]="link.href" [attr.aria-label]="link.label" rel="noopener" target="_blank">
                <i [class]="link.icon" aria-hidden="true"></i>
                <span>{{ link.label }}</span>
              </a>
            </li>
          }
        </ul>
      </div>

      <div class="container footer__meta text-mono text-muted">
        <span>Built with Angular {{ angularVersion }} · Signals · PrimeNG</span>
        <span>© {{ year }} — designed &amp; engineered by hand</span>
      </div>
    </footer>
  `,
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  private readonly resume = inject(ResumeService);
  protected readonly profile = computed(() => this.resume.data().profile);
  protected readonly year = new Date().getFullYear();
  protected readonly angularVersion = '21';
}
