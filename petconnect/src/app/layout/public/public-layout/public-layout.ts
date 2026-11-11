import { Component, inject, OnInit, signal } from '@angular/core';
import { HeaderComponent } from '../../../shared/presentation/components/header/header.component';
import { SidebarComponent } from '../../../shared/presentation/components/sidebar/sidebar';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { FooterComponent } from '../../../shared/presentation/components/footer/footer';
import { BreadcrumbComponent } from '../../../shared/presentation/components/breadcrumb/breadcrumb.component';
import { filter } from 'rxjs/operators';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FooterComponent, BreadcrumbComponent, RouterOutlet, RouterLink, RouterLinkActive, TranslocoModule],
  template: `
    <div class="layout-container">
      <!-- Header -->
      <app-header />

      <!-- Breadcrumb - Positioned above content -->
      <app-breadcrumb />

      <!-- Main content -->
      <div class="layout-main">
        <!-- Sidebar (desktop) / Mobile Nav (mobile) -->
        <app-sidebar class="desktop-sidebar" />

        <!-- Content -->
        <div class="layout-content-wrapper">
          <main class="layout-content">
            <router-outlet />
          </main>

          <!-- Footer (solo al final del contenido) -->
          <app-footer />
        </div>
      </div>

      <!-- Mobile Bottom Navigation -->
      <nav class="mobile-nav" [attr.aria-label]="'nav.mobileNavigation' | transloco" (keydown.escape)="closeMoreMenu()">
        <a routerLink="/" routerLinkActive="mobile-nav-active" [routerLinkActiveOptions]="{ exact: true }" class="mobile-nav-link" [attr.aria-label]="'nav.home' | transloco" (click)="closeMoreMenu()">
          <span class="material-symbols-rounded">home</span>
          <span class="mobile-nav-label">{{ 'nav.home' | transloco }}</span>
        </a>
        <a routerLink="/nearby" routerLinkActive="mobile-nav-active" class="mobile-nav-link" [attr.aria-label]="'nav.discover' | transloco" (click)="closeMoreMenu()">
          <span class="material-symbols-rounded">explore</span>
          <span class="mobile-nav-label">{{ 'nav.discover' | transloco }}</span>
        </a>
        <button type="button" class="mobile-nav-link mobile-nav-create" (click)="createPost()" [attr.aria-label]="'nav.createPost' | transloco">
          <span class="mobile-nav-create-icon">
            <span class="material-symbols-rounded">add</span>
          </span>
          <span class="mobile-nav-label">{{ 'nav.createPost' | transloco }}</span>
        </button>
        <a routerLink="/messages" routerLinkActive="mobile-nav-active" class="mobile-nav-link" [attr.aria-label]="'nav.messages' | transloco" (click)="closeMoreMenu()">
          <span class="material-symbols-rounded">chat_bubble</span>
          <span class="mobile-nav-label">{{ 'nav.messages' | transloco }}</span>
        </a>
        <button
          type="button"
          class="mobile-nav-link mobile-nav-more"
          [class.mobile-nav-active]="mobileMoreOpen()"
          [attr.aria-label]="'nav.more' | transloco"
          [attr.aria-expanded]="mobileMoreOpen()"
          aria-controls="mobile-more-menu"
          (click)="toggleMoreMenu()"
        >
          <span class="material-symbols-rounded">more_horiz</span>
          <span class="mobile-nav-label">{{ 'nav.more' | transloco }}</span>
        </button>

        @if (mobileMoreOpen()) {
          <button type="button" class="mobile-more-backdrop" tabindex="-1" aria-hidden="true" (click)="closeMoreMenu()"></button>
          <div class="mobile-more-menu" id="mobile-more-menu">
            <div class="mobile-more-header">
              <span>{{ 'nav.more' | transloco }}</span>
              <button type="button" class="mobile-more-close" [attr.aria-label]="'nav.closeMore' | transloco" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>
            <nav class="mobile-more-links" [attr.aria-label]="'nav.moreNavigation' | transloco">
              <a routerLink="/social" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">groups</span>{{ 'nav.community' | transloco }}
              </a>
              <a routerLink="/pets" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">group</span>{{ 'nav.family' | transloco }}
              </a>
              <a routerLink="/agenda" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">calendar_month</span>{{ 'nav.agenda' | transloco }}
              </a>
              <a routerLink="/adoptions" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">pet_supplies</span>{{ 'nav.adoptions' | transloco }}
              </a>
              <a routerLink="/lostpets" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">search</span>{{ 'nav.lostPets' | transloco }}
              </a>
              <a routerLink="/events" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">event</span>{{ 'nav.events' | transloco }}
              </a>
              <a routerLink="/marketplace" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">storefront</span>{{ 'nav.marketplace' | transloco }}
              </a>
              <a routerLink="/gamification" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">emoji_events</span>{{ 'nav.achievements' | transloco }}
              </a>
              <a routerLink="/profile" (click)="closeMoreMenu()">
                <span class="material-symbols-rounded">person</span>{{ 'nav.profile' | transloco }}
              </a>
            </nav>
          </div>
        }
      </nav>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      background-color: var(--surface-bg);
    }

    .layout-main {
      display: flex;
      flex: 1;
      overflow: hidden;
      margin-top: 64px;
    }

    .layout-content-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      min-width: 0;
      padding-left: 72px;
      padding-top: 48px;
    }

    .layout-content {
      flex: 1;
      padding: 1.5rem;
      background-color: var(--surface-bg);
      min-width: 0;
      overflow: visible;
    }

    .dark .layout-content {
      background-color: var(--surface-bg);
    }

    app-footer {
      flex-shrink: 0;
    }

    /* ===== MOBILE NAVIGATION ===== */
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: calc(64px + env(safe-area-inset-bottom));
      box-sizing: border-box;
      background-color: color-mix(in srgb, var(--sidebar-bg) 90%, transparent);
      border-top: 1px solid var(--sidebar-border);
      z-index: 100;
      align-items: center;
      justify-content: space-around;
      padding: 0 12px;
      padding-bottom: env(safe-area-inset-bottom);
      backdrop-filter: blur(12px);
      box-shadow: 0 -8px 24px rgba(27, 31, 24, 0.06);
    }

    .dark .mobile-nav {
      background-color: color-mix(in srgb, var(--sidebar-bg) 90%, transparent);
      backdrop-filter: blur(12px);
    }

    .mobile-nav-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 6px 4px;
      border: 0;
      background: transparent;
      color: var(--sidebar-text);
      text-decoration: none;
      font-family: inherit;
      font-size: 0.6875rem;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      flex: 1 1 0;
      min-width: 0;
      position: relative;
      z-index: 100;
      cursor: pointer;
    }

    .mobile-nav-link .material-symbols-rounded {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
      transition: all var(--transition-fast);
    }

    .mobile-nav-label {
      overflow: hidden;
      max-width: 100%;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .mobile-nav-link:hover {
      background-color: var(--sidebar-hover);
      color: var(--sidebar-text-hover);
      transform: translateY(-2px);
    }

    .mobile-nav-link:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }

    .mobile-nav-link:active {
      transform: scale(0.96);
    }

    .mobile-nav-active {
      color: var(--sidebar-active-text);
      background-color: var(--sidebar-active-bg);
    }

    .mobile-nav-active .material-symbols-rounded,
    .mobile-nav-active .mobile-nav-label {
      color: var(--sidebar-active-text);
      font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
    }

    .mobile-nav-more.mobile-nav-active .material-symbols-rounded {
      color: var(--sidebar-active-text);
      font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
    }

    .mobile-nav-create {
      gap: 1px;
    }

    .mobile-nav-create-icon {
      display: grid;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      margin-top: -1rem;
      border: 3px solid var(--sidebar-bg);
      border-radius: 0.9rem;
      background: var(--primary-color);
      color: var(--on-primary, #ffffff);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--primary-color) 28%, transparent);
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }

    .mobile-nav-create:hover .mobile-nav-create-icon {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px color-mix(in srgb, var(--primary-color) 34%, transparent);
    }

    .mobile-nav-create-icon .material-symbols-rounded {
      font-size: 1.5rem;
      color: inherit;
      font-variation-settings: 'wght' 500;
    }

    .mobile-nav-create .mobile-nav-label {
      color: var(--text-secondary);
    }

    .mobile-nav-create:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }

    .mobile-more-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99;
      border: 0;
      background: rgba(15, 18, 14, 0.18);
    }

    .mobile-more-menu {
      position: fixed;
      right: 12px;
      bottom: calc(72px + env(safe-area-inset-bottom));
      z-index: 101;
      width: min(360px, calc(100vw - 24px));
      max-height: calc(100dvh - 160px);
      overflow-y: auto;
      padding: 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-xl);
      background: var(--surface-card);
      box-shadow: var(--shadow-xl);
    }

    .mobile-more-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.125rem 0.25rem 0.625rem;
      color: var(--text-primary);
      font-size: 0.9375rem;
      font-weight: 650;
    }

    .mobile-more-close {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border: 0;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .mobile-more-close:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .mobile-more-links {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.375rem;
    }

    .mobile-more-links a {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-width: 0;
      padding: 0.75rem 0.625rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.8125rem;
      text-decoration: none;
      transition: background-color var(--transition-fast), color var(--transition-fast);
    }

    .mobile-more-links a:hover,
    .mobile-more-links a:focus-visible {
      outline: none;
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .mobile-more-links .material-symbols-rounded {
      flex: 0 0 auto;
      font-size: 1.25rem;
      color: var(--primary-color);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .layout-main {
        margin-top: 64px;
      }

      .layout-content-wrapper {
        /* En móvil el breadcrumb sigue siendo fixed (top:64px, alto ~40px):
           desplazamos el contenido para que el encabezado no quede tapado. */
        padding-left: 0;
        padding-top: 40px;
        padding-bottom: calc(64px + env(safe-area-inset-bottom));
      }

      .desktop-sidebar {
        display: none;
      }

      .mobile-nav {
        display: flex;
      }

      .layout-content {
        padding: 1rem;
      }

      app-breadcrumb {
        margin-left: 0;
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .mobile-nav-link {
        padding: 4px 2px;
        font-size: 0.625rem;
      }

      .mobile-nav-link .material-symbols-rounded {
        font-size: 1.25rem;
      }

      .mobile-nav-create-icon {
        width: 2.125rem;
        height: 2.125rem;
      }

      .mobile-nav-create-icon .material-symbols-rounded {
        font-size: 1.375rem;
      }
    }
  `]
})
export class PublicLayout implements OnInit {
  private readonly router = inject(Router);
  mobileMoreOpen = signal(false);

  ngOnInit(): void {
    // No page loader needed - each page handles its own loading state
  }

  toggleMoreMenu(): void {
    this.mobileMoreOpen.update(open => !open);
  }

  closeMoreMenu(): void {
    this.mobileMoreOpen.set(false);
  }

  createPost(): void {
    this.closeMoreMenu();
    void this.router.navigate(['/social'], { queryParams: { compose: 'true' } });
  }
}
