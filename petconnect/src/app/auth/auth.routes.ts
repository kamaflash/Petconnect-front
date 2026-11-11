import { Routes } from '@angular/router';
import { LoginPageComponent } from './presentation/pages/login-page.component';
import { ConfirmEmailPageComponent } from './presentation/pages/confirm-email-page.component';
import { AuthLayoutComponent } from '../layout/auth/auth-layout/auth-layout.component';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        component: LoginPageComponent
      },
      {
        path: 'confirm-email',
        component: ConfirmEmailPageComponent
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  }
];
