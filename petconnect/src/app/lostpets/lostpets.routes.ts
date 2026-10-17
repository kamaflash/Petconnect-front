import { Routes } from '@angular/router';
import { LostPetsPageComponent } from './presentation/pages/lostpets-page.component';
import { LostPetDetailPageComponent } from './presentation/pages/lostpet-detail-page.component';
import { LostPetReportModalComponent } from './presentation/components/lostpet-report-modal.component';

export const lostpetsRoutes: Routes = [
  {
    path: 'modal/new',
    component: LostPetReportModalComponent,
  },
  {
    path: '',
    component: LostPetsPageComponent,
  },
  {
    path: ':id',
    component: LostPetDetailPageComponent,
  },
];
