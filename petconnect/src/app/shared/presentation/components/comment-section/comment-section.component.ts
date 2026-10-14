import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentItemComponent } from '../comment-item/comment-item.component';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { SocialService, CommentResponse } from '../../../../social/infrastructure/services/social.service';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [TranslocoModule, CommonModule, CommentItemComponent, CommentFormComponent],
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
            [placeholder]="this.i18n.translate('commentSection.replyPlaceholder')"
            (commentCreated)="onReplyCreated($event)"
          />
          <button class="cancel-reply-btn" (click)="cancelReply()">{{ this.i18n.translate('commentSection.cancel') }}</button>
        </div>
      }

      <!-- Comments List -->
      <div class="comments-list">
        @if (loading()) {
          <div class="comments-loading">{{ this.i18n.translate('commentSection.loading') }}</div>
        } @else if (comments().length === 0) {
          <div class="comments-empty">{{ this.i18n.translate('commentSection.empty') }}</div>
        } @else {
          @for (comment of comments(); track comment.id) {
            <app-comment-item
              [comment]="comment"
              [currentUserId]="currentUserId()"
              [postAuthorId]="postAuthorId()"
              [canModerateSolution]="canModerateSolutions()"
              (replyRequested)="startReply($event)"
              (deleteRequested)="deleteComment($event)"
              (solutionToggled)="toggleSolution($event)"
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
  readonly i18n = inject(TranslocoService);
  private readonly socialService = inject(SocialService);

  // Inputs
  targetId = input.required<string>();
  targetType = input.required<string>();
  currentUserId = input.required<string>();
  postAuthorId = input<string>('');
  showForm = input(true);
  /** El post es una pregunta: habilita marcar respuestas como solución. */
  isQuestion = input(false);
  /** La pregunta ya tiene una respuesta marcada como solución. */
  isSolved = input(false);

  // Outputs
  commentsChanged = output<number>();
  /** Avisa de que cambió el estado de solución para refrescar el badge del post. */
  solutionChanged = output<{ solved: boolean; solutionCommentId: string | null }>();

  // State
  comments = signal<CommentResponse[]>([]);
  loading = signal(false);
  replyingToId = signal<string | null>(null);
  replyingToName = signal('');
  solutionBusy = signal<string | null>(null);

  /** El usuario actual es el autor del post y por tanto puede elegir solución. */
  readonly canModerateSolutions = computed(
    () => this.isQuestion() && !!this.postAuthorId() && this.postAuthorId() === this.currentUserId()
  );

  /** Id del comentario marcado como solución, si lo hay. */
  readonly solutionCommentId = computed(
    () => this.comments().find(c => c.solution)?.id ?? null
  );

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
      authorFirstName: this.i18n.translate('commentSection.you'),
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
    this.replyingToName.set(comment ? `${comment.authorFirstName} ${comment.authorLastName}`.trim() || this.i18n.translate('commentSection.user') : 'usuario');
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
      authorFirstName: this.i18n.translate('commentSection.you'),
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
        alert(this.i18n.translate('commentSection.deleteError'));
      }
    });
  }

  /**
   * Marca o retira la solución. El backend es la autoridad: valida que el
   * llamante sea el autor de la pregunta y que el post sea realmente una
   * pregunta. En errores se recarga el estado real desde el servidor.
   */
  toggleSolution(comment: CommentResponse): void {
    if (!this.canModerateSolutions() || this.solutionBusy()) {
      return;
    }

    const wasSolution = comment.solution === true;
    this.solutionBusy.set(comment.id);

    const request = wasSolution
      ? this.socialService.clearCommentSolution(this.targetId())
      : this.socialService.markCommentAsSolution(this.targetId(), comment.id);

    request.subscribe({
      next: () => {
        // El backend deja una única solución activa: reconstruimos la marca.
        this.comments.update(list =>
          list.map(c => ({ ...c, solution: wasSolution ? false : c.id === comment.id }))
        );
        this.solutionBusy.set(null);
        this.solutionChanged.emit({
          solved: !wasSolution,
          solutionCommentId: wasSolution ? null : comment.id,
        });
      },
      error: (err) => {
        console.error('Error updating solution:', err);
        this.solutionBusy.set(null);
        alert(this.i18n.translate('post.postIntent.solutionError'));
        // Recargar para no dejar la interfaz en un estado inventado.
        this.loadComments();
      },
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
