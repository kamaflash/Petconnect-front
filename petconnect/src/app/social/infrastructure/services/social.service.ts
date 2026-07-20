import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

// ========== INTERFACES ==========

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

export interface CreatePostRequest {
  authorId: string;
  imageUrl: string;
  caption: string;
}

export interface UpdatePostRequest {
  imageUrl?: string;
  caption?: string;
}

export interface EventResponse {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  organizerId: string;
  imageUrl: string;
  category: string;
  attendeesCount: number;
  active: boolean;
}

export interface GroupResponse {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  category: string;
  membersCount: number;
  active: boolean;
}

export interface FollowResponse {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  content: string;
  read: boolean;
  referenceId: string;
  referenceType: string;
  actorId: string;
  createdAt: string;
}

export interface TrendingTopicResponse {
  id: string;
  name: string;
  postsCount: number;
  active: boolean;
}

export interface StoryResponse {
  id: string;
  userId: string;
  imageUrl: string;
  seen: boolean;
  expiresAt: string;
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

// Like interfaces
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

// ========== SERVICE ==========

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ========== POSTS ==========

  getAllPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/social/posts`);
  }

  getPost(postId: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/social/posts/${postId}`);
  }

  getPostsByAuthor(authorId: string): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/social/posts/by-author/${authorId}`);
  }

  createPost(request: CreatePostRequest, imageFile?: File): Observable<PostResponse> {
    const formData = new FormData();
    formData.append('authorId', request.authorId);
    formData.append('caption', request.caption);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return this.http.post<PostResponse>(`${this.apiUrl}/social/posts`, formData);
  }

  updatePost(postId: string, request: UpdatePostRequest): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.apiUrl}/social/posts/${postId}`, request);
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/social/posts/${postId}`);
  }

  // ========== POSTS - LIKES ==========

  likePost(postId: string, userId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/social/posts/${postId}/like?userId=${userId}`, {});
  }

  unlikePost(postId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/social/posts/${postId}/unlike?userId=${userId}`);
  }

  getPostLikeStatus(postId: string, userId: string): Observable<LikeStatusResponse> {
    return this.http.get<LikeStatusResponse>(`${this.apiUrl}/social/posts/${postId}/like/status?userId=${userId}`);
  }

  // ========== STORIES ==========

  getStories(): Observable<StoryResponse[]> {
    return this.http.get<StoryResponse[]>(`${this.apiUrl}/social/stories`);
  }

  likeStory(storyId: string, userId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/social/stories/${storyId}/like?userId=${userId}`, {});
  }

  unlikeStory(storyId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/social/stories/${storyId}/like?userId=${userId}`);
  }

  getStoryLikeStatus(storyId: string, userId: string): Observable<LikeStatusResponse> {
    return this.http.get<LikeStatusResponse>(`${this.apiUrl}/social/stories/${storyId}/like/status?userId=${userId}`);
  }

  // ========== PETS - LIKES ==========

  likePet(petId: string, userId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/pets/${petId}/like?userId=${userId}`, {});
  }

  unlikePet(petId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pets/${petId}/like?userId=${userId}`);
  }

  getPetLikeStatus(petId: string, userId: string): Observable<LikeStatusResponse> {
    return this.http.get<LikeStatusResponse>(`${this.apiUrl}/pets/${petId}/like/status?userId=${userId}`);
  }

  // ========== GENERIC LIKES ==========

  getLikeCount(targetType: string, targetId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/likes/${targetType}/${targetId}/count`);
  }

  getUserLikes(userId: string): Observable<Like[]> {
    return this.http.get<Like[]>(`${this.apiUrl}/likes/user/${userId}`);
  }

  // ========== EVENTS ==========

  getAllEvents(): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(`${this.apiUrl}/social/events`);
  }

  createEvent(event: Partial<EventResponse>): Observable<EventResponse> {
    return this.http.post<EventResponse>(`${this.apiUrl}/social/events`, event);
  }

  attendEvent(eventId: string): Observable<EventResponse> {
    return this.http.post<EventResponse>(`${this.apiUrl}/social/events/${eventId}/attend`, {});
  }

  unattendEvent(eventId: string): Observable<EventResponse> {
    return this.http.post<EventResponse>(`${this.apiUrl}/social/events/${eventId}/unattend`, {});
  }

  // ========== GROUPS ==========

  getAllGroups(): Observable<GroupResponse[]> {
    return this.http.get<GroupResponse[]>(`${this.apiUrl}/social/groups`);
  }

  createGroup(group: Partial<GroupResponse>): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(`${this.apiUrl}/social/groups`, group);
  }

  joinGroup(groupId: string): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(`${this.apiUrl}/social/groups/${groupId}/join`, {});
  }

  leaveGroup(groupId: string): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(`${this.apiUrl}/social/groups/${groupId}/leave`, {});
  }

  // ========== FOLLOWS ==========

  getFollowers(userId: string): Observable<FollowResponse[]> {
    return this.http.get<FollowResponse[]>(`${this.apiUrl}/social/follows/followers/${userId}`);
  }

  getFollowing(userId: string): Observable<FollowResponse[]> {
    return this.http.get<FollowResponse[]>(`${this.apiUrl}/social/follows/following/${userId}`);
  }

  followUser(followerId: string, followingId: string): Observable<FollowResponse> {
    return this.http.post<FollowResponse>(`${this.apiUrl}/social/follows`, { followerId, followingId });
  }

  unfollowUser(followerId: string, followingId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/social/follows/${followerId}/${followingId}`);
  }

  // ========== NOTIFICATIONS ==========

  getNotifications(userId: string): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.apiUrl}/social/notifications/${userId}`);
  }

  getUnreadNotificationCount(userId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/social/notifications/${userId}/unread-count`);
  }

  markNotificationAsRead(notificationId: string): Observable<NotificationResponse> {
    return this.http.put<NotificationResponse>(`${this.apiUrl}/social/notifications/${notificationId}/read`, {});
  }

  markAllNotificationsAsRead(userId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/social/notifications/read-all/${userId}`, {});
  }

  // ========== TRENDING TOPICS ==========

  getTrendingTopics(): Observable<TrendingTopicResponse[]> {
    return this.http.get<TrendingTopicResponse[]>(`${this.apiUrl}/social/trending`);
  }

  // ========== PROFILES ==========

  getAllProfiles(): Observable<UserProfileResponse[]> {
    return this.http.get<UserProfileResponse[]>(`${this.apiUrl}/users/profiles`);
  }
}
