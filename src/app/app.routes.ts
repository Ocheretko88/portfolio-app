import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    // Lazy-loaded feature routes keep the initial bundle lean.
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Iryna Ocheretko — Full-Stack Developer',
  },
  { path: '**', redirectTo: '' },
];
