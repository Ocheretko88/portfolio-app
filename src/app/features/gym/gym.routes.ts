import { Routes } from '@angular/router';

/**
 * GymTracker feature routes (ADR-0005), lazy-loaded from the app shell so the
 * gym never weighs on the initial CV bundle. `log` is the Phase-1 logging
 * form (P1-6); history / programs / coach routes follow as the slice fills in.
 */
export const GYM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.GymDashboard),
    title: 'GymTracker — Dashboard',
  },
  {
    path: 'log',
    loadComponent: () => import('./log/log-form').then((m) => m.GymLogForm),
    title: 'GymTracker — Log a workout',
  },
];
