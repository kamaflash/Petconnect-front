export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  attachmentUrl?: string | null;
  createdAt: string;
  readAt?: string | null;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  title: string;
  isGroup: boolean;
  createdAt: string;
  updatedAt?: string | null;
  lastMessageId?: string | null;
  lastMessageAt?: string | null;
}

/**
 * Resumen de una conversación tal como la expone el backend
 * (GET /api/v1/conversations y POST /api/v1/conversations).
 */
export interface ConversationDTO {
  id: string;
  isGroup: boolean;
  title: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  partnerId: string | null;
  partnerFirstName: string | null;
  partnerLastName: string | null;
  partnerAvatarUrl: string | null;
}

export interface MessagePage {
  content: Message[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SendMessageRequest {
  conversationId: string;
  receiverId: string;
  content: string;
  type: string;
}

export interface CreateConversationRequest {
  otherUserId: string;
}

export interface NotificationDTO {
  type: string;
  data: Message;
}
