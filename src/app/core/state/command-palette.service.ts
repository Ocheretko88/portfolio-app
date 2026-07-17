import { Injectable, signal } from '@angular/core';

/** Shared open/close state for the ⌘K command palette. */
@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly openSig = signal(false);
  readonly isOpen = this.openSig.asReadonly();

  open(): void {
    this.openSig.set(true);
  }

  close(): void {
    this.openSig.set(false);
  }

  toggle(): void {
    this.openSig.update((v) => !v);
  }
}
