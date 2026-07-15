import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ThemeService } from '../../../infrastructure/services/theme.service';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { LoginPageComponent } from "../../../../auth/presentation/pages/login-page.component";
import { Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../../../auth/infrastructure/services/auth.service';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MenuModule,
    TooltipModule,
    InputTextModule,
    FormsModule,
    ModalComponent,
    LoginPageComponent,
    AvatarModule,
    RippleModule,
  ],
  template: `
    <header class="app-header">
      <div class="header-content">
        <!-- Left: Logo + Navigation -->
        <div class="header-left">
          <div class="logo-container" routerLink="/" style="cursor: pointer;">
            <div class="logo-icon">
              <i class="pi pi-paw" style="font-size: 1.1rem; color: white;"></i>
            </div>
            <span class="logo-text">PetConnect</span>
          </div>
        </div>

        <!-- Center: Search (only when logged in) -->
        @if (isLoggedIn()) {
          <div class="header-center">
            <div class="search-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input
                pInputText
                class="search-input"
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                (keyup.enter)="onSearch()"
                placeholder="Buscar mascotas, servicios..."
              />
              @if (searchQuery()) {
                <button class="clear-button" (click)="clearSearch()">
                  <i class="pi pi-times"></i>
                </button>
              }
            </div>
          </div>
        }

        <!-- Right: Actions -->
        <div class="header-right">
          @if (isLoggedIn()) {
            <!-- Theme toggle -->
            <button
              pButton
              [icon]="isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"
              class="p-button-text p-button-sm header-btn"
              (click)="toggleTheme()"
              pTooltip="Cambiar tema"
              tooltipPosition="bottom"
            ></button>

            <!-- Notifications -->
            <button
              pButton
              icon="pi pi-bell"
              class="p-button-text p-button-sm header-btn"
              pTooltip="Notificaciones"
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
              pTooltip="Mensajes"
              tooltipPosition="bottom"
              (click)="onMessages()"
            ></button>
          }

          <!-- User menu -->
          <div class="user-menu-container">
            <button
              pButton
              class="p-button-text p-button-sm header-btn user-btn"
              (click)="menu.toggle($event)"
              pTooltip="Menú"
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
  `]
})
export class HeaderComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ===== Estados =====
  isLoggedIn = computed(() => this.authService.isAuthenticated());
  isDarkMode = signal(false);
  searchQuery = signal('');
  showLoginModal = signal(false);

  menuItems: MenuItem[] = [];

  // ===== User Data =====
  userAvatar = computed(() => this.authService.user()?.avatarUrl || 'https://i.pravatar.cc/150?img=1');
  userEmail = computed(() => this.authService.user()?.email || '');
  userName = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : 'Usuario';
  });

  ngOnInit(): void {
    this.isDarkMode.set(this.themeService.isDarkMode());
    this.updateMenuItems();
  }

  // ===== Theme =====
  toggleTheme(): void {
    this.themeService.toggleDarkMode();
    this.isDarkMode.set(this.themeService.isDarkMode());
  }

  // ===== Search =====
  onSearch(): void {
    if (this.searchQuery().trim()) {
      console.log('Buscando:', this.searchQuery());
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  // ===== Navigation =====
  onNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  onMessages(): void {
    this.router.navigate(['/messages']);
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
          label: 'Mi Perfil',
          icon: 'pi pi-user',
          command: () => this.onProfile()
        },
        {
          label: 'Mis Mascotas',
          icon: 'pi pi-paw',
          command: () => this.onPets()
        },
        {
          label: 'Configuración',
          icon: 'pi pi-cog',
          command: () => this.onSettings()
        },
        { separator: true },
        {
          label: 'Cerrar Sesión',
          icon: 'pi pi-sign-out',
          command: () => this.onLogout()
        }
      ];
    } else {
      this.menuItems = [
        {
          label: 'Acceso',
          items: [
            {
              label: 'Iniciar Sesión',
              icon: 'pi pi-sign-in',
              command: () => this.onLogin()
            },
            {
              label: 'Registrarse',
              icon: 'pi pi-user-plus',
              command: () => this.onRegister()
            }
          ]
        }
      ];
    }
  }

  onLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  onRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  onProfile(): void {
    this.router.navigate(['/profile']);
  }

  onPets(): void {
    this.router.navigate(['/pets']);
  }

  onSettings(): void {
    this.router.navigate(['/settings']);
  }

  onLogout(): void {
    console.log('Cerrar sesión');
    this.authService.logout();
    this.updateMenuItems();
  }
}
