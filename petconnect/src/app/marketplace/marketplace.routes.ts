import { Routes } from '@angular/router';
import { MarketplacePageComponent } from './presentation/pages/marketplace-page.component';
import { CreateProductPageComponent } from './presentation/pages/create-product-page.component';

export const marketplaceRoutes: Routes = [
  {
    path: '',
    component: MarketplacePageComponent,
  },
  {
    path: 'create',
    component: CreateProductPageComponent,
  },
];
