import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllProducts(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(`${this.apiUrl}/marketplace/products`);
  }

  getMyProducts(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(`${this.apiUrl}/marketplace/products/seller`);
  }

  getProductsByCategory(category: string): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(`${this.apiUrl}/marketplace/products/category/${category}`);
  }

  createProduct(request: CreateProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.apiUrl}/marketplace/products`, request);
  }
}
