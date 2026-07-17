import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ThemeStore } from '../../core/state/theme.store';

interface NavItem {
  readonly label: string;
  readonly fragment: string;
}

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header" [class.header--open]="menuOpen()">
      <div class="container header__inner">
        <a class="brand" href="#top" (click)="closeMenu()">
          <span class="brand__mark" aria-hidden="true">IO</span>
          <span class="brand__text">
            Iryna Ocheretko
            <small>Full-Stack Developer</small>
          </span>
        </a>

        <nav class="nav" [attr.aria-hidden]="null" aria-label="Section navigation">
          <ul class="nav__list">
            @for (item of navItems; track item.fragment) {
              <li>
                <a class="nav__link" [href]="'#' + item.fragment" (click)="closeMenu()">
                  {{ item.label }}
                </a>
              </li>
            }
          </ul>
        </nav>

        <div class="header__actions">
          <button
            type="button"
            class="icon-btn"
            [attr.aria-label]="theme.nextLabel()"
            [attr.aria-pressed]="theme.isDark()"
            (click)="theme.toggle()"
          >
            <i class="pi" [class.pi-moon]="theme.isDark()" [class.pi-sun]="!theme.isDark()"></i>
          </button>

          <button
            type="button"
            class="icon-btn menu-toggle"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            (click)="toggleMenu()"
          >
            <i class="pi" [class.pi-bars]="!menuOpen()" [class.pi-times]="menuOpen()"></i>
          </button>
        </div>
      </div>

      <nav id="mobile-nav" class="mobile-nav" aria-label="Section navigation">
        <ul>
          @for (item of navItems; track item.fragment) {
            <li>
              <a [href]="'#' + item.fragment" (click)="closeMenu()">{{ item.label }}</a>
            </li>
          }
        </ul>
      </nav>
    </header>
  `,
  styleUrl: './site-header.css',
})
export class SiteHeader {
  protected readonly theme = inject(ThemeStore);
  protected readonly menuOpen = signal(false);

  protected readonly navItems: readonly NavItem[] = [
    { label: 'About', fragment: 'about' },
    { label: 'Skills', fragment: 'skills' },
    { label: 'Experience', fragment: 'experience' },
    { label: 'Education', fragment: 'education' },
    { label: 'Contact', fragment: 'contact' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
