import { TestBed } from '@angular/core/testing';
import { GymDashboard } from './dashboard';

describe('GymDashboard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GymDashboard] });
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
