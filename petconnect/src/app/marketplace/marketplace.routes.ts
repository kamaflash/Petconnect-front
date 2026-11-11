import { Routes } from '@angular/router';
import { MarketplacePageComponent } from './presentation/pages/marketplace-page.component';
import { CreateProductPageComponent } from './presentation/pages/create-product-page.component';
import { productDetailRoutes } from './presentation/pages/product-detail.routes';

export const marketplaceRoutes: Routes = [
  {
    path: '',
    component: MarketplacePageComponent,
  },
  {
    path: 'create',
    component: CreateProductPageComponent,
  },
  ...productDetailRoutes,
];
