import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CommentResponse } from '../../../../social/infrastructure/services/social.service';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
    <div class="comment-item">
      <div class="comment-avatar">
        <img [src]="comment().authorAvatarUrl" [alt]="comment().authorFirstName" class="avatar-img" />
      </div>
      <div class="comment-content">
        <div class="comment-header">
          <a [routerLink]="'/profile/' + comment().userId" class="comment-author">
            {{ comment().authorFirstName }} {{ comment().authorLastName }}
          </a>
          <span class="comment-text">{{ comment().content }}</span>
        </div>
        <div class="comment-actions">
          <span class="comment-time">{{ formatDate(comment().createdAt) }}</span>
          @if (isAuthor()) {
            <button class="comment-action-btn" (click)="onEdit()">Editar</button>
            <button class="comment-action-btn delete" (click)="onDelete()">Eliminar</button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .comment-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
    }

    .comment-avatar {
      flex-shrink: 0;
    }

    .avatar-img {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      object-fit: cover;
    }

    .comment-content {
      flex: 1;
      min-width: 0;
    }

    .comment-header {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .comment-author {
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--text-primary);
      text-decoration: none;
      line-height: 1.3;
    }

    .comment-author:hover {
      text-decoration: underline;
    }

    .comment-text {
      font-size: 0.8125rem;
      color: var(--text-primary);
      line-height: 1.4;
      word-wrap: break-word;
    }

    .comment-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.375rem;
    }

    .comment-time {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
    }

    .comment-action-btn {
      background: none;
      border: none;
      color: var(--text-tertiary);
      font-size: 0.6875rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      transition: color var(--transition-fast);
    }

    .comment-action-btn:hover {
      color: var(--text-primary);
    }

    .comment-action-btn.delete:hover {
      color: #ef4444;
    }
  `]
})
export class CommentItemComponent {
  // Inputs
  comment = input.required<CommentResponse>();
  currentUserId = input<string>('');

  // Outputs
  editRequested = output<string>();
  deleteRequested = output<string>();

  isAuthor(): boolean {
    return this.currentUserId() === this.comment().userId;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  onEdit(): void {
    this.editRequested.emit(this.comment().id);
  }

  onDelete(): void {
    if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      this.deleteRequested.emit(this.comment().id);
    }
  }
}
