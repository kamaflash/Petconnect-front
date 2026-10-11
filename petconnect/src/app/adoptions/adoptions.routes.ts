import { Routes } from '@angular/router';
import { AdoptionsPageComponent } from './presentation/pages/adoptions-page.component';

export const adoptionsRoutes: Routes = [
  {
    // Alias heredado: abre la pestaña "Mis solicitudes" dentro de la página
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
