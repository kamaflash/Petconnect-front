import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';

interface CommunityUser {
  id: string;
  name: string;
  avatar: string;
  username: string;
  userId: string;
  pets: number;
  level: number;
  isFollowing: boolean;
  followers: number;
  following: number;
  posts: number;
  joinedDate: Date;
  location?: string;
  bio?: string;
  achievements?: string[];
  isVerified?: boolean;
}

interface Pet {
  id: string;
  name: string;
  avatar: string;
  species: string;
  breed: string;
  age: string;
  isFollowing: boolean;
  ownerId: string;
  ownerName: string;
  followers: number;
  posts: number;
  lastActive: Date;
  isPublic: boolean;
}

interface CommunityPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    username: string;
    userId: string;
    isVerified?: boolean;
  };
  timestamp: Date;
  content: string;
  image?: string;
  imageGallery?: string[];
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  saved: boolean;
  tags?: string[];
  type?: 'update' | 'question' | 'event' | 'tip' | 'milestone';
  petMention?: {
    id: string;
    name: string;
    avatar: string;
  }[];
}

interface Comment {
  id: string;
  user: {
    name: string;
    avatar: string;
    username: string;
    userId: string;
  };
  content: string;
  timestamp: Date;
  likes: number;
  liked: boolean;
  replies?: Comment[];
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: string;
  attendees: number;
  image: string;
  isAttending: boolean;
  category: string;
  attendeesList: string[];
}

interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  members: number;
  isMember: boolean;
  category: string;
  lastActive: Date;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'achievement';
  user: {
    name: string;
    avatar: string;
    username: string;
    userId: string;
  };
  content: string;
  timestamp: Date;
  read: boolean;
  postId?: string;
  postContent?: string;
}

@Component({
  selector: 'app-social-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    AvatarModule,
    AvatarGroupModule,
    InputTextModule,
    DialogModule,
    ProgressBarModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ToastModule,
    DividerModule,
    ChipModule,
    BadgeModule,
    TooltipModule,
    MenuModule,
    DynamicFormComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="social-page">
      <div class="social-container">
        <!-- Tabs principales -->
        <div class="social-tabs">
          <div class="tabs-container">
            <button
              class="tab-button"
              [class.active]="activeTab() === 'feed'"
              (click)="setActiveTab('feed')"
            >
              <span class="material-symbols-rounded nav-icon" [class.filled]="activeTab() === 'feed'">home</span>
              <span class="tab-text">Mi Tablón</span>
              <span class="tab-badge" *ngIf="unreadNotifications > 0">{{ unreadNotifications }}</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'following'"
              (click)="setActiveTab('following')"
            >
              <span class="material-symbols-rounded nav-icon" [class.filled]="activeTab() === 'following'">person</span>
              <span class="tab-text">Siguiendo</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'events'"
              (click)="setActiveTab('events')"
            >
              <span class="material-symbols-rounded nav-icon" [class.filled]="activeTab() === 'events'">event</span>
              <span class="tab-text">Eventos</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'groups'"
              (click)="setActiveTab('groups')"
            >
              <span class="material-symbols-rounded nav-icon" [class.filled]="activeTab() === 'groups'">groups</span>
              <span class="tab-text">Grupos</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'notifications'"
              (click)="setActiveTab('notifications')"
            >
              <span class="material-symbols-rounded nav-icon" [class.filled]="activeTab() === 'notifications'">notifications</span>
              <span class="tab-text">Notificaciones</span>
              <span class="tab-badge" *ngIf="unreadNotifications > 0">{{ unreadNotifications }}</span>
            </button>
          </div>
        </div>

        <!-- Mi Tablón -->
        <div class="feed-layout" *ngIf="activeTab() === 'feed'">
          <div class="feed-column">
            <div class="create-post-input" (click)="showCreatePostDialog()">
              <p-avatar image="https://i.pravatar.cc/150?img=1" shape="circle" size="normal"></p-avatar>
              <input
                type="text"
                placeholder="¿Qué estás pensando?"
                class="post-input-field"
                readonly
              />
              <div class="post-input-icons">
                <i class="pi pi-image"></i>
                <i class="pi pi-smile"></i>
              </div>
            </div>

            <div class="post-card" *ngFor="let post of filteredFeedPosts()">
              <div class="post-header">
                <div class="post-user">
                  <div class="post-avatar-ring">
                    <p-avatar
                      [image]="post.user.avatar"
                      shape="circle"
                      size="large"
                    ></p-avatar>
                  </div>
                  <div class="post-user-text">
                    <a [routerLink]="'/profile/' + post.user.userId" class="post-username">{{ post.user.username }}</a>
                    <span class="post-name">{{ post.user.name }}</span>
                  </div>
                </div>
                <button class="post-more-btn">
                  <i class="pi pi-ellipsis-h"></i>
                </button>
              </div>

              <div class="post-image-wrap">
                <img [src]="post.image" [alt]="post.content" class="post-image" />
              </div>

              <div class="post-actions">
                <div class="post-actions-left">
                  <button class="post-action-btn" (click)="toggleLike(post)">
                    <i class="pi" [class.pi-heart-fill]="post.liked" [class.pi-heart]="!post.liked"
                       [style.color]="post.liked ? 'var(--primary-color)' : ''"></i>
                  </button>
                  <button class="post-action-btn">
                    <i class="pi pi-comment"></i>
                  </button>
                  <button class="post-action-btn">
                    <i class="pi pi-send"></i>
                  </button>
                </div>
                <button class="post-action-btn" (click)="toggleSavePost(post)">
                  <i class="pi" [class.pi-bookmark-fill]="post.saved" [class.pi-bookmark]="!post.saved"></i>
                </button>
              </div>

              <div class="post-likes">
                <p-avatar-group>
                  <p-avatar image="https://i.pravatar.cc/150?img=11" shape="circle" size="normal"></p-avatar>
                  <p-avatar image="https://i.pravatar.cc/150?img=12" shape="circle" size="normal"></p-avatar>
                  <p-avatar image="https://i.pravatar.cc/150?img=13" shape="circle" size="normal"></p-avatar>
                </p-avatar-group>
                <span class="likes-text">Le gusta a <strong>{{ post.likes }}</strong> personas</span>
              </div>

              <div class="post-caption">
                <a [routerLink]="'/profile/' + post.user.userId" class="caption-user">{{ post.user.username }}</a>
                <span class="caption-text">{{ post.content }}</span>
              </div>

              <div class="post-comments">
                <span class="comments-link">Ver los {{ post.comments }} comentarios</span>
                <span class="comment-time">{{ post.timestamp | date:'d MMM' }}</span>
              </div>

              <div class="post-comment-input">
                <input
                  type="text"
                  placeholder="Añade un comentario..."
                  class="comment-input"
                />
                <button class="comment-post-btn">Publicar</button>
              </div>
            </div>

            <div class="load-more-container">
              <p-button
                label="Cargar más publicaciones"
                icon="pi pi-spin pi-spinner"
                styleClass="p-button-outlined"
                (onClick)="loadMorePosts()"
                [loading]="loadingMore()"
              />
            </div>
          </div>

          <div class="feed-sidebar">
            <div class="sidebar-card">
              <div class="sidebar-header">
                <h3>Tendencias</h3>
              </div>
              <div class="trending-item" *ngFor="let trend of trendingTopics">
                <span class="trend-rank">#{{ trend.rank }}</span>
                <div class="trend-info">
                  <span class="trend-name">{{ trend.name }}</span>
                  <span class="trend-posts">{{ trend.posts }} publicaciones</span>
                </div>
              </div>
            </div>

            <div class="sidebar-card">
              <div class="sidebar-header">
                <h3>Família populares</h3>
              </div>
              <div class="popular-pet" *ngFor="let pet of popularPets">
                <p-avatar [image]="pet.avatar" shape="circle"></p-avatar>
                <div class="pet-info">
                  <span class="pet-name">{{ pet.name }}</span>
                  <span class="pet-breed">{{ pet.breed }}</span>
                </div>
                <p-button
                  [label]="pet.isFollowing ? 'Siguiendo' : 'Seguir'"
                  [icon]="pet.isFollowing ? 'pi pi-user-minus' : 'pi pi-user-plus'"
                  styleClass="p-button-sm  p-button-outlined"
                  [ngClass]="pet.isFollowing ? 'p-button-sm  p-button-outlined' : 'p-button-sm p-button-outlined' "
                  (onClick)="toggleFollowPet(pet)"
                />
              </div>
            </div>

            <div class="sidebar-card">
              <div class="sidebar-header">
                <h3>Próximos eventos</h3>
              </div>
              <div class="upcoming-event" *ngFor="let event of upcomingEvents">
                <div class="event-date">
                  <span class="event-day">{{ event.date | date:'dd' }}</span>
                  <span class="event-month">{{ event.date | date:'MMM' }}</span>
                </div>
                <div class="event-info">
                  <span class="event-title">{{ event.title }}</span>
                  <span class="event-attendees">{{ event.attendees }} asistentes</span>
                </div>
                <p-button
                  [label]="event.isAttending ? 'Asistiendo' : 'Asistir'"
                  [icon]="event.isAttending ? 'pi pi-check' : 'pi pi-plus'"
                  styleClass="p-button-sm  p-button-outlined"
                  (onClick)="toggleEventAttendance(event)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Siguiendo -->
        <div class="following-layout" *ngIf="activeTab() === 'following'">
          <div class="following-grid">
            <div class="following-card">
              <div class="following-header">
                <h3>Família que sigo ({{ followingPets().length }})</h3>
              </div>
              <div class="following-list">
                <div class="following-item" *ngFor="let pet of followingPets()">
                  <p-avatar [image]="pet.avatar" shape="circle" size="large"></p-avatar>
                  <div class="following-info">
                    <a [routerLink]="'/profile/pet/' + pet.id" class="following-name">{{ pet.name }}</a>
                    <p class="following-detail">{{ pet.species }} · {{ pet.breed }}</p>
                    <p class="following-detail">{{ pet.age }} · {{ pet.posts }} publicaciones</p>
                  </div>
                  <div class="following-actions">
                    <p-button
                      label="Dejar de seguir"
                      icon="pi pi-user-minus"
                      styleClass="p-button-sm p-button-outlined"
                      (onClick)="toggleFollowPet(pet)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="following-card">
              <div class="following-header">
                <h3>Usuarios que sigo ({{ followingUsers().length }})</h3>
              </div>
              <div class="following-list">
                <div class="following-item" *ngFor="let user of followingUsers()">
                  <p-avatar [image]="user.avatar" shape="circle" size="large"></p-avatar>
                  <div class="following-info">
                    <div class="following-username-row">
                      <a [routerLink]="'/profile/' + user.userId" class="following-name">{{ user.name }}</a>
                      <i *ngIf="user.isVerified" class="pi pi-check-circle verified-icon"></i>
                    </div>
                    <a [routerLink]="'/profile/' + user.userId" class="following-detail">{{ user.username }}</a>
                    <p class="following-detail">{{ user.pets }} mascotas · {{ user.followers }} seguidores</p>
                  </div>
                  <div class="following-actions">
                    <p-button
                      label="Dejar de seguir"
                      icon="pi pi-user-minus"
                      styleClass="p-button-sm p-button-outlined"
                      (onClick)="toggleFollow(user)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="following-card">
              <div class="following-header">
                <h3>Te siguen ({{ followersUsers().length }})</h3>
              </div>
              <div class="following-list">
                <div class="following-item" *ngFor="let user of followersUsers()">
                  <p-avatar [image]="user.avatar" shape="circle" size="large"></p-avatar>
                  <div class="following-info">
                    <div class="following-username-row">
                      <a [routerLink]="'/profile/' + user.userId" class="following-name">{{ user.name }}</a>
                      <i *ngIf="user.isVerified" class="pi pi-check-circle verified-icon"></i>
                    </div>
                    <a [routerLink]="'/profile/' + user.userId" class="following-detail">{{ user.username }}</a>
                    <p class="following-detail">{{ user.pets }} mascotas · {{ user.followers }} seguidores</p>
                  </div>
                  <div class="following-actions">
                    <p-button
                      [label]="user.isFollowing ? 'Siguiendo' : 'Seguir'"
                      [icon]="user.isFollowing ? 'pi pi-user-minus' : 'pi pi-user-plus'"
                      [ngClass]="user.isFollowing ? 'p-button-sm p-button-outlined' : 'p-button-sm p-button-outlined'"
                      (onClick)="toggleFollow(user)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Eventos -->
        <div class="events-layout" *ngIf="activeTab() === 'events'">
          <div class="events-header">
            <h2>Eventos de la comunidad</h2>
            <p-button
              icon="pi pi-plus"
              label="Crear evento"
              styleClass="p-button-primary"
              (onClick)="showCreateEventDialog()"
            />
          </div>
          <div class="events-grid">
            <div class="event-card" *ngFor="let event of upcomingEvents">
              <div class="event-image" [style.background-image]="'url(' + event.image + ')'">
                <div class="event-category">
                  <span>{{ event.category }}</span>
                </div>
              </div>
              <div class="event-content">
                <div class="event-date-badge">
                  <span class="event-day">{{ event.date | date:'dd' }}</span>
                  <span class="event-month">{{ event.date | date:'MMM' }}</span>
                </div>
                <div class="event-info">
                  <h3>{{ event.title }}</h3>
                  <p>{{ event.description }}</p>
                  <div class="event-meta">
                    <span><i class="pi pi-map-marker"></i> {{ event.location }}</span>
                    <span><i class="pi pi-user"></i> {{ event.organizer }}</span>
                  </div>
                  <div class="event-attendees">
                    <p-avatarGroup>
                      <p-avatar *ngFor="let attendee of event.attendeesList" [image]="attendee" shape="circle" size="normal"></p-avatar>
                    </p-avatarGroup>
                    <span>{{ event.attendees }} asistentes</span>
                  </div>
                </div>
                <div class="event-actions">
                  <p-button
                    [label]="event.isAttending ? 'Cancelar asistencia' : 'Asistir'"
                    [icon]="event.isAttending ? 'pi pi-times' : 'pi pi-check'"
                    [ngClass]="event.isAttending ? 'p-button-sm  p-button-outlined' : 'p-button-sm  p-button-outlined'"
                    (onClick)="toggleEventAttendance(event)"
                  />
                  <p-button
                    icon="pi pi-share-alt"
                    styleClass="p-button-sm p-button-outlined"
                    (onClick)="shareEvent(event)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Grupos -->
        <div class="groups-layout" *ngIf="activeTab() === 'groups'">
          <div class="groups-header">
            <h2>Grupos de interés</h2>
            <p-button
              icon="pi pi-plus"
              label="Crear grupo"
              styleClass="p-button-primary"
              (onClick)="showCreateGroupDialog()"
            />
          </div>
          <div class="groups-grid">
            <div class="group-card" *ngFor="let group of allGroups">
              <p-avatar [image]="group.avatar" shape="circle" size="xlarge"></p-avatar>
              <div class="group-info">
                <h3>{{ group.name }}</h3>
                <p>{{ group.description }}</p>
                <div class="group-meta">
                  <span><i class="pi pi-users"></i> {{ group.members }} miembros</span>
                  <span><i class="pi pi-tag"></i> {{ group.category }}</span>
                  <span><i class="pi pi-clock"></i> {{ getTimeAgo(group.lastActive) }}</span>
                </div>
              </div>
              <div class="group-actions">
                <p-button
                  [label]="group.isMember ? 'Unido' : 'Unirse'"
                  [icon]="group.isMember ? 'pi pi-check' : 'pi pi-users'"
                  [ngClass]="group.isMember ? 'p-button-sm p-button-outlined' : 'p-button-sm p-button-outlined'"
                  (onClick)="toggleGroupMembership(group)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Notificaciones -->
        <div class="notifications-layout" *ngIf="activeTab() === 'notifications'">
          <div class="notifications-header">
            <h2>Notificaciones</h2>
            <p-button
              label="Marcar todas como leídas"
              icon="pi pi-check-circle"
              styleClass="p-button-sm p-button-outlined"
              (onClick)="markAllNotificationsAsRead()"
            />
          </div>
          <div class="notifications-list">
            <div
              class="notification-item"
              *ngFor="let notification of notifications"
              [class.unread]="!notification.read"
            >
              <p-avatar [image]="notification.user.avatar" shape="circle"></p-avatar>
              <div class="notification-content">
                <div class="notification-header">
                  <strong>{{ notification.user.name }}</strong>
                  <span class="notification-time">{{ getTimeAgo(notification.timestamp) }}</span>
                </div>
                <p>{{ notification.content }}</p>
                <div class="notification-post" *ngIf="notification.postContent">
                  "{{ notification.postContent }}"
                </div>
                <div class="notification-actions" *ngIf="!notification.read">
                  <p-button
                    label="Marcar como leída"
                    icon="pi pi-check"
                    styleClass="p-button-sm p-button-outlined"
                    (onClick)="markNotificationAsRead(notification)"
                  />
                </div>
              </div>
              <div class="notification-icon">
                <i [class]="getNotificationIcon(notification.type)"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Diálogo de creación de publicación -->
    <p-dialog
      [(visible)]="createPostDialogVisible"
      [modal]="true"
      [style]="{width: '600px'}"
      [draggable]="false"
      [resizable]="false"
      [showHeader]="false"
      [contentStyle]="{'padding': '0'}"
      styleClass="create-post-dialog-container"
    >
      <div class="dialog-header-minimal">
        <h3 class="dialog-title-minimal">Crear publicación</h3>
        <button class="dialog-close-minimal" (click)="closeCreatePostDialog()">
          <i class="pi pi-times"></i>
        </button>
      </div>
      <div class="dialog-content-wrapper">
        <app-dynamic-form
          [config]="postFormConfig"
          (onSubmitClick)="onPostFormSubmit($event)"
          (onCancel)="closeCreatePostDialog()"
        />
      </div>
    </p-dialog>

    <!-- Visor de imágenes -->
    <p-dialog
      header="Visor de imágenes"
      [(visible)]="imageViewerVisible"
      [modal]="true"
      [style]="{width: '90vw', 'max-width': '1200px'}"
      [draggable]="false"
      [resizable]="false"
    >
      <div class="image-viewer">
        <img [src]="currentImage()" alt="Imagen" class="viewer-image" />
        <div class="viewer-controls" *ngIf="imageGallery.length > 1">
          <p-button
            icon="pi pi-chevron-left"
            styleClass="p-button-rounded p-button-text"
            (onClick)="previousImage()"
          />
          <span>{{ currentImageIndex + 1 }} / {{ imageGallery.length }}</span>
          <p-button
            icon="pi pi-chevron-right"
            styleClass="p-button-rounded p-button-text"
            (onClick)="nextImage()"
          />
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    .social-page {
      min-height: 100vh;
      background-color: var(--bitbucket-header-bg);
      transition: background-color 0.3s ease;
    }

    .dark .social-page {
      background-color: #111827;
    }

    .social-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem 2rem;
    }

    /* Tabs */
    .social-tabs {
      margin-bottom: 2rem;
    }

    .tabs-container {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--bitbucket-border);
      padding-bottom: 0.5rem;
      overflow-x: auto;
      flex-wrap: nowrap;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      white-space: nowrap;
      position: relative;
    }

    .tab-button:hover {
      background-color: var(--bitbucket-bg-hover);
      color: var(--bitbucket-text-primary);
    }

    .tab-button .nav-icon {
      font-size: 1.25rem;
    }

    .tab-button.active .nav-icon {
      font-size: 1.5rem;
    }

    .tab-button .nav-icon.filled {
      font-variation-settings: 'FILL' 1;
    }

    .tab-button .nav-icon:not(.filled) {
      font-variation-settings: 'FILL' 0;
    }

    .tab-badge {
      background: var(--red-500);
      color: white;
      font-size: 0.6rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      margin-left: 0.25rem;
    }

    /* Feed Layout */
    .feed-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
    }

    .feed-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Create Post Input */
    .create-post-input {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all var(--transition-normal);
    }

    .create-post-input:hover {
      background-color: var(--surface-hover);
      border-color: var(--surface-border);
    }

    .post-input-field {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.875rem;
      cursor: pointer;
      height: 2.25rem;
      padding: 0;
    }

    .post-input-field::placeholder {
      color: var(--text-tertiary);
    }

    .post-input-icons {
      display: flex;
      gap: 0.75rem;
      color: var(--primary-color);
      font-size: 1.125rem;
    }

    /* Post Card */
    .post-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
    }

    .post-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .post-avatar-ring {
      padding: 2px;
      border-radius: var(--radius-full);
      background: var(--instagram-gradient);
    }

    .post-avatar-ring :host ::ng-deep .p-avatar {
      border: 2px solid var(--surface-card);
    }

    .post-user-text {
      display: flex;
      flex-direction: column;
    }

    .post-username {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.8125rem;
      text-decoration: none;
      line-height: 1.3;
    }

    .post-username:hover {
      text-decoration: underline;
    }

    .post-name {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .post-more-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-tertiary);
      padding: 0.375rem;
      border-radius: var(--radius-full);
      transition: all var(--transition-fast);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .post-more-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .post-image-wrap {
      position: relative;
      width: 100%;
      background: var(--surface-hover);
    }

    .post-image {
      display: block;
      width: 100%;
      max-height: 600px;
      object-fit: contain;
      background: #000;
    }

    .post-actions {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 1rem 0.25rem;
    }

    .post-actions-left {
      display: flex;
      gap: 0.75rem;
    }

    .post-action-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-primary);
      font-size: 1.375rem;
      padding: 0.25rem;
      transition: all var(--transition-fast);
      border-radius: var(--radius-full);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .post-action-btn:hover {
      color: var(--primary-color);
      background: var(--surface-hover);
    }

    .post-likes {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 1rem 0.5rem;
    }

    .post-likes :host ::ng-deep .p-avatar-group .p-avatar {
      width: 1.25rem;
      height: 1.25rem;
      font-size: 0.5rem;
      border: 2px solid var(--surface-card);
      margin-left: -0.25rem;
    }

    .likes-text {
      font-size: 0.8125rem;
      color: var(--text-primary);
    }

    .post-caption {
      padding: 0 1rem 0.375rem;
      font-size: 0.8125rem;
      display: flex;
      gap: 0.375rem;
    }

    .caption-user {
      font-weight: 600;
      color: var(--text-primary);
      text-decoration: none;
      white-space: nowrap;
    }

    .caption-user:hover {
      text-decoration: underline;
    }

    .caption-text {
      color: var(--text-primary);
    }

    .post-comments {
      padding: 0 1rem 0.375rem;
      display: flex;
      justify-content: space-between;
    }

    .comments-link {
      color: var(--text-tertiary);
      font-size: 0.8125rem;
      cursor: pointer;
    }

    .comments-link:hover {
      color: var(--text-secondary);
    }

    .comment-time {
      color: var(--text-tertiary);
      font-size: 0.75rem;
    }

    .post-comment-input {
      border-top: 1px solid var(--surface-border);
      padding: 0.5rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .comment-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text-primary);
      font-size: 0.8125rem;
    }

    .comment-input::placeholder {
      color: var(--text-tertiary);
    }

    .comment-post-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      font-weight: 600;
      cursor: pointer;
      font-size: 0.8125rem;
      opacity: 0.6;
      transition: opacity var(--transition-fast);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .comment-post-btn:hover {
      opacity: 1;
      background: var(--primary-color-light);
    }

    /* Sidebar */
    .feed-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sidebar-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1.25rem;
    }

    .dark .sidebar-card {
      background-color: var(--bitbucket-header-bg);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .sidebar-header i {
      color: var(--primary-color);
      font-size: 1.25rem;
    }

    .sidebar-header h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .trending-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .trending-item:last-child {
      border-bottom: none;
    }

    .trend-rank {
      font-weight: 600;
      color: var(--primary-color);
      font-size: 0.875rem;
    }

    .trend-info {
      flex: 1;
    }

    .trend-name {
      display: block;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .trend-posts {
      font-size: 0.7rem;
      color: var(--bitbucket-text-secondary);
    }

    .popular-pet {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .popular-pet:last-child {
      border-bottom: none;
    }

    .pet-info {
      flex: 1;
    }

    .pet-name {
      display: block;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .pet-breed {
      font-size: 0.7rem;
      color: var(--bitbucket-text-secondary);
    }

    .upcoming-event {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .upcoming-event:last-child {
      border-bottom: none;
    }

    .event-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--primary-color-light);
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      min-width: 40px;
    }

    .event-day {
      font-weight: 600;
      font-size: 1rem;
    }

    .event-month {
      font-size: 0.6rem;
      text-transform: uppercase;
      color: var(--bitbucket-text-secondary);
    }

    .event-info {
      flex: 1;
    }

    .event-title {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .event-attendees {
      font-size: 0.7rem;
      color: var(--bitbucket-text-secondary);
    }

    /* Following Layout */
    .following-layout {
      display: grid;
      grid-template-columns: 1fr;
    }

    .following-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1.5rem;
    }

    .following-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1.25rem;
    }

    .dark .following-card {
      background-color: var(--bitbucket-header-bg);
    }

    .following-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .following-header i {
      color: var(--primary-color);
      font-size: 1.25rem;
    }

    .following-header h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .following-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .following-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .following-info {
      flex: 1;
      min-width: 0;
    }

    .following-name {
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      text-decoration: none;
    }

    .following-username-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .following-detail {
      font-size: 0.7rem;
      color: var(--bitbucket-text-secondary);
      margin: 0;
      text-decoration: none;
    }

    .following-actions {
      flex-shrink: 0;
    }

    /* Events Layout */
    .events-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .events-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .events-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .events-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .event-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .dark .event-card {
      background-color: var(--bitbucket-header-bg);
    }

    .event-image {
      height: 200px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .event-category {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.7rem;
    }

    .event-content {
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
    }

    .event-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--primary-color-light);
      padding: 0.5rem;
      border-radius: 0.5rem;
      min-width: 50px;
      height: fit-content;
    }

    .event-date-badge .event-day {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .event-date-badge .event-month {
      font-size: 0.6rem;
      text-transform: uppercase;
    }

    .event-info {
      flex: 1;
    }

    .event-info h3 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }

    .event-info p {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
    }

    .event-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.7rem;
      color: var(--bitbucket-text-secondary);
    }

    .event-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .event-attendees {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .event-attendees span {
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
    }

    .event-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      justify-content: center;
    }

    /* Groups Layout */
    .groups-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .groups-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .groups-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .groups-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .group-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .dark .group-card {
      background-color: var(--bitbucket-header-bg);
    }

    .group-info {
      flex: 1;
    }

    .group-info h3 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
    }

    .group-info p {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
    }

    .group-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.7rem;
      color: var(--bitbucket-text-secondary);
    }

    .group-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .group-actions {
      flex-shrink: 0;
    }

    /* Notifications Layout */
    .notifications-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notifications-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .notification-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background-color: var(--bitbucket-header-bg);
      border: 1px solid var(--bitbucket-border);
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .dark .notification-item {
      background-color: var(--bitbucket-header-bg);
    }

    .notification-item.unread {
      border-color: var(--primary-color);
      background-color: var(--primary-color-light);
    }

    .notification-content {
      flex: 1;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .notification-header strong {
      font-size: 0.875rem;
    }

    .notification-time {
      font-size: 0.65rem;
      color: var(--bitbucket-text-secondary);
    }

    .notification-content p {
      margin: 0 0 0.25rem;
      font-size: 0.875rem;
    }

    .notification-post {
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
      padding: 0.5rem;
      background: var(--primary-color-light);
      border-radius: 0.25rem;
      margin-top: 0.25rem;
    }

    .notification-actions {
      margin-top: 0.5rem;
    }

    .notification-icon {
      font-size: 1.5rem;
      color: var(--primary-color);
    }

    /* Dialog Header Minimal */
    .dialog-header-minimal {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-card);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .dialog-title-minimal {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .dialog-close-minimal {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-tertiary);
      padding: 0.25rem;
      border-radius: var(--radius-full);
      transition: all var(--transition-fast);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .dialog-close-minimal:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .dialog-content-wrapper {
      padding: 0;
      background: var(--surface-card);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      overflow: hidden;
    }

    /* ===== FIX PARA EL MODAL DE CREACIÓN DE POST ===== */
    :host ::ng-deep .p-dialog.create-post-dialog-container {
      border-radius: var(--radius-lg) !important;
      overflow: hidden !important;
    }

    :host ::ng-deep .p-dialog.create-post-dialog-container .p-dialog-header {
      border-radius: var(--radius-lg) var(--radius-lg) 0 0 !important;
      padding: 0 !important;
      border-bottom: none !important;
    }

    :host ::ng-deep .p-dialog.create-post-dialog-container .p-dialog-content {
      border-radius: 0 0 var(--radius-lg) var(--radius-lg) !important;
      padding: 0 !important;
      background: var(--surface-card);
    }

    :host ::ng-deep .p-dialog.create-post-dialog-container .p-dialog-footer {
      border-radius: 0 0 var(--radius-lg) var(--radius-lg) !important;
      padding: 0 !important;
      border-top: none !important;
    }

    /* Resetear estilos del formulario dinámico */
    :host ::ng-deep .dialog-content-wrapper app-dynamic-form {
      display: block;
      border-radius: 0 !important;
      overflow: hidden !important;
    }

    :host ::ng-deep .dialog-content-wrapper app-dynamic-form .dynamic-form-container,
    :host ::ng-deep .dialog-content-wrapper app-dynamic-form .p-card,
    :host ::ng-deep .dialog-content-wrapper app-dynamic-form .p-card-body,
    :host ::ng-deep .dialog-content-wrapper app-dynamic-form .p-card-content {
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 1rem 1.5rem 1.5rem !important;
      background: var(--surface-card) !important;
    }

    :host ::ng-deep .dialog-content-wrapper app-dynamic-form .p-card {
      background: transparent !important;
    }

    :host ::ng-deep .dialog-content-wrapper app-dynamic-form .field {
      margin-bottom: 1rem;
    }

    :host ::ng-deep .dialog-content-wrapper app-dynamic-form .field:last-child {
      margin-bottom: 0;
    }

    :host ::ng-deep .dialog-content-wrapper app-dynamic-form .file-upload-area {
      border-radius: var(--radius-md) !important;
    }

    :host ::ng-deep .dialog-content-wrapper app-dynamic-form textarea {
      border-radius: var(--radius-md) !important;
    }

    :host ::ng-deep .dialog-content-wrapper app-dynamic-form input {
      border-radius: var(--radius-md) !important;
    }

    :host ::ng-deep .dialog-content-wrapper app-dynamic-form .form-actions {
      padding-top: 1rem !important;
      margin-top: 0.5rem !important;
      border-top: 1px solid var(--surface-border) !important;
      display: flex !important;
      justify-content: flex-end !important;
      gap: 0.5rem !important;
    }

    /* Image Viewer */
    .image-viewer {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .viewer-image {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
    }

    .viewer-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .viewer-controls span {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    .load-more-container {
      text-align: center;
      padding: 1rem 0;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .feed-layout {
        grid-template-columns: 1fr;
      }

      .feed-sidebar {
        display: none;
      }

      .following-grid {
        grid-template-columns: 1fr;
      }

      .events-grid,
      .groups-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .social-container {
        padding: 0 0.5rem 1rem;
      }

      .tabs-container {
        gap: 0.25rem;
      }

      .tab-button {
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
      }

      .tab-button span:not(.tab-badge) {
        display: none;
      }

      .event-content {
        flex-direction: column;
      }

      .event-actions {
        flex-direction: row;
      }

      .group-card {
        flex-direction: column;
        text-align: center;
      }

      .group-meta {
        justify-content: center;
      }

      .notification-item {
        flex-wrap: wrap;
      }

      .notification-icon {
        order: -1;
      }
    }
  `]
})
export class SocialPageComponent {
  private messageService = inject(MessageService);

  // Tabs
  activeTab = signal('feed');
  followersSearchQuery = signal('');

  // Loading states
  loadingMore = signal(false);

  // New post
  createPostDialogVisible = signal(false);
  newPostContent = '';
  newPostTags = '';

  // Form config for creating posts
  postFormConfig: DynamicFormConfig = {
    submitLabel: 'Publicar',
    cancelLabel: 'Cancelar',
    showCancel: false,
    fields: [
      {
        key: 'images',
        label: 'Imágenes',
        type: 'file',
        placeholder: 'Arrastra imágenes aquí para subir',
        accept: 'image/*',
        multiple: true,
        maxFileSize: 5000000
      },
      {
        key: 'content',
        label: 'Contenido',
        type: 'textarea',
        placeholder: '¿Qué estás pensando?',
        validation: { required: true, minLength: 1, maxLength: 500 },
        rows: 4
      },
      {
        key: 'tags',
        label: 'Etiquetas',
        type: 'input',
        placeholder: 'Añade etiquetas (separadas por comas)'
      }
    ]
  };

  // Comments
  newComment = '';

  // Image viewer
  imageViewerVisible = signal(false);
  imageGallery: string[] = [];
  currentImageIndex = 0;

  // Computed
  currentImage = computed(() => {
    return this.imageGallery[this.currentImageIndex] || '';
  });

  // Total members count
  totalMembers = 12543;
  totalPosts = 8976;
  activeNow = 234;
  unreadNotifications = 12;

  // Trending topics
  trendingTopics = [
    { rank: 1, name: 'Adopciones responsables', posts: 234 },
    { rank: 2, name: 'Nutrición canina', posts: 189 },
    { rank: 3, name: 'Comportamiento felino', posts: 156 },
    { rank: 4, name: 'Cuidados de invierno', posts: 123 },
    { rank: 5, name: 'Família y niños', posts: 98 },
  ];

  // Popular pets
  popularPets: Pet[] = [
    {
      id: 'p1',
      name: 'Rocky',
      avatar: 'https://i.pravatar.cc/150?img=10',
      breed: 'Golden Retriever',
      isFollowing: false,
      species: 'Perro',
      age: '3 años',
      ownerId: '1',
      ownerName: 'Carlos',
      followers: 245,
      posts: 45,
      lastActive: new Date(),
      isPublic: true
    },
    {
      id: 'p2',
      name: 'Milo',
      avatar: 'https://i.pravatar.cc/150?img=11',
      breed: 'Persa',
      isFollowing: false,
      species: 'Gato',
      age: '2 años',
      ownerId: '2',
      ownerName: 'Ana',
      followers: 189,
      posts: 32,
      lastActive: new Date(),
      isPublic: true
    },
    {
      id: 'p3',
      name: 'Luna',
      avatar: 'https://i.pravatar.cc/150?img=12',
      breed: 'Husky Siberiano',
      isFollowing: false,
      species: 'Perro',
      age: '1 año',
      ownerId: '3',
      ownerName: 'María',
      followers: 312,
      posts: 56,
      lastActive: new Date(),
      isPublic: true
    },
  ];

  // Events
  upcomingEvents: Event[] = [
    {
      id: 'e1',
      title: 'Feria de Adopciones',
      description: 'Encuentra a tu nuevo mejor amigo en esta feria de adopciones responsables.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: 'Parque Central',
      organizer: 'PetCare Foundation',
      attendees: 156,
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=300&fit=crop',
      isAttending: false,
      category: 'Adopción',
      attendeesList: [
        'https://i.pravatar.cc/150?img=1',
        'https://i.pravatar.cc/150?img=2',
        'https://i.pravatar.cc/150?img=3',
        'https://i.pravatar.cc/150?img=4',
      ]
    },
    {
      id: 'e2',
      title: 'Charla: Cuidado Dental',
      description: 'Aprende sobre la importancia del cuidado dental en perros y gatos.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: 'Centro Veterinario',
      organizer: 'Dr. Pérez',
      attendees: 89,
      image: 'https://images.unsplash.com/photo-1583511655857-1c1bb0b7dc2e?w=600&h=300&fit=crop',
      isAttending: false,
      category: 'Educación',
      attendeesList: [
        'https://i.pravatar.cc/150?img=5',
        'https://i.pravatar.cc/150?img=6',
        'https://i.pravatar.cc/150?img=7',
      ]
    }
  ];

  // Groups
  allGroups: Group[] = [
    {
      id: 'g1',
      name: 'Amigos de los Perros',
      description: 'Comunidad para amantes de los perros de todas las razas.',
      avatar: 'https://i.pravatar.cc/150?img=8',
      members: 1234,
      isMember: true,
      category: 'Perros',
      lastActive: new Date()
    },
    {
      id: 'g2',
      name: 'Gatos y Más',
      description: 'Todo sobre el fascinante mundo de los gatos.',
      avatar: 'https://i.pravatar.cc/150?img=9',
      members: 876,
      isMember: false,
      category: 'Gatos',
      lastActive: new Date()
    },
    {
      id: 'g3',
      name: 'Família Exóticas',
      description: 'Comparte experiencias con mascotas no convencionales.',
      avatar: 'https://i.pravatar.cc/150?img=10',
      members: 345,
      isMember: false,
      category: 'Exóticos',
      lastActive: new Date()
    }
  ];

  // Following pets
  followingPets = signal<Pet[]>([
    {
      id: '1',
      name: 'Max',
      avatar: 'https://i.pravatar.cc/150?img=10',
      species: 'Perro',
      breed: 'Golden Retriever',
      age: '3 años',
      isFollowing: true,
      ownerId: '1',
      ownerName: 'Carlos',
      followers: 245,
      posts: 45,
      lastActive: new Date(),
      isPublic: true
    },
    {
      id: '2',
      name: 'Luna',
      avatar: 'https://i.pravatar.cc/150?img=11',
      species: 'Gato',
      breed: 'Persa',
      age: '2 años',
      isFollowing: true,
      ownerId: '2',
      ownerName: 'Ana',
      followers: 189,
      posts: 32,
      lastActive: new Date(),
      isPublic: true
    }
  ]);

  // Following users
  followingUsers = signal<CommunityUser[]>([
    {
      id: '1',
      name: 'Carlos Ruiz',
      avatar: 'https://i.pravatar.cc/150?img=3',
      username: '@carlos_pets',
      userId: '2',
      pets: 2,
      level: 8,
      isFollowing: true,
      followers: 1200,
      following: 345,
      posts: 67,
      joinedDate: new Date('2023-01-15'),
      location: 'Madrid, España',
      bio: 'Amante de los perros y la naturaleza',
      achievements: ['Top Contributor', 'Pet Lover'],
      isVerified: true
    },
    {
      id: '2',
      name: 'Luis Gómez',
      avatar: 'https://i.pravatar.cc/150?img=5',
      username: '@luis_doglover',
      userId: '3',
      pets: 1,
      level: 12,
      isFollowing: true,
      followers: 856,
      following: 123,
      posts: 45,
      joinedDate: new Date('2023-03-20'),
      location: 'Barcelona, España',
      bio: 'Dedicated to dog training',
      achievements: ['Trainer Expert', 'Weekend Hero'],
      isVerified: false
    }
  ]);

  // Followers users
  followersUsers = signal<CommunityUser[]>([
    {
      id: '3',
      name: 'María López',
      avatar: 'https://i.pravatar.cc/150?img=7',
      username: '@maria_pets',
      userId: '4',
      pets: 1,
      level: 10,
      isFollowing: false,
      followers: 1500,
      following: 234,
      posts: 89,
      joinedDate: new Date('2023-02-10'),
      location: 'Valencia, España',
      bio: 'Cat lover and rescuer',
      achievements: ['Cat Whisperer', 'Rescue Hero'],
      isVerified: true
    },
    {
      id: '4',
      name: 'Elena Sánchez',
      avatar: 'https://i.pravatar.cc/150?img=6',
      username: '@elena_catmom',
      userId: '5',
      pets: 2,
      level: 7,
      isFollowing: false,
      followers: 980,
      following: 456,
      posts: 34,
      joinedDate: new Date('2023-04-01'),
      location: 'Sevilla, España',
      bio: 'Mom of two amazing cats',
      achievements: ['New Member'],
      isVerified: false
    }
  ]);

  // Posts
  communityPosts = signal<CommunityPost[]>([
    {
      id: '1',
      user: {
        name: 'Carlos Ruiz',
        username: '@carlos_pets',
        avatar: 'https://i.pravatar.cc/150?img=3',
        userId: '2',
        isVerified: true
      },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      content: 'Acabo de adoptar un nuevo perrito llamado Max. Es un Golden Retriever de 3 años. ¡Estoy muy feliz! ¿Alguien tiene consejos para la adaptación?',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
      likes: 42,
      comments: 12,
      shares: 5,
      liked: false,
      saved: false,
      tags: ['adopcion', 'goldenretriever', 'nuevomascota'],
      type: 'milestone',
      petMention: [
        { id: '1', name: 'Max', avatar: 'https://i.pravatar.cc/150?img=10' }
      ]
    },
    {
      id: '2',
      user: {
        name: 'Ana Martínez',
        username: '@ana_amazon',
        avatar: 'https://i.pravatar.cc/150?img=4',
        userId: '2',
        isVerified: true
      },
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      content: '¡Nueva actualización disponible en la app! Ahora puedes programar citas veterinarias directamente desde la aplicación. Además, hemos añadido un sistema de recordatorios para medicamentos.',
      imageGallery: [
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=300&fit=crop',
        'https://images.unsplash.com/photo-1583511655857-1c1bb0b7dc2e?w=600&h=300&fit=crop'
      ],
      likes: 89,
      comments: 23,
      shares: 15,
      liked: true,
      saved: true,
      tags: ['actualizacion', 'tecnologia', 'veterinaria'],
      type: 'update'
    },
    {
      id: '3',
      user: {
        name: 'Luis Gómez',
        username: '@luis_doglover',
        avatar: 'https://i.pravatar.cc/150?img=5',
        userId: '3',
        isVerified: false
      },
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      content: 'Estoy buscando recomendaciones para un buen entrenador de perros en la zona de Barcelona. Mi perro Rocky necesita ayuda con la socialización.',
      likes: 34,
      comments: 18,
      shares: 8,
      liked: false,
      saved: false,
      tags: ['entrenamiento', 'barcelona', 'socializacion'],
      type: 'question',
      petMention: [
        { id: 'p1', name: 'Rocky', avatar: 'https://i.pravatar.cc/150?img=12' }
      ]
    }
  ]);

  // Comments
  postComments: { [key: string]: Comment[] } = {
    '1': [
      {
        id: 'c1',
        user: {
          name: 'María López',
          avatar: 'https://i.pravatar.cc/150?img=7',
          username: '@maria_pets',
          userId: '4'
        },
        content: '¡Felicidades! Los primeros días son importantes. Te recomiendo darle mucho amor y paciencia.',
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        likes: 5,
        liked: false
      },
      {
        id: 'c2',
        user: {
          name: 'Elena Sánchez',
          avatar: 'https://i.pravatar.cc/150?img=6',
          username: '@elena_catmom',
          userId: '5'
        },
        content: '¡Qué hermoso! Asegúrate de tener todos los accesorios necesarios. ¡Mucha suerte!',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        likes: 3,
        liked: true
      }
    ],
    '2': [
      {
        id: 'c3',
        user: {
          name: 'Carlos Ruiz',
          avatar: 'https://i.pravatar.cc/150?img=3',
          username: '@carlos_pets',
          userId: '2'
        },
        content: 'Excelente actualización. La funcionalidad de recordatorios es justo lo que necesitaba.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        likes: 7,
        liked: false
      }
    ],
    '3': [
      {
        id: 'c4',
        user: {
          name: 'Ana Martínez',
          avatar: 'https://i.pravatar.cc/150?img=4',
          username: '@ana_amazon',
          userId: '2'
        },
        content: 'Te recomiendo a Juan Pérez en el centro de Barcelona. Hace un trabajo excelente.',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        likes: 4,
        liked: false
      }
    ]
  };

  // Notifications
  notifications: Notification[] = [
    {
      id: 'n1',
      type: 'like',
      user: {
        name: 'María López',
        avatar: 'https://i.pravatar.cc/150?img=7',
        username: '@maria_pets',
        userId: '4'
      },
      content: 'le ha dado me gusta a tu publicación',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      read: false,
      postId: '1',
      postContent: 'Acabo de adoptar un nuevo perrito...'
    },
    {
      id: 'n2',
      type: 'comment',
      user: {
        name: 'Elena Sánchez',
        avatar: 'https://i.pravatar.cc/150?img=6',
        username: '@elena_catmom',
        userId: '5'
      },
      content: 'ha comentado tu publicación',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      read: false,
      postId: '1',
      postContent: '¡Felicidades! Los primeros días...'
    },
    {
      id: 'n3',
      type: 'follow',
      user: {
        name: 'Luis Gómez',
        avatar: 'https://i.pravatar.cc/150?img=5',
        username: '@luis_doglover',
        userId: '3'
      },
      content: 'ha comenzado a seguirte',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true
    },
    {
      id: 'n4',
      type: 'achievement',
      user: {
        name: 'Sistema PetCare',
        avatar: 'https://i.pravatar.cc/150?img=1',
        username: '@petcare',
        userId: 'system'
      },
      content: '¡Has alcanzado el nivel 10! Sigue compartiendo contenido para subir de nivel.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      read: false
    }
  ];

  filteredFeedPosts = computed(() => {
    return this.communityPosts().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  getPostComments(postId: string): Comment[] {
    return this.postComments[postId] || [];
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) return date.toLocaleDateString();
    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'hace un momento';
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'like': 'pi pi-heart-fill',
      'comment': 'pi pi-comment',
      'follow': 'pi pi-user-plus',
      'mention': 'pi pi-at',
      'achievement': 'pi pi-star-fill'
    };
    return icons[type] || 'pi pi-bell';
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  toggleLike(post: CommunityPost) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    if (post.liked) {
      this.messageService.add({
        severity: 'success',
        summary: 'Me gusta',
        detail: 'Te gusta esta publicación'
      });
    }
  }

  toggleSavePost(post: CommunityPost) {
    post.saved = !post.saved;
    this.messageService.add({
      severity: 'info',
      summary: post.saved ? 'Guardado' : 'Eliminado',
      detail: post.saved ? 'Publicación guardada en tu biblioteca' : 'Publicación eliminada de tu biblioteca'
    });
  }

  toggleFollow(user: CommunityUser) {
    user.isFollowing = !user.isFollowing;
    this.messageService.add({
      severity: 'success',
      summary: user.isFollowing ? 'Siguiendo' : 'Dejaste de seguir',
      detail: `${user.isFollowing ? 'Ahora sigues a' : 'Ya no sigues a'} ${user.name}`
    });
  }

  toggleFollowPet(pet: Pet) {
    pet.isFollowing = !pet.isFollowing;
    this.messageService.add({
      severity: 'success',
      summary: pet.isFollowing ? 'Siguiendo' : 'Dejaste de seguir',
      detail: `${pet.isFollowing ? 'Ahora sigues a' : 'Ya no sigues a'} ${pet.name}`
    });
  }

  toggleEventAttendance(event: Event) {
    event.isAttending = !event.isAttending;
    event.attendees += event.isAttending ? 1 : -1;
    this.messageService.add({
      severity: 'success',
      summary: event.isAttending ? 'Asistirás' : 'Cancelado',
      detail: event.isAttending ? `Te has inscrito a ${event.title}` : `Has cancelado tu asistencia a ${event.title}`
    });
  }

  toggleGroupMembership(group: Group) {
    group.isMember = !group.isMember;
    group.members += group.isMember ? 1 : -1;
    this.messageService.add({
      severity: 'success',
      summary: group.isMember ? 'Unido' : 'Saliste',
      detail: group.isMember ? `Te has unido a ${group.name}` : `Has salido de ${group.name}`
    });
  }

  shareEvent(event: Event) {
    this.messageService.add({
      severity: 'info',
      summary: 'Compartido',
      detail: `Evento ${event.title} compartido`
    });
  }

  closeCreatePostDialog() {
    this.createPostDialogVisible.set(false);
    this.newPostContent = '';
    this.newPostTags = '';
  }

  showCreatePostDialog() {
    this.createPostDialogVisible.set(true);
  }

  showCreateEventDialog() {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La creación de eventos estará disponible próximamente'
    });
  }

  showCreateGroupDialog() {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La creación de grupos estará disponible próximamente'
    });
  }

  onPostFormSubmit(formData: any) {
    const content = formData.content || '';
    const tags = formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [];
    const uploadedFiles = formData.files || [];

    if (!content.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contenido vacío',
        detail: 'Por favor escribe algo para publicar'
      });
      return;
    }

    const newPost: CommunityPost = {
      id: 'p' + Date.now(),
      user: {
        name: 'Usuario Actual',
        username: '@usuario_actual',
        avatar: 'https://i.pravatar.cc/150?img=1',
        userId: 'current',
        isVerified: true
      },
      timestamp: new Date(),
      content: content,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      saved: false,
      tags: tags
    };

    if (uploadedFiles && uploadedFiles.length > 0) {
      const imageUrls = uploadedFiles.map((file: any) => file.objectURL || file);
      if (imageUrls.length === 1) {
        newPost.image = imageUrls[0];
      } else {
        newPost.imageGallery = imageUrls;
      }
    }

    this.communityPosts.update(posts => [newPost, ...posts]);
    this.totalPosts += 1;

    this.closeCreatePostDialog();

    this.messageService.add({
      severity: 'success',
      summary: 'Publicado',
      detail: 'Tu publicación ha sido compartida con la comunidad'
    });
  }

  openImageViewer(images: string[], index: number) {
    this.imageGallery = images;
    this.currentImageIndex = index;
    this.imageViewerVisible.set(true);
  }

  nextImage() {
    if (this.currentImageIndex < this.imageGallery.length - 1) {
      this.currentImageIndex++;
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  loadMorePosts() {
    this.loadingMore.set(true);
    setTimeout(() => {
      const morePosts: CommunityPost[] = [
        {
          id: 'extra' + Date.now(),
          user: {
            name: 'Usuario Ejemplo',
            username: '@ejemplo',
            avatar: 'https://i.pravatar.cc/150?img=13',
            userId: 'example'
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          content: 'Esta es una publicación adicional generada al cargar más contenido. La comunidad está creciendo cada día.',
          likes: 15,
          comments: 3,
          shares: 2,
          liked: false,
          saved: false,
          tags: ['comunidad', 'crecimiento']
        }
      ];
      this.communityPosts.update(posts => [...posts, ...morePosts]);
      this.loadingMore.set(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Cargado',
        detail: 'Nuevas publicaciones añadidas al feed'
      });
    }, 1000);
  }

  markAllNotificationsAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadNotifications = 0;
    this.messageService.add({
      severity: 'success',
      summary: 'Notificaciones',
      detail: 'Todas las notificaciones han sido marcadas como leídas'
    });
  }

  markNotificationAsRead(notification: Notification) {
    notification.read = true;
    this.unreadNotifications = this.notifications.filter(n => !n.read).length;
  }
}
