import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse, pageParams } from '../../../shared/infrastructure/http/page-response';

export interface ProductResponse {
  id: string;
  sellerId: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  category: string;
  subcategory: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  stock: number;
  brand: string | null;
  rating: number;
  reviews: number;
  active: boolean;
  discount: number | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  imageUrls?: string;
  stock: number;
  brand?: string;
  discount?: number;
  tags?: string;
}

/** Filtros del catálogo que el backend aplica en BD (`GET /marketplace/products`). */
export interface ProductListFilters {
  /** Texto libre sobre nombre, descripción y marca. */
  term?: string;
  /** Categoría exacta. */
  category?: string;
  /** Marca exacta (insensible a mayúsculas en el backend). */
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  /** `true` = con stock, `false` = agotado. */
  inStock?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllProducts(page = 0, size = 10, filters: ProductListFilters = {}): Observable<PageResponse<ProductResponse>> {
    let params = pageParams(new HttpParams(), { page, size });
    if (filters.term) params = params.set('term', filters.term);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.brand) params = params.set('brand', filters.brand);
    if (filters.minPrice != null) params = params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice != null) params = params.set('maxPrice', String(filters.maxPrice));
    if (filters.inStock != null) params = params.set('inStock', String(filters.inStock));
    return this.http.get<PageResponse<ProductResponse>>(
      `${this.apiUrl}/marketplace/products`,
      { params },
    );
  }

  getMyProducts(page = 0, size = 10): Observable<PageResponse<ProductResponse>> {
    const params = new HttpParams();
    return this.http.get<PageResponse<ProductResponse>>(
      `${this.apiUrl}/marketplace/products/seller`,
      { params: pageParams(params, { page, size }) },
    );
  }

  getProductsByCategory(category: string, page = 0, size = 10): Observable<PageResponse<ProductResponse>> {
    const params = new HttpParams();
    return this.http.get<PageResponse<ProductResponse>>(
      `${this.apiUrl}/marketplace/products/category/${category}`,
      { params: pageParams(params, { page, size }) },
    );
  }

  createProduct(request: CreateProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.apiUrl}/marketplace/products`, request);
  }
}
