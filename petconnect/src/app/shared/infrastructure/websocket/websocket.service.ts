import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Client, StompHeaders, StompSubscription } from '@stomp/stompjs';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, NotificationDTO } from '../../../messages/domain/entities/message.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private readonly authService = inject(AuthService);
  private readonly wsUrl = environment.wsUrl;

  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();

  private readonly _connected = signal<boolean>(false);
  private readonly _messages = signal<Message[]>([]);
  private readonly _unreadCount = signal<number>(0);

  readonly connected = this._connected.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();

  private messageSubject = new BehaviorSubject<Message>(null as any);
  private notificationSubject = new BehaviorSubject<NotificationDTO>(null as any);

  constructor() {
    // Reconectar automáticamente cuando el token cambie
    effect(() => {
      const token = this.authService.token();
      if (token && !this._connected()) {
        this.connect();
      } else if (!token && this._connected()) {
        this.disconnect();
      }
    });
  }

  connect(): void {
    const token = this.authService.token();
    if (!token || this.client?.active) {
      return;
    }

    this.client = new Client({
      brokerURL: `${this.wsUrl}/ws`,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this._connected.set(true);
        this.subscribeToNotifications();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this._connected.set(false);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        this._connected.set(false);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this._connected.set(false);
    }
  }

  private subscribeToNotifications(): void {
    if (!this.client?.active) return;

    const subscription = this.client.subscribe('/user/queue/notifications', (message) => {
      const notification: NotificationDTO = JSON.parse(message.body);
      this.notificationSubject.next(notification);
      this._unreadCount.update(count => count + 1);
    });

    this.subscriptions.set('notifications', subscription);
  }

  subscribeToConversation(conversationId: string): Observable<Message> {
    if (!this.client?.active) {
      return this.messageSubject.asObservable();
    }

    const subscription = this.client.subscribe(
      `/topic/conversations/${conversationId}`,
      (message) => {
        const msg: Message = JSON.parse(message.body);
        this.messageSubject.next(msg);
        this._messages.update(msgs => [...msgs, msg]);
      }
    );

    this.subscriptions.set(`conversation-${conversationId}`, subscription);
    return this.messageSubject.asObservable();
  }

  unsubscribeFromConversation(conversationId: string): void {
    const subscription = this.subscriptions.get(`conversation-${conversationId}`);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(`conversation-${conversationId}`);
    }
  }

  sendMessage(destination: string, body: any): void {
    if (!this.client?.active) {
      console.warn('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body)
    });
  }

  onMessage(): Observable<Message | null> {
    return this.messageSubject.asObservable();
  }

  onNotification(): Observable<NotificationDTO | null> {
    return this.notificationSubject.asObservable();
  }

  resetUnreadCount(): void {
    this._unreadCount.set(0);
  }
}
