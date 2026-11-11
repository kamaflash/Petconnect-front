import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ReviewRequest {
  rating: number;
  comment: string;
}

export interface ReviewResponse {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Obtener todas las reseñas de un producto. */
  getReviews(productId: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(
      `${this.apiUrl}/marketplace/products/${productId}/reviews`
    );
  }

  /** Crear una reseña para un producto (usuario autenticado). */
  createReview(productId: string, request: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(
      `${this.apiUrl}/marketplace/products/${productId}/reviews`,
      request
    );
  }
}