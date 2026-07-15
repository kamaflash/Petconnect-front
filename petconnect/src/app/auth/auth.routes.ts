import { Routes } from '@angular/router';
import { LoginPageComponent } from './presentation/pages/login-page.component';
import { RegisterPageComponent } from './presentation/pages/register-page.component';
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
        path: 'register',
        component: RegisterPageComponent
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  }
];
