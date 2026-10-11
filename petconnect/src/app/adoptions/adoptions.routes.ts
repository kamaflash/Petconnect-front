import { Routes } from '@angular/router';
import { AdoptionsPageComponent } from './presentation/pages/adoptions-page.component';

export const adoptionsRoutes: Routes = [
  {
    path: 'my-requests',
    loadComponent: () =>
      import('./presentation/pages/my-adoption-requests-page.component')
        .then(m => m.MyAdoptionRequestsPageComponent),
  },
  {
    path: '',
    component: AdoptionsPageComponent,
  },
];
