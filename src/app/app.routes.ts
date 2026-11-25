import { Routes } from '@angular/router';

import { Home } from './pages/home/home';

/**
 * Defines the home-screen application route.
 */
export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
];
