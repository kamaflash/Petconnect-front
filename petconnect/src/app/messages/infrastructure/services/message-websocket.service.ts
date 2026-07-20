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

  markAsRead(messageId: string, conversationId: string): void {
    this.webSocketService.sendMessage('/app/chat.read', {
      messageId,
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
}
