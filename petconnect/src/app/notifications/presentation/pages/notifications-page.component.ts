import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import {
  NotificationResponse,
  SocialService,
} from '../../../social/infrastructure/services/social.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SkeletonModule,
    ToastModule,
    TranslocoModule,
    PageHeadingCardComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="page-content">
      <app-page-heading-card
        [title]="'notifications.title' | transloco"
        [subtitle]="'notifications.subtitle' | transloco"
      >
        <button
          page-heading-actions
          type="button"
          class="mark-all-btn"
          [disabled]="unreadCount() === 0 || loading()"
          [title]="'notifications.markAllRead' | transloco"
          (click)="markAllAsRead()"
        >
          <i class="pi pi-check-double" aria-hidden="true"></i>
          <span>{{ 'notifications.markAllRead' | transloco }}</span>
        </button>
      </app-page-heading-card>

      <section class="notifications-card card-modern" [attr.aria-busy]="loading()">
        @if (loading()) {
          @for (row of skeletonRows; track row) {
            <div class="notification-item" aria-hidden="true">
              <span class="notification-icon"><i class="pi pi-bell"></i></span>
              <div class="notification-body">
                <p-skeleton width="45%" height="0.85rem" styleClass="mb-2" />
                <p-skeleton width="75%" height="0.85rem" />
              </div>
            </div>
          }
        } @else if (hasError()) {
          <div class="state-box" role="alert">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
            <h2>{{ 'notifications.errorLoad' | transloco }}</h2>
            <button
              pButton
              type="button"
              class="p-button-outlined p-button-sm"
              [label]="'notifications.retry' | transloco"
              (click)="load()"
            ></button>
          </div>
        } @else if (notifications().length === 0) {
          <div class="state-box">
            <i class="pi pi-bell" aria-hidden="true"></i>
            <h2>{{ 'notifications.empty' | transloco }}</h2>
            <p>{{ 'notifications.emptyDesc' | transloco }}</p>
          </div>
        } @else {
          <div class="list-header">
            <span class="unread-badge">
              {{ 'notifications.unreadCount' | transloco: { n: unreadCount() } }}
            </span>
          </div>
          <ul class="notifications-list">
            @for (item of notifications(); track item.id) {
              <li
                class="notification-item"
                [class.unread]="!item.read"
                role="button"
                tabindex="0"
                (click)="onSelect(item)"
                (keydown.enter)="onSelect(item)"
              >
                <span class="notification-icon" [ngClass]="toneFor(item.type)">
                  <i [class]="iconFor(item.type)" aria-hidden="true"></i>
                </span>
                <div class="notification-body">
                  <p class="notification-content">{{ item.content }}</p>
                  <div class="notification-meta">
                    <span class="notification-time">{{ getTimeAgo(item.createdAt) }}</span>
                    @if (!item.read) {
                      <span
                        class="unread-dot"
                        [attr.aria-label]="'notifications.markRead' | transloco"
                      ></span>
                    }
                  </div>
                </div>
                @if (!item.read) {
                  <button
                    pButton
                    type="button"
                    icon="pi pi-check"
                    class="p-button-text p-button-sm read-btn"
                    [attr.title]="'notifications.markRead' | transloco"
                    (click)="$event.stopPropagation(); markAsRead(item)"
                  ></button>
                }
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-content {
      max-width: var(--max-page-width);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .mark-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 999px;
      padding: 0.5rem 1rem;
    }

    .mark-all-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .notifications-card {
      overflow: hidden;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      background: var(--surface-card);
    }

    .list-header {
      display: flex;
      justify-content: flex-end;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .unread-badge {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--primary-color);
    }

    .notifications-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item:hover {
      background-color: color-mix(in srgb, var(--primary-color) 5%, var(--surface-card));
    }

    .notification-item:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }

    .notification-item.unread {
      background-color: color-mix(in srgb, var(--primary-color) 8%, var(--surface-card));
    }

    .notification-icon {
      flex: 0 0 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      color: var(--primary-color);
    }

    .notification-icon.tone-like {
      background: color-mix(in srgb, #ec4899 15%, transparent);
      color: #ec4899;
    }

    .notification-icon.tone-comment {
      background: color-mix(in srgb, #3b82f6 15%, transparent);
      color: #3b82f6;
    }

    .notification-icon.tone-follow {
      background: color-mix(in srgb, #8b5cf6 15%, transparent);
      color: #8b5cf6;
    }

    .notification-body {
      flex: 1;
      min-width: 0;
    }

    .notification-content {
      margin: 0 0 0.25rem;
      color: var(--text-primary);
      font-size: 0.95rem;
      overflow-wrap: anywhere;
    }

    .notification-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .notification-time {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .unread-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--primary-color);
      flex-shrink: 0;
    }

    .read-btn {
      align-self: center;
      flex-shrink: 0;
    }

    .state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 3rem 1.5rem;
      text-align: center;
      color: var(--text-secondary);
    }

    .state-box i {
      font-size: 2.25rem;
      color: var(--primary-color);
    }

    .state-box h2 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--text-primary);
    }

    .state-box p {
      margin: 0;
      max-width: 28rem;
    }

    @media (max-width: 600px) {
      .mark-all-btn span {
        display: none;
      }

      .notification-item {
        padding: 0.85rem 1rem;
      }
    }
  `],
})
export class NotificationsPageComponent implements OnInit {
  private readonly socialService = inject(SocialService);
  private readonly authService = inject(AuthService);
  private readonly transloco = inject(TranslocoService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly notifications = signal<NotificationResponse[]>([]);
  readonly loading = signal(true);
  readonly hasError = signal(false);
  readonly skeletonRows = [0, 1, 2, 3, 4];

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const userId = this.authService.user()?.id;
    this.loading.set(true);
    this.hasError.set(false);

    if (!userId) {
      this.notifications.set([]);
      this.loading.set(false);
      return;
    }

    this.socialService.getNotifications(userId).subscribe({
      next: (items) => {
        this.notifications.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.loading.set(false);
      },
    });
  }

  markAsRead(notification: NotificationResponse): void {
    if (notification.read) return;

    this.socialService.markNotificationAsRead(notification.id).subscribe({
      next: (updated) => this.patchNotification(updated),
      error: () => this.notifyUpdateError(),
    });
  }

  markAllAsRead(): void {
    const userId = this.authService.user()?.id;
    if (!userId || this.unreadCount() === 0) return;

    this.socialService.markAllNotificationsAsRead(userId).subscribe({
      next: () => {
        this.notifications.set(
          this.notifications().map((n) => ({ ...n, read: true }))
        );
        this.messageService.add({
          severity: 'success',
          detail: this.transloco.translate('notifications.allMarkedRead'),
        });
      },
      error: () => this.notifyUpdateError(),
    });
  }

  onSelect(notification: NotificationResponse): void {
    this.markAsRead(notification);
    const target = this.targetRoute(notification);
    if (target) {
      void this.router.navigate(target);
    }
  }

  /** Navega al recurso asociado según el tipo de referencia. */
  private targetRoute(notification: NotificationResponse): string[] | null {
    if (!notification.referenceId) return null;

    switch ((notification.referenceType || '').toUpperCase()) {
      case 'POST':
        return ['/social/posts', notification.referenceId];
      case 'EVENT':
        return ['/events'];
      case 'GROUP':
        return ['/social'];
      case 'PRODUCT':
      case 'LISTING':
        return ['/marketplace'];
      case 'LOSTPET':
      case 'LOST_PET':
        return ['/lostpets', notification.referenceId];
      case 'ADOPTION':
      case 'ADOPTION_REQUEST':
      case 'ADOPTION_UPDATE':
        return ['/adoptions'];
      default:
        return null;
    }
  }

  private patchNotification(updated: NotificationResponse): void {
    this.notifications.set(
      this.notifications().map((n) => (n.id === updated.id ? updated : n))
    );
  }

  private notifyUpdateError(): void {
    this.messageService.add({
      severity: 'error',
      detail: this.transloco.translate('notifications.errorUpdate'),
    });
  }

  /** Icono PrimeNG según el tipo de notificación. */
  iconFor(type: string): string {
    const icons: Record<string, string> = {
      like: 'pi pi-heart-fill',
      comment: 'pi pi-comment',
      follow: 'pi pi-user-plus',
      mention: 'pi pi-at',
      achievement: 'pi pi-star-fill',
      ADOPTION_REQUEST: 'pi pi-heart',
      ADOPTION_UPDATE: 'pi pi-paw',
    };
    return icons[type] || 'pi pi-bell';
  }

  /** Tono de color del icono según la categoría. */
  toneFor(type: string): string {
    if (type === 'like' || type === 'achievement') return 'tone-like';
    if (type === 'comment') return 'tone-comment';
    if (type === 'follow' || type === 'mention') return 'tone-follow';
    return 'tone-system';
  }

  getTimeAgo(isoDate: string): string {
    const date = new Date(isoDate);
    const diff = Date.now() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) return date.toLocaleDateString();
    if (days > 0) {
      return this.transloco.translate(days > 1 ? 'notifications.time.days' : 'notifications.time.day', { n: days });
    }
    if (hours > 0) {
      return this.transloco.translate(hours > 1 ? 'notifications.time.hours' : 'notifications.time.hour', { n: hours });
    }
    if (minutes > 0) {
      return this.transloco.translate(minutes > 1 ? 'notifications.time.minutes' : 'notifications.time.minute', { n: minutes });
    }
    return this.transloco.translate('notifications.time.moments');
  }
}
