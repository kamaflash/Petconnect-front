import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
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
    TranslocoModule,
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
        <header class="admin-header page-heading-card">
          <div class="page-heading-copy">
            <h1>{{ 'admin.dashboardTitle' | transloco }}</h1>
            <p class="welcome-text">{{ 'admin.welcome' | transloco:{ userName: userName() } }}</p>
          </div>
        </header>

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
              <h2>{{ 'admin.adoptionRequests' | transloco }}</h2>
            </div>

            <div class="adoptions-empty" *ngIf="adminAdoptions().length === 0">
              <i class="pi pi-heart"></i>
              <p>{{ 'admin.noAdoptionRequests' | transloco }}</p>
              <span class="empty-subtitle">{{ 'admin.noAdoptionRequestsSubtitle' | transloco }}</span>
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
                      <span>{{ req.petName }} · {{ req.species || ('admin.unknownSpecies' | transloco) }} {{ req.breed ? '· ' + req.breed : '' }}</span>
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
                      <span class="adoption-step-counter" *ngIf="req.status === 'completed'">✓ {{ 'admin.completed' | transloco }}</span>
                      <span class="adoption-step-counter" *ngIf="req.status !== 'completed'">
                        {{ 'admin.stageOf' | transloco:{ current: stageIndexOf(req.status) + 1, total: adoptionStages.length } }}
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
                    label="{{ 'admin.advanceStage' | transloco }}"
                    icon="pi pi-arrow-right"
                    styleClass="p-button-sm p-button-success"
                    (onClick)="advanceAdoption(req)"
                  />
                  <p-button
                    label="{{ 'admin.contactAdopter' | transloco }}"
                    icon="pi pi-send"
                    styleClass="p-button-sm p-button-secondary"
                    (onClick)="contactAdopter(req)"
                  />
                  <p-button
                    *ngIf="canReject(req.status)"
                    label="{{ 'admin.reject' | transloco }}"
                    icon="pi pi-times"
                    styleClass="p-button-sm p-button-danger p-button-outlined"
                    (onClick)="rejectAdoption(req)"
                  />
                </div>
              </div>
            </div>

            <div class="adoptions-section-title">
              <h3>{{ 'admin.mySentRequests' | transloco }}</h3>
            </div>
            <div class="adoptions-empty" *ngIf="myAdoptionRequests().length === 0">
              <i class="pi pi-send"></i>
              <p>{{ 'admin.noSentRequests' | transloco }}</p>
              <span class="empty-subtitle">{{ 'admin.noSentRequestsSubtitle' | transloco }}</span>
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
                      <span>{{ req.species || ('admin.unknownSpecies' | transloco) }} {{ req.breed ? '· ' + req.breed : '' }}</span>
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
                      <span class="adoption-step-counter" *ngIf="isCompleted(req.status)">✓ {{ 'admin.completed' | transloco }}</span>
                      <span class="adoption-step-counter" *ngIf="!isCompleted(req.status)">
                        {{ 'admin.stageOf' | transloco:{ current: stageIndexOf(req.status) + 1, total: adoptionStages.length } }}
                      </span>
                    </div>
                    <div class="adoption-request-date">
                      {{ req.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </div>
                  </div>
                </div>
                <div class="adoption-readonly-note">
                  <i class="pi pi-lock"></i>
                  <span>{{ 'admin.sentRequest' | transloco }}</span>
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
      background-color: var(--surface-bg);
      transition: background-color 0.3s ease;
    }

    .admin-container {
      max-width: var(--max-page-width);
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
  readonly i18n = inject(TranslocoService);
  private readonly authService = inject(AuthService);
  private readonly socialService = inject(SocialService);
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
  showCreateStoryForm = signal(false);
  showCreateGroupForm = signal(false);

  // Form data
  postFormData = signal<any>({});
  eventFormData = signal<any>({});
  storyFormData = signal<any>({});
  groupFormData = signal<any>({});

  // Data from backend
  adminPosts = signal<any[]>([]);
  adminEvents = signal<any[]>([]);
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
    title: this.i18n.translate('admin.createNewPost'),
    submitLabel: this.i18n.translate('admin.createPost'),
    showCancel: true,
    fields: [
      {
        key: 'caption',
        label: this.i18n.translate('admin.captionLabel'),
        type: 'textarea',
        placeholder: this.i18n.translate('admin.captionPlaceholder'),
        rows: 3,
        validation: { required: true, minLength: 1, maxLength: 500 }
      },
      {
        key: 'imageUrl',
        label: this.i18n.translate('common.image'),
        type: 'file',
        placeholder: this.i18n.translate('admin.selectImage'),
        accept: 'image/*',
        maxFileSize: 5000000,
        multiple: false
      }
    ]
  };

  eventFormConfig: DynamicFormConfig = {
    title: this.i18n.translate('admin.createNewEvent'),
    submitLabel: this.i18n.translate('admin.createEvent'),
    showCancel: true,
    fields: [
      {
        key: 'title',
        label: this.i18n.translate('common.title'),
        type: 'input',
        placeholder: this.i18n.translate('admin.eventTitlePlaceholder'),
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'description',
        label: this.i18n.translate('common.description'),
        type: 'textarea',
        placeholder: this.i18n.translate('admin.eventDescPlaceholder'),
        rows: 3,
        validation: { required: true }
      },
      {
        key: 'location',
        label: this.i18n.translate('common.location'),
        type: 'input',
        placeholder: this.i18n.translate('admin.eventLocationPlaceholder'),
        validation: { required: true }
      },
      {
        key: 'date',
        label: this.i18n.translate('common.date'),
        type: 'date',
        placeholder: this.i18n.translate('admin.selectDate'),
        showIcon: true,
        dateFormat: 'dd/mm/yy',
        validation: { required: true }
      }
    ]
  };

  storyFormConfig: DynamicFormConfig = {
    title: this.i18n.translate('admin.createNewStory'),
    submitLabel: this.i18n.translate('admin.createStory'),
    showCancel: true,
    fields: [
      {
        key: 'imageUrl',
        label: this.i18n.translate('common.image'),
        type: 'file',
        placeholder: this.i18n.translate('admin.selectImage'),
        accept: 'image/*',
        maxFileSize: 5000000,
        multiple: false,
        validation: { required: true }
      },
      {
        key: 'duration',
        label: this.i18n.translate('admin.durationHours'),
        type: 'number',
        placeholder: this.i18n.translate('admin.durationHoursPlaceholder'),
        validation: { required: true, min: 1, max: 24 }
      }
    ]
  };

  groupFormConfig: DynamicFormConfig = {
    title: this.i18n.translate('admin.createNewGroup'),
    submitLabel: this.i18n.translate('admin.createGroup'),
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: this.i18n.translate('admin.name'),
        type: 'input',
        placeholder: this.i18n.translate('admin.groupNamePlaceholder'),
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'description',
        label: this.i18n.translate('common.description'),
        type: 'textarea',
        placeholder: this.i18n.translate('admin.groupDescPlaceholder'),
        rows: 3,
        validation: { required: true }
      },
      {
        key: 'isPublic',
        label: this.i18n.translate('admin.publicGroup'),
        type: 'checkbox'
      }
    ]
  };

  // Service form configuration (for vets)
  serviceFormConfig: DynamicFormConfig = {
    title: this.i18n.translate('admin.createNewService'),
    submitLabel: this.i18n.translate('admin.createService'),
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: this.i18n.translate('admin.serviceName'),
        type: 'input',
        placeholder: this.i18n.translate('admin.serviceTagsPlaceholder'),
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'description',
        label: this.i18n.translate('common.description'),
        type: 'textarea',
        placeholder: this.i18n.translate('admin.describeService'),
        rows: 3,
        validation: { required: true, maxLength: 500 }
      },
      {
        key: 'price',
        label: this.i18n.translate('admin.price'),
        type: 'input',
        placeholder: 'Ej: 50.00',
        validation: { required: true }
      },
      {
        key: 'duration',
        label: this.i18n.translate('admin.durationMinutes'),
        type: 'input',
        placeholder: 'Ej: 30',
        validation: { required: true }
      }
    ]
  };

  // Product form configuration (for sellers)
  productFormConfig: DynamicFormConfig = {
    title: this.i18n.translate('admin.createNewProduct'),
    submitLabel: this.i18n.translate('admin.createProduct'),
    showCancel: true,
    fields: [
      {
        key: 'name',
        label: this.i18n.translate('admin.productName'),
        type: 'input',
        placeholder: this.i18n.translate('admin.productNamePlaceholder'),
        validation: { required: true, minLength: 2, maxLength: 100 }
      },
      {
        key: 'description',
        label: this.i18n.translate('common.description'),
        type: 'textarea',
        placeholder: this.i18n.translate('admin.describeProduct'),
        rows: 3,
        validation: { required: true, maxLength: 500 }
      },
      {
        key: 'price',
        label: this.i18n.translate('admin.price'),
        type: 'input',
        placeholder: 'Ej: 29.99',
        validation: { required: true }
      },
      {
        key: 'stock',
        label: this.i18n.translate('admin.stock'),
        type: 'input',
        placeholder: this.i18n.translate('admin.stockPlaceholder'),
        validation: { required: true, min: 0 }
      },
      {
        key: 'category',
        label: this.i18n.translate('common.category'),
        type: 'select',
        placeholder: this.i18n.translate('common.selectCategory'),
        options: [
          { label: this.i18n.translate('admin.categoryFood'), value: 'food' },
          { label: this.i18n.translate('admin.categoryAccessories'), value: 'accessories' },
          { label: this.i18n.translate('admin.categoryMedicine'), value: 'medicine' },
          { label: this.i18n.translate('admin.categoryToys'), value: 'toys' },
          { label: this.i18n.translate('common.other'), value: 'other' }
        ],
        validation: { required: true }
      },
      {
        key: 'imageUrl',
        label: this.i18n.translate('common.image'),
        type: 'file',
        placeholder: this.i18n.translate('admin.selectImage'),
        accept: 'image/*',
        maxFileSize: 5000000,
        multiple: false
      }
    ]
  };

  // User info
  userName = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : this.i18n.translate('admin.userFallback');
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
      name: post.caption || this.i18n.translate('common.untitled'),
      avatar: post.imageUrl || 'https://placehold.co/150',
      description: `${this.i18n.translate('admin.likes')}: ${post.likesCount} | ${this.i18n.translate('admin.comments')}: ${post.commentsCount}`,
      tags: post.active ? [this.i18n.translate('admin.active')] : [this.i18n.translate('admin.inactive')],
    }));
  });

  adminEventItems = computed((): TableCardItem[] => {
    return this.adminEvents().map(event => ({
      id: event.id,
      name: event.title,
      avatar: event.imageUrl || 'https://placehold.co/150',
      description: event.description,
      location: event.location,
      tags: event.active ? [this.i18n.translate('admin.active')] : [this.i18n.translate('admin.inactive')],
    }));
  });

  adminStoryItems = computed((): TableCardItem[] => {
    return this.adminStories().map(story => ({
      id: story.id,
      name: this.i18n.translate('admin.storyItem'),
      avatar: story.imageUrl || 'https://placehold.co/150',
      description: story.seen ? this.i18n.translate('admin.seen') : this.i18n.translate('admin.storyPending'),
    }));
  });

  adminGroupItems = computed((): TableCardItem[] => {
    return this.adminGroups().map(group => ({
      id: group.id,
      name: group.name,
      avatar: group.avatarUrl || 'https://placehold.co/150',
      description: group.description,
      tags: group.active ? [this.i18n.translate('admin.active')] : [this.i18n.translate('admin.inactive')],
    }));
  });

  adminServiceItems = computed((): TableCardItem[] => {
    return this.adminServices().map(service => ({
      id: service.id,
      name: service.name,
      avatar: 'https://placehold.co/150',
      description: `${service.description} | ${this.i18n.translate('admin.duration')}: ${service.duration}min | ${this.i18n.translate('admin.price')}: ${service.price}€`,
      tags: service.active ? [this.i18n.translate('admin.active')] : [this.i18n.translate('admin.inactive')],
    }));
  });

  adminProductItems = computed((): TableCardItem[] => {
    return this.adminProducts().map(product => ({
      id: product.id,
      name: product.name,
      avatar: product.imageUrl || 'https://placehold.co/150',
      description: `${product.description || ''} | ${this.i18n.translate('admin.stock')}: ${product.stock} | ${this.i18n.translate('common.category')}: ${product.category}`,
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      tags: [product.price.toString() + '€', product.active ? this.i18n.translate('admin.active') : this.i18n.translate('admin.inactive')],
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
      summary: this.i18n.translate('admin.postCreated'),
      detail: this.i18n.translate('admin.postCreatedDetail')
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
      summary: this.i18n.translate('admin.eventCreated'),
      detail: this.i18n.translate('admin.eventCreatedDetail', { name: eventData.title })
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
      summary: this.i18n.translate('admin.storyCreated'),
      detail: this.i18n.translate('admin.storyCreatedDetail')
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
      summary: this.i18n.translate('admin.groupCreated'),
      detail: this.i18n.translate('admin.groupCreatedDetail', { name: groupData.name })
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
      summary: this.i18n.translate('admin.serviceCreated'),
      detail: this.i18n.translate('admin.serviceCreatedDetail', { name: serviceData.name })
    });
  }

  deleteServiceById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: this.i18n.translate('admin.underDevelopment'),
      detail: this.i18n.translate('admin.deleteServicesSoon')
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
          summary: this.i18n.translate('admin.productCreated'),
          detail: this.i18n.translate('admin.productCreatedDetail', { name: product.name })
        });
      },
      error: (err) => {
        console.error('Error creating product:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.i18n.translate('admin.productCreateError')
        });
      }
    });
  }

  deleteProductById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: this.i18n.translate('admin.underDevelopment'),
      detail: this.i18n.translate('admin.deleteProductsSoon')
    });
  }

  // Tabs configuration
    adminTabs = computed((): Tab[] => {
    const profileType = this.userProfileType();
    const t = this.i18n;
    const tabs: Tab[] = [
      // Common tabs for all users
      { id: 'posts', label: t.translate('admin.tabs.posts'), icon: 'photo_library' },
    ];

    // Add tabs based on profile type
    if (profileType === 'vet') {
      tabs.push(
        { id: 'services', label: t.translate('admin.tabs.services'), icon: 'medical_services' },
        { id: 'appointments', label: t.translate('admin.tabs.appointments'), icon: 'calendar_month' }
      );
    } else if (profileType === 'seller') {
      tabs.push(
        { id: 'products', label: t.translate('admin.tabs.products'), icon: 'shopping_bag' },
        { id: 'orders', label: t.translate('admin.tabs.orders'), icon: 'receipt_long' }
      );
    } else if (profileType === 'shelter') {
      tabs.push(
        { id: 'adoptions', label: t.translate('admin.tabs.adoptions'), icon: 'favorite' }
      );
    } else if (profileType === 'trainer') {
      tabs.push(
        { id: 'training-services', label: t.translate('admin.tabs.trainingServices'), icon: 'fitness_center' },
        { id: 'sessions', label: t.translate('admin.tabs.sessions'), icon: 'event_available' }
      );
    }

    // Add general tabs (exclude groups for sellers)
    tabs.push(
      { id: 'events', label: t.translate('admin.tabs.events'), icon: 'event' },
      { id: 'stories', label: t.translate('admin.tabs.stories'), icon: 'schedule' }
    );

    // Replace the generic 'groups' tab with an 'adoptions' tab for pet owners
    // (only added once; shelters already receive an adoptions tab above)
    if (profileType !== 'seller' && !tabs.some(tab => tab.id === 'adoptions')) {
      tabs.push({ id: 'adoptions', label: t.translate('admin.tabs.adoptions'), icon: 'favorite' });
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
      case 'pending': return this.i18n.translate('admin.pendingApproval');
      case 'pending_contact': return this.i18n.translate('admin.inContact');
      case 'pending_delivery': return this.i18n.translate('admin.pendingDelivery');
      case 'completed': return this.i18n.translate('admin.completedAdapter');
      case 'approved': return this.i18n.translate('admin.approved');
      case 'rejected': return this.i18n.translate('admin.rejected');
      default: return this.i18n.translate('admin.pendingApproval');
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
      case 'pending': return this.i18n.translate('admin.stagePending');
      case 'pending_contact': return this.i18n.translate('admin.stageContact');
      case 'pending_delivery': return this.i18n.translate('admin.stageDelivery');
      case 'completed': return this.i18n.translate('admin.stageCompleted');
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
          summary: this.i18n.translate('admin.requestUpdated'),
          detail: this.i18n.translate('admin.requestUpdatedDetail', { adopter: req.adopterName, pet: req.petName, status: this.adoptionStatusLabel(status) })
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.i18n.translate('admin.adoptionUpdateError')
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
          summary: this.i18n.translate('admin.deleted'),
          detail: this.i18n.translate('admin.postDeleted')
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.i18n.translate('admin.postDeleteError')
        });
      }
    });
  }

  deleteEventById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: this.i18n.translate('admin.underDevelopment'),
      detail: this.i18n.translate('admin.deleteEventsSoon')
    });
  }

  deleteStoryById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: this.i18n.translate('admin.underDevelopment'),
      detail: this.i18n.translate('admin.deleteStoriesSoon')
    });
  }

  deleteGroupById(id: string) {
    this.messageService.add({
      severity: 'info',
      summary: this.i18n.translate('admin.underDevelopment'),
      detail: this.i18n.translate('admin.deleteGroupsSoon')
    });
  }
}
