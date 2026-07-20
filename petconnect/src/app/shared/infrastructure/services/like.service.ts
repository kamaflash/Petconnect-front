import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, map } from 'rxjs';

// ========== INTERFACES ==========

export interface Like {
  id: string;
  userId: string;
  targetId: string;
  targetType: string;
  createdAt: string;
}

export interface LikeResponse {
  liked: boolean;
  message: string;
}

export interface LikeStatusResponse {
  liked: boolean;
  count: number;
}

// Tipos de contenido que pueden recibir likes
export type LikeTargetType = 'PET' | 'POST' | 'STORY' | 'COMMENT' | 'EVENT' | 'GROUP';

// ========== SERVICE ==========

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Dar like a un contenido
   */
  like(targetType: LikeTargetType, targetId: string, userId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(
      `${this.apiUrl}/likes/${targetType}/${targetId}?userId=${userId}`,
      {}
    );
  }

  /**
   * Quitar like de un contenido
   */
  unlike(targetType: LikeTargetType, targetId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/likes/${targetType}/${targetId}?userId=${userId}`
    );
  }

  /**
   * Verificar si un usuario ha dado like a un contenido
   */
  getLikeStatus(targetType: LikeTargetType, targetId: string, userId: string): Observable<LikeStatusResponse> {
    return this.http.get<LikeStatusResponse>(
      `${this.apiUrl}/likes/${targetType}/${targetId}/status?userId=${userId}`
    );
  }

  /**
   * Obtener el conteo de likes de un contenido
   */
  getLikeCount(targetType: LikeTargetType, targetId: string): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/likes/${targetType}/${targetId}/count`
    );
  }

  /**
   * Obtener todos los likes de un contenido
   */
  getLikes(targetType: LikeTargetType, targetId: string): Observable<Like[]> {
    return this.http.get<Like[]>(
      `${this.apiUrl}/likes/${targetType}/${targetId}`
    );
  }

  /**
   * Obtener los likes de un usuario
   */
  getUserLikes(userId: string): Observable<Like[]> {
    return this.http.get<Like[]>(
      `${this.apiUrl}/likes/user/${userId}`
    );
  }

  /**
   * Toggle like (alternar entre like/unlike)
   */
  toggleLike(
    targetType: LikeTargetType,
    targetId: string,
    userId: string,
    currentlyLiked: boolean
  ): Observable<LikeResponse | void> {
    if (currentlyLiked) {
      return this.unlike(targetType, targetId, userId);
    }
    return this.like(targetType, targetId, userId);
  }
}
