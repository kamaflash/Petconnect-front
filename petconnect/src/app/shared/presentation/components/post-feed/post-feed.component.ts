import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { SkeletonModule } from 'primeng/skeleton';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LikeService, LikeTargetType } from '../../../infrastructure/services/like.service';
import { CommentSectionComponent } from '../comment-section/comment-section.component';

export interface PostUser {
  name: string;
  avatar: string;
  username: string;
  userId: string;
}

export interface PostItem {
  id: string;
  user: PostUser;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
  timestamp: Date;
  likeAvatars?: string[];
}

export type PostViewMode = 'feed' | 'grid';

@Component({
  selector: 'app-post-feed',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AvatarModule,
    AvatarGroupModule,
    SkeletonModule,
    RouterModule,
    CommentSectionComponent,
    TranslocoModule,
  ],
  template: `
    <div [class.posts-feed]="mode() === 'feed'" [class.posts-grid]="mode() === 'grid'">
      <!-- Loading Skeletons -->
      @if (loading()) {
        <div class="post-card skeleton-post" *ngFor="let i of [1, 2, 3]">
          <!-- Header Skeleton -->
          <div class="post-header">
            <div class="post-user">
              <p-skeleton shape="circle" size="3rem" />
              <div class="post-user-text">
                <p-skeleton width="8rem" height="0.875rem" styleClass="mb-2" />
                <p-skeleton width="6rem" height="0.75rem" />
              </div>
            </div>
            <p-skeleton shape="circle" size="2rem" />
          </div>

          <!-- Image Skeleton -->
          <p-skeleton height="300px" />

          <!-- Actions Skeleton -->
          <div class="post-actions">
            <div class="post-actions-left">
              <p-skeleton shape="circle" size="2rem" />
              <p-skeleton shape="circle" size="2rem" />
              <p-skeleton shape="circle" size="2rem" />
            </div>
            <p-skeleton shape="circle" size="2rem" />
          </div>

          <!-- Likes Skeleton -->
          <div class="post-likes">
            <p-skeleton width="12rem" height="0.875rem" />
          </div>

          <!-- Caption Skeleton -->
          <div class="post-caption">
            <p-skeleton width="100%" height="0.875rem" styleClass="mb-2" />
            <p-skeleton width="80%" height="0.875rem" />
          </div>

          <!-- Comments Skeleton -->
          <div class="post-comments">
            <p-skeleton width="8rem" height="0.75rem" />
            <p-skeleton width="5rem" height="0.75rem" />
          </div>
        </div>
      } @else {
        <!-- Real Posts -->
        <div class="post-card" *ngFor="let post of posts(); trackBy: trackByPostId">
          <!-- Header -->
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

          <!-- Image -->
          <div class="post-image-wrap">
            <img [src]="post.image" [alt]="post.caption" class="post-image" />
          </div>

          <!-- Actions -->
          <div class="post-actions">
            <div class="post-actions-left">
              <button class="post-action-btn" (click)="toggleLike(post)">
                <i class="pi" [class.pi-heart-fill]="post.liked" [class.pi-heart]="!post.liked"
                   [style.color]="post.liked ? 'var(--primary-color)' : ''"></i>
              </button>
              <button class="post-action-btn" (click)="toggleComments(post.id, true)">
                <i class="pi pi-comment"></i>
              </button>
              <button class="post-action-btn">
                <i class="pi pi-send"></i>
              </button>
            </div>
            <button class="post-action-btn" (click)="toggleSave(post)">
              <i class="pi" [class.pi-bookmark-fill]="post.saved" [class.pi-bookmark]="!post.saved"></i>
            </button>
          </div>

          <!-- Likes -->
          <div class="post-likes">
            <p-avatar-group>
              <p-avatar *ngFor="let avatar of getLikeAvatars(post)" [image]="avatar" shape="circle" size="normal"></p-avatar>
            </p-avatar-group>
            <span class="likes-text">{{ 'post.likedBy' | transloco: { count: post.likes } }}</span>
          </div>

          <!-- Caption -->
          <div class="post-caption">
            <a [routerLink]="'/profile/' + post.user.userId" class="caption-user">{{ post.user.username }}</a>
            <span class="caption-text">{{ post.caption }}</span>
          </div>

          <!-- Comments -->
          <div class="post-comments">
            <span class="comments-link" (click)="toggleComments(post.id, false)">{{ 'post.viewComments' | transloco: { count: post.comments } }}</span>
            <span class="comment-time">{{ post.timestamp | date:'d MMM' }}</span>
          </div>

          <!-- Comment Section (Accordion) -->
          @if (isCommentsExpanded(post.id)) {
            @if (currentUserId()) {
              <app-comment-section
                [targetId]="post.id"
                [targetType]="'POST'"
                [currentUserId]="currentUserId()"
                [postAuthorId]="post.user.userId"
                [showForm]="shouldShowCommentForm(post.id)"
                (commentsChanged)="onCommentsChanged(post, $event)"
              />
            } @else {
              <div class="comments-login-prompt">
                <p>Inicia sesión para comentar</p>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .posts-feed {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* ===== GRID MODE ===== */
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .posts-grid {
        grid-template-columns: 1fr;
      }
    }

    .post-card {
      background: var(--surface-card);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .skeleton-post {
      padding: 0.75rem 1rem;
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
      background: var(--primary-color);
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
      background: var(--surface-card);
    }

    .post-image {
      display: block;
      width: 100%;
      max-height: 600px;
      object-fit: contain;
      background: transparent;
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

    .comments-login-prompt {
      padding: 1.5rem 1rem;
      text-align: center;
      background: var(--surface-hover);
      border-top: 1px solid var(--surface-border);
    }

    .comments-login-prompt p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.8125rem;
    }
  `]
})
export class PostFeedComponent {
  posts = input<PostItem[]>([]);
  loading = input(false);
  mode = input<PostViewMode>('feed');
  currentUserId = input<string>('');

  likeToggled = output<PostItem>();
  saveToggled = output<PostItem>();
  commentsChanged = output<{ postId: string; count: number }>();

  // Track which post has comments section open
  expandedComments = signal<Set<string>>(new Set());
  // Track which posts should show the comment form
  showCommentForm = signal<Set<string>>(new Set());

  private readonly likeService = inject(LikeService);

  toggleLike(post: PostItem): void {
    const previousLiked = post.liked;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;

    // Llamar al servicio genérico de likes para persistir
    const userId = this.currentUserId();
    if (userId) {
      const targetType: LikeTargetType = 'POST';
      if (previousLiked) {
        this.likeService.unlike(targetType, post.id, userId).subscribe({
          error: (err: any) => {
            // Revertir el cambio en caso de error
            console.error('Error toggling like:', err);
            post.liked = previousLiked;
            post.likes += post.liked ? 1 : -1;
          }
        });
      } else {
        this.likeService.like(targetType, post.id, userId).subscribe({
          error: (err: any) => {
            // Revertir el cambio en caso de error
            console.error('Error toggling like:', err);
            post.liked = previousLiked;
            post.likes += post.liked ? 1 : -1;
          }
        });
      }
    } else {
      console.warn('No user ID available, like not persisted');
    }

    this.likeToggled.emit(post);
  }

  getLikeAvatars(post: PostItem): string[] {
    // Use real avatars from post if available, otherwise return empty array
    if (post.likeAvatars && post.likeAvatars.length > 0) {
      return post.likeAvatars.slice(0, 3);
    }
    // Return empty array - no hardcoded placeholders
    return [];
  }

  // Generate a deterministic avatar URL based on userId (for debugging)
  private generateAvatarFromUserId(userId: string): string {
    const hash = userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return 'https://i.pravatar.cc/150?img=' + (Math.abs(hash) % 70);
  }

  toggleSave(post: PostItem): void {
    post.saved = !post.saved;
    this.saveToggled.emit(post);
  }

  onCommentsChanged(post: PostItem, count: number): void {
    post.comments = count;
    this.commentsChanged.emit({ postId: post.id, count });
  }

  toggleComments(postId: string, showForm: boolean = false): void {
    this.expandedComments.update(expanded => {
      const newSet = new Set(expanded);
      if (newSet.has(postId)) {
        // Close the accordion
        newSet.delete(postId);
        this.showCommentForm.update(formSet => {
          const newFormSet = new Set(formSet);
          newFormSet.delete(postId);
          return newFormSet;
        });
      } else {
        // Open the accordion
        newSet.add(postId);
        if (showForm) {
          this.showCommentForm.update(formSet => new Set(formSet).add(postId));
        } else {
          this.showCommentForm.update(formSet => {
            const newFormSet = new Set(formSet);
            newFormSet.delete(postId);
            return newFormSet;
          });
        }
      }
      return newSet;
    });
  }

  trackByPostId(index: number, post: PostItem): string {
    return post.id;
  }

  isCommentsExpanded(postId: string): boolean {
    return this.expandedComments().has(postId);
  }

  shouldShowCommentForm(postId: string): boolean {
    return this.showCommentForm().has(postId);
  }
}
