import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    // Lazy-loaded feature routes keep the initial bundle lean.
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Iryna Ocheretko — Full-Stack Developer',
  },
  {
    path: 'xray',
    loadComponent: () => import('./features/xray/xray').then((m) => m.XRay),
    title: 'X-Ray — under the hood · Iryna Ocheretko',
  },
  {
    path: 'security-lab',
    loadComponent: () => import('./features/security-lab/security-lab').then((m) => m.SecurityLab),
    title: 'Security Lab · Iryna Ocheretko',
  },
  { path: '**', redirectTo: '' },
];
