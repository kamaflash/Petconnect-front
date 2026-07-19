import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  icon: string;
  iconType?: 'material' | 'prime';
  visible?: boolean | (() => boolean);
  badge?: number;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-tabs-instagram">
      <div class="tabs-container-instagram">
        <button
          class="tab-button-instagram"
          [class.active]="activeTab() === tab.id"
          (click)="setActiveTab(tab.id)"
          *ngFor="let tab of visibleTabs()"
        >
          <ng-container *ngIf="tab.iconType === 'prime'">
            <i class="pi {{ activeTab() === tab.id ? getFilledIcon(tab.icon) : tab.icon }}" [class.active-icon]="activeTab() === tab.id"></i>
          </ng-container>
          <ng-container *ngIf="tab.iconType !== 'prime'">
            <span class="material-symbols-rounded" [class.active-icon]="activeTab() === tab.id">{{ tab.icon }}</span>
          </ng-container>
          <span class="tabs-button-text">{{ tab.label }}</span>
          <span class="tab-badge" *ngIf="tab.badge && tab.badge > 0">{{ tab.badge }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .profile-tabs-instagram {
      margin-top: 1rem;
      border-bottom: 1px solid var(--bitbucket-border);
      margin-bottom: 1rem;
    }

    .tabs-container-instagram {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding: 0.75rem 0;
    }

    .tab-button-instagram {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--bitbucket-text-secondary);
      font-weight: 500;
      font-size: 0.9375rem;
      transition: all 0.2s;
      position: relative;
    }

    .tab-button-instagram:hover {
      color: var(--bitbucket-text-primary);
    }

    .tab-button-instagram.active {
      color: var(--bitbucket-text-primary);
    }

    .tab-button-instagram.active::after {
      content: '';
      position: absolute;
      bottom: -0.75rem;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary-color);
      border-radius: 1px;
    }

    .tab-button-instagram .material-symbols-rounded {
      font-size: 1.25rem;
      transition: all 0.2s;
    }

    .tab-button-instagram .material-symbols-rounded.active-icon {
      font-variation-settings: 'FILL' 1;
      color: var(--primary-color);
    }

    .tab-button-instagram .pi {
      font-size: 1.125rem;
      transition: all 0.2s;
    }

    .tab-button-instagram .pi.active-icon {
      color: var(--primary-color);
      transform: scale(1.1);
    }

    .tab-badge {
      background: var(--red-500);
      color: white;
      font-size: 0.6rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      margin-left: 0.25rem;
    }

    @media (max-width: 768px) {
      .tabs-button-text {
        display: none;
      }
    }
  `]
})
export class TabsComponent {
  tabs = input<Tab[]>([]);
  activeTab = input<string>('posts');
  tabChange = output<string>();

  visibleTabs = computed(() => {
    return this.tabs().filter(tab => {
      if (tab.visible === undefined || tab.visible === true) {
        return true;
      }
      if (typeof tab.visible === 'function') {
        return tab.visible();
      }
      return tab.visible;
    });
  });

  setActiveTab(tabId: string) {
    this.tabChange.emit(tabId);
  }

  getFilledIcon(icon: string): string {
    const filledIcons: { [key: string]: string } = {
      'pi-home': 'pi-home-fill',
      'pi-user': 'pi-user-fill',
      'pi-users': 'pi-users-fill',
      'pi-heart': 'pi-heart-fill',
      'pi-bell': 'pi-bell-fill',
      'pi-envelope': 'pi-envelope-fill',
      'pi-calendar': 'pi-calendar-fill',
      'pi-cog': 'pi-cog-fill',
      'pi-star': 'pi-star-fill',
      'pi-bookmark': 'pi-bookmark-fill',
      'pi-thumbs-up': 'pi-thumbs-up-fill',
      'pi-comment': 'pi-comment-fill',
      'pi-share-alt': 'pi-share-alt-fill',
      'pi-search': 'pi-search-fill',
      'pi-shopping-cart': 'pi-shopping-cart-fill',
      'pi-plus': 'pi-plus-fill',
      'pi-check': 'pi-check-fill',
      'pi-times': 'pi-times-fill',
      'pi-pencil': 'pi-pencil-fill',
      'pi-trash': 'pi-trash-fill',
      'pi-download': 'pi-download-fill',
      'pi-upload': 'pi-upload-fill',
      'pi-image': 'pi-image-fill',
      'pi-video': 'pi-video-fill',
      'pi-music': 'pi-music-fill',
      'pi-file': 'pi-file-fill',
      'pi-folder': 'pi-folder-fill',
      'pi-lock': 'pi-lock-fill',
      'pi-unlock': 'pi-unlock-fill',
      'pi-eye': 'pi-eye-fill',
      'pi-eye-slash': 'pi-eye-slash-fill',
      'pi-flag': 'pi-flag-fill',
      'pi-tag': 'pi-tag-fill',
      'pi-minus': 'pi-minus-fill',
      'pi-clock': 'pi-clock-fill',
      'pi-map-marker': 'pi-map-marker-fill',
      'pi-phone': 'pi-phone-fill'
    };
    return filledIcons[icon] || icon;
  }
}
