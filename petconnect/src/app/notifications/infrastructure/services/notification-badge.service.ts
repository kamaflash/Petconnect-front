import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { SocialService } from '../../../social/infrastructure/services/social.service';
import { WebSocketService } from '../../../shared/infrastructure/websocket/websocket.service';

@Injectable({ providedIn: 'root' })
export class NotificationBadgeService {
  private readonly authService = inject(AuthService);
  private readonly socialService = inject(SocialService);
  private readonly webSocket = inject(WebSocketService);
  private countRequest?: Subscription;

  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly hasUnread = computed(() => this._unreadCount() > 0);

  constructor() {
    effect(() => {
      const userId = this.authService.user()?.id;
      if (!userId) {
        this.countRequest?.unsubscribe();
        this._unreadCount.set(0);
        return;
      }
      this.refresh(userId);
    });

    this.webSocket.onNotification().subscribe((notification) => {
      if (notification && notification.type !== 'NEW_MESSAGE') {
        this.refresh();
      }
    });
  }

  refresh(userId = this.authService.user()?.id): void {
    if (!userId) {
      this._unreadCount.set(0);
      return;
    }

    this.countRequest?.unsubscribe();
    this.countRequest = this.socialService.getUnreadNotificationCount(userId).subscribe({
      next: (count) => this._unreadCount.set(count),
      error: (error) => console.error('Error cargando el contador de notificaciones no leídas', error)
    });
  }
}
