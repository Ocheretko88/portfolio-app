import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { CommandPaletteService } from '../../core/state/command-palette.service';
import { ThemeStore } from '../../core/state/theme.store';

interface Command {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly hint: string;
  readonly run: () => void;
}

@Component({
  selector: 'app-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.css',
})
export class CommandPalette {
  protected readonly svc = inject(CommandPaletteService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeStore);
  private readonly doc = inject(DOCUMENT);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly query = signal('');
  protected readonly selected = signal(0);

  private readonly commands: readonly Command[] = [
    {
      id: 'xray',
      label: 'Open X-Ray visualiser',
      icon: 'pi pi-bolt',
      hint: 'page',
      run: () => this.go(['/xray']),
    },
    {
      id: 'security',
      label: 'Open Security Lab',
      icon: 'pi pi-shield',
      hint: 'page',
      run: () => this.go(['/security-lab']),
    },
    {
      id: 'about',
      label: 'Go to About',
      icon: 'pi pi-user',
      hint: 'section',
      run: () => this.section('about'),
    },
    {
      id: 'skills',
      label: 'Go to Skills',
      icon: 'pi pi-th-large',
      hint: 'section',
      run: () => this.section('skills'),
    },
    {
      id: 'experience',
      label: 'Go to Experience',
      icon: 'pi pi-briefcase',
      hint: 'section',
      run: () => this.section('experience'),
    },
    {
      id: 'contact',
      label: 'Go to Contact',
      icon: 'pi pi-send',
      hint: 'section',
      run: () => this.section('contact'),
    },
    {
      id: 'theme',
      label: 'Toggle light / dark theme',
      icon: 'pi pi-moon',
      hint: 'action',
      run: () => this.theme.toggle(),
    },
    {
      id: 'cv',
      label: 'Download CV (PDF)',
      icon: 'pi pi-download',
      hint: 'action',
      run: () => this.download(),
    },
    {
      id: 'github',
      label: 'Open GitHub profile',
      icon: 'pi pi-github',
      hint: 'link',
      run: () => this.external('https://github.com/Ocheretko88'),
    },
  ];

  protected readonly filtered = computed<Command[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [...this.commands];
    return this.commands.filter((c) => c.label.toLowerCase().includes(q));
  });

  constructor() {
    // Reset and focus the input whenever the palette opens.
    effect(() => {
      if (this.svc.isOpen()) {
        this.query.set('');
        this.selected.set(0);
        const input = this.searchInput();
        if (input) {
          setTimeout(() => input.nativeElement.focus(), 0);
        }
      }
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.svc.toggle();
      return;
    }
    if (!this.svc.isOpen()) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.svc.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Enter': {
        event.preventDefault();
        const cmd = this.filtered()[this.selected()];
        if (cmd) this.run(cmd);
        break;
      }
    }
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.selected.set(0);
  }

  protected run(cmd: Command): void {
    this.svc.close();
    cmd.run();
  }

  private move(delta: number): void {
    const count = this.filtered().length;
    if (count === 0) return;
    this.selected.update((i) => (i + delta + count) % count);
  }

  private go(commands: string[]): void {
    void this.router.navigate(commands);
  }

  private section(fragment: string): void {
    void this.router.navigate(['/'], { fragment });
  }

  private download(): void {
    const a = this.doc.createElement('a');
    a.href = 'assets/Iryna_Ocheretko_CV.pdf';
    a.download = 'Iryna_Ocheretko_CV.pdf';
    a.click();
  }

  private external(url: string): void {
    this.doc.defaultView?.open(url, '_blank', 'noopener');
  }
}
