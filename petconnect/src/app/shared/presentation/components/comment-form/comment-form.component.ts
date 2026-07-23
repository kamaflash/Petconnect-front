import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SocialService, CreateCommentRequest, UpdateCommentRequest, CommentResponse } from '../../../../social/infrastructure/services/social.service';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="comment-form">
      <input
        type="text"
        [value]="content()"
        (input)="onInput($event)"
        (keydown.enter)="onSubmit()"
        [placeholder]="placeholder()"
        class="comment-input"
        [disabled]="loading()"
        maxlength="500"
      />
      <button
        type="button"
        class="comment-submit-btn"
        [disabled]="loading() || !content().trim()"
        (click)="onSubmit()"
      >
        {{ loading() ? '...' : (buttonText() || 'Publicar') }}
      </button>
    </div>
  `,
  styles: [`
    .comment-form {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--surface-border);
    }

    .comment-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text-primary);
      font-size: 0.8125rem;
      padding: 0.5rem;
    }

    .comment-input::placeholder {
      color: var(--text-tertiary);
    }

    .comment-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .comment-submit-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      font-weight: 600;
      cursor: pointer;
      font-size: 0.8125rem;
      opacity: 0.6;
      transition: all var(--transition-fast);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      white-space: nowrap;
    }

    .comment-submit-btn:hover:not(:disabled) {
      opacity: 1;
      background: var(--primary-color-light);
    }

    .comment-submit-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `]
})
export class CommentFormComponent implements OnInit {
  private readonly socialService = inject(SocialService);

  // Inputs
  targetId = input.required<string>();
  targetType = input.required<string>();
  userId = input.required<string>();
  parentId = input<string | null>(null);
  placeholder = input<string>('Añade un comentario...');
  buttonText = input<string>('Publicar');
  editingCommentId = input<string | null>(null);
  initialContent = input<string>('');

  // Outputs
  commentCreated = output<{ id: string; content: string }>();
  commentUpdated = output<{ id: string; content: string }>();
  commentDeleted = output<void>();

  // State
  content = signal('');
  loading = signal(false);

  ngOnInit(): void {
    if (this.editingCommentId()) {
      this.content.set(this.initialContent());
    }
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.content.set(value);
  }

  onSubmit(): void {
    const contentValue = this.content().trim();
    if (!contentValue || this.loading()) {
      return;
    }

    this.loading.set(true);

    if (this.editingCommentId()) {
      // Update existing comment
      const request: UpdateCommentRequest = {
        userId: this.userId(),
        content: contentValue
      };

      this.socialService.updateComment(this.editingCommentId()!, request).subscribe({
        next: (response: CommentResponse) => {
          this.content.set('');
          this.loading.set(false);
          this.commentUpdated.emit({ id: response.id, content: response.content });
        },
        error: (err: any) => {
          console.error('Error updating comment:', err);
          this.loading.set(false);
        }
      });
    } else {
      // Create new comment
      const request: CreateCommentRequest = {
        userId: this.userId(),
        targetId: this.targetId(),
        targetType: this.targetType(),
        content: contentValue,
        parentId: this.parentId() || null
      };

      this.socialService.createComment(request).subscribe({
        next: (response: CommentResponse) => {
          this.content.set('');
          this.loading.set(false);
          this.commentCreated.emit({ id: response.id, content: response.content });
        },
        error: (err: any) => {
          console.error('Error creating comment:', err);
          this.loading.set(false);
        }
      });
    }
  }
}
