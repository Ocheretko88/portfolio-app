import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './layout/site-header/site-header';
import { SiteFooter } from './layout/site-footer/site-footer';
import { CommandPalette } from './layout/command-palette/command-palette';
import { ThemeStore } from './core/state/theme.store';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteHeader, SiteFooter, CommandPalette],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Injecting the store here triggers its onInit hook, applying the persisted
  // theme to <html> before first paint of the routed content.
  protected readonly theme = inject(ThemeStore);
}
