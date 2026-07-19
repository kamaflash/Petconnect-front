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
import { TabsComponent, Tab } from '../../../shared/presentation/components/tabs/tabs.component';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { SocialService, PostResponse, EventResponse, GroupResponse, StoryResponse } from '../../../social/infrastructure/services/social.service';
import { PetResponse } from '../../../pets/domain/pet.model';
import { PetService } from '../../../pets/infrastructure/services/pet.service';

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
    TabsComponent,
    DynamicFormComponent,
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
        <app-tabs
          [tabs]="adminTabs()"
          [activeTab]="activeTab()"
          (tabChange)="onTabChange($event)"
        />

        <!-- Loading indicator -->
        <div class="loading-overlay" *ngIf="loading()">
          <p-progressBar mode="indeterminate" [style]="{'height': '4px'}"></p-progressBar>
        </div>

        <!-- Contenido de tabs -->
        <div class="admin-content">
          <!-- Publicaciones -->
          <div class="admin-section" *ngIf="activeTab() === 'posts'">
            <!-- Formulario de creación -->
            <div class="form-container" *ngIf="showCreatePostForm()">
              <app-dynamic-form
                [config]="postFormConfig"
                [(formData)]="postFormData"
                (onSubmitClick)="handleCreatePost($event)"
                (onCancel)="showCreatePostForm.set(false)"
              />
            </div>

            <!-- Lista de publicaciones -->
            <div *ngIf="!showCreatePostForm()">
              <app-table-card
              [type]="'post'"
                [items]="adminPostItems()"
                [showSearch]="true"
                [filteredItems]="adminPostItems()"
                [editable]="true"
                [loading]="loading()"
                (onAdd)="showCreatePostForm.set(true)"
              >
                <ng-template card-actions let-item>
                  <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deletePostById(item.id)" />
                </ng-template>
              </app-table-card>
            </div>
          </div>

          <!-- Eventos -->
          <div class="admin-section" *ngIf="activeTab() === 'events'">
            <!-- Formulario de creación -->
            <div class="form-container" *ngIf="showCreateEventForm()">
              <app-dynamic-form
                [config]="eventFormConfig"
                [(formData)]="eventFormData"
                (onSubmitClick)="handleCreateEvent($event)"
                (onCancel)="showCreateEventForm.set(false)"
              />
            </div>

            <!-- Lista de eventos -->
            <div *ngIf="!showCreateEventForm()">
              <app-table-card
              [type]="'event'"
                [items]="adminEventItems()"
                [showSearch]="true"
                [filteredItems]="adminEventItems()"
                [editable]="true"
                (onAdd)="showCreateEventForm.set(true)"
              >
                <ng-template card-actions let-item>
                  <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deleteEventById(item.id)" />
                </ng-template>
              </app-table-card>
            </div>
          </div>

          <!-- Mascotas -->
          <div class="admin-section" *ngIf="activeTab() === 'pets'">
            <!-- Formulario de creación -->
            <div class="form-container" *ngIf="showCreatePetForm()">
              <app-dynamic-form
                [config]="petFormConfig"
                [(formData)]="petFormData"
                (onSubmitClick)="handleCreatePet($event)"
                (onCancel)="showCreatePetForm.set(false)"
              />
            </div>

            <!-- Lista de mascotas -->
            <div *ngIf="!showCreatePetForm()">
              <app-table-card
              [type]="'pet'"
                [items]="adminPetItems()"
                [showSearch]="true"
                [filteredItems]="adminPetItems()"
                [editable]="true"
                (onAdd)="showCreatePetForm.set(true)"
              >
                <ng-template card-actions let-item>
                  <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deletePetById(item.id)" />
                </ng-template>
              </app-table-card>
            </div>
          </div>

          <!-- Historias -->
          <div class="admin-section" *ngIf="activeTab() === 'stories'">
            <!-- Formulario de creación -->
            <div class="form-container" *ngIf="showCreateStoryForm()">
              <app-dynamic-form
                [config]="storyFormConfig"
                [(formData)]="storyFormData"
                (onSubmitClick)="handleCreateStory($event)"
                (onCancel)="showCreateStoryForm.set(false)"
              />
            </div>

            <!-- Lista de historias -->
            <div *ngIf="!showCreateStoryForm()">
              <app-table-card
              [type]="'story'"
                [items]="adminStoryItems()"
                [showSearch]="true"
                [filteredItems]="adminStoryItems()"
                [editable]="true"
                (onAdd)="showCreateStoryForm.set(true)"
              >
                <ng-template card-actions let-item>
                  <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deleteStoryById(item.id)" />
                </ng-template>
              </app-table-card>
            </div>
          </div>

          <!-- Grupos -->
          <div class="admin-section" *ngIf="activeTab() === 'groups'">

            <!-- Formulario de creación -->
            <div class="form-container" *ngIf="showCreateGroupForm()">
              <app-dynamic-form
                [config]="groupFormConfig"
                [(formData)]="groupFormData"
                (onSubmitClick)="handleCreateGroup($event)"
                (onCancel)="showCreateGroupForm.set(false)"
              />
            </div>

            <!-- Lista de grupos -->
            <div *ngIf="!showCreateGroupForm()">
              <app-table-card
              [type]="'group'"
                [items]="adminGroupItems()"
                [showSearch]="true"
                [filteredItems]="adminGroupItems()"
                [editable]="true"
                (onAdd)="showCreateGroupForm.set(true)"
              >
                <ng-template card-actions let-item>
                  <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deleteGroupById(item.id)" />
                </ng-template>
              </app-table-card>
            </div>
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

    .form-container {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
  `]
})
export class AdminPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly socialService = inject(SocialService);
  private readonly petService = inject(PetService);
  private readonly messageService = inject(MessageService);

  // Loading state
  loading = signal(true);

  // Tabs
  activeTab = signal('posts');

  // Form states
  showCreatePostForm = signal(false);
  showCreateEventForm = signal(false);
  showCreatePetForm = signal(false);
  showCreateStoryForm = signal(false);
  showCreateGroupForm = signal(false);

  // Form data
  postFormData = signal<any>({});
  eventFormData = signal<any>({});
  petFormData = signal<any>({});
  storyFormData = signal<any>({});
  groupFormData = signal<any>({});

  // Data from backend
  adminPosts = signal<any[]>([]);
  adminEvents = signal<any[]>([]);
  adminPets = signal<any[]>([]);
  adminStories = signal<any[]>([]);
  adminGroups = signal<any[]>([]);

  // Form configurations
  postFormConfig: DynamicFormConfig = {
    title: 'Crear Nueva Publicación',
    submitLabel: 'Crear Publicación',
    showCancel: true,
    fields: [
      {
        key: 'caption',
        label: 'Texto',
        type: 'textarea',
        placeholder: 'Escribe algo...',
        rows: 3,
        validation: { required: true, minLength: 1, maxLength: 500 }
      },
      {
        key: 'imageUrl',
        label: 'Imagen',
        type: 'file',
        placeholder: 'Selecciona una imagen',
        accept: 'image/*',
        maxFileSize: 5000000,
        multiple: false
      }
    ]
  };

  eventFormConfig: DynamicFormConfig = {
    title: 'Crear Nuevo Evento',
    submitLabel: 'Crear Evento',
    showCancel: true,
    fields: [
      {
        key: 'title',
        label: 'Título',
        type: 'input',
        placeholder: 'Título del evento',
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'description',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Descripción del evento',
        rows: 3,
        validation: { required: true }
      },
      {
        key: 'location',
        label: 'Ubicación',
        type: 'input',
        placeholder: 'Ubicación del evento',
        validation: { required: true }
      },
      {
        key: 'date',
        label: 'Fecha',
        type: 'date',
        placeholder: 'Selecciona la fecha',
        showIcon: true,
        dateFormat: 'dd/mm/yy',
        validation: { required: true }
      }
    ]
  };

  petFormConfig: DynamicFormConfig = {
    title: 'Crear Nueva Mascota',
    submitLabel: 'Crear Mascota',
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: 'Nombre',
        type: 'input',
        placeholder: 'Nombre de la mascota',
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'species',
        label: 'Especie',
        type: 'select',
        placeholder: 'Seleccione una especie',
        options: [
          { label: 'Perro', value: 'dog' },
          { label: 'Gato', value: 'cat' },
          { label: 'Ave', value: 'bird' },
          { label: 'Conejo', value: 'rabbit' },
          { label: 'Hámster', value: 'hamster' },
          { label: 'Otro', value: 'other' }
        ],
        validation: { required: true }
      },
      {
        key: 'breed',
        label: 'Raza',
        type: 'input',
        placeholder: 'Raza de la mascota',
        validation: { maxLength: 100 }
      },
      {
        key: 'dateOfBirth',
        label: 'Fecha de Nacimiento',
        type: 'date',
        placeholder: 'Seleccione la fecha',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'gender',
        label: 'Género',
        type: 'select',
        placeholder: 'Seleccione el género',
        options: [
          { label: 'Macho', value: 'male' },
          { label: 'Hembra', value: 'female' },
          { label: 'Desconocido', value: 'unknown' }
        ]
      },
      {
        key: 'color',
        label: 'Color',
        type: 'input',
        placeholder: 'Color de la mascota',
        validation: { maxLength: 100 }
      },
      {
        key: 'weight',
        label: 'Peso',
        type: 'number',
        placeholder: 'Peso',
        validation: { min: 0.1, max: 200 }
      },
      {
        key: 'weightUnit',
        label: 'Unidad de Peso',
        type: 'select',
        placeholder: 'Seleccione la unidad',
        options: [
          { label: 'kg', value: 'kg' },
          { label: 'lb', value: 'lb' }
        ]
      },
      {
        key: 'bio',
        label: 'Biografía',
        type: 'textarea',
        placeholder: 'Información sobre la personalidad y características de tu mascota...',
        rows: 3,
        validation: { maxLength: 500 }
      },
      {
        key: 'photos',
        label: 'Fotos',
        type: 'file',
        placeholder: 'Selecciona fotos de la mascota',
        accept: 'image/*',
        maxFileSize: 5000000,
        multiple: true
      }
    ]
  };

  storyFormConfig: DynamicFormConfig = {
    title: 'Crear Nueva Historia',
    submitLabel: 'Crear Historia',
    showCancel: true,
    fields: [
      {
        key: 'imageUrl',
        label: 'Imagen',
        type: 'file',
        placeholder: 'Selecciona una imagen',
        accept: 'image/*',
        maxFileSize: 5000000,
        multiple: false,
        validation: { required: true }
      },
      {
        key: 'duration',
        label: 'Duración (horas)',
        type: 'number',
        placeholder: 'Horas que durará la historia',
        validation: { required: true, min: 1, max: 24 }
      }
    ]
  };

  groupFormConfig: DynamicFormConfig = {
    title: 'Crear Nuevo Grupo',
    submitLabel: 'Crear Grupo',
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: 'Nombre',
        type: 'input',
        placeholder: 'Nombre del grupo',
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'description',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Descripción del grupo',
        rows: 3,
        validation: { required: true }
      },
      {
        key: 'isPublic',
        label: 'Grupo público',
        type: 'checkbox'
      }
    ]
  };

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
      image: pet.imageUrls?.[0] || pet.avatarUrl || 'https://placehold.co/150',
      description: `Especie: ${pet.species}${pet.breed ? ` | Raza: ${pet.breed}` : ''}${pet.gender ? ` | Género: ${pet.gender}` : ''}`,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender,
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
// Get the current user ID
    const user = this.authService.user();
    const ownerId:string = user?.id || '';
    // Load all pets (for admin)
    this.petService.getPetsByOwner(ownerId).subscribe({
      next: (pets) => this.adminPets.set(pets),
      error: (err) => console.error('Error loading pets:', err)
    });

    // Set loading to false after a short delay
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  // Create handlers
  handleCreatePost(postData: any) {
    const newPost = {
      id: Date.now().toString(),
      caption: postData.caption,
      imageUrl: postData.imageUrl?.[0]?.objectURL || 'https://placehold.co/150',
      likesCount: 0,
      commentsCount: 0,
      active: true
    };

    this.adminPosts.update(posts => [...posts, newPost]);
    this.showCreatePostForm.set(false);

    this.messageService.add({
      severity: 'success',
      summary: 'Publicación creada',
      detail: 'La publicación ha sido creada correctamente'
    });
  }

  handleCreateEvent(eventData: any) {
    const newEvent = {
      id: Date.now().toString(),
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      date: eventData.date,
      imageUrl: eventData.imageUrl?.[0]?.objectURL || 'https://placehold.co/150',
      active: true
    };

    this.adminEvents.update(events => [...events, newEvent]);
    this.showCreateEventForm.set(false);

    this.messageService.add({
      severity: 'success',
      summary: 'Evento creado',
      detail: `El evento ${eventData.title} ha sido creado correctamente`
    });
  }

  handleCreatePet(petData: any) {
    // Get the photos array from files (uploadedFiles) or from form data
    const photosArray = petData.files?.photos || petData.photos || [];

    // Debug: Log the received data
    console.log('handleCreatePet - petData:', petData);
    console.log('handleCreatePet - photosArray length:', photosArray.length);
    console.log('handleCreatePet - photosArray:', photosArray);

    // Extract the first image as the main image
    const imageFile = photosArray[0]?.originalFile;

    // Extract remaining images as additional images
    const imageFiles: File[] = photosArray
      .slice(1)
      .map((photo: any) => photo.originalFile)
      .filter((file: File | undefined) => file !== undefined) as File[];

    console.log('handleCreatePet - imageFile:', imageFile);
    console.log('handleCreatePet - imageFiles length:', imageFiles.length);
    console.log('handleCreatePet - imageFiles:', imageFiles);

    // Get the current user ID
    const user = this.authService.user();
    const ownerId = user?.id;

    // Create the request for the backend with only fundamental fields
    const request = {
      name: petData.name,
      species: petData.species,
      breed: petData.breed || null,
      dateOfBirth: petData.dateOfBirth || null,
      gender: petData.gender || null,
      color: petData.color || null,
      microchipId: null,
      bio: petData.bio || null,
      weight: petData.weight ? parseFloat(petData.weight) : null,
      weightUnit: petData.weightUnit || 'kg'
    };

    // Send to backend
    this.petService.createPet(request, imageFile, imageFiles, ownerId).subscribe({
      next: (response) => {
        this.adminPets.update(pets => [...pets, response]);
        this.showCreatePetForm.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Mascota creada',
          detail: `La mascota ${petData.name} ha sido creada correctamente`
        });
      },
      error: (err) => {
        console.error('Error creating pet:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la mascota'
        });
      }
    });
  }

  handleCreateStory(storyData: any) {
    const newStory = {
      id: Date.now().toString(),
      imageUrl: storyData.imageUrl?.[0]?.objectURL || 'https://placehold.co/150',
      duration: storyData.duration,
      seen: false
    };

    this.adminStories.update(stories => [...stories, newStory]);
    this.showCreateStoryForm.set(false);

    this.messageService.add({
      severity: 'success',
      summary: 'Historia creada',
      detail: 'La historia ha sido creada correctamente'
    });
  }

  handleCreateGroup(groupData: any) {
    const newGroup = {
      id: Date.now().toString(),
      name: groupData.name,
      description: groupData.description,
      isPublic: groupData.isPublic,
      avatarUrl: 'https://placehold.co/150',
      active: true
    };

    this.adminGroups.update(groups => [...groups, newGroup]);
    this.showCreateGroupForm.set(false);

    this.messageService.add({
      severity: 'success',
      summary: 'Grupo creado',
      detail: `El grupo ${groupData.name} ha sido creado correctamente`
    });
  }

  // Tabs configuration
  adminTabs = computed((): Tab[] => {
    return [
      { id: 'posts', label: 'Publicaciones', icon: 'photo_library' },
      { id: 'events', label: 'Eventos', icon: 'event' },
      { id: 'pets', label: 'Mascotas', icon: 'pet_supplies' },
      { id: 'stories', label: 'Historias', icon: 'schedule' },
      { id: 'groups', label: 'Grupos', icon: 'groups' },
    ];
  });

  onTabChange(tabId: string) {
    this.setActiveTab(tabId);
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
    this.petService.deletePet(id).subscribe({
      next: () => {
        this.adminPets.update(pets => pets.filter(p => p.id !== id));
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Mascota eliminada correctamente'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la mascota'
        });
      }
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
