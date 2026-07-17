import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableCardComponent, TableCardItem } from '../../../shared/presentation/components/table-card/table-card.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { SocialService, PostResponse, EventResponse, GroupResponse, StoryResponse } from '../../../social/infrastructure/services/social.service';

interface AdminTab {
  label: string;
  icon: string;
  value: string;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    AvatarModule,
    ProgressBarModule,
    TagModule,
    DialogModule,
    ToastModule,
    TableCardComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="admin-page">
      <div class="admin-container">
        <!-- Header -->
        <div class="admin-header">
          <h1>Panel de Administración</h1>
          <p class="welcome-text">¡Bienvenido, {{ userName() }}!</p>
        </div>

        <!-- Tabs -->
        <div class="admin-tabs">
          <div class="tabs-container">
            <button
              class="tab-button"
              [class.active]="activeTab() === 'posts'"
              (click)="setActiveTab('posts')"
            >
              <span class="material-symbols-rounded" [class.active-icon]="activeTab() === 'posts'">photo_library</span>
              <span>Publicaciones</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'events'"
              (click)="setActiveTab('events')"
            >
              <span class="material-symbols-rounded" [class.active-icon]="activeTab() === 'events'">event</span>
              <span>Eventos</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'pets'"
              (click)="setActiveTab('pets')"
            >
              <span class="material-symbols-rounded" [class.active-icon]="activeTab() === 'pets'">pet_supplies</span>
              <span>Mascotas</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'stories'"
              (click)="setActiveTab('stories')"
            >
              <span class="material-symbols-rounded" [class.active-icon]="activeTab() === 'stories'">schedule</span>
              <span>Historias</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'groups'"
              (click)="setActiveTab('groups')"
            >
              <span class="material-symbols-rounded" [class.active-icon]="activeTab() === 'groups'">groups</span>
              <span>Grupos</span>
            </button>
          </div>
        </div>

        <!-- Loading indicator -->
        <div class="loading-overlay" *ngIf="loading()">
          <p-progressBar mode="indeterminate" [style]="{'height': '4px'}"></p-progressBar>
        </div>

        <!-- Contenido de tabs -->
        <div class="admin-content">
          <!-- Publicaciones -->
          <div class="admin-section" *ngIf="activeTab() === 'posts'">

            <app-table-card
              [items]="adminPostItems()"
              [showSearch]="true"
              [filteredItems]="adminPostItems()"
              [editable]="true"
              [loading]="loading()"
              (onAdd)="showCreatePostDialog()"
            >
              <ng-template card-actions let-item>
                <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deletePostById(item.id)" />
              </ng-template>
            </app-table-card>
          </div>

          <!-- Eventos -->
          <div class="admin-section" *ngIf="activeTab() === 'events'">
            <app-table-card
              [items]="adminEventItems()"
              [showSearch]="true"
              [filteredItems]="adminEventItems()"
              [editable]="true"
              (onAdd)="showCreateEventDialog()"
            >
              <ng-template card-actions let-item>
                <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deleteEventById(item.id)" />
              </ng-template>
            </app-table-card>
          </div>

          <!-- Mascotas -->
          <div class="admin-section" *ngIf="activeTab() === 'pets'">
            <app-table-card
              [items]="adminPetItems()"
              [showSearch]="true"
              [filteredItems]="adminPetItems()"
              [editable]="true"
              (onAdd)="showCreatePetDialog()"
            >
              <ng-template card-actions let-item>
                <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deletePetById(item.id)" />
              </ng-template>
            </app-table-card>
          </div>

          <!-- Historias -->
          <div class="admin-section" *ngIf="activeTab() === 'stories'">
            <app-table-card
              [items]="adminStoryItems()"
              [showSearch]="true"
              [filteredItems]="adminStoryItems()"
              [editable]="true"
              (onAdd)="showCreateStoryDialog()"
            >
              <ng-template card-actions let-item>
                <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deleteStoryById(item.id)" />
              </ng-template>
            </app-table-card>
          </div>

          <!-- Grupos -->
          <div class="admin-section" *ngIf="activeTab() === 'groups'">
            <app-table-card
              [items]="adminGroupItems()"
              [showSearch]="true"
              [filteredItems]="adminGroupItems()"
              [editable]="true"
              (onAdd)="showCreateGroupDialog()"
            >
              <ng-template card-actions let-item>
                <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deleteGroupById(item.id)" />
              </ng-template>
            </app-table-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      min-height: 100vh;
      background-color: var(--bitbucket-header-bg);
      transition: background-color 0.3s ease;
    }

    .dark .admin-page {
      background-color: #111827;
    }

    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }

    .admin-header {
      margin-bottom: 2rem;
    }

    .admin-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--bitbucket-text-primary);
      margin: 0 0 0.5rem 0;
    }

    .admin-tabs {
      margin-top: 1rem;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .tabs-container {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding: 0.75rem 0;
    }

    .tab-button {
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

    .tab-button:hover {
      color: var(--bitbucket-text-primary);
    }

    .tab-button.active {
      color: var(--bitbucket-text-primary);
    }

    .tab-button.active::after {
      content: '';
      position: absolute;
      bottom: -0.75rem;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary-color);
      border-radius: 1px;
    }

    .tab-button .material-symbols-rounded {
      font-size: 1.25rem;
      transition: all 0.2s;
    }

    .tab-button .material-symbols-rounded.active-icon {
      font-variation-settings: 'FILL' 1;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    :host ::ng-deep .loading-overlay .p-progressbar {
      height: 4px;
    }

    :host ::ng-deep .loading-overlay .p-progressbar-value {
      background: var(--primary-color);
    }

    .admin-section {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .tabs-container {
        gap: 0.25rem;
      }

      .tab-button {
        padding: 0.375rem 0.75rem;
        font-size: 0.875rem;
      }
    }
  `]
})
export class AdminPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly socialService = inject(SocialService);
  private readonly messageService = inject(MessageService);

  // Loading state
  loading = signal(true);

  // Tabs
  activeTab = signal('posts');

  // Data from backend
  adminPosts = signal<PostResponse[]>([]);
  adminEvents = signal<EventResponse[]>([]);
  adminPets = signal<any[]>([]);
  adminStories = signal<StoryResponse[]>([]);
  adminGroups = signal<GroupResponse[]>([]);

  // User info
  userName = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : 'Usuario';
  });

  // Convert to TableCardItem format
  adminPostItems = computed((): TableCardItem[] => {
    return this.adminPosts().map(post => ({
      id: post.id,
      name: post.caption || 'Sin título',
      avatar: post.imageUrl || 'https://placehold.co/150',
      description: `Likes: ${post.likesCount} | Comentarios: ${post.commentsCount}`,
      tags: post.active ? ['Activo'] : ['Inactivo'],
    }));
  });

  adminEventItems = computed((): TableCardItem[] => {
    return this.adminEvents().map(event => ({
      id: event.id,
      name: event.title,
      avatar: event.imageUrl || 'https://placehold.co/150',
      description: event.description,
      location: event.location,
      tags: event.active ? ['Activo'] : ['Inactivo'],
    }));
  });

  adminPetItems = computed((): TableCardItem[] => {
    return this.adminPets().map(pet => ({
      id: pet.id,
      name: pet.name,
      avatar: pet.avatarUrl || 'https://placehold.co/150',
      description: pet.breed || pet.species,
      tags: pet.active ? ['Activo'] : ['Inactivo'],
    }));
  });

  adminStoryItems = computed((): TableCardItem[] => {
    return this.adminStories().map(story => ({
      id: story.id,
      name: 'Historia',
      avatar: story.imageUrl || 'https://placehold.co/150',
      description: story.seen ? 'Vista' : 'Pendiente',
    }));
  });

  adminGroupItems = computed((): TableCardItem[] => {
    return this.adminGroups().map(group => ({
      id: group.id,
      name: group.name,
      avatar: group.avatarUrl || 'https://placehold.co/150',
      description: group.description,
      tags: group.active ? ['Activo'] : ['Inactivo'],
    }));
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  private loadAllData(): void {
    this.loading.set(true);

    // Load all data in parallel
    this.socialService.getAllPosts().subscribe({
      next: (posts) => this.adminPosts.set(posts),
      error: (err) => console.error('Error loading posts:', err)
    });

    this.socialService.getAllEvents().subscribe({
      next: (events) => this.adminEvents.set(events),
      error: (err) => console.error('Error loading events:', err)
    });

    this.socialService.getAllGroups().subscribe({
      next: (groups) => this.adminGroups.set(groups),
      error: (err) => console.error('Error loading groups:', err)
    });

    // Set loading to false after a short delay
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  // Create dialogs
  showCreatePostDialog() {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La creación de publicaciones desde el admin estará disponible próximamente'
    });
  }

  showCreateEventDialog() {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La creación de eventos desde el admin estará disponible próximamente'
    });
  }

  showCreatePetDialog() {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La creación de mascotas desde el admin estará disponible próximamente'
    });
  }

  showCreateStoryDialog() {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La creación de historias desde el admin estará disponible próximamente'
    });
  }

  showCreateGroupDialog() {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La creación de grupos desde el admin estará disponible próximamente'
    });
  }

  // Delete actions
  deletePostById(id: string) {
    this.socialService.deletePost(id).subscribe({
      next: () => {
        this.adminPosts.update(posts => posts.filter(p => p.id !== id));
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Publicación eliminada correctamente'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la publicación'
        });
      }
    });
  }

  deleteEventById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La eliminación de eventos estará disponible próximamente'
    });
  }

  deletePetById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La eliminación de mascotas estará disponible próximamente'
    });
  }

  deleteStoryById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La eliminación de historias estará disponible próximamente'
    });
  }

  deleteGroupById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La eliminación de grupos estará disponible próximamente'
    });
  }
}
