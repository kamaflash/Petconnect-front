import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    username: string;
    isOnline: boolean;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    AvatarModule,
    BadgeModule,
    ScrollPanelModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="messages-page">
      <div class="messages-container">
        <!-- Conversations List -->
        <div class="conversations-sidebar">
          <div class="conversations-header">
            <h1>Mensajes</h1>
            <button class="new-message-btn">
              <i class="pi pi-pencil"></i>
            </button>
          </div>

          <div class="search-bar">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              placeholder="Buscar conversaciones..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="filterConversations()"
            />
          </div>

          <div class="conversations-list">
            @for (conversation of filteredConversations(); track conversation.id) {
              <div
                class="conversation-item"
                [class.active]="selectedConversation()?.id === conversation.id"
                (click)="selectConversation(conversation)"
              >
                <div class="conversation-avatar">
                  <p-avatar [image]="conversation.user.avatar" shape="circle" size="large"></p-avatar>
                  @if (conversation.user.isOnline) {
                    <span class="online-indicator"></span>
                  }
                </div>
                <div class="conversation-content">
                  <div class="conversation-header">
                    <span class="conversation-name">{{ conversation.user.name }}</span>
                    <span class="conversation-time">{{ conversation.lastMessageTime | date:'shortTime' }}</span>
                  </div>
                  <div class="conversation-preview">
                    <p class="last-message">{{ conversation.lastMessage }}</p>
                    @if (conversation.unreadCount > 0) {
                      <span class="unread-badge">{{ conversation.unreadCount }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Chat Area -->
        <div class="chat-area">
          @if (selectedConversation(); as conversation) {
            <div class="chat-container">
              <!-- Chat Header -->
              <div class="chat-header">
                <div class="chat-user-info">
                  <div class="chat-avatar">
                    <p-avatar [image]="conversation.user.avatar" shape="circle"></p-avatar>
                    @if (conversation.user.isOnline) {
                      <span class="online-indicator"></span>
                    }
                  </div>
                  <div class="chat-user-details">
                    <h3>{{ conversation.user.name }}</h3>
                    <span class="user-status">
                      {{ conversation.user.isOnline ? 'En línea' : 'Desconectado' }}
                    </span>
                  </div>
                </div>
                <div class="chat-actions">
                  <button class="action-btn">
                    <i class="pi pi-phone"></i>
                  </button>
                  <button class="action-btn">
                    <i class="pi pi-video"></i>
                  </button>
                  <button class="action-btn">
                    <i class="pi pi-ellipsis-v"></i>
                  </button>
                </div>
              </div>

              <!-- Messages -->
              <div class="messages-container" #scrollContainer>
                <div class="messages-list">
                  @for (message of conversation.messages; track message.id) {
                    <div class="message-item" [class.sent]="message.senderId === 'currentUser'">
                      <div class="message-bubble">
                        <p class="message-content">{{ message.content }}</p>
                        <span class="message-time">{{ message.timestamp | date:'shortTime' }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Message Input -->
              <div class="message-input-container">
                <button class="attach-btn">
                  <i class="pi pi-image"></i>
                </button>
                <input
                  type="text"
                  pInputText
                  placeholder="Escribe un mensaje..."
                  [(ngModel)]="newMessage"
                  (keyup.enter)="sendMessage()"
                />
                <button class="send-btn" (click)="sendMessage()">
                  <i class="pi pi-send"></i>
                </button>
              </div>
            </div>
          } @else {
            <div class="no-conversation">
              <i class="pi pi-comments"></i>
              <h2>Selecciona una conversación</h2>
              <p>Elige un chat de la lista para empezar a mensajear</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messages-page {
      height: 80vh;
      background: var(--surface-bg);
      overflow: hidden;
    }

    .messages-container {
      display: flex;
      height: 100%;
      max-width: 1400px;
      margin: 0 auto;
      background: var(--surface-card);
    }

    /* Conversations Sidebar */
    .conversations-sidebar {
      width: 380px;
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      background: var(--surface-card);
    }

    .conversations-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .conversations-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .new-message-btn {
      width: 40px;
      height: 40px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }

    .new-message-btn:hover {
      background: var(--primary-color-dark);
      transform: scale(1.1);
    }

    .search-bar {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .search-bar i {
      position: absolute;
      left: 2rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
    }

    .search-bar input {
      width: 100%;
      padding: 0.625rem 1rem 0.625rem 2.5rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-full);
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .conversations-list {
      flex: 1;
      overflow-y: auto;
    }

    .conversation-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      border-bottom: 1px solid var(--surface-border);
    }

    .conversation-item:hover {
      background: var(--surface-hover);
    }

    .conversation-item.active {
      background: var(--primary-color-light);
    }

    .conversation-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #10b981;
      border: 2px solid var(--surface-card);
      border-radius: 50%;
    }

    .conversation-content {
      flex: 1;
      min-width: 0;
    }

    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .conversation-name {
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--text-primary);
    }

    .conversation-time {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .conversation-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .last-message {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .unread-badge {
      background: var(--primary-color);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      min-width: 20px;
      text-align: center;
    }

    /* Chat Area */
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--surface-bg);
    }

    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      flex-shrink: 0;
    }

    .chat-user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .chat-avatar {
      position: relative;
    }

    .chat-avatar .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #10b981;
      border: 2px solid var(--surface-card);
      border-radius: 50%;
    }

    .chat-user-details h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .user-status {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .chat-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      background: none;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }

    .action-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    /* Messages */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      min-height: 0;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message-item {
      display: flex;
      margin-bottom: 0.5rem;
    }

    .message-item.sent {
      justify-content: flex-end;
    }

    .message-bubble {
      max-width: 70%;
      padding: 0.75rem 1rem;
      border-radius: 18px;
      position: relative;
    }

    .message-item:not(.sent) .message-bubble {
      background: var(--surface-card);
      color: var(--text-primary);
      border-bottom-left-radius: 4px;
    }

    .message-item.sent .message-bubble {
      background: var(--primary-color);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-content {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.4;
      word-wrap: break-word;
    }

    .message-time {
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: block;
      opacity: 0.7;
    }

    /* Message Input */
    .message-input-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: var(--surface-card);
      border-top: 1px solid var(--surface-border);
      flex-shrink: 0;
    }

    .attach-btn {
      width: 40px;
      height: 40px;
      background: none;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      flex-shrink: 0;
    }

    .attach-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .message-input-container input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-full);
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .send-btn {
      width: 40px;
      height: 40px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      flex-shrink: 0;
    }

    .send-btn:hover {
      background: var(--primary-color-dark);
      transform: scale(1.1);
    }

    /* No Conversation Selected */
    .no-conversation {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
    }

    .no-conversation i {
      font-size: 4rem;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
    }

    .no-conversation h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      color: var(--text-primary);
    }

    .no-conversation p {
      margin: 0;
      font-size: 1rem;
    }

    /* Scrollbar */
    .conversations-list::-webkit-scrollbar,
    .messages-container::-webkit-scrollbar {
      width: 6px;
    }

    .conversations-list::-webkit-scrollbar-track,
    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .conversations-list::-webkit-scrollbar-thumb,
    .messages-container::-webkit-scrollbar-thumb {
      background: var(--surface-border);
      border-radius: 10px;
    }

    .conversations-list::-webkit-scrollbar-thumb:hover,
    .messages-container::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .conversations-sidebar {
        width: 100%;
      }

      .chat-area {
        display: none;
      }

      .message-bubble {
        max-width: 85%;
      }
    }
  `]
})
export class MessagesPageComponent {
  private messageService = inject(MessageService);

  searchQuery = '';
  newMessage = '';

  conversations = signal<Conversation[]>([
    {
      id: '1',
      user: {
        id: '1',
        name: 'Carlos Ruiz',
        avatar: 'https://i.pravatar.cc/150?img=3',
        username: '@carlos_pets',
        isOnline: true
      },
      lastMessage: '¡Perfecto! Nos vemos mañana entonces',
      lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
      unreadCount: 2,
      messages: [
        {
          id: 'm1',
          senderId: '1',
          content: 'Hola! ¿Cómo estás?',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          read: true
        },
        {
          id: 'm2',
          senderId: 'currentUser',
          content: 'Hola Carlos! Estoy bien, ¿y tú?',
          timestamp: new Date(Date.now() - 55 * 60 * 1000),
          read: true
        },
        {
          id: 'm3',
          senderId: '1',
          content: 'Muy bien! Quería preguntarte sobre el paseo de perros de mañana',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          read: true
        },
        {
          id: 'm4',
          senderId: 'currentUser',
          content: 'Claro! Es a las 10:00 en el Parque Central',
          timestamp: new Date(Date.now() - 8 * 60 * 1000),
          read: true
        },
        {
          id: 'm5',
          senderId: '1',
          content: '¡Perfecto! Nos vemos mañana entonces',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false
        }
      ]
    },
    {
      id: '2',
      user: {
        id: '2',
        name: 'Ana Martínez',
        avatar: 'https://i.pravatar.cc/150?img=4',
        username: '@ana_amazon',
        isOnline: false
      },
      lastMessage: 'Gracias por la recomendación del veterinario',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 0,
      messages: [
        {
          id: 'm6',
          senderId: 'currentUser',
          content: 'Hola Ana! ¿Cómo está tu gato?',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          read: true
        },
        {
          id: 'm7',
          senderId: '2',
          content: 'Mucho mejor, gracias! El veterinario me recomendó una dieta especial',
          timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
          read: true
        },
        {
          id: 'm8',
          senderId: 'currentUser',
          content: 'Me alegro! ¿Cuál es la dieta?',
          timestamp: new Date(Date.now() - 2.2 * 60 * 60 * 1000),
          read: true
        },
        {
          id: 'm9',
          senderId: '2',
          content: 'Gracias por la recomendación del veterinario',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true
        }
      ]
    },
    {
      id: '3',
      user: {
        id: '3',
        name: 'Luis Gómez',
        avatar: 'https://i.pravatar.cc/150?img=5',
        username: '@luis_doglover',
        isOnline: true
      },
      lastMessage: '¿Vienes al concurso de belleza?',
      lastMessageTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
      unreadCount: 1,
      messages: [
        {
          id: 'm10',
          senderId: '3',
          content: 'Hey! ¿Has visto el concurso de belleza canina?',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          read: true
        },
        {
          id: 'm11',
          senderId: 'currentUser',
          content: 'Sí! Mi perro Rocky quiere participar',
          timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
          read: true
        },
        {
          id: 'm12',
          senderId: '3',
          content: '¿Vienes al concurso de belleza?',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          read: false
        }
      ]
    },
    {
      id: '4',
      user: {
        id: '4',
        name: 'María López',
        avatar: 'https://i.pravatar.cc/150?img=7',
        username: '@maria_pets',
        isOnline: false
      },
      lastMessage: 'Te envié las fotos de Luna',
      lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      unreadCount: 0,
      messages: [
        {
          id: 'm13',
          senderId: '4',
          content: 'Hola! Te quería mostrar las fotos de Luna en el parque',
          timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
          read: true
        },
        {
          id: 'm14',
          senderId: 'currentUser',
          content: '¡Qué bonita! Se ve muy feliz',
          timestamp: new Date(Date.now() - 24.5 * 60 * 60 * 1000),
          read: true
        },
        {
          id: 'm15',
          senderId: '4',
          content: 'Te envié las fotos de Luna',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          read: true
        }
      ]
    }
  ]);

  selectedConversation = signal<Conversation | null>(null);

  filteredConversations = computed(() => {
    if (!this.searchQuery) {
      return this.conversations();
    }

    const query = this.searchQuery.toLowerCase();
    return this.conversations().filter(c =>
      c.user.name.toLowerCase().includes(query) ||
      c.lastMessage.toLowerCase().includes(query)
    );
  });

  selectConversation(conversation: Conversation) {
    this.selectedConversation.set(conversation);

    // Mark messages as read
    conversation.unreadCount = 0;
    conversation.messages.forEach(m => m.read = true);
  }

  filterConversations() {
    // Filtering is handled by computed property
  }

  sendMessage() {
    const conversation = this.selectedConversation();
    if (!this.newMessage.trim() || !conversation) {
      return;
    }

    const message: Message = {
      id: 'm' + Date.now(),
      senderId: 'currentUser',
      content: this.newMessage,
      timestamp: new Date(),
      read: false
    };

    conversation.messages.push(message);
    conversation.lastMessage = this.newMessage;
    conversation.lastMessageTime = new Date();

    this.newMessage = '';

    this.messageService.add({
      severity: 'info',
      summary: 'Mensaje enviado',
      detail: 'Tu mensaje ha sido enviado'
    });
  }
}
