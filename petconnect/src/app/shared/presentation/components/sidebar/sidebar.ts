import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink, RouterLinkActive],
  template: `
<aside
  [class]="isHovered() || isOpen() ? 'sidebar-expanded' : 'sidebar-collapsed'"
  class="sidebar-container"
  style="height: calc(100vh - 64px);"
  (mouseenter)="onMouseEnter()"
  (mouseleave)="onMouseLeave()"
>
  <div class="sidebar-content">

    <!-- Navegación principal -->
    <nav class="sidebar-nav">
      <p class="nav-label">INICIO</p>

      <a
        routerLink="/"
        routerLinkActive="sidebar-link-active"
        [routerLinkActiveOptions]="{ exact: true }"
        #homeLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="homeLink.isActive">home</span>
        <span class="nav-text">Inicio</span>
      </a>

      <a
        routerLink="/social"
        routerLinkActive="sidebar-link-active"
        #socialLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="socialLink.isActive">groups</span>
        <span class="nav-text">Comunidad</span>
      </a>

      <p class="nav-label" style="margin-top: 0.75rem;">SERVICIOS</p>

      <a
        routerLink="/vet"
        routerLinkActive="sidebar-link-active"
        #vetLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="vetLink.isActive">favorite</span>
        <span class="nav-text">Veterinario</span>
      </a>

      <a
        routerLink="/marketplace"
        routerLinkActive="sidebar-link-active"
        #marketplaceLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="marketplaceLink.isActive">storefront</span>
        <span class="nav-text">Mercado</span>
      </a>

      <a
        routerLink="/adoptions"
        routerLinkActive="sidebar-link-active"
        [routerLinkActiveOptions]="{ exact: true }"
        #adoptionsLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="adoptionsLink.isActive">pet_supplies</span>
        <span class="nav-text">Adopciones</span>
      </a>

      <p class="nav-label" style="margin-top: 0.75rem;">DESCUBRIR</p>

      <a
        routerLink="/events"
        routerLinkActive="sidebar-link-active"
        #eventsLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="eventsLink.isActive">event</span>
        <span class="nav-text">Eventos</span>
      </a>

      <a
        routerLink="/lostpets"
        routerLinkActive="sidebar-link-active"
        #lostpetsLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="lostpetsLink.isActive">search</span>
        <span class="nav-text">Búsquedas</span>
      </a>

      <p class="nav-label" style="margin-top: 0.75rem;">CONTENIDO</p>

      <a
        routerLink="/messages"
        routerLinkActive="sidebar-link-active"
        #messagesLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="messagesLink.isActive">chat</span>
        <span class="nav-text">Mensajes</span>
      </a>
      <a
        routerLink="/gamification"
        routerLinkActive="sidebar-link-active"
        #gamificationLink="routerLinkActive"
        class="sidebar-link"
      >
        <span class="material-symbols-rounded nav-icon" [class.filled]="gamificationLink.isActive">emoji_events</span>
        <span class="nav-text">Logros</span>
      </a>
    </nav>

    <!-- Footer del sidebar -->
    <div class="sidebar-footer">
      <div class="sidebar-footer-content">
        <span class="material-symbols-rounded">info</span>
        <span class="text-sm">PetConnect v2.0</span>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .sidebar-container {
      position: fixed;
      left: 0;
      top: 64px;
      bottom: 0;
      z-index: 50;
      background-color: var(--sidebar-bg);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
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

    .sidebar-collapsed .sidebar-content {
      padding: 0.5rem;
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
