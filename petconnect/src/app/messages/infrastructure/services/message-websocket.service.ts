import { Injectable, inject } from '@angular/core';
import { WebSocketService } from '../../../shared/infrastructure/websocket/websocket.service';
import { Message, SendMessageRequest } from '../../domain/entities/message.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageWebSocketService {
  private readonly webSocketService = inject(WebSocketService);

  sendMessage(request: SendMessageRequest): void {
    this.webSocketService.sendMessage('/app/chat.send', request);
  }

  markAsRead(conversationId: string, messageId?: string): void {
    this.webSocketService.sendMessage('/app/chat.read', {
      messageId: messageId ?? null,
      conversationId
    });
  }

  subscribeToConversation(conversationId: string): Observable<Message> {
    return this.webSocketService.subscribeToConversation(conversationId);
  }

  unsubscribeFromConversation(conversationId: string): void {
    this.webSocketService.unsubscribeFromConversation(conversationId);
  }

  onMessage(): Observable<Message | null> {
    return this.webSocketService.onMessage();
  }

  onNotification(): Observable<any> {
    return this.webSocketService.onNotification();
  }

  /** Indica si un usuario (partnerId) está online, según la presencia vía WebSocket. */
  isUserOnline(userId: string | null | undefined): boolean {
    return this.webSocketService.isUserOnline(userId);
  }

  /** Envía el estado "Escribiendo…" de la conversación activa. */
  sendTyping(conversationId: string, isTyping: boolean): void {
    this.webSocketService.sendTyping(conversationId, isTyping);
  }

  /** Suscribirse a los eventos "Escribiendo…" de una conversación. */
  subscribeToTyping(conversationId: string): Observable<{ userId: string; isTyping: boolean }> {
    return this.webSocketService.subscribeToTyping(conversationId);
  }

  unsubscribeFromTyping(conversationId: string): void {
    this.webSocketService.unsubscribeFromTyping(conversationId);
  }

  /** Indica si el interlocutor está escribiendo en una conversación (reactivo). */
  isTyping(conversationId: string): boolean {
    return this.webSocketService.isTyping(conversationId);
  }

  /** Establece el indicador de escritura para una conversación. */
  setTyping(conversationId: string, isTyping: boolean): void {
    this.webSocketService.setTyping(conversationId, isTyping);
  }
}
