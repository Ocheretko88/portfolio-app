import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }),
  );

  it('creates the shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the header, footer and skip link', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('app-site-header')).toBeTruthy();
    expect(el.querySelector('app-site-footer')).toBeTruthy();
    expect(el.querySelector('.skip-link')?.textContent).toContain('Skip to content');
    expect(el.textContent).toContain('Iryna Ocheretko');
  });
});
