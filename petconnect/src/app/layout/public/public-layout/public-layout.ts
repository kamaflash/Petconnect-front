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
      <nav class="mobile-nav">
        <a routerLink="/" routerLinkActive="mobile-nav-active" [routerLinkActiveOptions]="{ exact: true }" class="mobile-nav-link" [attr.aria-label]="'nav.home' | transloco">
          <span class="material-symbols-rounded">home</span>
          <span class="mobile-nav-label">{{ 'nav.home' | transloco }}</span>
        </a>
        <a routerLink="/pets" routerLinkActive="mobile-nav-active" class="mobile-nav-link" [attr.aria-label]="'nav.family' | transloco">
          <span class="material-symbols-rounded">pets</span>
          <span class="mobile-nav-label">{{ 'nav.family' | transloco }}</span>
        </a>
        <a routerLink="/agenda" routerLinkActive="mobile-nav-active" class="mobile-nav-link" [attr.aria-label]="'nav.agenda' | transloco">
          <span class="material-symbols-rounded">calendar_month</span>
          <span class="mobile-nav-label">{{ 'nav.agenda' | transloco }}</span>
        </a>
        <a routerLink="/nearby" routerLinkActive="mobile-nav-active" class="mobile-nav-link" [attr.aria-label]="'nav.discover' | transloco">
          <span class="material-symbols-rounded">explore</span>
          <span class="mobile-nav-label">{{ 'nav.discover' | transloco }}</span>
        </a>
        <a routerLink="/adoptions" routerLinkActive="mobile-nav-active" class="mobile-nav-link" [attr.aria-label]="'nav.adoptions' | transloco">
          <span class="material-symbols-rounded">pet_supplies</span>
          <span class="mobile-nav-label">{{ 'nav.adoptions' | transloco }}</span>
        </a>
        <a routerLink="/social" routerLinkActive="mobile-nav-active" class="mobile-nav-link" [attr.aria-label]="'nav.community' | transloco">
          <span class="material-symbols-rounded">groups</span>
          <span class="mobile-nav-label">{{ 'nav.community' | transloco }}</span>
        </a>
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
      padding: 0 8px;
      padding-bottom: env(safe-area-inset-bottom);
      backdrop-filter: blur(12px);
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
      color: var(--sidebar-text);
      text-decoration: none;
      font-size: 0.6875rem;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      flex: 1;
      min-width: 0;
      position: relative;
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

    .mobile-nav-active {
      color: var(--sidebar-text-hover);
    }

    .mobile-nav-active span {
      color: var(--sidebar-text-hover);
      font-variation-settings: 'FILL' 1;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .layout-main {
        margin-top: 64px;
      }

      .layout-content-wrapper {
        padding-left: 0;
        padding-top: 0;
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
    }
  `]
})
export class PublicLayout implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    // No page loader needed - each page handles its own loading state
  }
}
