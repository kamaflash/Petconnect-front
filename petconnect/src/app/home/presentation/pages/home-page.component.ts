import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';

import {
  HomeService,
  PostPageResponse,
  PostResponse,
  UserProfileResponse,
} from '../../infrastructure/services/home.service';

import {
  Story,
  Post,
  Suggestion,
  PromoItem,
  User,
  Adoption,
  Achievement,
  UserLevel,
} from '../../infrastructure/models/home.models';

import { ProfileService } from '../../../profile/infrastructure/services/profile.service';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { LikeService } from '../../../shared/infrastructure/services/like.service';

import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import {
  PostFeedComponent,
  PostItem,
} from '../../../shared/presentation/components/post-feed/post-feed.component';

import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-home-page',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,

    ButtonModule,
    CardModule,
    TagModule,
    AvatarModule,
    AvatarGroupModule,
    InputTextModule,
    ProgressBarModule,
    SkeletonModule,

    PostFeedComponent,
    TranslocoModule,
  ],

    template: `
<div class="home-page">
      <div class="home-container">
        <!-- LEFT COLUMN -->
        <div class="left-column">
          <!-- MERCADO -->
          <div class="card-modern">
            <div class="card-header">
              <i class="pi pi-shopping-cart card-header-icon"></i>
              <span class="card-header-title"> {{ 'home.marketPlace' | transloco }} </span>
              <a routerLink="/marketplace" class="card-header-link">{{ 'home.seeAll' | transloco }}</a>
            </div>
            <div class="card-body">
              @if (loadingPromos()) {
                <div class="loading-list">
                  <p-skeleton width="100%" height="70px" styleClass="mb-2" />
                  <p-skeleton width="100%" height="70px" styleClass="mb-2" />
                </div>
              } @else {
                @for (promo of marketPromos; track promo.title) {
                  <div class="promo-item">
                    <img [src]="promo.image" [alt]="promo.title" class="promo-image" />
                    <div class="promo-content">
                      <p class="promo-title">{{ promo.title }}</p>
                      <p class="promo-desc">{{ promo.description }}</p>
                      @if (promo.tag) { <p-tag [value]="promo.tag" severity="warn"> </p-tag> }
                    </div>
                  </div>
                }
                @if (marketPromos.length === 0) {
                  <div class="empty-state">{{ 'home.noPromotions' | transloco }}</div>
                }
              }
            </div>
          </div>

          <!-- ADOPCIONES -->
          <div class="card-modern">
            <div class="card-header">
              <i class="pi pi-heart card-header-icon"></i>
              <span class="card-header-title"> {{ 'home.adoptions' | transloco }} </span>
              <a routerLink="/adoptions" class="card-header-link">{{ 'home.seeAll' | transloco }}</a>
            </div>
            <div class="card-body">
              @if (loadingAdoptions()) {
                @for (item of [1, 2, 3]; track item) {
                  <div class="skeleton-user">
                    <p-skeleton shape="circle" size="56px"> </p-skeleton>
                    <div class="skeleton-user-info">
                      <p-skeleton width="80%" height="12px"> </p-skeleton>
                      <p-skeleton width="60%" height="10px"> </p-skeleton>
                    </div>
                  </div>
                }
              } @else {
                @for (adoption of newAdoptions; track adoption.name) {
                  <div class="adoption-item">
                    <img [src]="adoption.image" [alt]="adoption.name" class="adoption-image" />
                    <div class="adoption-info">
                      <p class="adoption-name">{{ adoption.name }}</p>
                      <p class="adoption-breed">{{ adoption.breed }}</p>
                      <p-button label="{{ 'home.know' | transloco }}" (click)="openPetProfile(adoption.petId)" styleClass="p-button-sm p-button-outlined"></p-button>
                    </div>
                  </div>
                }
                @if (newAdoptions.length === 0) {
                  <div class="empty-state">{{ 'home.noAdoptions' | transloco }}</div>
                }
              }
            </div>
          </div>
        </div>

        <!-- CENTER COLUMN -->
        <div class="center-column">
          @if (loadingPosts()) {
            <div class="loading-overlay">
              <p-progressBar mode="indeterminate" [style]="{ height: '4px' }"> </p-progressBar>
            </div>
          }
          <div class="stories-card">
            <div class="stories-scroll">
              @if (loadingStories()) {
                @for (item of [1, 2, 3, 4, 5]; track item) {
                  <div class="story-item">
                    <p-skeleton shape="circle" size="56px"> </p-skeleton>
                    <p-skeleton width="50px" height="9px"> </p-skeleton>
                  </div>
                }
              } @else {
                @for (story of stories; track story.id) {
                  <a class="story-item" [routerLink]="'/profile/' + story.user.userId">
                    <div class="story-ring" [class.seen]="story.seen">
                      <p-avatar [image]="story.user.avatar" shape="circle" size="large"> </p-avatar>
                    </div>
                    <span class="story-name">{{ story.user.name }}</span>
                  </a>
                }
                @if (stories.length === 0) {
                  <div class="empty-stories">{{ 'home.noStories' | transloco }}</div>
                }
              }
            </div>
          </div>
          <app-post-feed
            [posts]="postItems()"
            [loading]="loadingPosts()"
            [currentUserId]="currentUserId()"
            (likeToggled)="onLikeToggled($event)"
            (saveToggled)="onSaveToggled($event)"
          >
          </app-post-feed>
          <div #postsLoadMoreSentinel class="posts-load-more-sentinel" aria-hidden="true"></div>
          @if (loadingMorePosts()) {
            <div class="posts-load-more" role="status" aria-label="Cargando más publicaciones">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
          }
        </div>

        <!-- RIGHT COLUMN -->
        <div class="right-column">
          <!-- A QUIEN SEGUIR (unificado) -->
          <div class="card-modern">
            <div class="card-header">
              <span class="card-header-title"> {{ 'home.whoToFollow' | transloco }} </span>
            </div>
            <div class="card-body">
              @if (peopleLoading()) {
                @for (item of [1, 2, 3]; track item) {
                  <div class="skeleton-user">
                    <p-skeleton shape="circle" size="40px"> </p-skeleton>
                    <div class="skeleton-user-info">
                      <p-skeleton width="80%" height="12px"> </p-skeleton>
                      <p-skeleton width="55%" height="10px"> </p-skeleton>
                    </div>
                  </div>
                }
              } @else {
                @for (person of peopleToFollow(); track person.userId) {
                  <div class="suggestion-item">
                    <p-avatar [image]="person.avatar" shape="circle" size="normal"> </p-avatar>
                    <div class="suggestion-info">
                      <a [routerLink]="'/profile/' + person.userId" class="suggestion-name">{{ person.name }}</a>
                      <span class="suggestion-username">{{ person.username }}</span>
                      <span class="suggestion-followers">{{ person.followers }} {{ 'home.followers' | transloco }}</span>
                    </div>
                    <button type="button" class="follow-btn" [class.following]="person.isFollowing" (click)="toggleFollow(person)">
                      <i [class]="person.isFollowing ? 'pi pi-check' : 'pi pi-user-plus'"> </i>
                      {{ person.isFollowing ? ('home.following' | transloco) : ('home.follow' | transloco) }}
                    </button>
                  </div>
                }
                @if (peopleToFollow().length === 0) {
                  <div class="empty-state">{{ 'home.noSuggestions' | transloco }}</div>
                }
              }
            </div>
          </div>

          <!-- GAMIFICACION (mini-card) -->
          <div class="card-modern">
            <div class="card-header">
              <i class="pi pi-trophy card-header-icon"></i>
              <span class="card-header-title"> {{ 'home.gamification' | transloco }} </span>
            </div>
            <div class="card-body">
              <div class="level-text">
                <span class="level-label">{{ 'home.level' | transloco }}</span>
                <span class="level-number">{{ 'home.levelNumber' | transloco: { level: userLevel.level } }}</span>
              </div>
              <div class="level-bar-wrap">
                <p-progressBar [value]="levelProgress" styleClass="level-progress-bar"></p-progressBar>
                <span class="level-xp">{{ userLevel.currentXp }} / {{ userLevel.totalXp }} {{ 'home.xp' | transloco }}</span>
              </div>
              <a routerLink="/gamification" class="card-header-link gamification-link">{{ 'home.viewGamification' | transloco }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ============================================================
       PAGE
       ============================================================ */

      .home-page {
        min-height: 100vh;
        padding: 1.5rem 0;
      }

      .posts-load-more-sentinel {
        height: 1px;
      }

      .posts-load-more {
        display: flex;
        justify-content: center;
        padding: 1rem;
        color: var(--text-secondary);
      }

      .home-container {
        margin: 0 auto;
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr) 320px;
        max-width: var(--max-page-width);
        gap: 1.5rem;
        width: 100%;
        box-sizing: border-box;
      }

      .home-heading {
        max-width: var(--max-page-width);
        margin-right: auto;
        margin-left: auto;
        width: calc(100% - 3rem);
      }

      /* ============================================================
       CARDS
       ============================================================ */

      .card-modern {
        background: var(--surface-card);
        border-radius: var(--radius-md);
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--surface-border);
      }

      .card-header-icon {
        color: var(--text-secondary);
        font-size: 1.125rem;
      }

      .card-header-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .card-header-link {
        margin-left: auto;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--primary-color);
        text-decoration: none;
        transition: opacity 0.2s ease;
      }

      .card-header-link:hover {
        opacity: 0.8;
        text-decoration: underline;
      }

      .gamification-link {
        display: inline-block;
        margin-top: 0.75rem;
      }

      .card-body {
        padding: 0.5rem 1.25rem;
      }

      /* ============================================================
       LEFT COLUMN
       ============================================================ */

      .left-column {
        display: flex;
        flex-direction: column;
      }

      /* ============================================================
       PROMOS
       ============================================================ */

      .promo-item {
        display: flex;
        gap: 0.75rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--surface-border);
      }

      .promo-item:last-child {
        border-bottom: none;
      }

      .promo-image {
        width: 56px;
        height: 56px;
        border-radius: var(--radius-sm);
        object-fit: cover;
        flex-shrink: 0;
      }

      .promo-content {
        flex: 1;
        min-width: 0;
      }

      .promo-title {
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 0.125rem 0;
        font-size: 0.8125rem;
      }

      .promo-desc {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin: 0 0 0.25rem 0;
        line-height: 1.4;
      }

      /* ============================================================
       SUGGESTIONS / VETS
       ============================================================ */

      .suggestion-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0;
        border-bottom: 1px solid var(--surface-border);
      }

      .suggestion-item:last-child {
        border-bottom: none;
      }

      .suggestion-info {
        flex: 1;
        min-width: 0;
      }

      .suggestion-name {
        display: block;
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.8125rem;
        text-decoration: none;
      }

      .suggestion-name:hover {
        color: var(--primary-color);
      }

      .suggestion-username {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: 0.0625rem;
      }

      .suggestion-followers {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: 0.0625rem;
      }

      /* ============================================================
       FOLLOW BUTTON
       ============================================================ */

      .follow-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
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
        background: var(--surface-hover);
        border-color: var(--text-secondary);
      }

      .follow-btn.following {
        background: var(--surface-card);
        border-color: var(--surface-border);
        color: var(--text-secondary);
      }

      .follow-btn.following:hover {
        border-color: #ef4444;
        color: #ef4444;
      }

      .follow-btn.following:hover i {
        color: #ef4444;
      }

      .follow-btn i {
        font-size: 0.8125rem;
      }

      /* ============================================================
       ADOPTIONS
       ============================================================ */

      .adoption-item {
        display: flex;
        gap: 0.75rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--surface-border);
        align-items: center;
      }

      .adoption-item:last-child {
        border-bottom: none;
      }

      .adoption-image {
        width: 56px;
        height: 56px;
        border-radius: var(--radius-full);
        object-fit: cover;
        flex-shrink: 0;
        border: 2px solid var(--primary-color);
      }

      .adoption-info {
        flex: 1;
        min-width: 0;
      }

      .adoption-name {
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
        font-size: 0.8125rem;
      }

      .adoption-breed {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin: 0.125rem 0 0.375rem 0;
      }

      /* ============================================================
       CENTER COLUMN
       ============================================================ */

      .center-column {
        min-width: 0;
        width: 100%;
        min-height: 0;
        overflow: visible;
      }

      /* ============================================================
       STORIES
       ============================================================ */

      .stories-card {
        background: var(--surface-card);
        border-radius: var(--radius-md);
        padding: 1rem;
        margin-bottom: 1.5rem;
      }

      .stories-scroll {
        display: flex;
        gap: 1rem;
        overflow-x: auto;
        padding: 0.25rem 0;

        scrollbar-width: none;
      }

      .stories-scroll::-webkit-scrollbar {
        display: none;
      }

      .story-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        gap: 0.375rem;

        cursor: pointer;
        flex-shrink: 0;

        text-decoration: none;

        min-width: 64px;
      }

      .story-ring {
        padding: 2px;
        border-radius: var(--radius-full);
        background: var(--instagram-gradient);
      }

      .story-ring.seen {
        background: var(--surface-border);
      }

      :host ::ng-deep .story-ring .p-avatar {
        border: 2px solid var(--surface-card);
      }

      .story-name {
        font-size: 0.6875rem;
        color: var(--text-secondary);

        max-width: 64px;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        text-align: center;
      }

      /* ============================================================
       RIGHT COLUMN
       ============================================================ */

      .right-column {
        display: flex;
        flex-direction: column;
      }

      /* ============================================================
       LEVEL
       ============================================================ */

      .level-card {
        border-radius: var(--radius-md);
        padding: 1.25rem;
        margin-bottom: 1rem;
      }

      .level-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        margin-bottom: 0.75rem;
      }

      .level-text {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .level-label {
        font-size: 0.8125rem;
        opacity: 0.85;
      }

      .level-number {
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .level-icon {
        font-size: 1.75rem;
        opacity: 0.85;
      }

      .level-bar-wrap {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      :host ::ng-deep .level-progress-bar {
        height: 6px !important;
        border-radius: var(--radius-full) !important;
      }

      :host ::ng-deep .level-progress-bar .p-progressbar {
        height: 6px;
        background: rgba(255, 255, 255, 0.25);
        border-radius: var(--radius-full);
      }

      :host ::ng-deep .level-progress-bar .p-progressbar-value {
        background: white;
        border-radius: var(--radius-full);
      }

      .level-xp {
        font-size: 0.75rem;
        opacity: 0.85;
      }

      /* ============================================================
       ACHIEVEMENTS
       ============================================================ */

      .achievement-item {
        display: flex;
        gap: 0.75rem;

        padding: 0.75rem 0;

        border-bottom: 1px solid var(--surface-border);
      }

      .achievement-item:last-child {
        border-bottom: none;
      }

      .achievement-icon {
        width: 44px;
        height: 44px;

        border-radius: var(--radius-full);

        background: var(--surface-hover);

        display: flex;
        align-items: center;
        justify-content: center;

        color: var(--text-tertiary);

        font-size: 1.25rem;

        flex-shrink: 0;

        border: 2px solid var(--surface-border);
      }

      .achievement-icon.unlocked {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-color-hover));

        color: white;
        border-color: transparent;
      }

      .achievement-info {
        flex: 1;
        min-width: 0;
      }

      .achievement-name {
        font-weight: 600;
        color: var(--text-primary);

        margin: 0 0 0.125rem 0;

        font-size: 0.8125rem;
      }

      .achievement-desc {
        font-size: 0.75rem;
        color: var(--text-secondary);

        margin: 0 0 0.375rem 0;
      }

      .achievement-bar {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      :host ::ng-deep .achievement-progress-bar {
        height: 4px !important;
        border-radius: var(--radius-full) !important;
      }

      :host ::ng-deep .achievement-progress-bar .p-progressbar {
        height: 4px;
        background: var(--surface-hover);
        border-radius: var(--radius-full);
      }

      :host ::ng-deep .achievement-progress-bar .p-progressbar-value {
        background: linear-gradient(90deg, var(--primary-color), var(--primary-color-hover));

        border-radius: var(--radius-full);
      }

      .achievement-count {
        font-size: 0.6875rem;
        color: var(--text-tertiary);
      }

      /* ============================================================
       TRENDS
       ============================================================ */

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

      /* ============================================================
       LOADING
       ============================================================ */

      .loading-overlay {
        position: fixed;

        top: 0;
        left: 0;
        right: 0;

        z-index: 1000;
      }

      :host ::ng-deep .loading-overlay .p-progressbar {
        height: 4px;
      }

      :host ::ng-deep .loading-overlay .p-progressbar-value {
        background: var(--primary-color);
      }

      /* ============================================================
       SKELETONS
       ============================================================ */

      .skeleton-user {
        display: flex;
        align-items: center;

        gap: 0.75rem;

        padding: 0.75rem 0;
      }

      .skeleton-user-info {
        flex: 1;

        display: flex;
        flex-direction: column;

        gap: 0.375rem;
      }

      .skeleton-achievement {
        display: flex;

        gap: 0.75rem;

        padding: 0.75rem 0;
      }

      /* ============================================================
       EMPTY STATES
       ============================================================ */

      .empty-state {
        padding: 1rem 0;

        text-align: center;

        font-size: 0.8125rem;

        color: var(--text-secondary);
      }

      .empty-stories {
        padding: 0.75rem;

        font-size: 0.75rem;

        color: var(--text-secondary);
      }

      .loading-list {
        padding: 0.5rem 0;
      }

      /* ============================================================
       RESPONSIVE
       ============================================================ */

      @media (max-width: 1200px) {
        .home-container {
          grid-template-columns: minmax(0, 1fr) 320px;

          max-width: 800px;
        }

        .left-column {
          display: none;
        }
      }

      @media (max-width: 900px) {
        .home-container {
          grid-template-columns: minmax(0, 1fr);

          max-width: 600px;
        }

        .right-column {
          display: none;
        }
      }

      @media (max-width: 640px) {
        .home-page {
          padding: 0.75rem 0;
        }

        .home-container {
          padding: 0 0.75rem;

          gap: 1rem;
        }
      }
    `,
  ],
})
export class HomePageComponent implements OnInit, AfterViewInit, OnDestroy {
  /* ============================================================
     DEPENDENCIES
     ============================================================ */

  private readonly homeService = inject(HomeService);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly likeService = inject(LikeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translocoService = inject(TranslocoService);
  private readonly router = inject(Router);

  /* ============================================================
     DATA
     ============================================================ */

  stories: Story[] = [];

  posts = signal<Post[]>([]);

  suggestions: Suggestion[] = [];

  marketPromos: PromoItem[] = [];

  vets: Suggestion[] = [];

  newAdoptions: Adoption[] = [];

  /* ============================================================
     USER LEVEL
     ============================================================ */

  userLevel: UserLevel = new UserLevel({
    level: 12,
    currentXp: 650,
    totalXp: 1000,
  });

  /* ============================================================
     CURRENT USER
     ============================================================ */

  currentUserId = signal<string>('');

  /* ============================================================
     VETS
     ============================================================ */

  vetUserIds = signal<Set<string>>(new Set());

  /* ============================================================
     LOADING STATES
     ============================================================ */

  loadingPosts = signal(true);

  loadingMorePosts = signal(false);

  hasMorePosts = signal(true);

  loadingStories = signal(true);

  loadingSuggestions = signal(true);

  loadingPromos = signal(true);

  loadingVets = signal(true);

  loadingAdoptions = signal(true);

  private readonly postPageSize = 10;
  private currentPostPage = 0;
  private postsObserver?: IntersectionObserver;

  @ViewChild('postsLoadMoreSentinel')
  private postsLoadMoreSentinel?: ElementRef<HTMLElement>;

  /* ============================================================
     COMPUTED
     ============================================================ */

  postItems = computed((): PostItem[] => {
    return [...this.posts()]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map((post) => ({
        id: post.id,

        user: {
          name: post.user.name,
          avatar: post.user.avatar,
          username: post.user.username || this.translocoService.translate('home.defaultHandle'),
          userId: post.user.userId,
        },

        image: post.image,

        caption: post.caption,

        likes: post.likes,

        comments: post.comments,

        liked: post.liked,

        saved: post.saved,

        timestamp: post.timestamp,

        likeAvatars: post.likeAvatars,
      }));
  });

  get levelProgress(): number {
    if (!this.userLevel.totalXp || this.userLevel.totalXp <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (this.userLevel.currentXp / this.userLevel.totalXp) * 100));
  }

  /* ============================================================
     INIT
     ============================================================ */

  ngOnInit(): void {
    this.initializeCurrentUser();

    this.loadAllData();
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined' || !this.postsLoadMoreSentinel) {
      return;
    }

    this.postsObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.loadNextPostPage();
        }
      },
      { rootMargin: '300px 0px' },
    );
    this.postsObserver.observe(this.postsLoadMoreSentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.postsObserver?.disconnect();
  }

  /* ============================================================
     CURRENT USER
     ============================================================ */

  private initializeCurrentUser(): void {
    const currentUser = this.authService.user();

    if (currentUser?.id) {
      this.currentUserId.set(currentUser.id);
    }
  }

  /* ============================================================
     LOAD ALL DATA
     ============================================================ */

  private loadAllData(): void {
    this.loadStories();

    this.loadPosts();

    this.loadVetsAndSuggestions();

    this.loadMarketPromos();

    this.loadNewAdoptions();

    this.loadUserLevel();
  }

  /* ============================================================
     STORIES
     ============================================================ */

  private loadStories(): void {
    this.loadingStories.set(true);

    forkJoin({
      stories: this.homeService.getStories(),

      profiles: this.homeService.getAllProfiles(),
    })
      .pipe(
        finalize(() => {
          this.loadingStories.set(false);

          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.stories || response.stories.length === 0) {
            this.stories = [];

            return;
          }

          const profiles = response.profiles || [];

          const profileMap = new Map(profiles.map((profile) => [profile.authUserId, profile]));

          this.stories = response.stories.map((story) => {
            const profile = profileMap.get(story.userId);

            return new Story({
              id: story.id,

              user: new User({
                name: profile ? `${profile.firstName} ${profile.lastName}` : this.translocoService.translate('home.defaultUsername'),

                avatar: profile?.avatarUrl || 'https://i.pravatar.cc/150?img=1',

                userId: profile?.authUserId || story.userId,
              }),

              seen: story.seen,
            });
          });
        },

        error: (error) => {
          console.error('Error loading stories:', error);

          this.stories = [];
        },
      });
  }

  /* ============================================================
     POSTS
     ============================================================ */

  private loadPosts(): void {
    this.currentPostPage = 0;
    this.hasMorePosts.set(true);
    this.loadingMorePosts.set(false);
    this.loadingPosts.set(true);

    const userId = this.currentUserId();

    this.loadPostPage(0, false, userId);
  }

  private loadNextPostPage(): void {
    if (this.loadingPosts() || this.loadingMorePosts() || !this.hasMorePosts()) {
      return;
    }

    this.loadingMorePosts.set(true);
    this.loadPostPage(this.currentPostPage + 1, true, this.currentUserId());
  }

  private loadPostPage(page: number, append: boolean, userId: string): void {
    const loadPublicPage = (): void => {
      this.homeService.getPublicFeed(page, this.postPageSize).subscribe({
        next: (response) => this.handlePostPage(response, page, append, userId),
        error: (error) => this.handlePostPageError(error, append),
      });
    };

    if (!userId) {
      loadPublicPage();
      return;
    }

    this.homeService.getPostsByFollowing(userId, page, this.postPageSize).subscribe({
      next: (response) => this.handlePostPage(response, page, append, userId),
      error: (error) => {
        console.error('Error loading posts from following; falling back to public feed:', error);
        loadPublicPage();
      },
    });
  }

  private handlePostPage(
    response: PostPageResponse,
    page: number,
    append: boolean,
    userId: string,
  ): void {
    this.currentPostPage = page;
    this.hasMorePosts.set(!response.last);

    this.homeService.getAllProfiles().subscribe({
      next: (profiles) => {
        this.processPosts(response.content, profiles, userId, append);
      },
      error: (error) => {
        console.error('Error loading profiles for posts:', error);
        this.processPosts(response.content, [], userId, append);
      },
    });
  }

  private handlePostPageError(error: unknown, append: boolean): void {
    console.error('Error loading posts:', error);

    if (!append) {
      this.posts.set([]);
      this.hasMorePosts.set(false);
    }

    this.finishPostPageLoading(append);
  }

  private finishPostPageLoading(append: boolean): void {
    if (append) {
      this.loadingMorePosts.set(false);
    } else {
      this.loadingPosts.set(false);
    }

    this.cdr.detectChanges();
  }

  private processPosts(
    posts: PostResponse[],
    profiles: UserProfileResponse[],
    userId: string,
    append: boolean,
  ): void {
    if (!posts || posts.length === 0) {
      this.hasMorePosts.set(false);
      this.finishPostPageLoading(append);
      return;
    }

    const loadedPosts = posts.map((post) => {
      const profile = profiles.find((p) => p.authUserId === post.authorId);

      return new Post({
        id: post.id,

        user: new User({
          name: profile ? `${profile.firstName} ${profile.lastName}` : this.translocoService.translate('home.defaultUsername'),

          avatar: profile?.avatarUrl || 'https://i.pravatar.cc/150?img=1',

          username: profile
            ? `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}`
            : this.translocoService.translate('home.defaultHandle'),

          userId: post.authorId,
        }),

        timestamp: new Date(post.createdAt),

        image: post.imageUrl,

        likes: post.likesCount || 0,

        comments: post.commentsCount || 0,

        caption: post.caption || '',

        liked: false,

        saved: false,
      });
    });

    if (!userId || loadedPosts.length === 0) {
      this.applyLoadedPosts(loadedPosts, append);
      return;
    }

    /* ==========================================================
       LIKE STATUS
       ========================================================== */

    const likeStatusRequests = loadedPosts.map((post) =>
      this.likeService.getLikeStatus('POST', post.id, userId).pipe(
        catchError(() =>
          of({
            liked: false,
            count: post.likes,
          }),
        ),
      ),
    );

    forkJoin(likeStatusRequests).subscribe({
      next: (likeStatuses) => {
        loadedPosts.forEach((post, index) => {
          const status = likeStatuses[index];

          post.liked = status?.liked ?? false;

          post.likes = status?.count ?? post.likes;
        });

        /* ========================================================
             LIKE AVATARS
             ======================================================== */

        const likeAvatarsRequests = loadedPosts.map((post) =>
          this.likeService.getLikes('POST', post.id).pipe(catchError(() => of([]))),
        );

        forkJoin(likeAvatarsRequests).subscribe({
          next: (likesArrays) => {
            loadedPosts.forEach((post, index) => {
              const likes = likesArrays[index] || [];

              const avatarUrls = likes

                .map((like) => {
                  const profile = profiles.find((p) => p.authUserId === like.userId);

                  return profile?.avatarUrl;
                })

                .filter((url): url is string => !!url)

                .slice(0, 3);

              post.likeAvatars = avatarUrls;
            });

            this.applyLoadedPosts(loadedPosts, append);
          },

          error: (error) => {
            console.error('Error loading like avatars:', error);

            this.applyLoadedPosts(loadedPosts, append);
          },
        });
      },

      error: (error) => {
        console.error('Error loading like status:', error);

        this.applyLoadedPosts(loadedPosts, append);
      },
    });
  }

  private applyLoadedPosts(loadedPosts: Post[], append: boolean): void {
    if (!append) {
      this.posts.set(loadedPosts);
    } else {
      const existingIds = new Set(this.posts().map((post) => post.id));
      this.posts.update((currentPosts) => [
        ...currentPosts,
        ...loadedPosts.filter((post) => !existingIds.has(post.id)),
      ]);
    }

    this.finishPostPageLoading(append);
  }

  /* ============================================================
     VETS + SUGGESTIONS
     ============================================================ */

  private loadVetsAndSuggestions(): void {
    this.loadVets();
  }

  /* ============================================================
     VETS
     ============================================================ */

  private loadVets(): void {
    this.loadingVets.set(true);

    const userId = this.currentUserId();

    this.profileService.getAllProfiles().subscribe({
      next: (response) => {
        if (!response || response.length === 0) {
          this.vets = [];

          this.vetUserIds.set(new Set());

          this.loadingVets.set(false);

          this.loadSuggestions();

          this.cdr.detectChanges();

          return;
        }

        const vetProfiles = response
          .filter((profile) => profile.profileType?.toLowerCase() === 'vet')
          .slice(0, 4);

        if (!userId) {
          this.vets = vetProfiles.map((profile) => this.createSuggestion(profile, false));

          this.updateVetIds();

          this.loadingVets.set(false);

          this.loadSuggestions();

          this.cdr.detectChanges();

          return;
        }

        this.homeService.getFollowing(userId).subscribe({
          next: (followingResponse) => {
            const followedUserIds = new Set(
              (followingResponse || []).map((follow) => follow.followingId || follow.id),
            );

            this.vets = vetProfiles.map((profile) =>
              this.createSuggestion(profile, followedUserIds.has(profile.authUserId)),
            );

            this.updateVetIds();

            this.loadingVets.set(false);

            this.loadSuggestions();

            this.cdr.detectChanges();
          },

          error: (error) => {
            console.error('Error loading following for vets:', error);

            this.vets = vetProfiles.map((profile) => this.createSuggestion(profile, false));

            this.updateVetIds();

            this.loadingVets.set(false);

            this.loadSuggestions();

            this.cdr.detectChanges();
          },
        });
      },

      error: (error) => {
        console.error('Error loading vets:', error);

        this.vets = [];

        this.vetUserIds.set(new Set());

        this.loadingVets.set(false);

        this.loadSuggestions();

        this.cdr.detectChanges();
      },
    });
  }

  private updateVetIds(): void {
    this.vetUserIds.set(new Set(this.vets.map((vet) => vet.userId)));
  }

  /* ============================================================
     SUGGESTIONS
     ============================================================ */

  private loadSuggestions(): void {
    this.loadingSuggestions.set(true);

    const userId = this.currentUserId();

    this.profileService.getAllProfiles().subscribe({
      next: (response) => {
        if (!response || response.length === 0) {
          this.suggestions = [];

          this.loadingSuggestions.set(false);

          this.cdr.detectChanges();

          return;
        }

        const vetIds = this.vetUserIds();

        const loadSuggestionsWithFollowing = (followedUserIds: Set<string>) => {
          this.suggestions = response

            .filter(
              (profile) =>
                profile.profileType !== 'PET' &&
                profile.authUserId !== userId &&
                !vetIds.has(profile.authUserId),
            )

            .slice(0, 4)

            .map((profile) =>
              this.createSuggestion(profile, followedUserIds.has(profile.authUserId)),
            );

          this.loadingSuggestions.set(false);

          this.cdr.detectChanges();
        };

        if (!userId) {
          loadSuggestionsWithFollowing(new Set());

          return;
        }

        this.homeService.getFollowing(userId).subscribe({
          next: (followingResponse) => {
            const followedUserIds = new Set(
              (followingResponse || []).map((follow) => follow.followingId || follow.id),
            );

            loadSuggestionsWithFollowing(followedUserIds);
          },

          error: (error) => {
            console.error('Error loading following for suggestions:', error);

            loadSuggestionsWithFollowing(new Set());
          },
        });
      },

      error: (error) => {
        console.error('Error loading suggestions:', error);

        this.suggestions = [];

        this.loadingSuggestions.set(false);

        this.cdr.detectChanges();
      },
    });
  }

  /* ============================================================
     CREATE SUGGESTION
     ============================================================ */

  private createSuggestion(profile: UserProfileResponse, isFollowing: boolean): Suggestion {
    return new Suggestion({
      name: `${profile.firstName} ${profile.lastName}`,

      username: `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}`,

      avatar: profile.avatarUrl || 'https://i.pravatar.cc/150?img=1',

      followers: this.formatFollowers(Math.floor(Math.random() * 1000) + 100),

      userId: profile.authUserId,

      isFollowing,
    });
  }

  /* ============================================================
     PEOPLE TO FOLLOW (unified: vets + suggestions)
     ============================================================ */

  peopleToFollow(): Suggestion[] {
    return [...this.vets, ...this.suggestions];
  }

  peopleLoading(): boolean {
    return this.loadingVets() || this.loadingSuggestions();
  }

  /* ============================================================
     MARKET PROMOS
     ============================================================ */

  private loadMarketPromos(): void {
    this.loadingPromos.set(true);

    this.homeService
      .getMarketPromos()
      .pipe(
        finalize(() => {
          this.loadingPromos.set(false);

          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          if (response && response.length > 0) {
            this.marketPromos = response

              .map((promo) => new PromoItem(promo))

              .slice(0, 4);
          } else {
            this.marketPromos = [];
          }
        },

        error: (error) => {
          console.error('Error loading market promos:', error);

          this.marketPromos = [];
        },
      });
  }

  /* ============================================================
     ADOPTIONS
     ============================================================ */

  private loadNewAdoptions(): void {
    this.loadingAdoptions.set(true);

    this.homeService
      .getNewAdoptions()
      .pipe(
        finalize(() => {
          this.loadingAdoptions.set(false);

          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          if (response && response.length > 0) {
            this.newAdoptions = response

              .map((adoption) => new Adoption(adoption))

              .slice(0, 4);
          } else {
            this.newAdoptions = [];
          }
        },

        error: (error) => {
          console.error('Error loading new adoptions:', error);

          this.newAdoptions = [];
        },
      });
  }

  /* ============================================================
     NAVEGACIÓN
     ============================================================ */

  /** Abre el perfil de la mascota seleccionada desde el módulo de adopciones. */
  openPetProfile(petId: string): void {
    if (!petId) return;
    this.router.navigate(['/profile/pet', petId]);
  }

  /* ============================================================
     USER LEVEL
     ============================================================ */

  private loadUserLevel(): void {
    this.homeService.getUserLevel().subscribe({
      next: (response) => {
        if (response) {
          this.userLevel = new UserLevel(response);

          this.cdr.detectChanges();
        }
      },

      error: (error) => {
        console.error('Error loading user level:', error);
      },
    });
  }

  /* ============================================================
     FOLLOWERS
     ============================================================ */

  private formatFollowers(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }

    return count.toString();
  }

  /* ============================================================
     LIKE TOGGLE
     ============================================================ */

  onLikeToggled(post: PostItem): void {
    const currentPosts = [...this.posts()];

    const index = currentPosts.findIndex((p) => p.id === post.id);

    if (index === -1) {
      return;
    }

    currentPosts[index].liked = post.liked;

    currentPosts[index].likes = post.likes;

    this.posts.set(currentPosts);
  }

  /* ============================================================
     SAVE TOGGLE
     ============================================================ */

  onSaveToggled(post: PostItem): void {
    const currentPosts = [...this.posts()];

    const index = currentPosts.findIndex((p) => p.id === post.id);

    if (index === -1) {
      return;
    }

    currentPosts[index].saved = post.saved;

    this.posts.set(currentPosts);
  }

  /* ============================================================
     FOLLOW / UNFOLLOW
     ============================================================ */

  toggleFollow(suggestion: Suggestion): void {
    const userId = this.currentUserId();

    if (!userId) {
      return;
    }

    const wasFollowing = suggestion.isFollowing;

    // Optimistic UI
    suggestion.isFollowing = !wasFollowing;

    this.cdr.detectChanges();

    if (suggestion.isFollowing) {
      this.homeService.followUser(userId, suggestion.userId).subscribe({
        next: () => {
          this.loadPosts();
        },

        error: (error) => {
          console.error('Error following user:', error);

          suggestion.isFollowing = wasFollowing;

          this.cdr.detectChanges();
        },
      });

      return;
    }

    this.homeService.unfollowUser(userId, suggestion.userId).subscribe({
      next: () => {
        this.loadPosts();
      },

      error: (error) => {
        console.error('Error unfollowing user:', error);

        suggestion.isFollowing = wasFollowing;

        this.cdr.detectChanges();
      },
    });
  }
}
