import { Routes } from '@angular/router';
import { PetsPageComponent } from './presentation/pages/pets-page.component';
import { PetCarePageComponent } from './presentation/pages/pet-care-page.component';

export const petsRoutes: Routes = [
  {
    path: ':id/care',
    component: PetCarePageComponent,
  },
  {
    path: '',
    component: PetsPageComponent,
  },
];
