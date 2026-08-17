import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import {
  ConversationDTO,
  Message,
  MessagePage
} from '../../domain/entities/message.model';

export interface UserProfileResponse {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  profileType: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getConversations(): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.apiUrl}/conversations`);
  }

  createConversation(otherUserId: string): Observable<ConversationDTO> {
    return this.http.post<ConversationDTO>(`${this.apiUrl}/conversations`, {
      otherUserId
    });
  }

  getMessages(
    conversationId: string,
    page = 0,
    size = 50
  ): Observable<MessagePage> {
    return this.http.get<MessagePage>(
      `${this.apiUrl}/conversations/${conversationId}/messages?page=${page}&size=${size}`
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/messages/unread-count`);
  }

  /** Envía y persiste un mensaje (vía REST, almacenamiento garantizado). */
  sendMessage(
    conversationId: string,
    request: { receiverId: string; content: string; type: string }
  ): Observable<Message> {
    return this.http.post<Message>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      request
    );
  }

  /** Usuarios disponibles para iniciar una nueva conversación. */
  getAllProfiles(): Observable<UserProfileResponse[]> {
    return this.http.get<UserProfileResponse[]>(`${this.apiUrl}/users/profiles`);
  }
}