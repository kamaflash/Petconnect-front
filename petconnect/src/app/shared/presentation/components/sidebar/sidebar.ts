import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink, RouterLinkActive, TranslocoModule],
  template: `
<aside
  [class]="isHovered() || isOpen() ? 'sidebar-expanded' : 'sidebar-collapsed'"
  class="sidebar-container"
  (mouseenter)="onMouseEnter()"
  (mouseleave)="onMouseLeave()"
>
  <div class="sidebar-content">
    <a class="sidebar-brand" routerLink="/" aria-label="Pawly">
      <img
        src="https://res.cloudinary.com/dxjcjee8f/image/upload/v1784374711/m9caz3kr9yusdgis1k42.png"
        alt=""
        class="sidebar-brand-logo"
      />
      <span class="sidebar-brand-title">Pawly</span>
    </a>

    <!-- Navegación principal -->
    <nav class="sidebar-nav">
      <p class="nav-label">{{ 'nav.groupHome' | transloco }}</p>

      <a
        routerLink="/"
        routerLinkActive="sidebar-link-active"
        [routerLinkActiveOptions]="{ exact: true }"
        #homeLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="homeLink.isActive">home</span>
        <span class="nav-text">{{ 'nav.home' | transloco }}</span>
      </a>

      <p class="nav-label" style="margin-top: 0.75rem;">{{ 'nav.groupFamily' | transloco }}</p>

      <a routerLink="/pets" routerLinkActive="sidebar-link-active" #petsLink="routerLinkActive" class="sidebar-link">
        <span class="material-symbols-rounded nav-icon" [class.filled]="petsLink.isActive">group</span>
        <span class="nav-text">{{ 'nav.family' | transloco }}</span>
      </a>
      <a routerLink="/agenda" routerLinkActive="sidebar-link-active" #agendaLink="routerLinkActive" class="sidebar-link">
        <span class="material-symbols-rounded nav-icon" [class.filled]="agendaLink.isActive">calendar_month</span>
        <span class="nav-text">{{ 'nav.agenda' | transloco }}</span>
      </a>

      <p class="nav-label" style="margin-top: 0.75rem;">{{ 'nav.groupDiscover' | transloco }}</p>

      <a routerLink="/nearby" routerLinkActive="sidebar-link-active" #nearbyLink="routerLinkActive" class="sidebar-link">
        <span class="material-symbols-rounded nav-icon" [class.filled]="nearbyLink.isActive">location_on</span>
        <span class="nav-text">{{ 'nav.nearby' | transloco }}</span>
      </a>
      <a routerLink="/adoptions" routerLinkActive="sidebar-link-active" #adoptionsLink="routerLinkActive" class="sidebar-link">
        <span class="material-symbols-rounded nav-icon" [class.filled]="adoptionsLink.isActive">pet_supplies</span>
        <span class="nav-text">{{ 'nav.adoptions' | transloco }}</span>
      </a>
      <a routerLink="/lostpets" routerLinkActive="sidebar-link-active" #lostpetsLink="routerLinkActive" class="sidebar-link">
        <span class="material-symbols-rounded nav-icon" [class.filled]="lostpetsLink.isActive">search</span>
        <span class="nav-text">{{ 'nav.lostPets' | transloco }}</span>
      </a>
      <a routerLink="/marketplace" routerLinkActive="sidebar-link-active" #marketplaceLink="routerLinkActive" class="sidebar-link">
        <span class="material-symbols-rounded nav-icon" [class.filled]="marketplaceLink.isActive">storefront</span>
        <span class="nav-text">{{ 'nav.marketplace' | transloco }}</span>
      </a>

      <p class="nav-label" style="margin-top: 0.75rem;">{{ 'nav.groupCommunity' | transloco }}</p>
      <a routerLink="/social" routerLinkActive="sidebar-link-active" #socialLink="routerLinkActive" class="sidebar-link">
        <span class="material-symbols-rounded nav-icon" [class.filled]="socialLink.isActive">groups</span>
        <span class="nav-text">{{ 'nav.community' | transloco }}</span>
      </a>

      <a routerLink="/events" routerLinkActive="sidebar-link-active" #eventsLink="routerLinkActive" class="sidebar-link">
        <span class="material-symbols-rounded nav-icon" [class.filled]="eventsLink.isActive">event</span>
        <span class="nav-text">{{ 'nav.events' | transloco }}</span>
      </a>
    </nav>

    <!-- Footer del sidebar -->
    <div class="sidebar-footer">
      <div class="sidebar-footer-content">
        <span class="material-symbols-rounded">info</span>
        <span class="text-sm">{{ 'nav.version' | transloco }}</span>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .sidebar-container {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 60;
      background-color: var(--sidebar-bg);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-right: 1px solid var(--sidebar-border);
    }

    .sidebar-collapsed {
      width: 72px;
    }

    .sidebar-expanded {
      width: 240px;
      box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 0.5rem;
      width: 100%;
      transition: padding 0.3s ease;
    }

    .sidebar-brand {
      display: flex;
      flex: 0 0 56px;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0.5rem;
      margin-bottom: 0.5rem;
      color: var(--sidebar-text);
      text-decoration: none;
      overflow: hidden;
    }

    .sidebar-brand-logo {
      display: block;
      flex: 0 0 40px;
      width: 40px;
      height: 40px;
      object-fit: contain;
    }

    .sidebar-brand-title {
      overflow: hidden;
      color: var(--sidebar-text);
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      opacity: 0;
      white-space: nowrap;
      transition: opacity 0.2s ease;
    }

    .sidebar-collapsed .sidebar-content {
      padding: 0.5rem;
    }

    .sidebar-collapsed .sidebar-brand {
      justify-content: center;
      padding: 0;
    }

    .sidebar-collapsed .sidebar-brand-logo {
      transform: translateX(10px);
    }

    .sidebar-collapsed .sidebar-brand-title {
      width: 0;
    }

    .sidebar-expanded .sidebar-brand-title {
      width: auto;
      opacity: 1;
    }

    /* ===== NAVEGACIÓN ===== */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--sidebar-text-secondary);
      padding: 0.75rem 0.75rem 0.25rem 0.75rem;
      margin: 0;
      opacity: 0;
      transition: opacity 0.2s ease;
      white-space: nowrap;
      overflow: hidden;
    }

    .sidebar-collapsed .nav-label {
      opacity: 0;
      padding-left: 0;
      padding-right: 0;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      color: var(--sidebar-text);
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
      margin-bottom: 2px;
      font-size: 0.95rem;
      font-weight: 500;
      justify-content: flex-start;
      width: 100%;
    }

    .sidebar-collapsed .sidebar-link {
      justify-content: start;
      padding: 0.75rem;
      width: 44px;
      margin-left: auto;
      margin-right: auto;
    }

    .sidebar-expanded .sidebar-link {
      justify-content: flex-start;
      padding: 0.75rem 1rem;
    }

    .sidebar-link:hover {
      background-color: var(--sidebar-hover);
      color: var(--sidebar-text-hover);
    }

    .sidebar-link:hover .nav-icon {
      color: var(--sidebar-text-hover);
    }

    .sidebar-link .nav-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
      text-align: center;
      color: var(--sidebar-text);
      transition: color 0.2s ease;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }

    .sidebar-link .nav-icon.filled {
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }

    .nav-text {
      flex: 1;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s ease;
      overflow: hidden;
    }

    .sidebar-collapsed .nav-text {
      opacity: 0;
      width: 0;
    }

    .sidebar-expanded .nav-text {
      opacity: 1;
    }

    .sidebar-expanded .nav-label {
      opacity: 0.6;
    }

    .sidebar-expanded .sidebar-footer-content {
      opacity: 0.6;
    }

    /* ===== ACTIVE STATE ===== */
    .sidebar-link-active {
    }

    .sidebar-link-active .nav-icon {
    }

    /* ===== FOOTER DEL SIDEBAR ===== */
    .sidebar-footer {
      margin-top: auto;
      padding-top: 0.5rem;
    }

    .sidebar-footer-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      color: var(--sidebar-text-secondary);
      font-size: 0.8rem;
      opacity: 0;
      transition: opacity 0.2s ease;
      white-space: nowrap;
      overflow: hidden;
    }

    .sidebar-collapsed .sidebar-footer-content {
      opacity: 0;
    }

    .sidebar-footer-content span {
      font-size: 1rem;
    }

    /* ===== SCROLLBAR DEL SIDEBAR ===== */
    .sidebar-nav::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-nav::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-nav::-webkit-scrollbar-thumb {
      background: var(--sidebar-scrollbar);
      border-radius: 10px;
    }

    .sidebar-nav::-webkit-scrollbar-thumb:hover {
      background: var(--sidebar-scrollbar-hover);
    }

    /* ===== DARK MODE AJUSTES ===== */
  .dark .sidebar-link-active {
  }

  @media (max-width: 768px) {
    .sidebar-container {
      display: none;
    }
  }
  `]
})
export class SidebarComponent {
  isOpen = input<boolean>(false);
  isHovered = signal(false);

  onMouseEnter(): void {
    this.isHovered.set(true);
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
  }
}
