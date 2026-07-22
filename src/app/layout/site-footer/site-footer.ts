import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="container">© {{ year }} Iryna Ocheretko</div>
    </footer>
  `,
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
}
