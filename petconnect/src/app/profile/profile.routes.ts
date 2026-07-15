import { Routes } from '@angular/router';
import { ProfilePageComponent } from './presentation/pages/profile-page.component';

export const profileRoutes: Routes = [
  {
    path: '',
    component: ProfilePageComponent,
  },
  {
    path: ':id',
    component: ProfilePageComponent,
  },
  {
    path: 'pet/:id',
    component: ProfilePageComponent,
  },
];
