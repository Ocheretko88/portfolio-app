import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    // Lazy-loaded feature route (per project conventions), even for the
    // single landing page — keeps the initial bundle lean and the pattern
    // ready for additional routes (the planned game / security lab).
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Iryna Ocheretko — Full-Stack Developer',
  },
  { path: '**', redirectTo: '' },
];
