import { Component, OnInit, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { RouterLink } from '@angular/router';
import { HomeService, PostResponse, UserProfileResponse, StoryResponse, SuggestionResponse, MarketplacePromoResponse, VetServiceResponse, AdoptionResponse, AchievementResponse, UserLevelResponse, FollowResponse } from '../../infrastructure/services/home.service';
import { Story, Post, Suggestion, PromoItem, User, VetService, Adoption, Achievement, UserLevel } from '../../infrastructure/models/home.models';
import { finalize, catchError } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { PostFeedComponent, PostItem } from '../../../shared/presentation/components/post-feed/post-feed.component';
import { ProfileService } from '../../../profile/infrastructure/services/profile.service';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { LikeService } from '../../../shared/infrastructure/services/like.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    AvatarModule,
    AvatarGroupModule,
    InputTextModule,
    ProgressBarModule,
    SkeletonModule,
    RouterLink,
    PostFeedComponent,
  ],
  template: `
    <div class="home-page">
      <div class="home-container">
        <!-- Columna Izquierda - Sidebar -->
        <div class="left-column">
          <!-- Anuncios de Mercado -->
          <div class="card-modern">
            <div class="card-header">
              <i class="pi pi-shopping-cart card-header-icon"></i>
              <span class="card-header-title">Mercado</span>
            </div>
            <div class="card-body">
              <div class="promo-item" *ngFor="let promo of marketPromos">
                <img [src]="promo.image" [alt]="promo.title" class="promo-image" />
                <div class="promo-content">
                  <p class="promo-title">{{ promo.title }}</p>
                  <p class="promo-desc">{{ promo.description }}</p>
                  <p-tag *ngIf="promo.tag" [value]="promo.tag" severity="warn"></p-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- Veterinarios -->
          <div class="card-modern">
            <div class="card-header">
              <i class="pi pi-user-md card-header-icon"></i>
              <span class="card-header-title">Veterinarios</span>
            </div>
            <div class="card-body">
              <div class="suggestion-item" *ngFor="let vet of vets">
                <p-avatar [image]="vet.avatar" shape="circle" size="normal"></p-avatar>
                <div class="suggestion-info">
                  <a [routerLink]="'/profile/' + vet.userId" class="suggestion-name">{{ vet.name }}</a>
                  <span class="suggestion-username">{{ vet.username }}</span>
                  <span class="suggestion-followers">{{ vet.followers }} seguidores</span>
                </div>
                <button
                  class="follow-btn"
                  [class.following]="vet.isFollowing"
                  (click)="toggleFollow(vet)"
                >
                  <i [class]="vet.isFollowing ? 'pi pi-check' : 'pi pi-user-plus'"></i>
                  {{ vet.isFollowing ? 'Siguiendo' : 'Seguir' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Nuevas Adopciones -->
          <div class="card-modern">
            <div class="card-header">
              <i class="pi pi-heart card-header-icon"></i>
              <span class="card-header-title">Adopciones</span>
            </div>
            <div class="card-body">
              <div class="adoption-item" *ngFor="let adoption of newAdoptions">
                <img [src]="adoption.image" [alt]="adoption.name" class="adoption-image" />
                <div class="adoption-info">
                  <p class="adoption-name">{{ adoption.name }}</p>
                  <p class="adoption-breed">{{ adoption.breed }}</p>
                  <p-button label="Conocer" [routerLink]="'/adoptions'" styleClass="p-button-sm p-button-outlined" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Central - Feed -->
        <div class="center-column">
          <!-- Loading Progress Bar -->
          @if (loadingPosts()) {
            <div class="loading-overlay">
              <p-progressBar mode="indeterminate" [style]="{'height': '4px'}" />
            </div>
          }

          <!-- Stories -->
          <div class="stories-card">
            <div class="stories-scroll">
              <a class="story-item" *ngFor="let story of stories" [routerLink]="'/profile/' + story.user.userId">
                <div class="story-ring" [class.seen]="story.seen">
                  <p-avatar
                    [image]="story.user.avatar"
                    shape="circle"
                    size="large"
                  ></p-avatar>
                </div>
                <span class="story-name">{{ story.user.name }}</span>
              </a>
            </div>
          </div>

          <!-- Feed -->
          <app-post-feed
            [posts]="postItems()"
            [loading]="loadingPosts()"
            [currentUserId]="currentUserId()"
            (likeToggled)="onLikeToggled($event)"
            (saveToggled)="onSaveToggled($event)"
          />
        </div>

        <!-- Columna Derecha -->
        <div class="right-column">
          <!-- Level Card -->
          <div class="level-card">
            <div class="level-top">
              <div class="level-text">
                <span class="level-label">Tu Nivel</span>
                <span class="level-number">Nivel 12</span>
              </div>
              <i class="pi pi-trophy level-icon"></i>
            </div>
            <div class="level-bar-wrap">
              <p-progressBar [value]="65" styleClass="level-progress-bar"></p-progressBar>
              <span class="level-xp">650 / 1000 XP</span>
            </div>
          </div>

          <!-- Achievements -->
          <div class="card-modern">
            <div class="card-header">
              <span class="card-header-title">Próximos Logros</span>
            </div>
            <div class="card-body">
              <div class="achievement-item" *ngFor="let achievement of upcomingAchievements">
                <div class="achievement-icon" [class.unlocked]="achievement.unlocked">
                  <i class="pi" [class]="achievement.icon"></i>
                </div>
                <div class="achievement-info">
                  <p class="achievement-name">{{ achievement.name }}</p>
                  <p class="achievement-desc">{{ achievement.description }}</p>
                  <div class="achievement-bar">
                    <p-progressBar [value]="(achievement.progress / achievement.total) * 100" styleClass="achievement-progress-bar"></p-progressBar>
                    <span class="achievement-count">{{ achievement.progress }} / {{ achievement.total }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

   <!-- Suggestions - Perfiles -->
           <div class="card-modern">
             <div class="card-header">
               <span class="card-header-title">Quién seguir</span>
             </div>
             <div class="card-body">
               <div class="suggestion-item" *ngFor="let suggestion of suggestions">
                 <p-avatar [image]="suggestion.avatar" shape="circle" size="normal"></p-avatar>
                 <div class="suggestion-info">
                   <a [routerLink]="'/profile/' + suggestion.userId" class="suggestion-name">{{ suggestion.name }}</a>
                   <span class="suggestion-username">{{ suggestion.username }}</span>
                   <span class="suggestion-followers">{{ suggestion.followers }} seguidores</span>
                 </div>
                  <button
                    class="follow-btn"
                    [class.following]="suggestion.isFollowing"
                    (click)="toggleFollow(suggestion)"
                  >
                    <i [class]="suggestion.isFollowing ? 'pi pi-check' : 'pi pi-user-plus'"></i>
                    {{ suggestion.isFollowing ? 'Siguiendo' : 'Seguir' }}
                  </button>
               </div>
             </div>
           </div>

          <!-- Trends -->
          <div class="card-modern">
            <div class="card-header">
              <span class="card-header-title">Tendencias</span>
            </div>
            <div class="card-body">
              <div class="trend-item" *ngFor="let trend of trendingTopics()">
                <span class="trend-category">#{{ trend.rank }} Tendencia</span>
                <span class="trend-name">{{ trend.name }}</span>
                <span class="trend-posts">{{ trend.posts }} publicaciones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== PAGE ===== */
    .home-page {
      min-height: 100vh;
      padding: 1.5rem 0;
    }

    .home-container {
      margin: 0 auto;
      display: grid;
      grid-template-columns: 300px 1fr 320px;
      max-width: 1280px;
      gap: 1.5rem;
      padding: 0 1.5rem;
      width: 100%;
      box-sizing: border-box;
    }

    /* ===== MODERN CARD ===== */
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

    .card-body {
      padding: 0.5rem 1.25rem;
    }

    /* ===== LEFT COLUMN ===== */
    .left-column {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .promo-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .promo-item:last-child { border-bottom: none; }

    .promo-image {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      flex-shrink: 0;
    }

    .promo-content { flex: 1; min-width: 0; }

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

    /* Services */
    .service-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .service-item:last-child { border-bottom: none; }

    .service-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      background: var(--primary-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .service-info { flex: 1; min-width: 0; }

    .service-title {
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.125rem 0;
      font-size: 0.8125rem;
    }

    .service-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    }

    /* Adoptions */
    .adoption-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
      align-items: center;
    }

    .adoption-item:last-child { border-bottom: none; }

    .adoption-image {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-full);
      object-fit: cover;
      flex-shrink: 0;
      border: 2px solid var(--primary-color);
    }

    .adoption-info { flex: 1; min-width: 0; }

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

    /* ===== CENTER COLUMN ===== */
    .center-column {
      min-width: 0;
      flex: 1;
      width: 100%;
      min-height: 0;
      overflow: visible;
    }

    /* Stories */
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

    .stories-scroll::-webkit-scrollbar { display: none; }

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

    .story-ring :host ::ng-deep .p-avatar {
      border: 2px solid var(--surface-card);
    }

    .story-add-ring {
      background: var(--primary-color);
    }

    .story-add-avatar {
      background: transparent !important;
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

    /* ===== RIGHT COLUMN ===== */
    .right-column {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* Level Card */
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

    .level-progress-bar {
      height: 6px !important;
      border-radius: var(--radius-full) !important;
    }

    .level-progress-bar :host ::ng-deep .p-progressbar {
      height: 6px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: var(--radius-full);
    }

    .level-progress-bar :host ::ng-deep .p-progressbar-value {
      background: white;
      border-radius: var(--radius-full);
    }

    .level-xp {
      font-size: 0.75rem;
      opacity: 0.85;
    }

    /* Achievements */
    .achievement-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .achievement-item:last-child { border-bottom: none; }

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

    .achievement-info { flex: 1; min-width: 0; }

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

    .achievement-progress-bar {
      height: 4px !important;
      border-radius: var(--radius-full) !important;
    }

    .achievement-progress-bar :host ::ng-deep .p-progressbar {
      height: 4px;
      background: var(--surface-hover);
      border-radius: var(--radius-full);
    }

    .achievement-progress-bar :host ::ng-deep .p-progressbar-value {
      background: linear-gradient(90deg, var(--primary-color), var(--primary-color-hover));
      border-radius: var(--radius-full);
    }

    .achievement-count {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
    }

    /* Suggestions */
    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0;
      border-bottom: 1px solid var(--surface-border);
      text-decoration: none;
    }

    .suggestion-item:last-child { border-bottom: none; }

    .suggestion-info { flex: 1; min-width: 0; }

    .suggestion-name {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.8125rem;
    }

    .suggestion-username {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.0625rem;
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

    .suggestion-followers {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.0625rem;
    }

    /* Trends */
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

    .trend-item:last-child { margin-bottom: 0; }

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

    /* Loading Overlay */
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

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1200px) {
      .home-container {
        grid-template-columns: 1fr 320px;
        max-width: 800px;
      }
      .left-column { display: none; }
    }

    @media (max-width: 900px) {
      .home-container {
        grid-template-columns: 1fr;
        max-width: 600px;
      }
      .right-column { display: none; }
    }

    @media (max-width: 640px) {
      .home-page { padding: 0.75rem 0; }
      .home-container { padding: 0 0.75rem; gap: 1rem; }
    }
  `]
})
export class HomePageComponent implements OnInit {
  private readonly homeService = inject(HomeService);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly likeService = inject(LikeService);
  private readonly cdr = inject(ChangeDetectorRef);

  stories: Story[] = [];
  posts = signal<Post[]>([]);
  suggestions: Suggestion[] = [];
  marketPromos: PromoItem[] = [];
  vets: Suggestion[] = [];
  newAdoptions: Adoption[] = [];
  upcomingAchievements: Achievement[] = [];
  userLevel: UserLevel = { level: 12, currentXp: 650, totalXp: 1000 };
  trendingTopics = signal<{ rank: number; name: string; posts: number }[]>([]);

  // Current user
  currentUserId = signal('');

  // Vet user IDs (to exclude from suggestions)
  vetUserIds = signal<Set<string>>(new Set());

  // Loading states
  loadingPosts = signal(true);
  loadingStories = signal(true);
  loadingSuggestions = signal(true);
  loadingPromos = signal(true);
  loadingVets = signal(true);
  loadingAdoptions = signal(true);
  loadingAchievements = signal(true);

  // Convert posts to PostItem format for the component
  // Sort posts by timestamp (newest first) to match social-page behavior
  postItems = computed((): PostItem[] => {
    return this.posts()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map(post => ({
      id: post.id,
      user: {
        name: post.user.name,
        avatar: post.user.avatar,
        username: post.user.username || '@usuario',
        userId: post.user.userId
      },
      image: post.image,
      caption: post.caption,
      likes: post.likes,
      comments: post.comments,
      liked: post.liked,
      saved: post.saved,
      timestamp: post.timestamp,
      likeAvatars: post.likeAvatars
    }));
  });

  ngOnInit(): void {
    this.initializeCurrentUser();
    this.loadAllData();
  }

  private initializeCurrentUser(): void {
    const currentUser = this.authService.user();
    if (currentUser) {
      this.currentUserId.set(currentUser.id);
    }
  }

  private loadAllData(): void {
    this.loadStories();
    this.loadPosts();
    this.loadVetsAndSuggestions();
    this.loadMarketPromos();
    this.loadNewAdoptions();
    this.loadAchievements();
    this.loadUserLevel();
    this.loadTrendingTopics();
  }

  private loadVetsAndSuggestions(): void {
    // Load vets first, then suggestions (to avoid duplicates)
    this.loadVets();
    // Small delay to ensure vets are loaded first
    setTimeout(() => {
      this.loadSuggestions();
    }, 100);
  }

  private loadStories(): void {
    this.loadingStories.set(true);

    forkJoin({
      stories: this.homeService.getStories(),
      profiles: this.homeService.getAllProfiles()
    }).pipe(
      finalize(() => {
        this.loadingStories.set(false);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response.stories && response.stories.length > 0) {
          const profiles = response.profiles || [];

          // Create a map for faster lookup (keyed by authUserId)
          const profileMap = new Map(profiles.map(p => [p.authUserId, p]));

          this.stories = response.stories.map(story => {
            const profile = profileMap.get(story.userId);
            return new Story({
              id: story.id,
              user: new User({
                name: profile ? `${profile.firstName} ${profile.lastName}` : 'Usuario',
                avatar: profile?.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                userId: profile?.authUserId || story.userId // Use authUserId as the unique identifier
              }),
              seen: story.seen
            });
          });
          this.cdr.detectChanges();
        } else {
          this.stories = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading stories:', err);
        this.stories = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadPosts(): void {
    this.loadingPosts.set(true);
    const userId = this.currentUserId();

    // If user is logged in, load posts from followed users
    if (userId) {
      this.homeService.getPostsByFollowing(userId).subscribe({
        next: (posts) => {
          this.homeService.getAllProfiles().subscribe({
            next: (profiles) => {
              this.processPosts(posts, profiles, userId);
            },
            error: () => {
              this.processPosts(posts, [], userId);
            }
          });
        },
        error: (err) => {
          console.error('Error loading posts from following:', err);
          // Fallback to all posts
          this.homeService.getAllPosts().subscribe({
            next: (posts) => {
              this.homeService.getAllProfiles().subscribe({
                next: (profiles) => {
                  this.processPosts(posts, profiles, userId);
                },
                error: () => {
                  this.processPosts(posts, [], userId);
                }
              });
            },
            error: () => {
              this.loadingPosts.set(false);
              this.cdr.detectChanges();
            }
          });
        }
      });
    } else {
      // If not logged in, load all posts
      this.homeService.getAllPosts().subscribe({
        next: (posts) => {
          this.homeService.getAllProfiles().subscribe({
            next: (profiles) => {
              this.processPosts(posts, profiles, '');
            },
            error: () => {
              this.processPosts(posts, [], '');
            }
          });
        },
        error: (err) => {
          console.error('Error loading posts:', err);
          this.loadingPosts.set(false);
          this.cdr.detectChanges();
        }
      });
    }
  }

  private processPosts(posts: PostResponse[], profiles: UserProfileResponse[], userId: string): void {
    if (posts && posts.length > 0) {
      // First, create posts with basic data
      const loadedPosts = posts.map(post => {
        const profile = profiles.find(p => p.authUserId === post.authorId);
        return new Post({
          id: post.id,
          user: new User({
            name: profile ? `${profile.firstName} ${profile.lastName}` : 'Usuario',
            avatar: profile?.avatarUrl || 'https://i.pravatar.cc/150?img=1',
            username: profile ? `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}` : '@usuario',
            userId: post.authorId
          }),
          timestamp: new Date(post.createdAt),
          image: post.imageUrl,
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          caption: post.caption || '',
          liked: false,
          saved: false
        });
      });

      // If user is logged in, fetch like status and avatars for each post
      if (userId && loadedPosts.length > 0) {
        const likeStatusRequests = loadedPosts.map(post =>
          this.likeService.getLikeStatus('POST', post.id, userId).pipe(
            catchError(() => of({ liked: false, count: post.likes }))
          )
        );

        forkJoin(likeStatusRequests).subscribe({
          next: (likeStatuses) => {
            // Update liked status and likes count
            loadedPosts.forEach((post, index) => {
              post.liked = likeStatuses[index].liked;
              post.likes = likeStatuses[index].count;
            });

            // Fetch like avatars for each post (up to 3)
            const likeAvatarsRequests = loadedPosts.map(post =>
              this.likeService.getLikes('POST', post.id).pipe(
                catchError(() => of([]))
              )
            );

            forkJoin(likeAvatarsRequests).subscribe({
              next: (likesArrays) => {
                loadedPosts.forEach((post, index) => {
                  const likes = likesArrays[index];
                  // Get avatar URLs for users who liked the post
                  const avatarUrls = likes
                    .map(like => {
                      const profile = profiles.find(p => p.authUserId === like.userId);
                      return profile?.avatarUrl;
                    })
                    .filter((url): url is string => !!url)
                    .slice(0, 3);
                  post.likeAvatars = avatarUrls;
                });
                this.posts.set(loadedPosts);
                this.loadingPosts.set(false);
                this.cdr.detectChanges();
              },
              error: () => {
                this.posts.set(loadedPosts);
                this.loadingPosts.set(false);
                this.cdr.detectChanges();
              }
            });
          },
          error: () => {
            // If like status check fails, still show posts with liked: false
            this.posts.set(loadedPosts);
            this.loadingPosts.set(false);
            this.cdr.detectChanges();
          }
        });
      } else {
        this.posts.set(loadedPosts);
        this.loadingPosts.set(false);
        this.cdr.detectChanges();
      }
    } else {
      this.posts.set([]);
      this.loadingPosts.set(false);
      this.cdr.detectChanges();
    }
  }

  private loadSuggestions(): void {
    this.loadingSuggestions.set(true);
    const userId = this.currentUserId();

    this.profileService.getAllProfiles().pipe(
      finalize(() => {
        this.loadingSuggestions.set(false);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          // Get the list of users that the current user follows
          if (userId) {
            this.homeService.getFollowing(userId).subscribe({
              next: (followingResponse) => {
                const followedUserIds = new Set(
                  (followingResponse || []).map(f => f.followingId || f.id)
                );

                // Map profiles to suggestions, excluding the current user, pet profiles, and vets
                // Use authUserId as the unique identifier for the user
                const vetIds = this.vetUserIds();
                this.suggestions = response
                  .filter(profile => profile.profileType !== 'PET' && profile.authUserId !== userId && !vetIds.has(profile.authUserId))
                  .slice(0, 5) // Limit to 5 suggestions
                  .map(profile => new Suggestion({
                    name: `${profile.firstName} ${profile.lastName}`,
                    username: `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}`,
                    avatar: profile.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                    followers: this.formatFollowers(Math.floor(Math.random() * 1000) + 100),
                    userId: profile.authUserId,
                    isFollowing: followedUserIds.has(profile.authUserId)
                  }));
                this.cdr.detectChanges();
              },
              error: () => {
                // If following endpoint fails, show profiles without follow status
                this.suggestions = response
                  .filter(profile => profile.profileType !== 'PET' && profile.authUserId !== userId)
                  .slice(0, 5)
                  .map(profile => new Suggestion({
                    name: `${profile.firstName} ${profile.lastName}`,
                    username: `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}`,
                    avatar: profile.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                    followers: this.formatFollowers(Math.floor(Math.random() * 1000) + 100),
                    userId: profile.authUserId,
                    isFollowing: false
                  }));
                this.cdr.detectChanges();
              }
            });
          } else {
            // If not logged in, show profiles without follow status
            this.suggestions = response
              .filter(profile => profile.profileType !== 'PET')
              .slice(0, 5)
              .map(profile => new Suggestion({
                name: `${profile.firstName} ${profile.lastName}`,
                username: `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}`,
                avatar: profile.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                followers: this.formatFollowers(Math.floor(Math.random() * 1000) + 100),
                userId: profile.authUserId,
                isFollowing: false
              }));
            this.cdr.detectChanges();
          }
        } else {
          this.suggestions = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading suggestions:', err);
        this.suggestions = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadMarketPromos(): void {
    this.loadingPromos.set(true);

    this.homeService.getMarketPromos().pipe(
      finalize(() => {
        this.loadingPromos.set(false);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.marketPromos = response.map(promo => new PromoItem(promo));
          this.cdr.detectChanges();
        } else {
          this.marketPromos = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading market promos:', err);
        this.marketPromos = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadVets(): void {
    this.loadingVets.set(true);
    const userId = this.currentUserId();

    this.profileService.getAllProfiles().pipe(
      finalize(() => {
        this.loadingVets.set(false);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          // If user is logged in, get following status
          if (userId) {
            this.homeService.getFollowing(userId).subscribe({
              next: (followingResponse) => {
                const followedUserIds = new Set(
                  (followingResponse || []).map(f => f.followingId || f.id)
                );

                // Filter profiles with profileType equal to 'vet'
                // Use authUserId as the unique identifier for the user
                const vetProfiles = response
                  .filter(profile => profile.profileType?.toLowerCase() === 'vet')
                  .slice(0, 5) // Limit to 5 vets
                  .map(profile => new Suggestion({
                    name: `${profile.firstName} ${profile.lastName}`,
                    username: `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}`,
                    avatar: profile.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                    followers: this.formatFollowers(Math.floor(Math.random() * 1000) + 100),
                    userId: profile.authUserId,
                    isFollowing: followedUserIds.has(profile.authUserId)
                  }));

                // Store vet user IDs to exclude from suggestions
                this.vetUserIds.set(new Set(vetProfiles.map(v => v.userId)));
                this.vets = vetProfiles;
                this.cdr.detectChanges();
              },
              error: () => {
                // If following endpoint fails, show vets without follow status
                this.vets = response
                  .filter(profile => profile.profileType?.toLowerCase() === 'vet')
                  .slice(0, 5)
                  .map(profile => new Suggestion({
                    name: `${profile.firstName} ${profile.lastName}`,
                    username: `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}`,
                    avatar: profile.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                    followers: this.formatFollowers(Math.floor(Math.random() * 1000) + 100),
                    userId: profile.authUserId,
                    isFollowing: false
                  }));
                this.cdr.detectChanges();
              }
            });
          } else {
            // If not logged in, show vets without follow status
            this.vets = response
              .filter(profile => profile.profileType?.toLowerCase() === 'vet')
              .slice(0, 5)
              .map(profile => new Suggestion({
                name: `${profile.firstName} ${profile.lastName}`,
                username: `@${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}`,
                avatar: profile.avatarUrl || 'https://i.pravatar.cc/150?img=1',
                followers: this.formatFollowers(Math.floor(Math.random() * 1000) + 100),
                userId: profile.authUserId,
                isFollowing: false
              }));
            this.cdr.detectChanges();
          }
        } else {
          this.vets = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading vets:', err);
        this.vets = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadNewAdoptions(): void {
    this.loadingAdoptions.set(true);

    this.homeService.getNewAdoptions().pipe(
      finalize(() => {
        this.loadingAdoptions.set(false);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.newAdoptions = response.map(adoption => new Adoption(adoption));
          this.cdr.detectChanges();
        } else {
          this.newAdoptions = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading new adoptions:', err);
        this.newAdoptions = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadAchievements(): void {
    this.loadingAchievements.set(true);

    this.homeService.getUpcomingAchievements().pipe(
      finalize(() => {
        this.loadingAchievements.set(false);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.upcomingAchievements = response.map(achievement => new Achievement(achievement));
          this.cdr.detectChanges();
        } else {
          this.upcomingAchievements = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading achievements:', err);
        this.upcomingAchievements = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadUserLevel(): void {
    this.homeService.getUserLevel().subscribe({
      next: (response) => {
        if (response) {
          this.userLevel = new UserLevel(response);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading user level:', err);
      }
    });
  }

  private formatFollowers(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  }

  private loadTrendingTopics(): void {
    this.homeService.getTrendingTopics().subscribe({
      next: (topics) => {
        // Show only top 3 trending topics
        const topTopics = topics.slice(0, 3);
        this.trendingTopics.set(topTopics.map((topic, index) => ({
          rank: index + 1,
          name: topic.name,
          posts: topic.postsCount
        })));
      },
      error: (err) => {
        console.error('Error loading trending topics:', err);
      }
    });
  }

  onLikeToggled(post: PostItem): void {
    // Handle like toggle from child component
    const currentPosts = this.posts();
    const index = currentPosts.findIndex(p => p.id === post.id);
    if (index !== -1) {
      currentPosts[index].liked = post.liked;
      currentPosts[index].likes = post.likes;
      this.posts.set([...currentPosts]);
    }
  }

  onSaveToggled(post: PostItem): void {
    // Handle save toggle from child component
    const currentPosts = this.posts();
    const index = currentPosts.findIndex(p => p.id === post.id);
    if (index !== -1) {
      currentPosts[index].saved = post.saved;
      this.posts.set([...currentPosts]);
    }
  }

  // Toggle follow/unfollow for a suggestion
  toggleFollow(suggestion: Suggestion): void {
    const userId = this.currentUserId();
    if (!userId) return;

    const wasFollowing = suggestion.isFollowing;
    suggestion.isFollowing = !suggestion.isFollowing;

    if (suggestion.isFollowing) {
      // Follow the user
      this.homeService.followUser(userId, suggestion.userId).subscribe({
        next: () => {
          // Refresh posts to include new followed user's posts
          this.loadPosts();
        },
        error: () => {
          // Revert on error
          suggestion.isFollowing = wasFollowing;
        }
      });
    } else {
      // Unfollow the user
      this.homeService.unfollowUser(userId, suggestion.userId).subscribe({
        next: () => {
          // Refresh posts to remove unfollowed user's posts
          this.loadPosts();
        },
        error: () => {
          // Revert on error
          suggestion.isFollowing = wasFollowing;
        }
      });
    }
  }
}
