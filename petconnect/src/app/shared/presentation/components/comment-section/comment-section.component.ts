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
      <!-- Comment Form -->
      @if (!editingCommentId()) {
        <app-comment-form
          [targetId]="targetId()"
          [targetType]="targetType()"
          [userId]="currentUserId()"
          (commentCreated)="onCommentCreated($event)"
        />
      }

      <!-- Comments List -->
      <div class="comments-list">
        @if (loading()) {
          <div class="comments-loading">Cargando comentarios...</div>
        } @else if (comments().length === 0) {
          <div class="comments-empty">No hay comentarios aún. ¡Sé el primero!</div>
        } @else {
          @for (comment of comments(); track comment.id) {
            @if (editingCommentId() === comment.id) {
              <app-comment-form
                [targetId]="targetId()"
                [targetType]="targetType()"
                [userId]="currentUserId()"
                [editingCommentId]="editingCommentId()"
                [initialContent]="getCommentContent(comment.id)"
                [buttonText]="'Guardar'"
                (commentUpdated)="onCommentUpdated($event)"
                (commentDeleted)="onCommentDeleted()"
              />
            } @else {
              <app-comment-item
                [comment]="comment"
                [currentUserId]="currentUserId()"
                (editRequested)="startEditing($event)"
                (deleteRequested)="deleteComment($event)"
              />
            }
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
  `]
})
export class CommentSectionComponent {
  private readonly socialService = inject(SocialService);

  // Inputs
  targetId = input.required<string>();
  targetType = input.required<string>();
  currentUserId = input.required<string>();

  // Outputs
  commentsChanged = output<number>();

  // State
  comments = signal<CommentResponse[]>([]);
  loading = signal(false);
  editingCommentId = signal<string | null>(null);

  constructor() {
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
      createdAt: new Date().toISOString()
    };

    this.comments.update(comments => [...comments, newComment]);
    this.commentsChanged.emit(this.comments().length);
  }

  startEditing(commentId: string): void {
    this.editingCommentId.set(commentId);
  }

  onCommentUpdated(event: { id: string; content: string }): void {
    this.comments.update(comments =>
      comments.map(c => c.id === event.id ? { ...c, content: event.content } : c)
    );
    this.editingCommentId.set(null);
  }

  deleteComment(commentId: string): void {
    this.socialService.deleteComment(commentId, this.currentUserId()).subscribe({
      next: () => {
        this.comments.update(comments => comments.filter(c => c.id !== commentId));
        this.commentsChanged.emit(this.comments().length);
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
        alert('Error al eliminar el comentario');
      }
    });
  }

  onCommentDeleted(): void {
    this.editingCommentId.set(null);
    this.loadComments();
  }

  getCommentContent(commentId: string): string {
    const comment = this.comments().find(c => c.id === commentId);
    return comment?.content || '';
  }
}
