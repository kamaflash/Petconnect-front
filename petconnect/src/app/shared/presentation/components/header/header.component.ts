/* eslint-disable import/order */
import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
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
import { WebSocketService } from '../../../infrastructure/websocket/websocket.service';
import { RippleModule } from 'primeng/ripple';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
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
    TranslocoModule,
  ],
  template: `
    <header class="app-header" [class.has-sidebar]="isLoggedIn()" [class.no-sidebar]="!isLoggedIn()">
      <div class="header-content">
        <!-- Keep the brand in the header only where the desktop sidebar is hidden. -->
        <div class="header-left">
           <div class="logo-container mobile-header-brand" routerLink="/" style="cursor: pointer;">
               <img src="https://res.cloudinary.com/dxjcjee8f/image/upload/v1784374711/m9caz3kr9yusdgis1k42.png" alt="Petconnect" class="logo-image" />
           </div>
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
                <span class="notification-dot"></span>
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

                <p-menu #menu [model]="menuItems" [popup]="true" [appendTo]="'body'">
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
                <span class="notification-dot"></span>
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
      color: var(--text-primary) !important;
      background-color: var(--surface-hover) !important;
      transform: scale(1.05);
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
      background: #ef4444;
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
      background: #ef4444;
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
    }
  `]
})
export class HeaderComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
    private readonly authService = inject(AuthService);
  private readonly webSocket = inject(WebSocketService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  // ===== Estados =====
  isLoggedIn = computed(() => this.authService.isAuthenticated());
  canManageManagement = computed(() => {
    const user = this.authService.user();
    const profileType = user?.profileType?.toLowerCase();
    return user?.role === 'ADMIN' || ['vet', 'seller', 'shelter', 'trainer'].includes(profileType ?? '');
  });
  isDarkMode = signal(false);
  showLoginModal = signal(false);

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
    ngOnInit(): void {
    this.isDarkMode.set(this.themeService.isDarkMode());
    this.updateMenuItems();
    this.webSocket.connect();
    // Reconstruir el menú cuando cambie el idioma (rustle de texts TS).
    this.transloco.langChanges$.subscribe(() => this.updateMenuItems());
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

        onLogout(): void {
    void this.authService.logout();
    this.updateMenuItems();
    void this.router.navigate(['/auth/login']);
  }
}
