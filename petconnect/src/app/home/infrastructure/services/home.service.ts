import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface PostResponse {
  id: string;
  authorId: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  active: boolean;
  createdAt: string;
}

export interface UserProfileResponse {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  dateOfBirth: string | null;
  city: string | null;
  country: string | null;
  profilePublic: boolean;
  notificationsEnabled: boolean;
  profileType: string;
}

export interface PetResponse {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bio: string | null;
  avatarUrl: string | null;
  weight: number | null;
  weightUnit: string | null;
  active: boolean;
  microchipId: string | null;
  color: string | null;
}

// Interfaces for API responses
export interface StoryResponse {
  id: string;
  userId: string;
  seen: boolean;
}

export interface SuggestionResponse {
  id: string;
  username: string;
  avatar: string;
  followers: number;
}

// Follow response for following endpoint
export interface FollowResponse {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface MarketplacePromoResponse {
  id: string;
  type: 'marketplace' | 'service' | 'adoption';
  title: string;
  description: string;
  image: string;
  link: string;
  tag?: string;
}

export interface VetServiceResponse {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface AdoptionResponse {
  id: string;
  name: string;
  breed: string;
  image: string;
}

export interface AchievementResponse {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  unlocked: boolean;
}

export interface UserLevelResponse {
  level: number;
  currentXp: number;
  totalXp: number;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/social/posts`);
  }

  getAllProfiles(): Observable<UserProfileResponse[]> {
    return this.http.get<UserProfileResponse[]>(`${this.apiUrl}/users/profiles`);
  }

  getUserById(userId: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/${userId}`);
  }

  getPetsByOwner(ownerProfileId: string): Observable<PetResponse[]> {
    return this.http.get<PetResponse[]>(`${this.apiUrl}/pets/by-owner/${ownerProfileId}`);
  }

  // Stories
  getStories(): Observable<StoryResponse[]> {
    return this.http.get<StoryResponse[]>(`${this.apiUrl}/home/stories`);
  }

  // Social stories (alternative endpoint)
  getSocialStories(): Observable<StoryResponse[]> {
    return this.http.get<StoryResponse[]>(`${this.apiUrl}/social/stories`);
  }

  // Suggestions
  getSuggestions(): Observable<SuggestionResponse[]> {
    return this.http.get<SuggestionResponse[]>(`${this.apiUrl}/home/suggestions`);
  }

  // Marketplace promos
  getMarketPromos(): Observable<MarketplacePromoResponse[]> {
    return this.http.get<MarketplacePromoResponse[]>(`${this.apiUrl}/home/market-promos`);
  }

  // Vet services
  getVetServices(): Observable<VetServiceResponse[]> {
    return this.http.get<VetServiceResponse[]>(`${this.apiUrl}/home/vet-services`);
  }

  // New adoptions
  getNewAdoptions(): Observable<AdoptionResponse[]> {
    return this.http.get<AdoptionResponse[]>(`${this.apiUrl}/home/adoptions`);
  }

  // Achievements
  getUpcomingAchievements(): Observable<AchievementResponse[]> {
    return this.http.get<AchievementResponse[]>(`${this.apiUrl}/home/achievements`);
  }

   // User level
   getUserLevel(): Observable<UserLevelResponse> {
     return this.http.get<UserLevelResponse>(`${this.apiUrl}/home/user-level`);
   }

   // Posts from followed users (for home feed)
   getPostsByFollowing(userId: string): Observable<PostResponse[]> {
     return this.http.get<PostResponse[]>(`${this.apiUrl}/social/posts/following/${userId}`);
   }

   // Following - get users that the current user follows
   getFollowing(userId: string): Observable<FollowResponse[]> {
     return this.http.get<FollowResponse[]>(`${this.apiUrl}/social/follows/following/${userId}`);
   }

   // Follow a user
   followUser(followerId: string, followingId: string): Observable<SuggestionResponse> {
     return this.http.post<SuggestionResponse>(`${this.apiUrl}/social/follows`, { followerId, followingId });
   }

   // Unfollow a user
   unfollowUser(followerId: string, followingId: string): Observable<void> {
     return this.http.delete<void>(`${this.apiUrl}/social/follows/${followerId}/${followingId}`);
   }
 }
