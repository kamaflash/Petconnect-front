import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { MessagesApiService } from '../../../messages/infrastructure/services/messages-api.service';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message, NotificationDTO } from '../../../messages/domain/entities/message.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private readonly authService = inject(AuthService);
  private readonly messagesApi = inject(MessagesApiService);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly wsUrl = environment.wsUrl;

  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();

  // Conversaciones cuya suscripción al topic quedó pendiente hasta que el
  // WebSocket termine de conectar (así no se pierde el tiempo real si se
  // selecciona la conversación antes de que el WS esté listo).
  private pendingConversations = new Set<string>();

  private readonly _connected = signal<boolean>(false);
  private readonly _messages = signal<Message[]>([]);
  private readonly _unreadCount = signal<number>(0);

  // Estado online por usuario (userId -> boolean). Signal reactivo para que las
  // vistas se actualicen correctamente bajo zoneless change detection.
  private readonly _onlineUsers = signal<Record<string, boolean>>({});

  // Indicador de "está escribiendo" por conversación (señal reactiva).
  private readonly _typingByConversation = signal<Record<string, boolean>>({});

  // Suscripciones activas a typing por conversación
  private readonly _typingSubs = new Map<string, StompSubscription>();

  // Conversaciones cuyo typing quedó pendiente hasta que el WebSocket conecte.
  private pendingTyping = new Set<string>();

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
        // Cargar el total de mensajes no leídos desde el servidor.
        this.refreshUnreadCount();
        // Inicializar presencia con el snapshot actual y suscribir los topics
        // de conversaciones que quedaron pendientes antes de conectar.
        this.loadPresenceSnapshot();
        this.subscribePendingConversations();
        this.subscribePendingTypings();
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
      // Solo contabilizamos los mensajes nuevos como "no leídos".
      if (notification.type === 'NEW_MESSAGE') {
        this._unreadCount.update(count => count + 1);
      }
    });

    this.subscriptions.set('notifications', subscription);

    // Presencia online: el backend publica {userId, online} en /topic/users/online
    // cada vez que un usuario conecta/desconecta una sesión WebSocket.
    const presenceSubscription = this.client.subscribe('/topic/users/online', (message) => {
      const data: { userId: string; online: boolean } = JSON.parse(message.body);
      this._onlineUsers.update(map => ({ ...map, [data.userId]: data.online }));
    });

    this.subscriptions.set('presence', presenceSubscription);
  }

  subscribeToConversation(conversationId: string): Observable<Message> {
    if (!this.client?.active) {
      // Todavía no conectado: lo encolamos y al conectar nos suscribimos al topic.
      this.pendingConversations.add(conversationId);
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

    this.pendingConversations.delete(conversationId);
    this.subscriptions.set(`conversation-${conversationId}`, subscription);
    return this.messageSubject.asObservable();
  }

  /** Crea las suscripciones a topics de conversaciones que quedaron pendientes al conectar. */
  private subscribePendingConversations(): void {
    if (!this.client?.active) return;
    const pending = Array.from(this.pendingConversations);
    this.pendingConversations.clear();
    for (const conversationId of pending) {
      this.subscribeToConversation(conversationId);
    }
  }

  /** Re-aprovecha las suscripciones de "está escribiendo" que quedaron pendientes al conectar. */
  private subscribePendingTypings(): void {
    if (!this.client?.active) return;
    const pending = Array.from(this.pendingTyping);
    this.pendingTyping.clear();
    for (const conversationId of pending) {
      this.subscribeToTyping(conversationId).subscribe();
    }
  }

  /** Carga el snapshot de usuarios online desde el backend (GET /presence/online). */
  private loadPresenceSnapshot(): void {
    this.http.get<string[]>(`${this.apiUrl}/presence/online`).subscribe({
      next: (userIds) => {
        const map: Record<string, boolean> = {};
        for (const id of userIds) map[id] = true;
        this._onlineUsers.set(map);
      },
      error: (err) => console.error('Error cargando presencia online', err)
    });
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

  /** Recarga el total de mensajes no leídos directamente desde el backend. */
  refreshUnreadCount(): void {
    this.messagesApi.getUnreadCount().subscribe({
      next: (count) => this._unreadCount.set(count),
      error: (err) => console.error('Error cargando contador de mensajes no leídos', err)
    });
  }

  /** Resta `by` mensajes del contador global de no leídos (p. ej. al leer una conversación). */
  decrementUnreadCount(by = 1): void {
    this._unreadCount.update(count => Math.max(0, count - by));
  }

  // -------------------------------------------------------
  // Estado de presencia online (reactivo)
  // -------------------------------------------------------

  /** Actualizar estado online de un usuario (vía /topic/users/online). */
  setUserOnline(userId: string, online: boolean): void {
    this._onlineUsers.update(map => ({ ...map, [userId]: online }));
  }

  /** Verificar si un usuario está online (signal reactivo). */
  isUserOnline(userId: string | null | undefined): boolean {
    if (!userId) return false;
    return this._onlineUsers()[userId] === true;
  }

  // -------------------------------------------------------
  // Indicador de "está escribiendo"
  // -------------------------------------------------------

  // -------------------------------------------------------
  // Indicador de "está escribiendo"
  // -------------------------------------------------------

  /** Establecer indicador de escritura (para el resto de participantes). */
  setTyping(conversationId: string, isTyping: boolean): void {
    this._typingByConversation.update(m => ({ ...m, [conversationId]: isTyping }));
  }

  /** Verificar si el interlocutor está escribiendo en la conversación (reactivo). */
  isTyping(conversationId: string): boolean {
    return this._typingByConversation()[conversationId] === true;
  }

  /** Publica el estado "Escribiendo…" en /app/chat.typing para una conversación. */
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.client?.active) return;
    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId, isTyping })
    });
  }

  /** Suscribirse a eventos de typing de una conversación */
  subscribeToTyping(conversationId: string): Observable<{userId: string, isTyping: boolean}> {
    if (!this.client?.active) {
      // Queda pendiente hasta que el WebSocket conecte.
      this.pendingTyping.add(conversationId);
      return new Observable<{userId: string, isTyping: boolean}>(observer => { observer.complete(); });
    }

    if (this._typingSubs.has(conversationId)) {
      this._typingSubs.get(conversationId)?.unsubscribe();
    }

    const me = this.authService.user()?.id;
    const subscription = this.client.subscribe(
      `/topic/conversations/${conversationId}/typing`,
      (message) => {
        const data: {userId: string, isTyping: boolean} = JSON.parse(message.body);
        // Ignorar el propio typing para no mostrar "Escribiendo…" a uno mismo.
        if (data.userId && data.userId !== me) {
          this._typingByConversation.update(m => ({ ...m, [conversationId]: data.isTyping }));
        }
      }
    );

    this._typingSubs.set(conversationId, subscription);
    return new Observable<{userId: string, isTyping: boolean}>(observer => {
      return () => {
        subscription.unsubscribe();
        this._typingSubs.delete(conversationId);
      };
    });
  }

  unsubscribeFromTyping(conversationId: string): void {
    this.pendingTyping.delete(conversationId);
    const subscription = this._typingSubs.get(conversationId);
    if (subscription) {
      subscription.unsubscribe();
      this._typingSubs.delete(conversationId);
    }
    this._typingByConversation.update(m => ({ ...m, [conversationId]: false }));
  }

  unsubscribeFromConversation(conversationId: string): void {
    this.pendingConversations.delete(conversationId);
    const key = `conversation-${conversationId}`;
    const subscription = this.subscriptions.get(key);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }
}
