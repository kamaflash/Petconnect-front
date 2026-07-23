import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentItemComponent } from '../comment-item/comment-item.component';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { SocialService, CommentResponse } from '../../../../social/infrastructure/services/social.service';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, CommentItemComponent, CommentFormComponent],
  template: `
    <div class="comment-section">
      <!-- Comment Form (for new top-level comment) -->
      @if (!replyingToId() && showForm()) {
        <app-comment-form
          [targetId]="targetId()"
          [targetType]="targetType()"
          [userId]="currentUserId()"
          (commentCreated)="onCommentCreated($event)"
        />
      }

      <!-- Reply Form (shown when replying to a specific comment) -->
      @if (replyingToId()) {
        <div class="reply-form-container">
          <span class="reply-label">Respondiendo a {{ replyingToName() }}</span>
          <app-comment-form
            [targetId]="targetId()"
            [targetType]="targetType()"
            [userId]="currentUserId()"
            [parentId]="replyingToId()"
            [placeholder]="'Escribe una respuesta...'"
            (commentCreated)="onReplyCreated($event)"
          />
          <button class="cancel-reply-btn" (click)="cancelReply()">Cancelar</button>
        </div>
      }

      <!-- Comments List -->
      <div class="comments-list">
        @if (loading()) {
          <div class="comments-loading">Cargando comentarios...</div>
        } @else if (comments().length === 0) {
          <div class="comments-empty">No hay comentarios aún. ¡Sé el primero!</div>
        } @else {
          @for (comment of comments(); track comment.id) {
            <app-comment-item
              [comment]="comment"
              [currentUserId]="currentUserId()"
              [postAuthorId]="postAuthorId()"
              (replyRequested)="startReply($event)"
              (deleteRequested)="deleteComment($event)"
            />
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .comment-section {
      border-top: 1px solid var(--surface-border);
    }

    .comments-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .comments-loading {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--text-tertiary);
      font-size: 0.8125rem;
    }

    .comments-empty {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--text-tertiary);
      font-size: 0.8125rem;
    }

    .reply-form-container {
      border-top: 1px solid var(--surface-border);
      background: var(--surface-hover);
    }

    .reply-label {
      display: block;
      padding: 0.5rem 1rem 0;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .cancel-reply-btn {
      display: block;
      width: 100%;
      background: none;
      border: none;
      padding: 0.25rem 1rem 0.5rem;
      text-align: left;
      color: var(--text-tertiary);
      font-size: 0.75rem;
      cursor: pointer;
    }

    .cancel-reply-btn:hover {
      color: var(--text-primary);
    }
  `]
})
export class CommentSectionComponent {
  private readonly socialService = inject(SocialService);

  // Inputs
  targetId = input.required<string>();
  targetType = input.required<string>();
  currentUserId = input.required<string>();
  postAuthorId = input<string>('');
  showForm = input(true);

  // Outputs
  commentsChanged = output<number>();

  // State
  comments = signal<CommentResponse[]>([]);
  loading = signal(false);
  replyingToId = signal<string | null>(null);
  replyingToName = signal('');

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.loading.set(true);
    this.socialService.getComments(this.targetType(), this.targetId()).subscribe({
      next: (data) => {
        this.comments.set(data);
        this.loading.set(false);
        this.commentsChanged.emit(data.length);
      },
      error: (err) => {
        console.error('Error loading comments:', err);
        this.loading.set(false);
      }
    });
  }

  onCommentCreated(event: { id: string; content: string }): void {
    const newComment: CommentResponse = {
      id: event.id,
      userId: this.currentUserId(),
      targetId: this.targetId(),
      targetType: this.targetType(),
      content: event.content,
      authorFirstName: 'Tú',
      authorLastName: '',
      authorAvatarUrl: '',
      createdAt: new Date().toISOString(),
      parentId: null,
      replies: []
    };

    this.comments.update(comments => [...comments, newComment]);
    this.commentsChanged.emit(this.comments().length);
  }

  startReply(commentId: string): void {
    const comment = this.findComment(commentId);
    this.replyingToName.set(comment ? `${comment.authorFirstName} ${comment.authorLastName}`.trim() || 'Usuario' : 'usuario');
    this.replyingToId.set(commentId);
  }

  onReplyCreated(event: { id: string; content: string }): void {
    const parentId = this.replyingToId();
    if (!parentId) return;

    const newReply: CommentResponse = {
      id: event.id,
      userId: this.currentUserId(),
      targetId: this.targetId(),
      targetType: this.targetType(),
      content: event.content,
      authorFirstName: 'Tú',
      authorLastName: '',
      authorAvatarUrl: '',
      createdAt: new Date().toISOString(),
      parentId: parentId,
      replies: []
    };

    // Add reply to parent comment
    this.comments.update(comments =>
      comments.map(c => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), newReply] };
        }
        return c;
      })
    );

    this.replyingToId.set(null);
    this.replyingToName.set('');
    this.commentsChanged.emit(this.comments().length);
  }

  cancelReply(): void {
    this.replyingToId.set(null);
    this.replyingToName.set('');
  }

  deleteComment(commentId: string): void {
    this.socialService.deleteComment(commentId, this.currentUserId()).subscribe({
      next: () => {
        // Try to remove from top-level comments first
        let removed = false;
        this.comments.update(comments => {
          const filtered = comments.filter(c => c.id !== commentId);
          if (filtered.length !== comments.length) {
            removed = true;
            return filtered;
          }
          // If not top-level, remove from replies
          return comments.map(c => {
            if (c.replies) {
              return { ...c, replies: c.replies.filter(r => r.id !== commentId) };
            }
            return c;
          });
        });
        this.commentsChanged.emit(this.comments().length);
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
        alert('Error al eliminar el comentario');
      }
    });
  }

  private findComment(commentId: string): CommentResponse | undefined {
    // Search top-level
    const topLevel = this.comments().find(c => c.id === commentId);
    if (topLevel) return topLevel;
    // Search in replies
    for (const c of this.comments()) {
      if (c.replies) {
        const reply = c.replies.find(r => r.id === commentId);
        if (reply) return reply;
      }
    }
    return undefined;
  }
}
