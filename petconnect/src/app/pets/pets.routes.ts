import { Routes } from '@angular/router';
import { PetsPageComponent } from './presentation/pages/pets-page.component';
import { CreatePetPageComponent } from './presentation/pages/create-pet-page.component';

export const petsRoutes: Routes = [
  {
    path: '',
    component: PetsPageComponent,
  },
  {
    path: 'create',
    component: CreatePetPageComponent,
  },
];
