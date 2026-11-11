/* eslint-disable import/order */
import { Component, inject, signal, OnInit, OnDestroy, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ThemeService } from '../../../infrastructure/services/theme.service';
import { TooltipModule } from 'primeng/tooltip';
import { ModalComponent } from '../modal/modal';
import { LoginPageComponent } from "../../../../auth/presentation/pages/login-page.component";
import { Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../../../auth/infrastructure/services/auth.service';
import { isProfessionalProfile } from '../../../../auth/domain/management-access';
import { WebSocketService } from '../../../infrastructure/websocket/websocket.service';
import { RippleModule } from 'primeng/ripple';
import { PopoverModule, Popover } from 'primeng/popover';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { Subject, debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs';
import { GlobalSearchService, SearchResult } from '../../../infrastructure/services/global-search.service';
import { NotificationBadgeService } from '../../../../notifications/infrastructure/services/notification-badge.service';
/* eslint-enable import/order */

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MenuModule,
    TooltipModule,
    ModalComponent,
    LoginPageComponent,
    AvatarModule,
    RippleModule,
    PopoverModule,
    TranslocoModule,
  ],
  template: `
    <header class="app-header" [class.has-sidebar]="isLoggedIn()" [class.no-sidebar]="!isLoggedIn()">
      <div class="header-content">
        <!-- Keep the brand in the header only where the desktop sidebar is hidden. -->
        <div class="header-left">
           <div class="logo-container mobile-header-brand" routerLink="/" style="cursor: pointer;">
               <img src="https://res.cloudinary.com/dxjcjee8f/image/upload/v1784374711/m9caz3kr9yusdgis1k42.png" alt="Pawly" class="logo-image" />
           </div>

            <!-- Búsqueda global -->
            <div class="header-search">
              <input
                #searchInput
                type="text"
                class="header-search-input"
                [placeholder]="'header.searchPlaceholder' | transloco"
                [value]="searchQuery()"
                (input)="onSearchInput($event)"
                (focus)="onSearchFocus()"
                autocomplete="off"
              />
              <span class="header-search-icon">
                <i class="pi pi-search"></i>
              </span>
            </div>

            <!-- Resultados de búsqueda: overlay anclado al campo de búsqueda -->
            <p-popover
              #searchPopover
              styleClass="header-search-popover"
              appendTo="body"
              [dismissable]="true"
              [focusOnShow]="false"
              (onHide)="onSearchOverlayHidden()"
            >
              <div class="header-search-results">
                @if (searchQuery().trim()) {
                  <div class="search-results-header">
                    <span>{{ 'header.searchResults' | transloco }}</span>
                    <button type="button" class="clear-search-btn" (click)="clearSearch()">
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                  @if (searchResults().length === 0) {
                    <div class="search-result-empty">
                      {{ 'header.searchNoResults' | transloco }}
                    </div>
                  } @else {
                    @for (result of searchResults(); track result.type + result.id) {
                      <button type="button" class="search-result-item" (click)="onSelectResult(result)">
                        @if (result.image) {
                          <img [src]="result.image" [alt]="result.title" class="search-result-img" />
                        } @else {
                          <span class="search-result-img search-result-img-placeholder">
                            <i class="pi" [class]="typeIcon(result.type)"></i>
                          </span>
                        }
                        <div class="search-result-info">
                          <div class="search-result-title">{{ result.title }}</div>
                          @if (result.subtitle) {
                            <div class="search-result-subtitle">{{ result.subtitle }}</div>
                          }
                        </div>
                        <span class="search-result-type">{{ typeLabel(result.type) }}</span>
                      </button>
                    }
                  }
                }
              </div>
            </p-popover>
         </div>

        <!-- Right: Actions -->
        <div class="header-right">
          @if (isLoggedIn()) {
            <!-- Desktop: Full menu -->
            <div class="desktop-actions">
              <!-- Theme toggle -->
              <button
                pButton
                [icon]="isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"
                class="p-button-text p-button-sm header-btn"
                (click)="toggleTheme()"
                pTooltip="{{ 'header.tooltipToggleTheme' | transloco }}"
                [attr.aria-label]="'header.tooltipToggleTheme' | transloco"
                tooltipPosition="bottom"
              ></button>

              <!-- Notifications -->
              <button
                pButton
                icon="pi pi-bell"
                class="p-button-text p-button-sm header-btn"
                pTooltip="{{ 'header.tooltipNotifications' | transloco }}"
                [attr.aria-label]="'header.tooltipNotifications' | transloco"
                tooltipPosition="bottom"
                (click)="onNotifications()"
              >
                @if (hasUnreadNotifications()) {
                  <span class="notification-dot"></span>
                }
              </button>

              <!-- Messages -->
              <button
                pButton
                icon="pi pi-envelope"
                class="p-button-text p-button-sm header-btn"
                pTooltip="{{ 'header.tooltipMessages' | transloco }}"
                [attr.aria-label]="'header.tooltipMessages' | transloco"
                tooltipPosition="bottom"
                (click)="onMessages()"
              >
                @if (unreadMessages() > 0) {
                  <span class="messages-badge">{{ unreadMessagesDisplay() }}</span>
                }
              </button>

              @if (canManageManagement()) {
                <button
                  pButton
                  icon="pi pi-briefcase"
                  class="p-button-text p-button-sm header-btn"
                  pTooltip="{{ 'header.tooltipAdmin' | transloco }}"
                  [attr.aria-label]="'header.tooltipAdmin' | transloco"
                  tooltipPosition="bottom"
                  (click)="onManagement()"
                ></button>
              }

              <!-- User menu -->
              <div class="user-menu-container">
                <button
                  pButton
                  class="p-button-text p-button-sm header-btn user-btn"
                  (click)="menu.toggle($event)"
                  pTooltip="{{ 'header.tooltipMenu' | transloco }}"
                  [attr.aria-label]="'header.tooltipMenu' | transloco"
                  tooltipPosition="bottom"
                >
                  @if (isLoggedIn()) {
                    <p-avatar
                      [image]="userAvatar()"
                      shape="circle"
                      size="normal"
                      class="user-avatar"
                    ></p-avatar>
                  } @else {
                    <i class="pi pi-user"></i>
                  }
                </button>

                <p-menu #menu [model]="menuItems" [popup]="true" [appendTo]="'body'" styleClass="user-profile-menu">
                  <ng-template pTemplate="start">
                    @if (isLoggedIn()) {
                      <div class="user-menu-header">
                        <p-avatar
                          [image]="userAvatar()"
                          shape="circle"
                          size="large"
                        ></p-avatar>
                        <div class="user-info">
                          <span class="user-name">{{ userName() }}</span>
                          <span class="user-email">{{ userEmail() }}</span>
                        </div>
                      </div>
                    }
                  </ng-template>
                </p-menu>
              </div>
            </div>

            <!-- Mobile: Icon buttons -->
            <div class="mobile-actions">
              <button
                pButton
                [icon]="isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"
                class="p-button-text p-button-sm header-btn"
                (click)="toggleTheme()"
                pTooltip="{{ 'header.tooltipToggleTheme' | transloco }}"
                [attr.aria-label]="'header.tooltipToggleTheme' | transloco"
                tooltipPosition="bottom"
              ></button>
              <button
                pButton
                icon="pi pi-envelope"
                class="p-button-text p-button-sm header-btn"
                pTooltip="{{ 'header.tooltipMessages' | transloco }}"
                [attr.aria-label]="'header.tooltipMessages' | transloco"
                tooltipPosition="bottom"
                (click)="onMessages()"
              >
                @if (unreadMessages() > 0) {
                  <span class="messages-badge">{{ unreadMessagesDisplay() }}</span>
                }
              </button>
              <button
                pButton
                icon="pi pi-bell"
                class="p-button-text p-button-sm header-btn"
                pTooltip="{{ 'header.tooltipNotifications' | transloco }}"
                [attr.aria-label]="'header.tooltipNotifications' | transloco"
                tooltipPosition="bottom"
                (click)="onNotifications()"
              >
                @if (hasUnreadNotifications()) {
                  <span class="notification-dot"></span>
                }
              </button>
              <button
                pButton
                icon="pi pi-cog"
                class="p-button-text p-button-sm header-btn"
                pTooltip="{{ 'header.tooltipSettings' | transloco }}"
                [attr.aria-label]="'header.tooltipSettings' | transloco"
                tooltipPosition="bottom"
                (click)="onSettings()"
              ></button>
              @if (canManageManagement()) {
                <button
                  pButton
                  icon="pi pi-briefcase"
                  class="p-button-text p-button-sm header-btn"
                  pTooltip="{{ 'header.tooltipAdmin' | transloco }}"
                  [attr.aria-label]="'header.tooltipAdmin' | transloco"
                  tooltipPosition="bottom"
                  (click)="onManagement()"
                ></button>
              }
              <button
                pButton
                icon="pi pi-user"
                class="p-button-text p-button-sm header-btn"
                pTooltip="{{ 'header.tooltipProfile' | transloco }}"
                [attr.aria-label]="'header.tooltipProfile' | transloco"
                tooltipPosition="bottom"
                (click)="onProfile()"
              ></button>
            </div>
          } @else {
            <button
              pButton
              icon="pi pi-user"
              class="p-button-text p-button-sm header-btn"
              (click)="onLogin()"
              pTooltip="{{ 'header.tooltipLogin' | transloco }}"
              [attr.aria-label]="'header.tooltipLogin' | transloco"
              tooltipPosition="bottom"
            ></button>
          }
        </div>
      </div>
    </header>

    <!-- Login Modal -->
    <app-modal
      [visible]="showLoginModal()"
      header=""
      size="small"
      [showConfirm]="false"
      [showCancel]="false"
      [closable]="true"
      [dismissableMask]="true"
      [closeOnEscape]="true"
      [noPadding]="true"
      [showHeader]="false"
      (onHide)="closeLoginModal()"
    >
      <app-login-page
        [inModal]="true"
        (closeModal)="closeLoginModal()"
        (loginSuccess)="onLoginSuccess()"
      />
    </app-modal>
  `,
  styles: [`
    /* ===== HEADER BUTTONS ===== */
    .header-btn {
      width: 40px !important;
      height: 40px !important;
      border-radius: var(--radius-full) !important;
      color: var(--text-secondary) !important;
      transition: all var(--transition-fast) !important;
      position: relative;
    }

    .header-btn:hover {
      color: var(--primary-color) !important;
      background-color: var(--primary-color-light) !important;
      transform: scale(1.05);
    }

    .header-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .header-btn:active {
      transform: scale(0.95);
    }

    .header-btn .p-button-icon {
      font-size: 1.1rem !important;
    }

        /* ===== NOTIFICATION DOT ===== */
    .notification-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      background: var(--danger-color);
      border-radius: 50%;
      border: 2px solid var(--surface-card);
    }

    /* ===== MESSAGES BADGE ===== */
    .messages-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      background: var(--danger-color);
      color: #fff;
      font-size: 0.6875rem;
      font-weight: 700;
      line-height: 17px;
      text-align: center;
      border-radius: var(--radius-full);
      box-sizing: border-box;
      pointer-events: none;
    }

    /* ===== USER BUTTON ===== */
    .user-btn {
      width: 40px !important;
      height: 40px !important;
      border-radius: var(--radius-full) !important;
      padding: 0 !important;
      overflow: hidden;
    }

    .user-avatar {
      width: 32px !important;
      height: 32px !important;
    }

    :host ::ng-deep .user-avatar .p-avatar {
      width: 32px !important;
      height: 32px !important;
    }

    :host ::ng-deep .user-avatar img {
      width: 32px !important;
      height: 32px !important;
      object-fit: cover;
    }

    /* ===== LOGO ===== */
    .logo-image {
      width: 40px !important;
      height: 40px !important;
      object-fit: contain;
    }

    .mobile-header-brand {
      display: none;
    }

    :host ::ng-deep .app-header.no-sidebar .mobile-header-brand {
      display: flex;
    }

    :host ::ng-deep .app-header.has-sidebar {
      padding-left: 88px;
    }

    /* ===== USER MENU ===== */
    :host ::ng-deep .p-menu {
      min-width: 260px !important;
      padding: 0.5rem !important;
      border-radius: var(--radius-md) !important;
      overflow: hidden;
    }

    :host ::ng-deep .p-menu .p-menuitem {
      padding: 0.125rem 0.25rem !important;
    }

    :host ::ng-deep .p-menu .p-menuitem-link {
      padding: 0.625rem 0.75rem !important;
      border-radius: var(--radius-sm) !important;
    }

    :host ::ng-deep .p-menu .p-menuitem-separator {
      margin: 0.25rem 0 !important;
    }

    .user-menu-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--surface-border);
      margin-bottom: 0.25rem;
    }

    :host ::ng-deep .user-menu-header .p-avatar {
      width: 48px !important;
      height: 48px !important;
      flex-shrink: 0;
    }

    :host ::ng-deep .user-menu-header img {
      width: 48px !important;
      height: 48px !important;
      object-fit: cover;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
      margin: 0;
    }

    .user-email {
      color: var(--text-secondary);
      font-size: 0.75rem;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ===== DESKTOP/MOBILE TOGGLE ===== */
    .desktop-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mobile-actions {
      display: none;
      align-items: center;
      gap: 0.5rem;
    }

    /* ===== GLOBAL SEARCH ===== */
    .header-search {
      position: relative;
      display: flex;
      align-items: center;
      width: min(320px, 30vw);
      margin-left: 1rem;
    }

    .header-search-input {
      width: 100%;
      height: 38px;
      padding: 0 2.4rem 0 0.9rem;
      border: 1px solid var(--surface-border);
      border-radius: 999px;
      background: var(--surface-card, transparent);
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .header-search-input::placeholder {
      color: var(--text-secondary);
    }

    .header-search-input:focus {
      border-color: var(--primary-color, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .header-search-icon {
      position: absolute;
      right: 0.85rem;
      color: var(--text-secondary);
      pointer-events: none;
      font-size: 0.85rem;
    }

    /* Panel de resultados: se renderiza dentro de p-popover (overlay en body). */
    .header-search-results {
      width: 380px;
      max-width: min(380px, calc(100vw - 2rem));
      max-height: 420px;
      overflow-y: auto;
      padding: 0.35rem;
      background: var(--surface-card, #fff);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md, 12px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
    }

    .search-results-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.35rem 0.5rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--surface-border);
      margin-bottom: 0.25rem;
    }

    .clear-search-btn {
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 4px;
    }

    .clear-search-btn:hover {
      background: var(--surface-hover, rgba(99, 102, 241, 0.1));
      color: var(--text-primary);
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      width: 100%;
      padding: 0.5rem;
      border: none;
      border-radius: var(--radius-sm, 8px);
      background: transparent;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .search-result-item:hover,
    .search-result-item:focus-visible {
      background: var(--surface-hover, rgba(99, 102, 241, 0.08));
      outline: none;
    }

    .search-result-img {
      width: 38px;
      height: 38px;
      flex-shrink: 0;
      border-radius: 50%;
      object-fit: cover;
    }

    .search-result-img-placeholder {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-hover, rgba(99, 102, 241, 0.12));
      color: var(--primary-color, #6366f1);
      font-size: 0.95rem;
    }

    .search-result-info {
      flex: 1;
      min-width: 0;
    }

    .search-result-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-result-subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-result-type {
      flex-shrink: 0;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: var(--surface-hover, rgba(99, 102, 241, 0.12));
      color: var(--primary-color, #6366f1);
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .search-result-empty {
      padding: 1rem 0.5rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      :host ::ng-deep .app-header.has-sidebar {
        padding-left: 1.25rem;
      }

      .mobile-header-brand {
        display: flex;
      }

      .desktop-actions {
        display: none;
      }

      .mobile-actions {
        display: flex;
      }
      .header-search {
        display: none;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
    private readonly authService = inject(AuthService);
  private readonly webSocket = inject(WebSocketService);
  private readonly notificationBadge = inject(NotificationBadgeService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly searchService = inject(GlobalSearchService);

  // ===== Estados =====
  isLoggedIn = computed(() => this.authService.isAuthenticated());
  canManageManagement = computed(() => isProfessionalProfile(this.authService.user()));
  isDarkMode = signal(false);
  showLoginModal = signal(false);

  
  // ===== Búsqueda global =====
  searchQuery = signal<string>('');
  searchResults = signal<SearchResult[]>([]);
  isSearchOpen = signal<boolean>(false);
  private readonly searchDebounce = new Subject<string>();
  private searchRequestId = 0;

  menuItems: MenuItem[] = [];

  // ===== User Data =====
  userAvatar = computed(() => this.authService.user()?.avatarUrl || 'https://i.pravatar.cc/150?img=1');
  userEmail = computed(() => this.authService.user()?.email || '');
  userName = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : this.transloco.translate('header.userPlaceholder');
  });

  // ===== Mensajes no leídos =====
  unreadMessages = computed(() => this.webSocket.unreadCount());
  unreadMessagesDisplay = computed(() =>
    this.unreadMessages() > 99 ? '99+' : String(this.unreadMessages())
  );
  hasUnreadNotifications = computed(() => this.notificationBadge.hasUnread());
  
  // ===== Búsqueda global =====
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('searchPopover') searchPopover?: Popover;

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target?.value ?? '';
    this.searchQuery.set(value);
    if (!value.trim()) {
      this.searchResults.set([]);
      this.closeSearchOverlay();
      return;
    }
    this.openSearchOverlay();
    this.searchDebounce.next(value);
  }

  /** Abre el overlay al enfocar el campo de búsqueda. */
  onSearchFocus(): void {
    if (this.searchQuery().trim()) {
      this.openSearchOverlay();
    }
  }

  private openSearchOverlay(): void {
    const input = this.searchInput?.nativeElement;
    const popover = this.searchPopover;
    if (!input || !popover) return;
    this.isSearchOpen.set(true);
    if (!popover.overlayVisible) {
      popover.show(undefined, input);
    }
  }

  private closeSearchOverlay(): void {
    this.isSearchOpen.set(false);
    const popover = this.searchPopover;
    if (popover?.overlayVisible) {
      popover.hide();
    }
  }

  /** Se dispara cuando el overlay se oculta (click fuera, ESC, etc.). */
  onSearchOverlayHidden(): void {
    this.isSearchOpen.set(false);
  }

  onSelectResult(result: SearchResult): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.closeSearchOverlay();
    void this.router.navigateByUrl(result.route);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.closeSearchOverlay();
    this.searchInput?.nativeElement.focus();
  }

  typeLabel(type: SearchResult['type']): string {
    const key = {
      user: 'header.searchTypeUser',
      pet: 'header.searchTypePet',
      service: 'header.searchTypeService',
      event: 'header.searchTypeEvent',
    }[type];
    return this.transloco.translate(key);
  }

  typeIcon(type: SearchResult['type']): string {
    return {
      user: 'pi-user',
      pet: 'pi-heart',
      service: 'pi-briefcase',
      event: 'pi-calendar',
    }[type];
  }

  // El cierre por clic fuera / ESC lo gestiona el propio popover (dismissable).

  ngOnInit(): void {
    this.isDarkMode.set(this.themeService.isDarkMode());
    this.updateMenuItems();
    this.webSocket.connect();
    // Reconstruir el menú cuando cambie el idioma (rustle de texts TS).
    this.transloco.langChanges$.subscribe(() => this.updateMenuItems());
    // Búsqueda global con debounce
    this.searchDebounce
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          const requestId = ++this.searchRequestId;
          return this.searchService.search(q).pipe(
            map((results) => (requestId === this.searchRequestId ? results : []))
          );
        })
      )
      .subscribe((results) => this.searchResults.set(results));

  }

  // ===== Theme =====
  toggleTheme(): void {
    this.themeService.toggleDarkMode();
    this.isDarkMode.set(this.themeService.isDarkMode());
  }

  // ===== Navigation =====
    onNotifications(): void {
    void this.router.navigate(['/notifications']);
  }

      onMessages(): void {
    void this.router.navigate(['/messages']);
  }

  // ===== Login Modal =====
  openLoginModal(): void {
    this.showLoginModal.set(true);
  }

  closeLoginModal(): void {
    this.showLoginModal.set(false);
  }

  onLoginSuccess(): void {
    this.updateMenuItems();
    this.closeLoginModal();
  }

  // ===== Menu Actions =====
  private updateMenuItems(): void {
    if (this.isLoggedIn()) {
      this.menuItems = [
        {
          label: this.transloco.translate('header.myProfile'),
          icon: 'pi pi-user',
          command: () => this.onProfile()
        },
        {
          label: this.transloco.translate('header.settings'),
          icon: 'pi pi-cog',
          command: () => this.onSettings()
        },
        { separator: true },
        {
          label: this.transloco.translate('header.logout'),
          icon: 'pi pi-sign-out',
          command: () => this.onLogout()
        }
      ];
    } else {
      this.menuItems = [
        {
          label: this.transloco.translate('header.access'),
          items: [
            {
              label: this.transloco.translate('header.login'),
              icon: 'pi pi-sign-in',
              command: () => this.onLogin()
            },
            {
              label: this.transloco.translate('header.register'),
              icon: 'pi pi-user-plus',
              command: () => this.onRegister()
            }
          ]
        }
      ];
    }
  }

    onLogin(): void {
    void this.router.navigate(['/auth/login']);
  }

    onRegister(): void {
    void this.router.navigate(['/auth/login']);
  }

    onProfile(): void {
    void this.router.navigate(['/profile']);
  }

    onManagement(): void {
    void this.router.navigate(['/management']);
  }

    onSettings(): void {
    void this.router.navigate(['/settings']);
  }

  async onLogout(): Promise<void> {
    try {
      await this.authService.logout();
      this.updateMenuItems();
      await this.router.navigate(['/auth/login']);
    } catch (error: unknown) {
      console.error('Could not complete logout.', error);
    }
  }
}
