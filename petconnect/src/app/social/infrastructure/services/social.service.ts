import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

// ========== INTERFACES ==========

/**
 * Intención declarada al crear una publicación.
 * Debe coincidir con el enum `PostIntent` del backend.
 */
export type PostIntent =
  | 'UPDATE'
  | 'QUESTION'
  | 'RECOMMENDATION'
  | 'ACHIEVEMENT'
  | 'MEETUP'
  | 'URGENT_LOST';

/**
 * Intención mostrada cuando una publicación antigua no la declara.
 * El backend la resuelve igual, esto evita depender del campo en plantillas.
 */
export const DEFAULT_POST_INTENT: PostIntent = 'UPDATE';

/** Intención efectiva de una publicación, nunca nula. */
export function resolveIntent(intent: PostIntent | null | undefined): PostIntent {
  return intent ?? DEFAULT_POST_INTENT;
}

export interface PostResponse {
  id: string;
  authorId: string;
  imageUrl: string;
  caption: string;
  tags?: string;
  likesCount: number;
  commentsCount: number;
  active: boolean;
  createdAt: string;
  /** El backend siempre devuelve un valor; se marca opcional por compatibilidad. */
  intent?: PostIntent;
  /** Solo significativo en publicaciones de tipo QUESTION. */
  solved?: boolean;
}

export interface CreatePostRequest {
  authorId: string;
  imageUrl: string;
  caption: string;
  tags?: string;
  intent?: PostIntent;
}

export interface UpdatePostRequest {
  imageUrl?: string;
  caption?: string;
  intent?: PostIntent;
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

/**
 * Círculo de comunidad tal y como lo ve el visitante actual.
 * `member` y `moderator` los calcula el servidor a partir del token: el
 * cliente nunca los envía, así nadie puede hacerse pasar por miembro.
 */
export interface CommunityResponse {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  category: string;
  topic: string | null;
  membersCount: number;
  /** authUserId del creador; `null` en círculos anteriores a la fase de propiedad. */
  createdBy: string | null;
  member: boolean;
  moderator: boolean;
  /** Solo el propietario puede editar o eliminar; es lo que habilita esos botones. */
  owner: boolean;
}

/**
 * Datos de un círculo para crearlo o editarlo. El backend valida nombre y tema:
 * aquí no se replica la validación para no mantener dos fuentes de verdad.
 */
export interface CommunityDraft {
  name: string;
  description: string | null;
  avatarUrl: string | null;
  category: string | null;
  topic: string | null;
}

/** Filtros de búsqueda de círculos. */
export interface CommunitySearchCriteria {
  q?: string;
  topic?: string;
  page?: number;
  size?: number;
}

/** Temas fijos que agrupan los círculos en el buscador. */
export const COMMUNITY_TOPICS: readonly string[] = [
  'LOCATION',
  'SPECIES',
  'ACTIVITY',
  'SUPPORT',
];

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
  location: string | null;
  latitude: number | null;
  longitude: number | null;
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

// ========== COMMENTS ==========

export interface CommentResponse {
  id: string;
  userId: string;
  targetId: string;
  targetType: string;
  content: string;
  authorFirstName: string;
  authorLastName: string;
  authorAvatarUrl: string;
  createdAt: string;
  parentId?: string | null;
  replies?: CommentResponse[];
  /** El autor de la pregunta marcó esta respuesta como solución. */
  solution?: boolean;
}

export interface CreateCommentRequest {
  userId: string;
  targetId: string;
  targetType: string;
  content: string;
  parentId?: string | null;
}

export interface UpdateCommentRequest {
  userId: string;
  content: string;
}

// ========== PAGINATION ==========

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  last: boolean;
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

  // Public feed - active posts. The backend may return a Page JSON
  // ({content, last, totalElements}) or a plain array depending on the
  // running version; the page/size params are sent when supported.
  // Passing an intent filters the feed; omitting it keeps the previous behaviour.
  getPublicFeed(
    page: number = 0,
    size: number = 10,
    intent?: PostIntent
  ): Observable<PageResponse<PostResponse> | PostResponse[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (intent) {
      params = params.set('intent', intent);
    }
    return this.http.get<PageResponse<PostResponse> | PostResponse[]>(`${this.apiUrl}/social/posts/feed`, { params });
  }

  getPost(postId: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/social/posts/${postId}`);
  }

  getPostsByAuthor(authorId: string): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/social/posts/by-author/${authorId}`);
  }

  getPostsByPet(petId: string): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(`${this.apiUrl}/social/posts/by-pet/${petId}`);
  }

  createPost(request: CreatePostRequest, imageFile?: File): Observable<PostResponse> {
    const formData = new FormData();
    formData.append('authorId', request.authorId);
    formData.append('caption', request.caption);
    if (request.tags) {
      formData.append('tags', request.tags);
    }
    if (request.intent) {
      formData.append('intent', request.intent);
    }
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

  // Get profile by authUserId (used for follow relationships)
  getProfileByAuthUserId(authUserId: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/by-auth/${authUserId}`);
  }

  // Get profile by profile ID
  getProfileById(profileId: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/profile/${profileId}`);
  }

  // ========== COMMENTS ==========

  createComment(request: CreateCommentRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${this.apiUrl}/social/comments`, request);
  }

  getComments(targetType: string, targetId: string): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${this.apiUrl}/social/comments/${targetType}/${targetId}`);
  }

  updateComment(commentId: string, request: UpdateCommentRequest): Observable<CommentResponse> {
    return this.http.put<CommentResponse>(`${this.apiUrl}/social/comments/${commentId}`, request);
  }

  deleteComment(commentId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/social/comments/${commentId}?userId=${userId}`);
  }

  getUserComments(userId: string): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${this.apiUrl}/social/comments/user/${userId}`);
  }

  // ========== PREGUNTAS RESUELTAS ==========
  // La autorización se valida en el backend: solo el autor de la publicación
  // puede marcar o retirar la solución, y únicamente en preguntas.

  /** Marca una respuesta como solución de una pregunta. */
  markCommentAsSolution(postId: string, commentId: string): Observable<PostResponse> {
    return this.http.post<PostResponse>(
      `${this.apiUrl}/social/posts/${postId}/solution/${commentId}`,
      {}
    );
  }

  /** Retira la solución marcada, dejando la pregunta sin resolver. */
  clearCommentSolution(postId: string): Observable<PostResponse> {
    return this.http.delete<PostResponse>(`${this.apiUrl}/social/posts/${postId}/solution`);
  }

  // ========== CÍRCULOS DE COMUNIDAD ==========
  // La lista es pública para poder descubrir círculos sin sesión. Unirse y
  // salir exigen token: el backend toma el usuario del token, nunca de la
  // petición, por lo que aquí no se envía ningún identificador.

  /** Busca círculos por texto y/o tema. */
  searchCommunities(criteria: CommunitySearchCriteria = {}): Observable<PageResponse<CommunityResponse>> {
    let params = new HttpParams();
    if (criteria.q && criteria.q.trim()) {
      params = params.set('q', criteria.q.trim());
    }
    if (criteria.topic && criteria.topic.trim()) {
      params = params.set('topic', criteria.topic.trim());
    }
    if (criteria.page !== undefined && criteria.page !== null) {
      params = params.set('page', String(criteria.page));
    }
    if (criteria.size !== undefined && criteria.size !== null) {
      params = params.set('size', String(criteria.size));
    }
    return this.http.get<PageResponse<CommunityResponse>>(`${this.apiUrl}/communities`, { params });
  }

  /** Círculos a los que pertenece el usuario autenticado. */
  getMyCommunities(page = 0, size = 20): Observable<PageResponse<CommunityResponse>> {
    return this.http.get<PageResponse<CommunityResponse>>(`${this.apiUrl}/communities/mine`, {
      params: new HttpParams().set('page', String(page)).set('size', String(size)),
    });
  }

  /** Detalle de un círculo, con la pertenencia del visitante actual. */
  getCommunityById(communityId: string): Observable<CommunityResponse> {
    return this.http.get<CommunityResponse>(`${this.apiUrl}/communities/${communityId}`);
  }

  /** Une al usuario autenticado al círculo. Idempotente en el backend. */
  joinCommunity(communityId: string): Observable<CommunityResponse> {
    return this.http.post<CommunityResponse>(`${this.apiUrl}/communities/${communityId}/join`, {});
  }

  /** Saca al usuario autenticado del círculo. Idempotente en el backend. */
  leaveCommunity(communityId: string): Observable<CommunityResponse> {
    return this.http.post<CommunityResponse>(`${this.apiUrl}/communities/${communityId}/leave`, {});
  }

  /**
   * Crea un círculo. El creador lo toma el servidor del token y además queda
   * dado de alta como moderador, por eso la respuesta ya viene con
   * `member`/`owner` en true.
   */
  createCommunity(draft: CommunityDraft): Observable<CommunityResponse> {
    return this.http.post<CommunityResponse>(`${this.apiUrl}/communities`, draft);
  }

  /** Edición completa de un círculo. Responde 403 si el usuario no es el propietario. */
  updateCommunity(communityId: string, draft: CommunityDraft): Observable<CommunityResponse> {
    return this.http.put<CommunityResponse>(`${this.apiUrl}/communities/${communityId}`, draft);
  }

  /**
   * Baja lógica del círculo. Devuelve vacío (204): tras un borrado correcto la
   * UI redirige, así que el estado final ya lo describe la navegación.
   */
  deleteCommunity(communityId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/communities/${communityId}`);
  }
}
