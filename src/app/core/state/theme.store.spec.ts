import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeStore } from './theme.store';

describe('ThemeStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    // Deterministic starting point regardless of the runner's storage state.
    TestBed.inject(DOCUMENT).defaultView?.localStorage?.clear();
  });

  it('toggles the mode and keeps isDark / nextLabel in sync', () => {
    const store = TestBed.inject(ThemeStore);
    const wasDark = store.isDark();

    store.toggle();

    expect(store.isDark()).toBe(!wasDark);
    expect(store.nextLabel()).toContain(store.isDark() ? 'light' : 'dark');
  });

  it('set() applies an explicit mode', () => {
    const store = TestBed.inject(ThemeStore);
    store.set('light');
    expect(store.isDark()).toBe(false);
    store.set('dark');
    expect(store.isDark()).toBe(true);
  });
});
