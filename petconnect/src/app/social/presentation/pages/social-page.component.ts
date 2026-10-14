import { Component, signal, computed, inject, OnInit, effect, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { ProgressBarModule } from 'primeng/progressbar';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { TabsComponent, Tab } from '../../../shared/presentation/components/tabs/tabs.component';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';
import { PostFeedComponent, PostItem } from '../../../shared/presentation/components/post-feed/post-feed.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { CloudinaryService, CloudinaryUploadResponse } from '../../../shared/infrastructure/services/cloudinary.service';
import { SocialService, PostResponse, EventResponse, GroupResponse, NotificationResponse, TrendingTopicResponse, FollowResponse, UserProfileResponse, PageResponse } from '../../infrastructure/services/social.service';
import { LikeService } from '../../../shared/infrastructure/services/like.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  likeAvatars?: string[];
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
    PostFeedComponent,
    ProgressBarModule,
    TabsComponent,
    ModalComponent,
    TranslocoModule,
  ],
  providers: [MessageService],
  template: `
    <div class="social-page">
      <div class="social-container">
        <header class="page-heading-card">
          <div class="page-heading-copy">
            <h1>{{ 'breadcrumb.social' | transloco }}</h1>
          </div>
        </header>

        <!-- Tabs -->
        <app-tabs
          [tabs]="socialTabs()"
          [activeTab]="activeTab()"
          (tabChange)="onTabChange($event)"
        />

        <!-- Loading Progress Bar -->
        @if (loading() || loadingMore()) {
          <div class="loading-overlay">
            <p-progressBar mode="indeterminate" [style]="{'height': '4px'}" />
          </div>
        }

        <!-- Mi Tablón -->
        <!-- Loading state is now handled by PostFeedComponent with Skeleton -->
        <div class="feed-layout" *ngIf="activeTab() === 'feed'">
          <div class="feed-column">
            <div class="create-post-input" (click)="showCreatePostDialog()">
              <p-avatar [image]="currentUserAvatar()" shape="circle" size="normal"></p-avatar>
              <input
                type="text"
                placeholder="{{ 'social.whatsOnYourMind' | transloco }}"
                class="post-input-field"
                readonly
              />
              <div class="post-input-icons">
                <i class="pi pi-image"></i>
                <i class="pi pi-smile"></i>
              </div>
            </div>

            <app-post-feed
              [posts]="postItems()"
              [loading]="loading()"
              [currentUserId]="currentUserId()"
              (likeToggled)="onLikeToggled($event)"
              (saveToggled)="onSaveToggled($event)"
              (commentsChanged)="onCommentsChanged($event)"
            />

            <div class="load-more-container">
              <p-button
                label="{{ 'social.loadMore' | transloco }}"
                icon="pi pi-spin pi-spinner"
                styleClass="p-button-outlined"
                (onClick)="loadMorePosts()"
                [loading]="loadingMore()"
              />
            </div>

            <!-- Infinite scroll sentinel: triggers loadMorePosts on scroll -->
            <div #feedAnchor class="feed-sentinel"></div>
          </div>

          <div class="feed-sidebar">
            <div class="sidebar-card">
              <div class="sidebar-header">
                <h3>{{ 'social.trending' | transloco }}</h3>
              </div>
              <div class="trend-item" *ngFor="let trend of trendingTopics()">
                <span class="trend-category">#{{ trend.rank }} {{ 'social.trend' | transloco }}</span>
                <span class="trend-name">{{ trend.name }}</span>
                <span class="trend-posts">{{ trend.posts }} {{ 'social.posts' | transloco }}</span>
              </div>
            </div>

            <div class="sidebar-card">
              <div class="sidebar-header">
                <h3>{{ 'social.popularFamily' | transloco }}</h3>
              </div>
              <div class="popular-pet" *ngFor="let pet of popularPets()">
                <p-avatar [image]="pet.avatar" shape="circle"></p-avatar>
                <div class="pet-info">
                  <span class="pet-name">{{ pet.name }}</span>
                  <span class="pet-breed">{{ pet.breed }}</span>
                </div>
                <p-button
                  [label]="pet.isFollowing ? ('social.following' | transloco) : ('social.follow' | transloco)"
                  [icon]="pet.isFollowing ? 'pi pi-user-minus' : 'pi pi-user-plus'"
                  styleClass="p-button-sm  p-button-outlined"
                  [ngClass]="pet.isFollowing ? 'p-button-sm  p-button-outlined' : 'p-button-sm p-button-outlined' "
                  (onClick)="toggleFollowPet(pet)"
                />
              </div>
            </div>

            <div class="sidebar-card">
              <div class="sidebar-header">
                <h3>{{ 'social.upcomingEvents' | transloco }}</h3>
              </div>
              <a class="events-link" routerLink="/events">{{ 'home.seeAll' | transloco }} <i class="pi pi-arrow-right" aria-hidden="true"></i></a>
            </div>
          </div>
        </div>

        <!-- Siguiendo -->
        <div class="following-layout" *ngIf="activeTab() === 'following'">
          <div class="following-grid">
            <div class="following-card">
              <div class="following-header">
                <h3>{{ 'social.familyIFollow' | transloco }} ({{ followingPets().length }})</h3>
              </div>
              <div class="following-list">
                <div class="following-item" *ngFor="let pet of followingPets()">
                  <p-avatar [image]="pet.avatar" shape="circle" size="large"></p-avatar>
                  <div class="following-info">
                    <a [routerLink]="'/profile/pet/' + pet.id" class="following-name">{{ pet.name }}</a>
                    <p class="following-detail">{{ pet.species }} · {{ pet.breed }}</p>
                    <p class="following-detail">{{ pet.age }} · {{ pet.posts }} {{ 'social.posts' | transloco }}</p>
                  </div>
                  <div class="following-actions">
                    <button
                      class="follow-btn following"
                      (click)="toggleFollowPet(pet)"
                    >
                      <i class="pi pi-check"></i>
                      {{ 'social.following' | transloco }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="following-card">
              <div class="following-header">
                <h3>{{ 'social.usersIFollow' | transloco }} ({{ followingUsers().length }})</h3>
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
                    <p class="following-detail">{{ user.pets }} {{ 'social.pets' | transloco }} · {{ user.followers }} {{ 'social.followers' | transloco }}</p>
                  </div>
                  <div class="following-actions">
                    <button
                      class="follow-btn following"
                      (click)="toggleFollow(user)"
                    >
                      <i class="pi pi-check"></i>
                      {{ 'social.following' | transloco }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="following-card">
              <div class="following-header">
                <h3>{{ 'social.followersYou' | transloco }} ({{ followersUsers().length }})</h3>
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
                    <p class="following-detail">{{ user.pets }} {{ 'social.pets' | transloco }} · {{ user.followers }} {{ 'social.followers' | transloco }}</p>
                  </div>
                  <div class="following-actions">
                    <button
                      class="follow-btn"
                      [class.following]="user.isFollowing"
                      (click)="toggleFollow(user)"
                    >
                      <i [class]="user.isFollowing ? 'pi pi-check' : 'pi pi-user-plus'"></i>
                      {{ user.isFollowing ? ('social.following' | transloco) : ('social.follow' | transloco) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Grupos -->
        <div class="groups-layout" *ngIf="activeTab() === 'groups'">
          <div class="groups-header">
            <h2>{{ 'social.interestGroups' | transloco }}</h2>
            <p-button
              icon="pi pi-plus"
              label="{{ 'social.createGroup' | transloco }}"
              styleClass="p-button-primary"
              (onClick)="showCreateGroupDialog()"
            />
          </div>
          <div class="groups-grid">
            <div class="group-card" *ngFor="let group of allGroups()">
              <p-avatar [image]="group.avatar" shape="circle" size="xlarge"></p-avatar>
              <div class="group-info">
                <h3>{{ group.name }}</h3>
                <p>{{ group.description }}</p>
                <div class="group-meta">
                  <span><i class="pi pi-users"></i> {{ group.members }} {{ 'social.members' | transloco }}</span>
                  <span><i class="pi pi-tag"></i> {{ group.category }}</span>
                  <span><i class="pi pi-clock"></i> {{ getTimeAgo(group.lastActive) }}</span>
                </div>
              </div>
              <div class="group-actions">
                <p-button
                  [label]="group.isMember ? ('social.joined' | transloco) : ('social.join' | transloco)"
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
            <h2>{{ 'social.notifications' | transloco }}</h2>
            <p-button
              label="{{ 'social.markAllRead' | transloco }}"
              icon="pi pi-check-circle"
              styleClass="p-button-sm p-button-outlined"
              (onClick)="markAllNotificationsAsRead()"
            />
          </div>
          <div class="notifications-list">
            <div
              class="notification-item"
              *ngFor="let notification of notifications()"
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
                    label="{{ 'social.markRead' | transloco }}"
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
    <app-modal
      [visible]="createPostDialogVisible()"
      [style]="{width: '600px'}"
      [draggable]="false"
      [resizable]="false"
      [showHeader]="false"
      [contentStyle]="{'padding': '0'}"
      [noPadding]="true"
      [showCancel]="false"
      [showConfirm]="false"
      styleClass="create-post-dialog-container"
      (onHide)="closeCreatePostDialog()"
    >
      <div class="dialog-header-minimal">
        <h3 class="dialog-title-minimal">{{ 'social.createPost' | transloco }}</h3>
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
    </app-modal>

    <!-- Visor de imágenes -->
    <app-modal
      [header]="'social.imageViewer' | transloco"
      [visible]="imageViewerVisible()"
      [style]="{width: '90vw', 'max-width': '1200px'}"
      [draggable]="false"
      [resizable]="false"
      [showCancel]="false"
      [showConfirm]="false"
      (onHide)="imageViewerVisible.set(false)"
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
    </app-modal>
  `,
  styles: [`
    .social-page {
      min-height: 100vh;
      background-color: var(--surface-bg);
      transition: background-color 0.3s ease;
    }

    .social-container {
      max-width: var(--max-page-width);
      margin: 0 auto;
      padding: 0 1rem 2rem;
    }

    /* Loading */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
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

    /* Infinite scroll sentinel */
    .feed-sentinel {
      height: 1px;
      width: 100%;
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

    .events-link {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      color: var(--primary-color);
      font-size: .8125rem;
      font-weight: 600;
      text-decoration: none;
    }

    .trend-item {
      padding: 0.75rem;
      background: var(--surface-hover);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      margin-bottom: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .trend-item:last-child {
      margin-bottom: 0;
    }

    .trend-item:hover {
      background: var(--surface-hover);
      transform: translateX(2px);
    }

    .trend-category {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .trend-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .trend-posts {
      font-size: 0.75rem;
      color: var(--text-secondary);
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

    /* Follow button - modern minimal style */
    .follow-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid var(--surface-border);
      background: transparent;
      color: var(--text-primary);
      flex-shrink: 0;
      line-height: 1;
    }

    .follow-btn:hover {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--on-primary);
    }

    .follow-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .follow-btn:active {
      transform: scale(0.97);
    }

    .follow-btn.following {
      background: var(--surface-card);
      border-color: var(--surface-border);
      color: var(--text-secondary);
    }

    .follow-btn.following:hover {
      border-color: var(--danger-color);
      color: var(--danger-color);
      background: var(--danger-color-light);
    }

    .follow-btn.following:hover i {
      color: var(--danger-color);
    }

    .follow-btn i {
      font-size: 0.8125rem;
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
export class SocialPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private messageService = inject(MessageService);
  private transloco = inject(TranslocoService);
  private authService = inject(AuthService);
  private cloudinaryService = inject(CloudinaryService);
  private socialService = inject(SocialService);
  private likeService = inject(LikeService);
  private http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  // Loading state
  loading = signal(false);
  loadingMore = signal(false);

  // Pagination state (client-side: the feed endpoint returns a plain array)
  private readonly pageSize = 10;
  private appendMode = false;
  currentPage = signal(0);
  isLastPage = signal(false);

  // Infinite scroll sentinel (see template #feedAnchor)
  @ViewChild('feedAnchor') feedAnchor!: ElementRef<HTMLElement>;
  private intersectionObserver: IntersectionObserver | null = null;

  // Current user data
  currentUserId = signal('');
  currentUserName = signal('Usuario');
  currentUserAvatar = signal('https://i.pravatar.cc/150?img=1');
  currentUserUsername = signal('@usuario');

  // Tabs
  activeTab = signal('feed');
  followersSearchQuery = signal('');

  // New post
  createPostDialogVisible = signal(false);
  newPostContent = '';
  newPostTags = '';

  // Form config for creating posts (getter para reflejar el idioma activo)
  get postFormConfig(): DynamicFormConfig {
    return {
      submitLabel: this.transloco.translate('social.form.submit'),
      cancelLabel: this.transloco.translate('social.form.cancel'),
      showCancel: false,
      fields: [
        {
          key: 'images',
          label: this.transloco.translate('social.form.images'),
          type: 'file',
          placeholder: this.transloco.translate('social.form.imagesPlaceholder'),
          accept: 'image/*',
          multiple: true,
          maxFileSize: 5000000
        },
        {
          key: 'content',
          label: this.transloco.translate('social.form.content'),
          type: 'textarea',
          placeholder: this.transloco.translate('social.whatsOnYourMind'),
          validation: { required: true, minLength: 1, maxLength: 500 },
          rows: 4
        },
        {
          key: 'tags',
          label: this.transloco.translate('social.form.tags'),
          type: 'input',
          placeholder: this.transloco.translate('social.form.tagsPlaceholder'),
          validation: {
            pattern: '^([#@][a-zA-Z0-9_]+)(\\s*,\\s*[#@][a-zA-Z0-9_]+)*$',
            customMessage: this.transloco.translate('social.form.tagsMessage')
          }
        }
      ]
    };
  }

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
  unreadNotifications = 0;

  // Trending topics (from backend)
  trendingTopics = signal<{ rank: number; name: string; posts: number }[]>([]);

  // Popular pets (from backend)
  popularPets = signal<Pet[]>([]);

  // Events (from backend)
  allEvents = signal<Event[]>([]);
  upcomingEvents = signal<Event[]>([]);

  // Groups (from backend)
  allGroups = signal<Group[]>([]);

  // Following pets
  followingPets = signal<Pet[]>([]);

  // Following users
  followingUsers = signal<CommunityUser[]>([]);

  // Followers users
  followersUsers = signal<CommunityUser[]>([]);

  // Posts (from backend)
  communityPosts = signal<CommunityPost[]>([]);

  // Comments
  postComments: { [key: string]: Comment[] } = {};

  // Notifications (from backend)
  notifications = signal<Notification[]>([]);

  // Computed
  filteredFeedPosts = computed(() => {
    return this.communityPosts().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  // Convert CommunityPost[] to PostItem[] for the shared component
  postItems = computed((): PostItem[] => {
    return this.filteredFeedPosts().map(post => ({
      id: post.id,
      user: {
        name: post.user.name,
        avatar: post.user.avatar,
        username: post.user.username,
        userId: post.user.userId
      },
      image: post.image || '',
      caption: post.content,
      likes: post.likes,
      comments: post.comments,
      liked: post.liked,
      saved: post.saved,
      likeAvatars: post.likeAvatars,
      timestamp: post.timestamp
    }));
  });

  ngOnInit(): void {
    this.initializeCurrentUser();
    this.loadAllData();
  }

  private initializeCurrentUser(): void {
    const currentUser = this.authService.user();
    if (currentUser) {
      // user.id is the authUserId - the unique identifier for the user
      this.currentUserId.set(currentUser.id);
      this.currentUserName.set(`${currentUser.firstName} ${currentUser.lastName}`);
      this.currentUserAvatar.set(currentUser.avatarUrl || 'https://i.pravatar.cc/150?img=1');
      this.currentUserUsername.set(`@${currentUser.firstName.toLowerCase()}_${currentUser.id.substring(0, 6)}`);
    }
  }

  private loadAllData(): void {
    this.loading.set(true);

    // Load all data in parallel
    this.loadPosts();
    this.loadGroups();
    this.loadTrendingTopics();
    this.loadNotifications();
    this.loadFollowingData();

    // Set loading to false after a short delay (data will be populated as it arrives)
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);
  }

  private loadFollowingData(): void {
    const userId = this.currentUserId();
    if (!userId) return;

    // Load following users
    this.socialService.getFollowing(userId).subscribe({
      next: (following) => {
        // Fetch real user profiles for each following relationship
        const profileRequests = following.map(f =>
          this.socialService.getProfileByAuthUserId(f.followingId).pipe(
            catchError(() => of(null))
          )
        );

        if (profileRequests.length > 0) {
          forkJoin(profileRequests).subscribe({
            next: (profiles) => {
              const validProfiles = profiles.filter((p): p is UserProfileResponse => p !== null);
              this.followingUsers.set(
                validProfiles.map((profile) => ({
                    id: profile.id,
                    name: `${profile.firstName} ${profile.lastName}`,
                    avatar: profile.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                    username: `@${profile.firstName.toLowerCase()}_${profile.authUserId.substring(0, 6)}`,
                    userId: profile.authUserId,
                    pets: 0,
                    level: 1,
                    isFollowing: true,
                    followers: 0,
                    following: 0,
                    posts: 0,
                    joinedDate: new Date(),
                    isVerified: false
                  }))
              );
              // Log warning for profiles not found
              const notFoundCount = following.length - validProfiles.length;
              if (notFoundCount > 0) {
                console.warn(`${notFoundCount} perfiles de usuarios seguidos no encontrados`);
              }
            },
            error: (error) => {
              console.error('Error loading following profiles:', error);
            }
          });
        } else {
          this.followingUsers.set([]);
        }
      },
      error: (error) => {
        console.error('Error loading following:', error);
      }
    });

    // Load followers
    this.socialService.getFollowers(userId).subscribe({
      next: (followers) => {
        // Fetch real user profiles for each follower relationship
        const profileRequests = followers.map(f =>
          this.socialService.getProfileByAuthUserId(f.followerId).pipe(
            catchError(() => of(null))
          )
        );

        if (profileRequests.length > 0) {
          forkJoin(profileRequests).subscribe({
            next: (profiles) => {
              const validProfiles = profiles.filter((p): p is UserProfileResponse => p !== null);
              this.followersUsers.set(
                validProfiles.map((profile) => ({
                    id: profile.id,
                    name: `${profile.firstName} ${profile.lastName}`,
                    avatar: profile.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                    username: `@${profile.firstName.toLowerCase()}_${profile.authUserId.substring(0, 6)}`,
                    userId: profile.authUserId,
                    pets: 0,
                    level: 1,
                    isFollowing: false,
                    followers: 0,
                    following: 0,
                    posts: 0,
                    joinedDate: new Date(),
                    isVerified: false
                  }))
              );
              // Log warning for profiles not found
              const notFoundCount = followers.length - validProfiles.length;
              if (notFoundCount > 0) {
                console.warn(`${notFoundCount} perfiles de seguidores no encontrados`);
              }
            },
            error: (error) => {
              console.error('Error loading follower profiles:', error);
            }
          });
        } else {
          this.followersUsers.set([]);
        }
      },
      error: (error) => {
        console.error('Error loading followers:', error);
      }
    });
  }

  private loadPosts(append: boolean = false): void {
    this.appendMode = append;
    if (append) {
      this.loadingMore.set(true);
    } else {
      this.loading.set(true);
    }

    const page = append ? this.currentPage() : 0;

    this.socialService.getPublicFeed(page, this.pageSize).subscribe({
      next: (rawResponse) => {
        // El backend puede devolver un Page JSON ({content, last, totalElements})
        // o un array plano si la versión en ejecución no pagina. Normalizamos:
        const pageResponse: PageResponse<PostResponse> = Array.isArray(rawResponse)
          ? { content: rawResponse, totalElements: rawResponse.length, totalPages: 1, page: 0, size: rawResponse.length, last: true }
          : rawResponse;
        const posts = pageResponse.content ?? [];

        // Load all profiles to map author data
        this.socialService.getAllProfiles().subscribe({
          next: (profiles) => {
            // Create a map for faster lookup (keyed by authUserId)
            const profileMap = new Map(profiles.map(p => [p.authUserId, p]));

            const mappedPosts = posts.map(post =>
              this.mapPostToCommunityPost(post, profileMap)
            );

            // Load like status and avatars for each post if user is logged in
            const userId = this.currentUserId();
            if (userId && mappedPosts.length > 0) {
              const likeStatusRequests = mappedPosts.map(post =>
                this.likeService.getLikeStatus('POST', post.id, userId).pipe(
                  catchError(() => of({ liked: false, count: post.likes }))
                )
              );

              forkJoin(likeStatusRequests).subscribe({
                next: (likeStatuses) => {
                  // Update liked status and likes count
                  mappedPosts.forEach((post, index) => {
                    post.liked = likeStatuses[index].liked;
                    post.likes = likeStatuses[index].count;
                  });

                  // Load like avatars for each post (up to 3)
                  const likeAvatarsRequests = mappedPosts.map(post =>
                    this.likeService.getLikes('POST', post.id).pipe(
                      catchError(() => of([]))
                    )
                  );

                  forkJoin(likeAvatarsRequests).subscribe({
                    next: (likesArrays) => {
                      mappedPosts.forEach((post, index) => {
                        const likes = likesArrays[index] || [];
                        // Map likes to real avatar URLs using profileMap
                        post.likeAvatars = likes
                          .map(like => {
                            const profile = profileMap.get(like.userId);
                            return profile?.avatarUrl;
                          })
                          .filter((url): url is string => !!url)
                          .slice(0, 3);
                      });
                      this.applyPosts(mappedPosts, pageResponse);
                    },
                    error: () => {
                      // If avatars fail, continue without them
                      this.applyPosts(mappedPosts, pageResponse);
                    }
                  });
                },
                error: () => {
                  // If like status fails, use default values
                  this.applyPosts(mappedPosts, pageResponse);
                }
              });
            } else {
              this.applyPosts(mappedPosts, pageResponse);
            }
          },
          error: () => {
            // If profiles fail to load, use default mapping
            const mappedPosts = posts.map(post =>
              this.mapPostToCommunityPost(post, new Map())
            );
            this.applyPosts(mappedPosts, pageResponse);
          }
        });
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.loading.set(false);
        this.loadingMore.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate('social.toasts.error'),
          detail: this.transloco.translate('social.toasts.postsLoadError')
        });
      }
    });
  }

  /**
   * Stores the page of posts returned by the backend.
   * The backend paginates the feed (?page=&size=), so "Cargar más" /
   * infinite scroll triggers a new request for the next page.
   */
  private applyPosts(mappedPosts: CommunityPost[], pageResponse: PageResponse<PostResponse>): void {
    if (this.appendMode) {
      this.communityPosts.update(current => [...current, ...mappedPosts]);
    } else {
      this.communityPosts.set(mappedPosts);
    }
    this.currentPage.set(this.appendMode ? this.currentPage() + 1 : 1);
    this.isLastPage.set(pageResponse.last);
    this.totalPosts = pageResponse.totalElements;
    this.loading.set(false);
    this.loadingMore.set(false);
  }

  ngAfterViewInit(): void {
    this.setupInfiniteScroll();
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
  }

  /**
   * Wires up an IntersectionObserver on a sentinel rendered at the bottom of
   * the feed. When the sentinel comes into view the next page is loaded and
   * concatenated (infinite scroll).
   */
  private setupInfiniteScroll(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    // Reconnect in case the view was (re)rendered (e.g. after switching tabs)
    this.intersectionObserver?.disconnect();
    if (!this.feedAnchor) {
      return;
    }
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          this.activeTab() === 'feed' &&
          !this.isLastPage() &&
          !this.loadingMore()
        ) {
          this.loadMorePosts();
        }
      });
    }, { root: null, rootMargin: '200px', threshold: 0 });
    this.intersectionObserver.observe(this.feedAnchor.nativeElement);
  }

  private loadEvents(): void {
    this.socialService.getAllEvents().subscribe({
      next: (events) => {
        const mappedEvents = events.map(event => this.mapEventToEvent(event));
        this.allEvents.set(mappedEvents);
        this.upcomingEvents.set(mappedEvents.slice(0, 2));
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate('social.toasts.error'),
          detail: this.transloco.translate('social.toasts.eventsLoadError')
        });
      }
    });
  }

  private loadGroups(): void {
    this.socialService.getAllGroups().subscribe({
      next: (groups) => {
        this.allGroups.set(groups.map(group => this.mapGroupToGroup(group)));
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate('social.toasts.error'),
          detail: this.transloco.translate('social.toasts.groupsLoadError')
        });
      }
    });
  }

  private loadTrendingTopics(): void {
    this.socialService.getTrendingTopics().subscribe({
      next: (topics) => {
        // Show only top 3 trending topics
        const topTopics = topics.slice(0, 3);
        this.trendingTopics.set(topTopics.map((topic, index) => ({
          rank: index + 1,
          name: topic.name,
          posts: topic.postsCount
        })));
      },
      error: (error) => {
        console.error('Error loading trending topics:', error);
      }
    });
  }

  private loadNotifications(): void {
    const userId = this.currentUserId();
    if (userId) {
      this.socialService.getNotifications(userId).subscribe({
        next: (notifications) => {
          this.notifications.set(notifications.map(n => this.mapNotificationToNotification(n)));
          this.unreadNotifications = notifications.filter(n => !n.read).length;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
        }
      });

      this.socialService.getUnreadNotificationCount(userId).subscribe({
        next: (count) => {
          this.unreadNotifications = count;
        },
        error: (error) => {
          console.error('Error loading unread count:', error);
        }
      });
    }
  }

  private mapPostToCommunityPost(post: PostResponse, profileMap: Map<string, UserProfileResponse>): CommunityPost {
    const profile = profileMap.get(post.authorId);
    const tags = post.tags ? post.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [];
    return {
      id: post.id,
      user: {
        name: profile ? `${profile.firstName} ${profile.lastName}` : this.transloco.translate('social.defaultUser'),
        username: profile ? `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}` : '@usuario',
        avatar: profile?.avatarUrl || 'https://i.pravatar.cc/150?img=1',
        userId: post.authorId,
        isVerified: false
      },
      timestamp: new Date(post.createdAt),
      content: post.caption,
      image: post.imageUrl,
      likes: post.likesCount,
      comments: post.commentsCount,
      shares: 0,
      liked: false,
      saved: false,
      tags: tags
    };
  }

  private mapEventToEvent(event: EventResponse): Event {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.eventDate),
      location: event.location,
      organizer: this.transloco.translate('social.organizer'),
      attendees: event.attendeesCount,
      image: event.imageUrl,
      isAttending: false,
      category: event.category,
      attendeesList: []
    };
  }

  private mapGroupToGroup(group: GroupResponse): Group {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatarUrl,
      members: group.membersCount,
      isMember: false,
      category: group.category,
      lastActive: new Date()
    };
  }

  private mapNotificationToNotification(notification: NotificationResponse): Notification {
    return {
      id: notification.id,
      type: notification.type as 'like' | 'comment' | 'follow' | 'mention' | 'achievement',
      user: {
        name: this.transloco.translate('social.defaultUser'),
        avatar: 'https://i.pravatar.cc/150?img=1',
        username: '@usuario',
        userId: notification.actorId
      },
      content: notification.content,
      timestamp: new Date(notification.createdAt),
      read: notification.read,
      postId: notification.referenceId,
      postContent: ''
    };
  }

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
    if (days > 0) return this.transloco.translate(days > 1 ? 'social.time.days' : 'social.time.day', { n: days });
    if (hours > 0) return this.transloco.translate(hours > 1 ? 'social.time.hours' : 'social.time.hour', { n: hours });
    if (minutes > 0) return this.transloco.translate(minutes > 1 ? 'social.time.minutes' : 'social.time.minute', { n: minutes });
    return this.transloco.translate('social.time.moments');
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'like': 'pi pi-heart-fill',
      'comment': 'pi pi-comment',
      'follow': 'pi pi-user-plus',
      'mention': 'pi pi-at',
      'achievement': 'pi pi-star-fill',
      'ADOPTION_REQUEST': 'pi pi-heart',
      'ADOPTION_UPDATE': 'pi pi-paw'
    };
    return icons[type] || 'pi pi-bell';
  }

  // Generate a deterministic avatar URL based on userId (for likes)
  private generateAvatarFromUserId(userId: string): string {
    const hash = userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return 'https://i.pravatar.cc/150?img=' + (Math.abs(hash) % 70);
  }

  // Tabs configuration
  socialTabs = computed((): Tab[] => {
    const t = (key: string) => this.transloco.translate(key);
    return [
      { id: 'feed', label: t('social.tabs.feed'), icon: 'home', badge: this.unreadNotifications },
      { id: 'following', label: t('social.following'), icon: 'person' },
      { id: 'groups', label: t('social.tabs.groups'), icon: 'groups' },
      { id: 'notifications', label: t('social.notifications'), icon: 'notifications', badge: this.unreadNotifications },
    ];
  });

  onTabChange(tabId: string) {
    this.setActiveTab(tabId);
    if (tabId === 'feed') {
      // The feed view (and its scroll sentinel) is (re)rendered after a tab switch
      setTimeout(() => this.setupInfiniteScroll(), 0);
    }
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  onLikeToggled(postItem: PostItem): void {
    // Find the corresponding CommunityPost and update it
    const currentPosts = this.communityPosts();
    const post = currentPosts.find(p => p.id === postItem.id);
    if (post) {
      post.liked = postItem.liked;
      post.likes = postItem.likes;
      this.communityPosts.set([...currentPosts]);
    }
  }

  onSaveToggled(postItem: PostItem): void {
    const currentPosts = this.communityPosts();
    const post = currentPosts.find(p => p.id === postItem.id);
    if (post) {
      post.saved = postItem.saved;
      this.communityPosts.set([...currentPosts]);
    }
  }

  onCommentsChanged(event: { postId: string; count: number }): void {
    const currentPosts = this.communityPosts();
    const post = currentPosts.find(p => p.id === event.postId);
    if (post) {
      post.comments = event.count;
      this.communityPosts.set([...currentPosts]);
    }
  }

  toggleLike(post: CommunityPost) {
    const wasLiked = post.liked;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;

    if (post.liked) {
      this.socialService.likePost(post.id, this.currentUserId()).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate('social.toasts.liked'),
            detail: this.transloco.translate('social.toasts.likedDetail')
          });
        },
        error: () => {
          // Revert on error
          post.liked = wasLiked;
          post.likes -= post.liked ? 1 : -1;
        }
      });
    } else {
      this.socialService.unlikePost(post.id, this.currentUserId()).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'info',
            summary: this.transloco.translate('social.toasts.updated'),
            detail: this.transloco.translate('social.toasts.unlikedDetail')
          });
        },
        error: () => {
          // Revert on error
          post.liked = wasLiked;
          post.likes += post.liked ? 1 : -1;
        }
      });
    }
  }

  toggleSavePost(post: CommunityPost) {
    post.saved = !post.saved;
    this.messageService.add({
      severity: 'info',
      summary: this.transloco.translate(post.saved ? 'social.toasts.saved' : 'social.toasts.removed'),
      detail: this.transloco.translate(post.saved ? 'social.toasts.savedDetail' : 'social.toasts.removedDetail')
    });
  }

  toggleFollow(user: CommunityUser) {
    const wasFollowing = user.isFollowing;
    const currentUserId = this.currentUserId();

    if (!currentUserId) {
      this.messageService.add({
        severity: 'error',
        summary: this.transloco.translate('social.toasts.error'),
        detail: this.transloco.translate('social.toasts.loginRequiredFollow')
      });
      return;
    }

    user.isFollowing = !user.isFollowing;

    if (user.isFollowing) {
      // Follow the user
      this.socialService.followUser(currentUserId, user.userId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate('social.toasts.following'),
            detail: this.transloco.translate('social.toasts.followingDetail').replace('{name}', user.name)
          });
        },
        error: () => {
          // Revert on error
          user.isFollowing = wasFollowing;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate('social.toasts.error'),
            detail: this.transloco.translate('social.toasts.errorFollow')
          });
        }
      });
    } else {
      // Unfollow the user
      this.socialService.unfollowUser(currentUserId, user.userId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'info',
            summary: this.transloco.translate('social.toasts.unfollowed'),
            detail: this.transloco.translate('social.toasts.unfollowedDetail').replace('{name}', user.name)
          });
        },
        error: () => {
          // Revert on error
          user.isFollowing = wasFollowing;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate('social.toasts.error'),
            detail: this.transloco.translate('social.toasts.errorUnfollow')
          });
        }
      });
    }
  }

  toggleFollowPet(pet: Pet) {
    // Note: Backend doesn't support following pets, only users
    // This is a local-only functionality for now
    pet.isFollowing = !pet.isFollowing;
    this.messageService.add({
      severity: 'info',
      summary: this.transloco.translate('social.toasts.inDevelopment'),
      detail: this.transloco.translate('social.toasts.petFollowComingSoon')
    });
  }

  toggleEventAttendance(event: Event) {
    event.isAttending = !event.isAttending;
    event.attendees += event.isAttending ? 1 : -1;
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate(event.isAttending ? 'social.toasts.attending' : 'social.toasts.attendanceCancelled'),
      detail: this.transloco.translate(event.isAttending ? 'social.toasts.attendingDetail' : 'social.toasts.attendanceCancelledDetail').replace('{name}', event.title)
    });
  }

  toggleGroupMembership(group: Group) {
    group.isMember = !group.isMember;
    group.members += group.isMember ? 1 : -1;
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate(group.isMember ? 'social.toasts.joined' : 'social.toasts.left'),
      detail: this.transloco.translate(group.isMember ? 'social.toasts.joinedDetail' : 'social.toasts.leftDetail').replace('{name}', group.name)
    });
  }

  shareEvent(event: Event) {
    this.messageService.add({
      severity: 'info',
      summary: this.transloco.translate('social.toasts.shared'),
      detail: this.transloco.translate('social.toasts.sharedDetail').replace('{name}', event.title)
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
      summary: this.transloco.translate('social.toasts.inDevelopment'),
      detail: this.transloco.translate('social.toasts.eventCreationComingSoon')
    });
  }

  showCreateGroupDialog() {
    this.messageService.add({
      severity: 'info',
      summary: this.transloco.translate('social.toasts.inDevelopment'),
      detail: this.transloco.translate('social.toasts.groupCreationComingSoon')
    });
  }

  async onPostFormSubmit(formData: any) {
    const content = formData.content || '';
    const rawTags = formData.tags || '';
    const tags = rawTags.split(',').map((t: string) => t.trim()).filter((t: string) => t).join(',');
    const uploadedFiles = formData.images || [];

    if (!content.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate('social.toasts.emptyContent'),
        detail: this.transloco.translate('social.toasts.emptyContentDetail')
      });
      return;
    }

    // Get current user from AuthService
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: this.transloco.translate('social.toasts.error'),
        detail: this.transloco.translate('social.toasts.loginRequiredPost')
      });
      return;
    }

    // Get the first image file if available
    let imageFile: File | undefined;
    if (uploadedFiles && uploadedFiles.length > 0) {
      const firstFile = uploadedFiles[0];
      imageFile = firstFile.originalFile || firstFile;
    }

    // Create post in backend with image upload
    this.socialService.createPost({
      authorId: this.currentUserId(),
      caption: content,
      imageUrl: '',
      tags: tags
    }, imageFile)
      .subscribe({
        next: (createdPost) => {
          const newPost: CommunityPost = {
            id: createdPost.id,
            user: {
              name: this.currentUserName(),
              username: this.currentUserUsername(),
              avatar: this.currentUserAvatar(),
              userId: this.currentUserId(),
              isVerified: false
            },
            timestamp: new Date(createdPost.createdAt),
            content: createdPost.caption,
            image: createdPost.imageUrl || undefined,
            likes: createdPost.likesCount,
            comments: createdPost.commentsCount,
            shares: 0,
            liked: false,
            saved: false,
            tags: tags
          };

          this.communityPosts.update(posts => [newPost, ...posts]);
          this.totalPosts += 1;
          this.closeCreatePostDialog();

          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate('social.toasts.published'),
            detail: this.transloco.translate('social.toasts.publishedDetail')
          });
        },
        error: () => {
          // Fallback: add locally if API fails
          const newPost: CommunityPost = {
            id: 'p' + Date.now(),
            user: {
              name: this.currentUserName(),
              username: this.currentUserUsername(),
              avatar: this.currentUserAvatar(),
              userId: this.currentUserId(),
              isVerified: false
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

          this.communityPosts.update(posts => [newPost, ...posts]);
          this.totalPosts += 1;
          this.closeCreatePostDialog();

          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate('social.toasts.publishedOffline'),
            detail: this.transloco.translate('social.toasts.publishedOfflineDetail')
          });
        }
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

  loadMorePosts(): void {
    // Avoid overlapping requests or loading past the last page
    if (this.isLastPage() || this.loadingMore() || this.loading()) {
      return;
    }
    this.loadPosts(true);
  }

  markAllNotificationsAsRead() {
    const userId = this.currentUserId();
    if (userId) {
      this.socialService.markAllNotificationsAsRead(userId).subscribe({
        next: () => {
          this.notifications.update(n => n.map(notification => ({ ...notification, read: true })));
          this.unreadNotifications = 0;
          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate('social.toasts.notifications'),
            detail: this.transloco.translate('social.toasts.notificationsReadDetail')
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate('social.toasts.error'),
            detail: this.transloco.translate('social.toasts.notificationsError')
          });
        }
      });
    }
  }

  markNotificationAsRead(notification: Notification) {
    this.socialService.markNotificationAsRead(notification.id).subscribe({
      next: () => {
        this.notifications.update(n =>
          n.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        this.unreadNotifications = this.notifications().filter(n => !n.read).length;
      },
      error: () => {
        // Fallback: mark locally
        this.notifications.update(n =>
          n.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        this.unreadNotifications = this.notifications().filter(n => !n.read).length;
      }
    });
  }
}
