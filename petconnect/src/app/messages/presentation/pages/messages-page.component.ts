import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import {
  Component,
  signal,
  computed,
  inject,
  effect,
  viewChild,
  ElementRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import {
  MessagesApiService,
  UserProfileResponse
} from '../../infrastructure/services/messages-api.service';
import { MessageWebSocketService } from '../../infrastructure/services/message-websocket.service';
import { WebSocketService } from '../../../shared/infrastructure/websocket/websocket.service';
import {
  ConversationDTO,
  Message,
  SendMessageRequest
} from '../../domain/entities/message.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    AvatarModule,
    BadgeModule,
    ScrollPanelModule,
    ToastModule,
    DialogModule,
  ],
  providers: [MessageService],
  template: `
    <div class="messages-page">
      <div class="messages-container">
        <!-- Conversations List -->
        <div class="conversations-sidebar">
          <div class="conversations-header">
            <h1>{{ 'messages.title' | transloco }}</h1>
            <button class="new-message-btn" (click)="openNewConversationDialog()">
              <i class="pi pi-pencil"></i>
            </button>
          </div>

          <div class="search-bar">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              [placeholder]="'messages.searchConversations' | transloco"
              [(ngModel)]="searchQuery"
            />
          </div>

          <div class="conversations-list">
            @for (conversation of filteredConversations(); track conversation.id) {
              <div
                class="conversation-item"
                [class.active]="selectedId() === conversation.id"
                (click)="selectConversation(conversation)"
              >
                <div class="conversation-avatar">
                  <p-avatar [image]="conversation.partnerAvatarUrl ?? undefined" shape="circle" size="large"></p-avatar>
                </div>
                <div class="conversation-content">
                  <div class="conversation-header">
                    <span class="conversation-name">{{ conversation.title }}</span>
                    <span class="conversation-time">{{ conversation.lastMessageAt | date:'shortTime' }}</span>
                  </div>
                  <div class="conversation-preview">
                    <p class="last-message">{{ conversation.lastMessage || this.i18n.translate('messages.startConversation') }}</p>
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
                    <p-avatar [image]="conversation.partnerAvatarUrl ?? undefined" shape="circle"></p-avatar>
                  </div>
                  <div class="chat-user-details">
                    <h3>{{ conversation.title }}</h3>
                    @if (isPartnerTyping()) {
                      <span class="typing-indicator">
                        <i class="pi pi-spin pi-spinner"></i>
                        {{ 'messages.typing' | transloco }}
                      </span>
                    } @else {
                      <span class="user-status" [class.online]="partnerOnline()">
                        <span class="status-dot"></span>
                        {{ partnerOnline() ? ('messages.online' | transloco) : ('messages.offline' | transloco) }}
                      </span>
                    }
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
                           <div class="chat-messages" #scrollContainer>
                <div class="messages-list">
                  @if (loadingMessages()) {
                    <div class="messages-loading">
                      <i class="pi pi-spin pi-spinner"></i>
                      <span>{{ 'messages.loading' | transloco }}</span>
                    </div>
                  } @else if (messages().length === 0) {
                    <div class="messages-empty">
                      <i class="pi pi-comments"></i>
                      <p>{{ 'messages.empty' | transloco }}</p>
                    </div>
                  } @else {
                    @for (message of messages(); track message.id) {
                      <div class="message-item" [class.sent]="message.senderId === currentUserId()">
                        <div class="message-bubble">
                          <p class="message-content">{{ message.content }}</p>
                          <span class="message-time">{{ message.createdAt | date:'shortTime' }}</span>
                        </div>
                      </div>
                    }
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
                  [placeholder]="'messages.typePlaceholder' | transloco"
                  [(ngModel)]="newMessage"
                  (ngModelChange)="onTypingInput()"
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
              <h2>{{ 'messages.selectConversation' | transloco }}</h2>
              <p>{{ 'messages.selectConversationHint' | transloco }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Nuevo mensaje -->
      <p-dialog
        [header]="'messages.newConversation' | transloco"
        [visible]="showNewDialog()"
        (visibleChange)="showNewDialog.set($event)"
        [style]="{ width: '420px' }"
        [modal]="true"
        [dismissableMask]="true"
      >
        <div class="new-message-search">
          <i class="pi pi-search"></i>
          <input
            type="text"
            pInputText
            [placeholder]="'messages.searchPeople' | transloco"
            [(ngModel)]="newUserSearch"
          />
        </div>
        <div class="new-message-users">
          @if (newUserResults().length === 0) {
            <p class="empty-users">{{ 'messages.noUsers' | transloco }}</p>
          }
          @for (user of newUserResults(); track user.authUserId) {
            <div class="new-message-user" (click)="startNewConversation(user)">
              <p-avatar
                [image]="user.avatarUrl ?? undefined"
                [label]="user.firstName"
                shape="circle"
              ></p-avatar>
              <span class="new-message-name">
                {{ user.firstName }} {{ user.lastName }}
              </span>
            </div>
          }
        </div>
      </p-dialog>
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
      max-width: var(--max-page-width);
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
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--text-tertiary);
    }

    .user-status.online {
      color: var(--green-500, #22c55e);
    }

    .user-status.online .status-dot {
      background: var(--green-500, #22c55e);
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }

    .typing-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
      color: var(--green-500, #22c55e);
      margin-top: 0.1rem;
    }

    .typing-indicator i {
      font-size: 0.875rem;
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

        /* Messages list (scroll area). Clase distinta a .messages-container de la página
       para evitar que herede display:flex/max-width/margin del wrapper y rompa el
       apilado vertical de los mensajes (panel quedaba invisible). */
    .chat-messages {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 1.5rem;
      min-height: 0;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .messages-loading,
    .messages-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-secondary);
      padding: 2rem 0;
      text-align: center;
    }

    .messages-loading i {
      font-size: 1.5rem;
    }

    .messages-empty i {
      font-size: 3rem;
      color: var(--text-tertiary);
    }

    .messages-empty p {
      margin: 0;
      font-size: 0.9375rem;
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

    /* Nuevo mensaje dialog */
    .new-message-search {
      position: relative;
      margin-bottom: 1rem;
    }

    .new-message-search i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
    }

    .new-message-search input {
      width: 100%;
      padding: 0.625rem 1rem 0.625rem 2.5rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-full);
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .new-message-users {
      display: flex;
      flex-direction: column;
      max-height: 320px;
      overflow-y: auto;
      gap: 0.25rem;
    }

    .new-message-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .new-message-user:hover {
      background: var(--surface-hover);
    }

    .new-message-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .empty-users {
      text-align: center;
      color: var(--text-tertiary);
      padding: 1rem 0;
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
export class MessagesPageComponent implements OnInit, OnDestroy {
  readonly i18n = inject(TranslocoService);
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly messagesApi = inject(MessagesApiService);
  private readonly webSocket = inject(MessageWebSocketService);

  // ---------- Estado ----------
  currentUserId = signal('');
  conversations = signal<ConversationDTO[]>([]);
  selectedId = signal('');
  messages = signal<Message[]>([]);
  searchQuery = '';
  newMessage = '';
  loadingConversations = signal(false);
  loadingMessages = signal(false);

  // Diálogo de nueva conversación
  showNewDialog = signal(false);
  newUserSearch = '';
  allUsers = signal<UserProfileResponse[]>([]);

  private notificationSub!: Subscription;
  private currentConversationSub!: Subscription;
  private activeConversationId = '';

  /** Estado online del interlocutor de la conversación activa (reactivo). */
  partnerOnline = computed(() =>
    this.webSocket.isUserOnline(this.selectedConversation()?.partnerId ?? null)
  );

  /** Indica si el interlocutor está escribiendo (reactivo). */
  isPartnerTyping = computed(() =>
    this.webSocket.isTyping(this.selectedConversation()?.id ?? '')
  );

  private messagesEl = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  private typingSub!: Subscription;
  private typingTimer: any = null;

  /** Mantiene el scroll siempre abajo para ver el último mensaje al instante. */
  private autoScroll = effect(() => {
    this.messages();
    this.loadingMessages();
    this.selectedId();
    queueMicrotask(() => this.scrollToBottom());
  });

  constructor() {
    // Si venimos desde "Contactar con solicitante" en administración, abrimos
    // (o creamos) directamente la conversación con ese usuario.
    const userId = this.route.snapshot.queryParamMap.get('userId');
    if (userId) {
      this.openOrCreateConversation(userId);
    }
  }

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.currentUserId.set(user.id);
    }

    this.loadConversations();

    // Notificaciones globales de nuevos mensajes (todos los chats)
    this.notificationSub = this.webSocket.onNotification().subscribe((notification) => {
      if (notification && notification.type === 'NEW_MESSAGE' && notification.data) {
        this.handleIncomingMessage(notification.data);
      }
    });
  }

  ngOnDestroy(): void {
    this.notificationSub?.unsubscribe();
    this.currentConversationSub?.unsubscribe();
    this.typingSub?.unsubscribe();
    if (this.typingTimer) clearTimeout(this.typingTimer);
    if (this.activeConversationId) {
      this.webSocket.unsubscribeFromConversation(this.activeConversationId);
      this.webSocket.unsubscribeFromTyping(this.activeConversationId);
    }
  }

  // ---------- Conversaciones ----------
  filteredConversations = computed(() => {
    const query = this.searchQuery.toLowerCase();
    if (!query) {
      return this.conversations();
    }
    return this.conversations().filter(c =>
      c.title?.toLowerCase().includes(query) ||
      (c.lastMessage || '').toLowerCase().includes(query)
    );
  });

  selectedConversation = computed(
    () => this.conversations().find(c => c.id === this.selectedId()) ?? null
  );

  loadConversations(): void {
    this.loadingConversations.set(true);
    this.messagesApi.getConversations().subscribe({
      next: (convs) => {
        this.conversations.set(convs);
        this.loadingConversations.set(false);
        // Sincronizar el contador global de no leídos con el servidor
        // (refleja las conversaciones ya leídas en la página).
        this.webSocket.refreshUnreadCount();
      },
      error: () => this.loadingConversations.set(false)
    });
  }

  selectConversation(conversation: ConversationDTO): void {
    const previousId = this.selectedId();
    if (previousId && previousId !== conversation.id) {
      this.webSocket.unsubscribeFromConversation(previousId);
    }

    this.selectedId.set(conversation.id);
    this.activeConversationId = conversation.id;
    this.messages.set([]);

    // Cargar el historial SIEMPRE y ANTES de cualquier lógica WS, para que funcione
    // a la primera pulsación (tanto al abrir una conversación como al re-seleccionarla).
    this.loadMessagesRealtime(conversation.id);

    // Suscripción en tiempo real (no debe bloquear la carga si fallara por cualquier motivo)
    this.currentConversationSub?.unsubscribe();
    this.typingSub?.unsubscribe();
    this.webSocket.unsubscribeFromTyping(previousId);
    try {
      this.currentConversationSub = this.webSocket
        .subscribeToConversation(conversation.id)
        .subscribe((msg) => {
          if (msg && msg.conversationId === this.activeConversationId) {
            this.upsertMessage(msg);
          }
        });

      // Suscripción al indicador "Escribiendo…" de esta conversación
      this.typingSub = this.webSocket
        .subscribeToTyping(conversation.id)
        .subscribe();
      this.webSocket.setTyping(conversation.id, false);
    } catch (e) {
      console.error(this.i18n.translate('messages.subscribeError'), e);
    }

    // Marcar como leídos todos los mensajes de la conversación
    this.webSocket.markAsRead(conversation.id);
    this.scrollToBottom();
  }

  private loadMessagesRealtime(conversationId: string): void {
    this.loadingMessages.set(true);
    this.messagesApi.getMessages(conversationId).subscribe({
      next: (page) => {
        // El backend las devuelve de más nueva a más antigua; invertir para cronológico.
        this.messages.set([...(page.content ?? [])].reverse());
        this.loadingMessages.set(false);
        // Actualizar contador local de no leídos
        const previous = this.conversations().find(c => c.id === conversationId)?.unreadCount ?? 0;
        this.conversations.update(list =>
          list.map(c => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
        // Reflejar la lectura en el contador global del header.
        if (previous > 0) {
          this.webSocket.decrementUnreadCount(previous);
        }
      },
      error: () => this.loadingMessages.set(false)
    });
  }

  // ---------- Enviar ----------
  sendMessage(): void {
    const conversation = this.selectedConversation();
    const content = this.newMessage.trim();
    if (!content || !conversation || !conversation.partnerId) {
      return;
    }

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: this.currentUserId(),
      receiverId: conversation.partnerId,
      conversationId: conversation.id,
      status: 'SENT',
      type: 'TEXT',
      attachmentUrl: null,
      createdAt: new Date().toISOString(),
      readAt: null
    };

    this.upsertMessage(optimistic);
    this.newMessage = '';
    this.bumpConversation(conversation.id, content);

    // Dejar de indicar "Escribiendo…" al enviar
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.webSocket.sendTyping(conversation.id, false);

    // Persistencia vía REST (garantiza que el mensaje se guarde y se recupere al recargar).
    // El backend además lo difunde por WebSocket (tiempo real) para el destinatario.
    this.messagesApi
      .sendMessage(conversation.id, {
        receiverId: conversation.partnerId,
        content,
        type: 'TEXT'
      })
      .subscribe({
        next: (saved) => this.upsertMessage(saved),
        error: () =>
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.translate('messages.error'),
      detail: this.i18n.translate('messages.sendError')
          })
      });
  }

  /** Se llama al escribir en el input: indica "Escribiendo…" con un debounce de 1.2s. */
  onTypingInput(): void {
    const conversation = this.selectedConversation();
    if (!conversation) return;
    this.webSocket.sendTyping(conversation.id, true);
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.webSocket.sendTyping(conversation.id, false);
    }, 1200);
  }

  /** Lleva el scroll de mensajes hasta abajo (último mensaje siempre visible). */
  private scrollToBottom(): void {
    const el = this.messagesEl()?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  // ---------- Gestión de mensajes entrantes ----------
  private handleIncomingMessage(message: Message): void {
    // Si no es la conversación activa, solo actualizamos la lista
    if (message.conversationId !== this.activeConversationId) {
      this.conversations.update(list =>
        [...list]
          .map(c =>
            c.id === message.conversationId
              ? {
                  ...c,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                  unreadCount: c.unreadCount + 1
                }
              : c
          )
          .sort((a, b) =>
            new Date(b.lastMessageAt ?? 0).getTime() -
            new Date(a.lastMessageAt ?? 0).getTime()
          )
      );
      return;
    }

    this.upsertMessage(message);
    this.bumpConversation(message.conversationId, message.content);
    this.webSocket.markAsRead(message.conversationId);
  }

  /** Inserta un mensaje sin duplicar los optimistas (enviados localmente). */
  private upsertMessage(message: Message): void {
    this.messages.update(list => {
      // Reemplazar el mensaje optimista por el real del servidor
      const optimisticIndex = list.findIndex(
        m =>
          m.id.startsWith('temp-') &&
          m.senderId === message.senderId &&
          m.conversationId === message.conversationId &&
          m.content === message.content
      );
      if (optimisticIndex >= 0) {
        const copy = [...list];
        copy[optimisticIndex] = message;
        return copy;
      }
      if (list.some(m => m.id === message.id)) {
        return list;
      }
      return [...list, message];
    });
  }

  private bumpConversation(conversationId: string, lastMessage: string): void {
    this.conversations.update(list =>
      [...list]
        .map(c =>
          c.id === conversationId
            ? { ...c, lastMessage, lastMessageAt: new Date().toISOString() }
            : c
        )
        .sort((a, b) =>
          new Date(b.lastMessageAt ?? 0).getTime() -
          new Date(a.lastMessageAt ?? 0).getTime()
        )
    );
  }

  // ---------- Abrir / crear conversación con otro usuario ----------
  openOrCreateConversation(userId: string): void {
    const existing = this.conversations().find(c => c.partnerId === userId);
    if (existing) {
      this.selectConversation(existing);
      return;
    }

    this.messagesApi.createConversation(userId).subscribe({
      next: (conversation) => {
        if (!this.conversations().some(c => c.id === conversation.id)) {
          this.conversations.update(list => [conversation, ...list]);
        }
        this.selectConversation(conversation);
      },
      error: () => this.messageService.add({
        severity: 'error',
        summary: this.i18n.translate('messages.error'),
        detail: this.i18n.translate('messages.openError')
      })
    });
  }

  // ---------- Nueva conversación ----------
  openNewConversationDialog(): void {
    this.newUserSearch = '';
    this.showNewDialog.set(true);
    if (this.allUsers().length === 0) {
      this.messagesApi.getAllProfiles().subscribe({
        next: (users) => {
          const me = this.currentUserId();
          const existingPartners = new Set(
            this.conversations()
              .filter(c => !c.isGroup && c.partnerId)
              .map(c => c.partnerId!)
          );
          this.allUsers.set(
            users.filter(u => u.authUserId !== me && !existingPartners.has(u.authUserId))
          );
        }
      });
    }
  }

  newUserResults = computed(() => {
    const query = this.newUserSearch.toLowerCase();
    return this.allUsers().filter(u =>
      !query ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
    );
  });

  startNewConversation(user: UserProfileResponse): void {
    this.showNewDialog.set(false);
    this.allUsers.update(list => list.filter(u => u.authUserId !== user.authUserId));
    this.openOrCreateConversation(user.authUserId);
  }
}
