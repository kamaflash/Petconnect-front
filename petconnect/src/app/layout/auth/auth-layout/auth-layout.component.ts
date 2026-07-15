import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-background">
        <div class="auth-background-pattern"></div>
      </div>
      <div class="auth-content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      background-color: var(--bitbucket-header-bg);
    }

    .auth-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
    }

    .auth-background-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.02;
      background-image:
        radial-gradient(circle at 10% 20%, var(--primary-color) 0%, transparent 20%),
        radial-gradient(circle at 90% 80%, var(--primary-color) 0%, transparent 20%);
    }

    .dark .auth-background-pattern {
      opacity: 0.03;
    }

    .auth-content {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
    }

    :host ::ng-deep .auth-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 12px;
      padding: 2.5rem 2rem;
      border: 1px solid var(--bitbucket-border);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .dark :host ::ng-deep .auth-card {
      background-color: var(--bitbucket-header-bg);
      border-color: var(--bitbucket-border);
    }

    /* ===== HEADER ===== */
    :host ::ng-deep .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    :host ::ng-deep .auth-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    :host ::ng-deep .auth-logo-icon {
      width: 44px;
      height: 44px;
      background-color: var(--primary-color);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    :host ::ng-deep .auth-logo-icon i {
      color: white;
      font-size: 1.5rem;
    }

    :host ::ng-deep .auth-logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--bitbucket-text-primary);
    }

    :host ::ng-deep .auth-subtitle {
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    /* ===== LINKS ===== */
    :host ::ng-deep .auth-link {
      text-align: center;
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
      padding-top: 1.5rem;
      border-top: 1px solid var(--bitbucket-border);
      margin-top: 1.5rem;
    }

    :host ::ng-deep .auth-link-text {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
      margin-left: 0.25rem;
      transition: color 0.2s ease;
    }

    :host ::ng-deep .auth-link-text:hover {
      color: var(--primary-color-hover);
      text-decoration: underline;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 640px) {
      :host ::ng-deep .auth-card {
        padding: 1.5rem 1rem;
      }

      :host ::ng-deep .auth-logo-icon {
        width: 36px;
        height: 36px;
      }

      :host ::ng-deep .auth-logo-icon i {
        font-size: 1.25rem;
      }

      :host ::ng-deep .auth-logo-text {
        font-size: 1.25rem;
      }
    }

    @media (max-width: 480px) {
      .auth-layout {
        padding: 0.5rem;
      }
    }
  `]
})
export class AuthLayoutComponent {}
