import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GymDashboard } from './dashboard';

describe('GymDashboard', () => {
  beforeEach(() => {
    // GymStore (injected by this component) now depends on GymApi (P1-5).
    // HttpClient is root-provided, so DI would resolve without this, but we
    // provide the HTTP-testing client anyway so this spec can never reach a
    // live backend if a future change adds an eager load — same test-hygiene
    // pattern as every other spec that touches a store/service backed by HTTP.
    TestBed.configureTestingModule({
      imports: [GymDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('creates the scaffold component', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the GymTracker heading', () => {
    const fixture = TestBed.createComponent(GymDashboard);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.section-title')?.textContent).toContain('GymTracker');
  });
});
