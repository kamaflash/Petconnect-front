export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  attachmentUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  title: string;
  isGroup: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastMessageId?: string;
  lastMessageAt?: Date;
}

export interface SendMessageRequest {
  conversationId: string;
  receiverId: string;
  content: string;
  type: string;
}

export interface NotificationDTO {
  type: string;
  data: Message;
}
