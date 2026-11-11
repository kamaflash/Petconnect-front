import { Routes } from '@angular/router';
import { ProductDetailPageComponent } from './product-detail-page.component';

export const productDetailRoutes: Routes = [
  {
    path: 'product/:id',
    component: ProductDetailPageComponent,
  },
];