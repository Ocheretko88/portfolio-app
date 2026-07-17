/**
 * Development environment. Swapped in for `environment.ts` during `ng serve`
 * via the `fileReplacements` entry in angular.json. Point this at your local
 * Laravel API (`php artisan serve` defaults to port 8000).
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
};
