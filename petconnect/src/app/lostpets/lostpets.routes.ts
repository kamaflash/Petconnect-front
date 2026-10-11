import { Routes } from '@angular/router';
import { LostPetsPageComponent } from './presentation/pages/lostpets-page.component';
import { LostPetDetailPageComponent } from './presentation/pages/lostpet-detail-page.component';

export const lostpetsRoutes: Routes = [
  {
    path: ':id',
    component: LostPetDetailPageComponent,
  },
  {
    path: '',
    component: LostPetsPageComponent,
  },
];
