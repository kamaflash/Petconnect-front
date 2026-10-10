import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TranslocoModule],
  template: `
    <nav class="breadcrumb-container" *ngIf="breadcrumbs().length > 0">
      <ol class="breadcrumb-list">
        <li *ngFor="let item of breadcrumbs(); let last = last" class="breadcrumb-item">
          <ng-container *ngIf="!last; else lastItem">
            <a
              [routerLink]="item.path"
              class="breadcrumb-link"
              [class.has-icon]="item.icon"
            >
              <i *ngIf="item.icon" class="{{ item.icon }} breadcrumb-icon"></i>
              <span class="breadcrumb-text">{{ item.label | transloco }}</span>
            </a>
            <i class="pi pi-chevron-right breadcrumb-separator"></i>
          </ng-container>
          <ng-template #lastItem>
            <span class="breadcrumb-current" [class.has-icon]="item.icon">
              <i *ngIf="item.icon" class="{{ item.icon }} breadcrumb-icon"></i>
              <span class="breadcrumb-text">{{ item.label | transloco }}</span>
            </span>
          </ng-template>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-container {
      display: flex;
      align-items: center;
      padding: 0.625rem 1.5rem;
      background-color: var(--surface-card);
      min-height: 48px;
      position: fixed;
      top: 64px;
      left: 72px;
      right: 0;
      width: calc(100% - 72px);
      box-sizing: border-box;
      z-index: 9;
      border-bottom: 1px solid var(--surface-border);
    }

    .breadcrumb-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.125rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.5rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: all var(--transition-fast);
    }

    .breadcrumb-link:hover {
      color: var(--primary-color);
      background-color: var(--surface-hover);
    }

    .breadcrumb-link.has-icon {
      padding-left: 0.375rem;
    }

    .breadcrumb-icon {
      font-size: 0.875rem;
      color: var(--text-tertiary);
    }

    .breadcrumb-text {
      line-height: 1;
    }

    .breadcrumb-separator {
      color: var(--text-tertiary);
      font-size: 0.625rem;
      margin: 0 0.125rem;
      opacity: 0.4;
    }

    .breadcrumb-current {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.5rem;
      color: var(--text-primary);
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .breadcrumb-current.has-icon {
      padding-left: 0.375rem;
    }

    .dark .breadcrumb-container {
      background-color: var(--surface-card);
      border-bottom-color: var(--surface-border);
    }

    .dark .breadcrumb-link {
      color: var(--text-secondary);
    }

    .dark .breadcrumb-link:hover {
      color: var(--primary-color);
      background-color: var(--surface-hover);
    }

    .dark .breadcrumb-current {
      color: var(--text-primary);
    }

    .dark .breadcrumb-icon {
      color: var(--text-tertiary);
    }

    @media (max-width: 768px) {
      .breadcrumb-container {
        padding: 0.5rem 1rem;
        min-height: 40px;
        left: 0;
        width: 100%;
      }

      .breadcrumb-link,
      .breadcrumb-current {
        font-size: 0.75rem;
        padding: 0.25rem 0.375rem;
      }

      .breadcrumb-icon {
        font-size: 0.8125rem;
      }
    }

    @media (max-width: 640px) {
      .breadcrumb-container {
        padding: 0.375rem 0.75rem;
      }

      .breadcrumb-link,
      .breadcrumb-current {
        font-size: 0.6875rem;
      }
    }
  `]
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  breadcrumbs = signal<BreadcrumbItem[]>([]);
  private subscription = new Subscription();

  // Mapeo de rutas a claves i18n e iconos
  private readonly routeLabels: Record<string, { label: string; icon?: string }> = {
    '': { label: 'breadcrumb.home', icon: 'pi pi-home' },
    'pets': { label: 'breadcrumb.pets', icon: 'pi pi-paw' },
    'users': { label: 'breadcrumb.users', icon: 'pi pi-users' },
    'health': { label: 'breadcrumb.health', icon: 'pi pi-user-md' },
    'vet': { label: 'breadcrumb.health', icon: 'pi pi-user-md' },
    'appointments': { label: 'breadcrumb.appointments', icon: 'pi pi-calendar' },
    'lostpets': { label: 'breadcrumb.lostpets', icon: 'pi pi-search' },
    'adoptions': { label: 'breadcrumb.adoptions', icon: 'pi pi-heart' },
    'events': { label: 'breadcrumb.events', icon: 'pi pi-calendar-times' },
    'marketplace': { label: 'breadcrumb.marketplace', icon: 'pi pi-shopping-cart' },
    'services': { label: 'breadcrumb.services', icon: 'pi pi-briefcase' },
    'content': { label: 'breadcrumb.content', icon: 'pi pi-image' },
    'social': { label: 'breadcrumb.social', icon: 'pi pi-users' },
    'profile': { label: 'breadcrumb.profile', icon: 'pi pi-user' },
    'gamification': { label: 'breadcrumb.gamification', icon: 'pi pi-trophy' },
    'admin': { label: 'breadcrumb.admin', icon: 'pi pi-cog' },
    'auth': { label: 'breadcrumb.auth', icon: 'pi pi-sign-in' }
  };

  ngOnInit(): void {
    // Escuchar cambios de ruta
    this.subscription.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.updateBreadcrumbs();
        })
    );

    // Inicializar breadcrumbs
    this.updateBreadcrumbs();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateBreadcrumbs(): void {
    const currentUrl = this.router.url;
    const segments = currentUrl.split('/').filter(segment => segment);

    const breadcrumbs: BreadcrumbItem[] = [];

    // Siempre agregar el inicio
    breadcrumbs.push({
      label: 'breadcrumb.home',
      path: '/',
      icon: 'pi pi-home'
    });

    // Construir breadcrumbs para cada segmento
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      const routeInfo = this.routeLabels[segment] || {
        label: this.formatLabel(segment),
        icon: 'pi pi-circle'
      };

      breadcrumbs.push({
        label: routeInfo.label,
        path: currentPath,
        icon: routeInfo.icon
      });
    });

    this.breadcrumbs.set(breadcrumbs);
  }

  private formatLabel(segment: string): string {
    // Formatear el segmento para mostrar como etiqueta legible
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
