import { Routes } from '@angular/router';
import { SocialPageComponent } from './presentation/pages/social-page.component';
import { PostDetailPageComponent } from './presentation/pages/post-detail-page.component';
import { CommunitiesPageComponent } from './presentation/pages/communities-page.component';
import { CommunityDetailPageComponent } from './presentation/pages/community-detail-page.component';

export const socialRoutes: Routes = [
  {
    path: 'posts/:id',
    component: PostDetailPageComponent,
  },
  {
    path: 'communities/:id',
    component: CommunityDetailPageComponent,
  },
  {
    path: 'communities',
    component: CommunitiesPageComponent,
  },
  {
    path: '',
    component: SocialPageComponent,
  },
];
