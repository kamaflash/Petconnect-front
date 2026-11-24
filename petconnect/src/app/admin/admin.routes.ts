import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { canAccessManagementSpace } from '../auth/domain/management-access';
import { AuthService } from '../auth/infrastructure/services/auth.service';
import { AdminPageComponent } from './presentation/pages/admin-page.component';
import { EditProductPageComponent } from './presentation/pages/edit-product-page.component';

const managementGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return canAccessManagementSpace(authService.user())
    ? true
    : router.createUrlTree(['/']);
};

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminPageComponent,
    canActivate: [managementGuard],
  },
  {
    path: 'products/edit/:id',
    component: EditProductPageComponent,
    canActivate: [managementGuard],
  },
];
