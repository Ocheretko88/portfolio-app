import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeStore } from '../../core/state/theme.store';
import { CommandPaletteService } from '../../core/state/command-palette.service';

interface SectionItem {
  readonly label: string;
  readonly fragment: string;
}

interface RouteItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
})
export class SiteHeader {
  protected readonly theme = inject(ThemeStore);
  protected readonly palette = inject(CommandPaletteService);
  protected readonly menuOpen = signal(false);

  protected readonly sections: readonly SectionItem[] = [
    { label: 'About', fragment: 'about' },
    { label: 'Skills', fragment: 'skills' },
    { label: 'Experience', fragment: 'experience' },
    { label: 'Education', fragment: 'education' },
    { label: 'Contact', fragment: 'contact' },
  ];

  // Hidden from the nav for now: X-Ray and Security Lab don't yet add value for
  // the target audience (CTOs / senior devs). The routes still exist, so these
  // can be restored by uncommenting when the demos are ready.
  protected readonly routeItems: readonly RouteItem[] = [
    { label: 'Gym', route: '/gym', icon: 'pi pi-chart-line' },
    // { label: 'X-Ray', route: '/xray', icon: 'pi pi-bolt' },
    // { label: 'Security Lab', route: '/security-lab', icon: 'pi pi-shield' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
