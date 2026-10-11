import { Routes } from '@angular/router';
import { SocialPageComponent } from './presentation/pages/social-page.component';
import { PostDetailPageComponent } from './presentation/pages/post-detail-page.component';

export const socialRoutes: Routes = [
  {
    path: 'posts/:id',
    component: PostDetailPageComponent,
  },
  {
    path: '',
    component: SocialPageComponent,
  },
];
