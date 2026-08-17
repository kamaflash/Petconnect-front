import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
import { HomeService, VetServiceResponse } from '../../../home/infrastructure/services/home.service';
import { MarketplaceService, CreateProductRequest } from '../../../marketplace/infrastructure/services/marketplace.service';
import { AdoptionService, AdoptionRequest, AdoptionStatus } from '../../../adoptions/infrastructure/services/adoption.service';
import { PetOwnershipEventService } from '../../../shared/services/pet-ownership-event.service';

interface AdminTab {
  label: string;
  icon: string;
  value: string;
  roles?: string[];
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  active: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  active: boolean;
  rating?: number;
  reviews?: number;
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

          <!-- Servicios (Vet) -->
          <div class="admin-section" *ngIf="activeTab() === 'services' && hasProfile('vet')">
            <!-- Formulario de creación -->
            <div class="form-container" *ngIf="showCreateServiceForm()">
              <app-dynamic-form
                [config]="serviceFormConfig"
                [(formData)]="serviceFormData"
                (onSubmitClick)="handleCreateService($event)"
                (onCancel)="showCreateServiceForm.set(false)"
              />
            </div>

            <!-- Lista de servicios -->
            <div *ngIf="!showCreateServiceForm()">
              <app-table-card
                [type]="'service'"
                [items]="adminServiceItems()"
                [showSearch]="true"
                [filteredItems]="adminServiceItems()"
                [editable]="true"
                [loading]="loading()"
                (onAdd)="showCreateServiceForm.set(true)"
              >
                <ng-template card-actions let-item>
                  <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deleteServiceById(item.id)" />
                </ng-template>
              </app-table-card>
            </div>
          </div>

          <!-- Productos (Seller) -->
          <div class="admin-section" *ngIf="activeTab() === 'products' && hasProfile('seller')">
            <!-- Formulario de creación -->
            <div class="form-container" *ngIf="showCreateProductForm()">
              <app-dynamic-form
                [config]="productFormConfig"
                [(formData)]="productFormData"
                (onSubmitClick)="handleCreateProduct($event)"
                (onCancel)="showCreateProductForm.set(false)"
              />
            </div>

            <!-- Lista de productos -->
            <div *ngIf="!showCreateProductForm()">
              <app-table-card
                [type]="'product'"
                [items]="adminProductItems()"
                [showSearch]="true"
                [filteredItems]="adminProductItems()"
                [editable]="true"
                [loading]="loading()"
                (onAdd)="showCreateProductForm.set(true)"
              >
                <ng-template card-actions let-item>
                  <p-button icon="pi pi-trash" styleClass="p-button-sm p-button-danger" (onClick)="deleteProductById(item.id)" />
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

          <!-- Adopciones -->
          <div class="admin-section" *ngIf="activeTab() === 'adoptions'">
            <div class="section-header">
              <h2>Solicitudes de adopción</h2>
            </div>

            <div class="adoptions-empty" *ngIf="adminAdoptions().length === 0">
              <i class="pi pi-heart"></i>
              <p>No tienes solicitudes de adopción todavía.</p>
              <span class="empty-subtitle">Cuando alguien solicite adoptar una de tus mascotas, aparecerá aquí.</span>
            </div>

            <div class="adoptions-list" *ngIf="adminAdoptions().length > 0">
              <div class="adoption-request-card" *ngFor="let req of adminAdoptions()">
                <div class="adoption-request-main">
                  <p-avatar [image]="req.petImage || 'https://placehold.co/150'" shape="circle" size="large"></p-avatar>
                  <div class="adoption-request-info">
                    <div class="adoption-request-title">
                      <strong>{{ req.adopterName }}</strong>
                      <p-tag
                        [value]="adoptionStatusLabel(req.status)"
                        [severity]="adoptionStatusSeverity(req.status)"
                        styleClass="adoption-status-tag"
                      ></p-tag>
                    </div>
                    <div class="adoption-request-pet">
                      <i class="pi pi-paw"></i>
                      <span>{{ req.petName }} · {{ req.species || 'Especie desconocida' }} {{ req.breed ? '· ' + req.breed : '' }}</span>
                    </div>
                    <div class="adoption-request-message" *ngIf="req.message">
                      "{{ req.message }}"
                    </div>
                    <div class="adoption-steps" *ngIf="stageIndexOf(req.status) >= 0">
                      <div
                        class="adoption-step"
                        *ngFor="let stage of adoptionStages; let i = index"
                        [class.active]="i < stageIndexOf(req.status)"
                        [class.current]="i === stageIndexOf(req.status)"
                      >
                        <span class="adoption-step-dot"></span>
                        <span class="adoption-step-label">{{ adoptionStageShortLabel(stage) }}</span>
                      </div>
                      <span class="adoption-step-counter" *ngIf="req.status === 'completed'">✓ Finalizada</span>
                      <span class="adoption-step-counter" *ngIf="req.status !== 'completed'">
                        Etapa {{ stageIndexOf(req.status) + 1 }} de {{ adoptionStages.length }}
                      </span>
                    </div>
                    <div class="adoption-request-date">
                      {{ req.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </div>
                  </div>
                </div>
                <div class="adoption-request-actions">
                  <p-button
                    *ngIf="canAdvance(req.status)"
                    label="Avanzar etapa"
                    icon="pi pi-arrow-right"
                    styleClass="p-button-sm p-button-success"
                    (onClick)="advanceAdoption(req)"
                  />
                  <p-button
                    label="Contactar con solicitante"
                    icon="pi pi-send"
                    styleClass="p-button-sm p-button-secondary"
                    (onClick)="contactAdopter(req)"
                  />
                  <p-button
                    *ngIf="canReject(req.status)"
                    label="Rechazar"
                    icon="pi pi-times"
                    styleClass="p-button-sm p-button-danger p-button-outlined"
                    (onClick)="rejectAdoption(req)"
                  />
                </div>
              </div>
            </div>

            <div class="adoptions-section-title">
              <h3>Mis solicitudes enviadas</h3>
            </div>
            <div class="adoptions-empty" *ngIf="myAdoptionRequests().length === 0">
              <i class="pi pi-send"></i>
              <p>No has enviado solicitudes de adopción todavía.</p>
              <span class="empty-subtitle">Las solicitudes que realices aparecerán aquí.</span>
            </div>
            <div class="adoptions-list" *ngIf="myAdoptionRequests().length > 0">
              <div class="adoption-request-card" *ngFor="let req of myAdoptionRequests()">
                <div class="adoption-request-main">
                  <p-avatar [image]="req.petImage || 'https://placehold.co/150'" shape="circle" size="large"></p-avatar>
                  <div class="adoption-request-info">
                    <div class="adoption-request-title">
                      <strong>{{ req.petName }}</strong>
                      <p-tag
                        [value]="adoptionStatusLabel(req.status)"
                        [severity]="adoptionStatusSeverity(req.status)"
                        styleClass="adoption-status-tag"
                      ></p-tag>
                    </div>
                    <div class="adoption-request-pet">
                      <i class="pi pi-paw"></i>
                      <span>{{ req.species || 'Especie desconocida' }} {{ req.breed ? '· ' + req.breed : '' }}</span>
                    </div>
                    <div class="adoption-steps" *ngIf="stageIndexOf(req.status) >= 0">
                      <div
                        class="adoption-step"
                        *ngFor="let stage of adoptionStages; let i = index"
                        [class.active]="i < stageIndexOf(req.status)"
                        [class.current]="i === stageIndexOf(req.status)"
                      >
                        <span class="adoption-step-dot"></span>
                        <span class="adoption-step-label">{{ adoptionStageShortLabel(stage) }}</span>
                      </div>
                      <span class="adoption-step-counter" *ngIf="isCompleted(req.status)">✓ Finalizada</span>
                      <span class="adoption-step-counter" *ngIf="!isCompleted(req.status)">
                        Etapa {{ stageIndexOf(req.status) + 1 }} de {{ adoptionStages.length }}
                      </span>
                    </div>
                    <div class="adoption-request-date">
                      {{ req.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </div>
                  </div>
                </div>
                <div class="adoption-readonly-note">
                  <i class="pi pi-lock"></i>
                  <span>Solicitud enviada</span>
                </div>
              </div>
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

    /* Adopciones */
    .adoptions-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--bitbucket-text-secondary);
    }

    .adoptions-empty i {
      font-size: 2.5rem;
      opacity: 0.4;
      margin-bottom: 0.75rem;
    }

    .adoptions-empty p {
      margin: 0 0 0.25rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
    }

    .adoptions-empty .empty-subtitle {
      font-size: 0.875rem;
      opacity: 0.7;
    }

    .adoptions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .adoption-request-card {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--bitbucket-border);
      border-radius: 0.5rem;
      background-color: var(--bitbucket-header-bg);
    }

    .adoption-request-main {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      flex: 1;
      min-width: 0;
    }

    .adoption-request-info {
      flex: 1;
      min-width: 0;
    }

    .adoption-request-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .adoption-request-title strong {
      font-size: 1rem;
      color: var(--bitbucket-text-primary);
    }

    .adoption-request-pet {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    .adoption-request-message {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      font-style: italic;
      color: var(--bitbucket-text-primary);
      background-color: var(--bitbucket-body-bg);
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
    }

    .adoption-request-date {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
      opacity: 0.8;
    }

    .adoption-request-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      flex-shrink: 0;
      align-items: center;
      justify-content: flex-end;
    }

    .adoption-steps {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .adoption-step {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
      opacity: 0.5;
    }

    .adoption-step .adoption-step-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--bitbucket-border);
      flex-shrink: 0;
    }

    .adoption-step.active {
      opacity: 0.8;
    }

    .adoption-step.active .adoption-step-dot {
      background-color: var(--primary-color, #4f46e5);
    }

    .adoption-step.current .adoption-step-dot {
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
      background-color: var(--primary-color, #4f46e5);
    }

    .adoption-step.current {
      opacity: 1;
      color: var(--bitbucket-text-primary);
      font-weight: 600;
    }

    .adoption-step-counter {
      margin-left: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--bitbucket-text-secondary);
    }

    @media (max-width: 640px) {
      .adoption-request-card {
        flex-direction: column;
      }

      .adoption-request-actions {
        width: 100%;
        justify-content: flex-end;
      }
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
  private readonly homeService = inject(HomeService);
  private readonly marketplaceService = inject(MarketplaceService);
  private readonly adoptionService = inject(AdoptionService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly petOwnershipEvent = inject(PetOwnershipEventService);

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
    adminAdoptions = signal<AdoptionRequest[]>([]);

  // Solicitudes de adopción enviadas por el usuario actual (solo lectura)
  myAdoptionRequests = signal<AdoptionRequest[]>([]);

  // Vet services data
  adminServices = signal<ServiceItem[]>([]);
  showCreateServiceForm = signal(false);
  serviceFormData = signal<any>({});

  // Products data (for sellers)
  adminProducts = signal<ProductItem[]>([]);
  showCreateProductForm = signal(false);
  productFormData = signal<any>({});

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

  // Service form configuration (for vets)
  serviceFormConfig: DynamicFormConfig = {
    title: 'Crear Nuevo Servicio',
    submitLabel: 'Crear Servicio',
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: 'Nombre del Servicio',
        type: 'input',
        placeholder: 'Ej: Consulta general, Vacunación',
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'description',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Describe el servicio...',
        rows: 3,
        validation: { required: true, maxLength: 500 }
      },
      {
        key: 'price',
        label: 'Precio (€)',
        type: 'input',
        placeholder: 'Ej: 50.00',
        validation: { required: true }
      },
      {
        key: 'duration',
        label: 'Duración (minutos)',
        type: 'input',
        placeholder: 'Ej: 30',
        validation: { required: true }
      }
    ]
  };

  // Product form configuration (for sellers)
  productFormConfig: DynamicFormConfig = {
    title: 'Crear Nuevo Producto',
    submitLabel: 'Crear Producto',
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: 'Nombre del Producto',
        type: 'input',
        placeholder: 'Nombre del producto',
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'description',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Describe el producto...',
        rows: 3,
        validation: { required: true, maxLength: 500 }
      },
      {
        key: 'price',
        label: 'Precio (€)',
        type: 'input',
        placeholder: 'Ej: 29.99',
        validation: { required: true }
      },
      {
        key: 'stock',
        label: 'Stock',
        type: 'input',
        placeholder: 'Cantidad disponible',
        validation: { required: true, min: 0 }
      },
      {
        key: 'category',
        label: 'Categoría',
        type: 'select',
        placeholder: 'Selecciona una categoría',
        options: [
          { label: 'Alimentos', value: 'food' },
          { label: 'Accesorios', value: 'accessories' },
          { label: 'Medicamentos', value: 'medicine' },
          { label: 'Juguetes', value: 'toys' },
          { label: 'Otro', value: 'other' }
        ],
        validation: { required: true }
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

  // User info
  userName = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : 'Usuario';
  });

  // User profile type
  userProfileType = computed(() => {
    const user = this.authService.user();
    return user?.profileType?.toLowerCase() || 'user';
  });

  // Check if user has specific profile
  hasProfile = (profileType: string): boolean => {
    return this.userProfileType() === profileType.toLowerCase();
  };

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

  adminServiceItems = computed((): TableCardItem[] => {
    return this.adminServices().map(service => ({
      id: service.id,
      name: service.name,
      avatar: 'https://placehold.co/150',
      description: `${service.description} | Duración: ${service.duration}min | Precio: ${service.price}€`,
      tags: service.active ? ['Activo'] : ['Inactivo'],
    }));
  });

  adminProductItems = computed((): TableCardItem[] => {
    return this.adminProducts().map(product => ({
      id: product.id,
      name: product.name,
      avatar: product.imageUrl || 'https://placehold.co/150',
      description: `${product.description || ''} | Stock: ${product.stock} | Categoría: ${product.category}`,
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      tags: [product.price.toString() + '€', product.active ? 'Activo' : 'Inactivo'],
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
    // Get the current user ID (user.id is the authUserId)
    const user = this.authService.user();
    const ownerId:string = user?.id || '';
    // Load all pets (for admin)
    this.petService.getPetsByOwner(ownerId).subscribe({
      next: (pets) => this.adminPets.set(pets),
      error: (err) => console.error('Error loading pets:', err)
    });

    // Load products (for sellers)
    this.marketplaceService.getMyProducts().subscribe({
      next: (products: any[]) => {
        console.log('Products loaded from API:', products);
        const mapped = products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: Number(p.price),
          stock: p.stock,
          category: p.category,
          imageUrl: p.imageUrl || '',
          active: p.active
        }));
        console.log('Mapped products:', mapped);
        this.adminProducts.set(mapped);
      },
      error: (err) => console.error('Error loading products:', err)
    });

        // Load adoption requests for pets owned by the current user
    this.adoptionService.getAdoptionRequestsForMyPets().subscribe({
      next: (requests) => this.adminAdoptions.set(requests),
      error: (err) => console.error('Error loading adoption requests:', err)
    });

    // Load adoption requests sent by the current user (solicitudes enviadas)
    this.adoptionService.getMyAdoptionRequests().subscribe({
      next: (requests) => this.myAdoptionRequests.set(requests),
      error: (err) => console.error('Error loading my adoption requests:', err)
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

    // Get the current user ID (user.id is the authUserId)
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

  // Service handlers (for vets)
  handleCreateService(serviceData: any) {
    const newService = {
      id: Date.now().toString(),
      name: serviceData.name,
      description: serviceData.description,
      price: serviceData.price,
      duration: serviceData.duration,
      active: true
    };

    this.adminServices.update(services => [...services, newService]);
    this.showCreateServiceForm.set(false);

    this.messageService.add({
      severity: 'success',
      summary: 'Servicio creado',
      detail: `El servicio ${serviceData.name} ha sido creado correctamente`
    });
  }

  deleteServiceById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La eliminación de servicios estará disponible próximamente'
    });
  }

  // Product handlers (for sellers)
  handleCreateProduct(productData: any) {
    const request: CreateProductRequest = {
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock),
      category: productData.category,
      imageUrl: productData.imageUrl?.[0]?.objectURL || undefined
    };

    this.marketplaceService.createProduct(request).subscribe({
      next: (product: any) => {
        const mapped: ProductItem = {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: Number(product.price),
          stock: product.stock,
          category: product.category,
          imageUrl: product.imageUrl || '',
          active: product.active
        };
        this.adminProducts.update(products => [...products, mapped]);
        this.showCreateProductForm.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Producto creado',
          detail: `El producto ${product.name} ha sido creado correctamente`
        });
      },
      error: (err) => {
        console.error('Error creating product:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el producto'
        });
      }
    });
  }

  deleteProductById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'La eliminación de productos estará disponible próximamente'
    });
  }

  // Tabs configuration
  adminTabs = computed((): Tab[] => {
    const profileType = this.userProfileType();
    const tabs: Tab[] = [
      // Common tabs for all users
      { id: 'posts', label: 'Publicaciones', icon: 'photo_library' },
    ];

    // Add pets tab for all except sellers
    if (profileType !== 'seller') {
      tabs.push({ id: 'pets', label: 'Mis Mascotas', icon: 'pet_supplies' });
    }

    // Add tabs based on profile type
    if (profileType === 'vet') {
      tabs.push(
        { id: 'services', label: 'Mis Servicios', icon: 'medical_services' },
        { id: 'appointments', label: 'Citas', icon: 'calendar_month' }
      );
    } else if (profileType === 'seller') {
      tabs.push(
        { id: 'products', label: 'Mis Productos', icon: 'shopping_bag' },
        { id: 'orders', label: 'Pedidos', icon: 'receipt_long' }
      );
    } else if (profileType === 'shelter') {
      tabs.push(
        { id: 'adoptions', label: 'Adopciones', icon: 'favorite' },
        { id: 'shelter-pets', label: 'Mascotas en Refugio', icon: 'pets' }
      );
    } else if (profileType === 'trainer') {
      tabs.push(
        { id: 'training-services', label: 'Servicios de Entrenamiento', icon: 'fitness_center' },
        { id: 'sessions', label: 'Sesiones', icon: 'event_available' }
      );
    }

    // Add general tabs (exclude groups for sellers)
    tabs.push(
      { id: 'events', label: 'Eventos', icon: 'event' },
      { id: 'stories', label: 'Historias', icon: 'schedule' }
    );

    // Replace the generic 'groups' tab with an 'adoptions' tab for pet owners
    // (only added once; shelters already receive an adoptions tab above)
    if (profileType !== 'seller' && !tabs.some(t => t.id === 'adoptions')) {
      tabs.push({ id: 'adoptions', label: 'Adopciones', icon: 'favorite' });
    }

    return tabs;
  });

  onTabChange(tabId: string) {
    this.setActiveTab(tabId);
  }

  // ========== ADOPCIONES ==========

    readonly adoptionStages: AdoptionStatus[] = ['pending', 'pending_contact', 'pending_delivery', 'completed'];

  adoptionStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pendiente de aceptación';
      case 'pending_contact': return 'En contacto';
      case 'pending_delivery': return 'Pendiente de entrega';
      case 'completed': return 'Entregada / Finalizada';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return 'Pendiente';
    }
  }

  adoptionStatusSeverity(status: string): 'success' | 'danger' | 'warn' {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
      case 'pending_contact':
      case 'pending_delivery':
      default:
        return 'warn';
    }
  }

  adoptionStageShortLabel(stage: AdoptionStatus): string {
    switch (stage) {
      case 'pending': return 'Pendiente';
      case 'pending_contact': return 'Contacto';
      case 'pending_delivery': return 'Entrega';
      case 'completed': return 'Entregado';
      default: return stage;
    }
  }

    stageIndexOf(status: string): number {
    return this.adoptionStages.indexOf((status || '').toLowerCase() as AdoptionStatus);
  }

  canAdvance(status: string): boolean {
    const s = (status || '').toLowerCase();
    const i = this.adoptionStages.indexOf(s as AdoptionStatus);
    // Permite avanzar si el status está en la secuencia y no es el último (completed)
    return i >= 0 && i < this.adoptionStages.length - 1;
  }

  canReject(status: string): boolean {
    const s = (status || '').toLowerCase();
    // Solo NO permite rechazar si ya está completed (terminal) o rejected (terminal)
    return s !== 'completed' && s !== 'rejected';
  }

  isCompleted(status: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'completed';
  }

  advanceAdoption(req: AdoptionRequest): void {
    const next = this.adoptionStages[this.stageIndexOf(req.status) + 1];
    if (!next) return;
    this.updateAdoptionStatus(req, next);
  }

  rejectAdoption(req: AdoptionRequest): void {
    this.updateAdoptionStatus(req, 'rejected');
  }

  contactAdopter(req: AdoptionRequest): void {
    this.router.navigate(['/messages'], {
      queryParams: { userId: req.adopterId, name: req.adopterName }
    });
  }

  private updateAdoptionStatus(req: AdoptionRequest, status: AdoptionStatus): void {
    this.adoptionService.updateAdoptionRequestStatus(req.id, status).subscribe({
      next: (updated) => {
        this.adminAdoptions.update(requests => requests.map(r => r.id === updated.id ? updated : r));
        // Al finalizar la adopción, notificar cambio de propiedad de la mascota
        if (status === 'completed') {
          this.petOwnershipEvent.notify(req.petId, 'adoption_completed', req.id);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Solicitud actualizada',
          detail: `La solicitud de ${req.adopterName} para ${req.petName} avanzó a "${this.adoptionStatusLabel(status)}"`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la solicitud de adopción'
        });
      }
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
