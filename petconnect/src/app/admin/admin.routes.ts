import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { canAccessManagementSpace } from '../auth/domain/management-access';
import { AuthService } from '../auth/infrastructure/services/auth.service';
import { AdminPageComponent } from './presentation/pages/admin-page.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminPageComponent,
    canActivate: [
      () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        return canAccessManagementSpace(authService.user())
          ? true
          : router.createUrlTree(['/']);
      }
    ]
  },
];
