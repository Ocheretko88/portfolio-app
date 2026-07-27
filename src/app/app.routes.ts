import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    // Lazy-loaded feature routes keep the initial bundle lean.
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Iryna Ocheretko — Full-Stack Developer',
  },
  {
    // GymTracker bounded context (ADR-0005), lazy-loaded.
    path: 'gym',
    loadChildren: () => import('./features/gym/gym.routes').then((m) => m.GYM_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
