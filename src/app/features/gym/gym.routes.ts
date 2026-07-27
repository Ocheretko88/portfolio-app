import { Routes } from '@angular/router';

/**
 * GymTracker feature routes (ADR-0005), lazy-loaded from the app shell so the
 * gym never weighs on the initial CV bundle. Scaffold: the dashboard only;
 * log / history / programs / coach routes are added in Phase 1+.
 */
export const GYM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.GymDashboard),
    title: 'GymTracker — Dashboard',
  },
];
