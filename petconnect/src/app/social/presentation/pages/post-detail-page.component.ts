import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ProgressBarModule } from 'primeng/progressbar';
import { EMPTY, Subscription, catchError, finalize, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { LikeService } from '../../../shared/infrastructure/services/like.service';
import { PostFeedComponent, PostItem } from '../../../shared/presentation/components/post-feed/post-feed.component';
import { ProfileService } from '../../../profile/infrastructure/services/profile.service';
import { SocialService } from '../../infrastructure/services/social.service';

@Component({
  selector: 'app-post-detail-page',
  standalone: true,
  imports: [CommonModule, PostFeedComponent, ProgressBarModule, TranslocoModule],
  template: `
    <main class="post-detail-page">
      <header class="page-heading-card">
        <button class="back-button" type="button" (click)="goBack()">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          <span>{{ 'post.backToProfile' | transloco }}</span>
        </button>
        <div class="page-heading-copy">
          <h1>{{ 'post.detailTitle' | transloco }}</h1>
          <p>{{ 'post.detailSubtitle' | transloco }}</p>
        </div>
      </header>

      @if (loading()) {
        <p-progressBar mode="indeterminate" [style]="{ height: '4px' }" />
        <app-post-feed [posts]="[]" [loading]="true" [currentUserId]="currentUserId()" />
      } @else if (post(); as postItem) {
        <app-post-feed [posts]="[postItem]" [loading]="false" [currentUserId]="currentUserId()" />
      } @else if (hasError()) {
        <section class="post-detail-error" role="alert">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
          <p>{{ 'post.detailError' | transloco }}</p>
          <button class="back-button" type="button" (click)="goBack()">
            {{ 'post.backToProfile' | transloco }}
          </button>
        </section>
      }
    </main>
  `,
  styles: [`
    .post-detail-page {
      width: min(100%, 46rem);
      margin: 0 auto;
      padding: 1rem;
    }

    .page-heading-card {
      justify-content: flex-start;
      margin-bottom: 1rem;
    }

    .back-button {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 2.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-full);
      background: var(--surface-card);
      color: var(--text-primary);
      font: inherit;
      cursor: pointer;
    }

    .back-button:hover {
      background: var(--surface-hover);
    }

    .post-detail-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem 1rem;
      border-radius: var(--radius-lg);
      background: var(--surface-card);
      color: var(--text-secondary);
      text-align: center;
    }

    .post-detail-error > i {
      color: var(--primary-color);
      font-size: 1.75rem;
    }

    .post-detail-error p {
      margin: 0;
    }

    @media (max-width: 600px) {
      .post-detail-page {
        padding: 0.75rem;
      }
    }
  `],
})
export class PostDetailPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly socialService = inject(SocialService);
  private readonly profileService = inject(ProfileService);
  private readonly likeService = inject(LikeService);
  private routeSubscription?: Subscription;
  private loadSubscription?: Subscription;

  readonly post = signal<PostItem | null>(null);
  readonly loading = signal(true);
  readonly hasError = signal(false);
  readonly currentUserId = signal(this.authService.user()?.id || '');

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.loadPost(params.get('id'));
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.loadSubscription?.unsubscribe();
  }

  goBack(): void {
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
    if (returnTo?.startsWith('/profile/') && !returnTo.startsWith('//')) {
      void this.router.navigateByUrl(returnTo);
      return;
    }

    const post = this.post();
    if (post) {
      void this.router.navigate(['/profile', post.user.userId], { queryParams: { tab: 'posts' } });
      return;
    }

    this.location.back();
  }

  private loadPost(postId: string | null): void {
    this.loadSubscription?.unsubscribe();
    this.post.set(null);
    this.hasError.set(false);
    this.loading.set(true);

    if (!postId) {
      this.loading.set(false);
      this.hasError.set(true);
      return;
    }

    const currentUserId = this.currentUserId();
    this.loadSubscription = this.socialService.getPost(postId).pipe(
      switchMap(post => forkJoin({
        post: of(post),
        // Post author IDs are authenticated-user IDs, not profile IDs.
        author: this.profileService.getProfileByAuthUserId(post.authorId),
        likeStatus: currentUserId
          ? this.likeService.getLikeStatus('POST', post.id, currentUserId)
          : of({ liked: false, count: post.likesCount }),
      })),
      map(({ post, author, likeStatus }): PostItem => ({
        id: post.id,
        user: {
          name: `${author.firstName} ${author.lastName}`.trim(),
          avatar: author.avatarUrl || '',
          username: `@${`${author.firstName}.${author.lastName}`.toLowerCase()}`,
          userId: post.authorId,
        },
        image: post.imageUrl,
        caption: post.caption || '',
        likes: likeStatus.count,
        comments: post.commentsCount || 0,
        liked: likeStatus.liked,
        saved: false,
        timestamp: post.createdAt ? new Date(post.createdAt) : new Date(),
      })),
      catchError(error => {
        this.handleLoadError(error);
        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
    ).subscribe(post => this.post.set(post));
  }

  private handleLoadError(error: unknown): void {
    console.error('Error loading post detail:', error);
    this.loading.set(false);
    this.hasError.set(true);
  }
}
