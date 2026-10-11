import { Routes } from '@angular/router';
import { authGuard } from './shared/infrastructure/guards/auth.guard';
import { PublicLayout } from './layout/public/public-layout/public-layout';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    canActivate: [authGuard],
    component: PublicLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./home/home.routes').then(m => m.homeRoutes)
      }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    component: PublicLayout,
    children: [
      {
        path: 'pets',
        loadChildren: () =>
          import('./pets/pets.routes').then(m => m.petsRoutes)
      },
      {
        path: 'users',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'health',
        redirectTo: '/agenda',
        pathMatch: 'full'
      },
      {
        path: 'appointments',
        redirectTo: '/agenda',
        pathMatch: 'full'
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./agenda/presentation/pages/agenda-page.component').then(m => m.AgendaPageComponent)
      },
      {
        path: 'lostpets',
        loadChildren: () =>
          import('./lostpets/lostpets.routes').then(m => m.lostpetsRoutes)
      },
      {
        path: 'adoptions',
        loadChildren: () =>
          import('./adoptions/adoptions.routes').then(m => m.adoptionsRoutes)
      },
      {
        path: 'events',
        loadChildren: () =>
          import('./events/events.routes').then(m => m.eventsRoutes)
      },
      {
        path: 'messages',
        loadChildren: () =>
          import('./messages/messages.routes').then(m => m.messagesRoutes)
      },
      {
        path: 'marketplace',
        loadChildren: () =>
          import('./marketplace/marketplace.routes').then(m => m.marketplaceRoutes)
      },
      {
        path: 'services',
        redirectTo: '/nearby',
        pathMatch: 'full'
      },
      {
        path: 'content',
        redirectTo: '/social',
        pathMatch: 'full'
      },
      {
        path: 'social',
        loadChildren: () =>
          import('./social/social.routes').then(m => m.socialRoutes)
      },
      {
        path: 'vet',
        redirectTo: '/nearby',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./profile/profile.routes').then(m => m.profileRoutes)
      },
      {
        path: 'nearby',
        loadChildren: () =>
          import('./nearby/nearby.routes').then(m => m.nearbyRoutes)
      },
      {
        path: 'gamification',
        loadChildren: () =>
          import('./gamification/gamification.routes').then(m => m.gamificationRoutes)
      },
      {
        path: 'management',
        loadChildren: () =>
          import('./admin/admin.routes').then(m => m.adminRoutes)
      },
      {
        path: 'admin',
        redirectTo: '/management',
        pathMatch: 'full'
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.routes').then(m => m.settingsRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
