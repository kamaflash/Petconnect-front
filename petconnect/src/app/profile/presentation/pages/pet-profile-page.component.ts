import { Component, signal, computed, inject, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuModule } from 'primeng/menu';
import { TabsComponent, Tab } from '../../../shared/presentation/components/tabs/tabs.component';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { InfoItemComponent } from '../../../shared/presentation/components/info-item/info-item.component';
import { StatCardComponent } from '../../../shared/presentation/components/stat-card/stat-card.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { ProfileService, PetResponse } from '../../infrastructure/services/profile.service';
import { MessageService } from 'primeng/api';
import {
  getSpeciesLabel,
  getGenderLabel,
  getTemperamentLabel,
  getEnergyLevelLabel,
  getTrainingLevelLabel
} from '../../../shared/utils/pet-label.utils';

interface PetComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  date: Date;
  likes: number;
}

@Component({
  selector: 'app-pet-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    DialogModule,
    ToastModule,
    ProgressBarModule,
    SkeletonModule,
    FormsModule,
    MenuModule,
    TabsComponent,
    DynamicFormComponent,
    InfoItemComponent,
    StatCardComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="pet-profile-page">
      <div class="pet-profile-container">
        <!-- Loading indicator -->
        <div class="loading-overlay" *ngIf="loading()">
          <p-progressBar mode="indeterminate" [style]="{'height': '4px'}"></p-progressBar>
        </div>

        <!-- Back button -->
        <div class="back-button-container">
          <p-button
            label="Volver"
            icon="pi pi-arrow-left"
            styleClass="p-button-text p-button-sm"
            (onClick)="goBack()"
          />
        </div>

<!-- Pet Header -->
        <div class="pet-header" *ngIf="!loading() && pet()">
          <!-- Pet Avatar -->
          <div class="pet-avatar-section">
            <div class="pet-avatar-container" (click)="openLightboxAt(0)">
              <img [src]="pet()?.avatarUrl || 'https://placehold.co/400x400?text=No+Image'" [alt]="pet()?.name" class="pet-avatar" />
              <div class="avatar-overlay">
                <i class="pi pi-search-plus"></i>
              </div>
            </div>
          </div>

          <!-- Pet Info -->
          <div class="pet-info-section">
            <div class="pet-title-section">
              <h1 class="pet-name">{{ pet()?.name }}</h1>
              <p-tag [value]="pet()?.active ? 'Activo' : 'Inactivo'"
                     [severity]="pet()?.active ? 'success' : 'secondary'" />
              <div class="pet-admin-actions-inline" *ngIf="isOwner()">
                <p-button
                  type="button"
                  icon="pi pi-cog"
                  styleClass="p-button-outlined p-button-sm"
                  (onClick)="menu.toggle($event)"
                />
                <p-menu #menu [model]="actionMenuItems" [popup]="true" />
              </div>
            </div>

            <!-- Pet Stats -->
            <div class="pet-stats-section">
              <div class="pet-stat-item">
                <i class="pi pi-heart"></i>
                <div class="stat-content">
                  <span class="stat-value">{{ petStats().likes }}</span>
                  <span class="stat-label">Likes</span>
                </div>
              </div>
              <div class="pet-stat-item">
                <i class="pi pi-comment"></i>
                <div class="stat-content">
                  <span class="stat-value">{{ petStats().posts }}</span>
                  <span class="stat-label">Publicaciones</span>
                </div>
              </div>
              <div class="pet-stat-item">
                <i class="pi pi-calendar"></i>
                <div class="stat-content">
                  <span class="stat-value">{{ pet()?.dateOfBirth ? (pet()!.dateOfBirth | date:'yyyy') : '—' }}</span>
                  <span class="stat-label">Año nacimiento</span>
                </div>
              </div>
              <div class="pet-stat-item">
                <i class="pi pi-weight"></i>
                <div class="stat-content">
                  <span class="stat-value">{{ pet()?.weight || '—' }}</span>
                  <span class="stat-label">Peso (kg)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Skeletons -->
        <div class="pet-skeletons" *ngIf="loading()">
          <p-skeleton height="400px" class="photos-skeleton"></p-skeleton>
          <div class="pet-info-skeleton">
            <p-skeleton width="15rem" height="2rem" class="mb-2"></p-skeleton>
            <p-skeleton width="10rem" height="1rem" class="mb-3"></p-skeleton>
            <div class="stats-skeleton-grid">
              <p-skeleton width="5rem" height="3rem"></p-skeleton>
              <p-skeleton width="5rem" height="3rem"></p-skeleton>
              <p-skeleton width="5rem" height="3rem"></p-skeleton>
              <p-skeleton width="5rem" height="3rem"></p-skeleton>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <app-tabs
          *ngIf="!loading() && pet()"
          [tabs]="petTabs()"
          [activeTab]="activeTab()"
          (tabChange)="onTabChange($event)"
        />

        <!-- Tab Content -->
        <div class="pet-tab-content" *ngIf="!loading() && pet()">
            <!-- Info Tab (consolidated) -->
            <div class="tab-section" *ngIf="activeTab() === 'info'">
              <div class="about-card">
                <h3>Información Básica</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Especie</span>
                  <span class="info-value">{{ getSpeciesLabelWrapper(pet()?.species) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Raza</span>
                    <span class="info-value">{{ pet()?.breed || '—' }}</span>
                  </div>
                  <div class="info-item" *ngIf="pet()?.dateOfBirth; else noBirthDate">
                    <span class="info-label">Fecha de Nacimiento</span>
                    <span class="info-value">{{ pet()!.dateOfBirth | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <ng-template #noBirthDate>
                    <div class="info-item">
                      <span class="info-label">Fecha de Nacimiento</span>
                      <span class="info-value">—</span>
                    </div>
                  </ng-template>
                  <div class="info-item">
                    <span class="info-label">Género</span>
                    <span class="info-value">{{ getGenderLabelWrapper(pet()?.gender) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Color</span>
                    <span class="info-value">{{ pet()?.color || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Microchip</span>
                    <span class="info-value">{{ pet()?.microchipId || '—' }}</span>
                  </div>
                </div>

                <div class="pet-bio-section" *ngIf="pet()?.bio">
                  <h4>Biografía</h4>
                  <p>{{ pet()?.bio }}</p>
                </div>
              </div>

              <div class="medical-card">
                <h3>Información Médica y de Salud</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Tipo de Sangre</span>
                    <span class="info-value">{{ pet()?.bloodType || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Alergias</span>
                    <span class="info-value">{{ pet()?.allergies || '—' }}</span>
                  </div>
                  <div class="info-item full-width">
                    <span class="info-label">Condiciones Médicas</span>
                    <span class="info-value">{{ pet()?.medicalConditions || '—' }}</span>
                  </div>
                </div>

                <h4 class="subsection-title">Veterinario</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Nombre</span>
                    <span class="info-value">{{ pet()?.vetName || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Teléfono</span>
                    <span class="info-value">{{ pet()?.vetPhone || '—' }}</span>
                  </div>
                  <div class="info-item full-width">
                    <span class="info-label">Dirección</span>
                    <span class="info-value">{{ pet()?.vetAddress || '—' }}</span>
                  </div>
                </div>

                <h4 class="subsection-title">Vacunación</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Última Vacunación</span>
                    <span class="info-value">{{ pet()?.lastVaccinationDate ? (pet()!.lastVaccinationDate | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Próxima Vacunación</span>
                    <span class="info-value">{{ pet()?.nextVaccinationDate ? (pet()!.nextVaccinationDate | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Última Visita</span>
                    <span class="info-value">{{ pet()?.lastVetVisit ? (pet()!.lastVetVisit | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                </div>

                <h4 class="subsection-title">Seguro Médico</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Aseguradora</span>
                    <span class="info-value">{{ pet()?.insuranceProvider || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Póliza</span>
                    <span class="info-value">{{ pet()?.insurancePolicyNumber || '—' }}</span>
                  </div>
                </div>
              </div>

              <div class="additional-card">
                <h3>Información Adicional</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Contacto de Emergencia</span>
                    <span class="info-value">{{ pet()?.emergencyContact || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Teléfono de Emergencia</span>
                    <span class="info-value">{{ pet()?.emergencyPhone || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Centro de Adopción</span>
                    <span class="info-value">{{ pet()?.adoptionCenter || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Fecha de Adopción</span>
                    <span class="info-value">{{ pet()?.adoptionDate ? (pet()!.adoptionDate | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Número de Registro</span>
                    <span class="info-value">{{ pet()?.registrationNumber || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Número de Licencia</span>
                    <span class="info-value">{{ pet()?.licenseNumber || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Vencimiento de Licencia</span>
                    <span class="info-value">{{ pet()?.licenseExpiryDate ? (pet()!.licenseExpiryDate | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Esterilizado/Castrado</span>
                    <span class="info-value">{{ pet()?.spayedNeutered ? 'Sí' : 'No' }}</span>
                  </div>
                  <div class="info-item" *ngIf="pet()?.spayedNeuteredDate">
                    <span class="info-label">Fecha de Esterilización</span>
                    <span class="info-value">{{ pet()!.spayedNeuteredDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
              </div>

              <div class="behavior-card">
                <h3>Comportamiento y Características</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Temperamento</span>
                    <span class="info-value">{{ getTemperamentLabelWrapper(pet()?.temperament) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Nivel de Energía</span>
                    <span class="info-value">{{ getEnergyLevelLabelWrapper(pet()?.energyLevel) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Nivel de Entrenamiento</span>
                    <span class="info-value">{{ getTrainingLevelLabelWrapper(pet()?.trainingLevel) }}</span>
                  </div>
                  <div class="info-item full-width">
                    <span class="info-label">Actividades Favoritas</span>
                    <span class="info-value">{{ pet()?.favoriteActivities || '—' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Comida Favorita</span>
                    <span class="info-value">{{ pet()?.favoriteFood || '—' }}</span>
                  </div>
                  <div class="info-item full-width">
                    <span class="info-label">Necesidades Especiales</span>
                    <span class="info-value">{{ pet()?.specialNeeds || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Photos Tab (grid style like posts) -->
            <div class="tab-section" *ngIf="activeTab() === 'photos'">
              <div class="posts-grid">
                <div class="post-card" *ngFor="let post of petPosts(); let i = index" (click)="openPostModal(i)">
                  <img [src]="post.image" [alt]="post.caption" />
                  <div class="post-overlay">
                    <span><i class="pi pi-heart"></i> {{ post.likesCount }}</span>
                    <span><i class="pi pi-comment"></i> {{ post.commentsCount }}</span>
                  </div>
                </div>
                <div class="empty-state" *ngIf="petPosts().length === 0">
                  <i class="pi pi-image"></i>
                  <p>No hay fotos disponibles</p>
                </div>
              </div>
            </div>

            <!-- Posts Tab -->
            <div class="tab-section" *ngIf="activeTab() === 'posts'">
              <div class="posts-grid">
                <div class="post-card" *ngFor="let post of petPosts(); let i = index" (click)="openPostModal(i)">
                  <img [src]="post.image" [alt]="post.caption" />
                  <div class="post-overlay">
                    <span><i class="pi pi-heart"></i> {{ post.likesCount }}</span>
                    <span><i class="pi pi-comment"></i> {{ post.commentsCount }}</span>
                  </div>
                </div>
                <div class="empty-state" *ngIf="petPosts().length === 0">
                  <i class="pi pi-image"></i>
                  <p>No hay publicaciones aún</p>
                </div>
              </div>
            </div>

            <!-- Comments Tab -->
            <div class="tab-section" *ngIf="activeTab() === 'comments'">
              <div class="comments-list">
                <div class="comment-card" *ngFor="let comment of petComments()">
                  <img [src]="comment.authorAvatar" [alt]="comment.authorName" class="comment-avatar" />
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.authorName }}</span>
                      <span class="comment-date">{{ comment.date | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <p class="comment-text">{{ comment.content }}</p>
                    <div class="comment-actions">
                      <button class="comment-action-btn">
                        <i class="pi pi-heart"></i> {{ comment.likes }}
                      </button>
                    </div>
                  </div>
                </div>
                <div class="empty-state" *ngIf="petComments().length === 0">
                  <i class="pi pi-comment"></i>
                  <p>No hay comentarios aún</p>
                </div>
              </div>
            </div>
          </div>
      </div>

      <!-- Post Modal (image + comments) -->
      <p-dialog
        [visible]="postModalVisible"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '1000px' }"
        [closable]="true"
        (onHide)="closePostModal()"
        [dismissableMask]="true"
        styleClass="post-modal-dialog"
      >
        <div class="post-modal" *ngIf="currentPost()">
          <!-- Image side -->
          <div class="post-modal-image-side">
            <button class="post-modal-arrow post-modal-arrow-left" *ngIf="petPosts().length > 1" (click)="prevPost($event)">
              <i class="pi pi-chevron-left"></i>
            </button>
            <img [src]="currentPost().image" [alt]="currentPost().caption" class="post-modal-img" />
            <button class="post-modal-arrow post-modal-arrow-right" *ngIf="petPosts().length > 1" (click)="nextPost($event)">
              <i class="pi pi-chevron-right"></i>
            </button>
            <div class="post-modal-dots" *ngIf="petPosts().length > 1">
              <span
                class="post-modal-dot"
                *ngFor="let p of petPosts(); let di = index"
                [class.active]="di === currentPostIndex()"
                (click)="openPostModal(di)"
              ></span>
            </div>
          </div>

          <!-- Details side -->
          <div class="post-modal-details-side">
            <!-- Header -->
            <div class="post-modal-details-header">
              <div class="post-modal-details-user">
                <span class="post-modal-details-avatar" *ngIf="!pet()?.avatarUrl">{{ pet()?.name?.charAt(0) || 'P' }}</span>
                <p-avatar *ngIf="pet()?.avatarUrl" [image]="pet()?.avatarUrl!" shape="circle" size="normal"></p-avatar>
                <p-avatar *ngIf="!pet()?.avatarUrl" image="https://placehold.co/40x40?text=P" shape="circle" size="normal"></p-avatar>
                <span class="post-modal-details-username">{{ pet()?.name }}</span>
              </div>
            </div>

            <!-- Caption -->
            <div class="post-modal-details-caption" *ngIf="currentPost().caption">
              <span class="post-modal-details-avatar-sm" *ngIf="!pet()?.avatarUrl">{{ pet()?.name?.charAt(0) || 'P' }}</span>
              <p-avatar *ngIf="pet()?.avatarUrl" [image]="pet()?.avatarUrl!" shape="circle" size="normal"></p-avatar>
              <p-avatar *ngIf="!pet()?.avatarUrl" image="https://placehold.co/40x40?text=P" shape="circle" size="normal"></p-avatar>
              <div class="post-modal-details-caption-text">
                <span class="caption-username">{{ pet()?.name }}</span>
                <span class="caption-text">{{ currentPost().caption }}</span>
              </div>
            </div>

            <!-- Comments -->
            <div class="post-modal-details-comments">
              <div class="post-modal-details-comment" *ngFor="let comment of petComments()">
                <img [src]="comment.authorAvatar" [alt]="comment.authorName" class="comment-avatar-sm" />
                <div class="post-modal-details-comment-body">
                  <div class="post-modal-details-comment-header">
                    <span class="comment-author-sm">{{ comment.authorName }}</span>
                    <span class="comment-date-sm">{{ comment.date | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <p class="comment-text-sm">{{ comment.content }}</p>
                  <button class="comment-like-sm">
                    <i class="pi pi-heart"></i> {{ comment.likes }}
                  </button>
                </div>
              </div>
              <div class="post-modal-empty-comments" *ngIf="petComments().length === 0">
                <i class="pi pi-comment"></i>
                <p>No hay comentarios aún</p>
              </div>
            </div>

            <!-- Actions bar -->
            <div class="post-modal-details-actions">
              <div class="post-modal-details-stats">
                <span class="post-modal-details-likes"><i class="pi pi-heart-fill"></i> {{ currentPost().likesCount }} likes</span>
                <span class="post-modal-details-time">{{ currentPost().date || 'Recientemente' }}</span>
              </div>
            </div>
          </div>
        </div>
      </p-dialog>

      <!-- Edit Pet Dialog -->
      <p-dialog
        [visible]="showEditDialog"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '1000px' }"
        [closable]="true"
        (onHide)="showEditDialog = false"
        [dismissableMask]="true"
        styleClass="post-modal-dialog"
        header="Editar Mascota"
      >
      <app-dynamic-form
        [config]="getCurrentFormConfig()"
        [formData]="editPetFormData"
        (onSubmitClick)="onEditPetSubmit($event)"
        (onCancel)="showEditDialog = false"
      />
      </p-dialog>

      <!-- Delete Confirmation Dialog -->
      <p-dialog
        [visible]="showDeleteDialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        [closable]="true"
        (onHide)="showDeleteDialog = false"
        header="Confirmar Eliminación"
      >
        <div class="delete-confirmation">
          <i class="pi pi-exclamation-triangle"></i>
          <p>¿Estás seguro de que quieres eliminar a {{ pet()?.name }}? Esta acción no se puede deshacer.</p>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancelar" styleClass="p-button-secondary" (onClick)="showDeleteDialog = false" />
          <p-button label="Eliminar" styleClass="p-button-danger" (onClick)="deletePet()" />
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .pet-profile-page {
      min-height: 100vh;
      background-color: var(--bitbucket-header-bg);
      transition: background-color 0.3s ease;
    }

  .dark .pet-profile-page {
    background-color: var(--surface-bg);
  }

    .pet-profile-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 1rem;
    }

    /* Loading Overlay */
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

    /* Back Button */
    .back-button-container {
      margin-bottom: 1rem;
    }

    /* Pet Header */
    .pet-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    /* Pet Avatar */
    .pet-avatar-section {
      display: flex;
      justify-content: center;
    }

    .pet-avatar-container {
      position: relative;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      border: 4px solid var(--primary-color);
      transition: all 0.3s ease;
    }

    .pet-avatar-container:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 20px rgba(148, 199, 72, 0.4);
    }

    .pet-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .pet-avatar-container:hover .avatar-overlay {
      opacity: 1;
    }

    .avatar-overlay i {
      font-size: 2rem;
      color: white;
    }

    /* Pet Info */
    .pet-info-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .pet-title-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .pet-title-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .pet-admin-actions-inline {
      flex-shrink: 0;
    }

    .pet-name {
      font-size: 2rem;
      font-weight: 700;
      color: var(--bitbucket-text-primary);
      margin: 0;
    }

    .pet-stats-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .pet-stat-item {
      padding: 1rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s;
    }

    .pet-stat-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .pet-stat-item i {
      font-size: 2rem;
      color: var(--primary-color);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--bitbucket-text-primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    .pet-admin-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    /* Tabs */
    .pet-tab-content {
      margin-top: 1.5rem;
    }

    .tab-section {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .tab-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0 0 1.5rem 0;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    .info-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .subsection-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 1.5rem 0 1rem 0;
      padding-top: 1rem;
      border-top: 1px solid var(--bitbucket-border);
    }

    .pet-bio-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--bitbucket-border);
    }

    .pet-bio-section h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0 0 0.75rem 0;
    }

    .pet-bio-section p {
      color: var(--bitbucket-text-primary);
      line-height: 1.6;
      margin: 0;
    }

    .about-card,
    .medical-card,
    .additional-card,
    .behavior-card {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
    }

    .about-card:last-child,
    .medical-card:last-child,
    .additional-card:last-child,
    .behavior-card:last-child {
      margin-bottom: 0;
    }

    /* Posts Grid */
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .post-card {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    .post-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .post-card:hover img {
      transform: scale(1.05);
    }

    .post-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      opacity: 0;
      transition: opacity 0.3s ease;
      color: white;
    }

    .post-card:hover .post-overlay {
      opacity: 1;
    }

    .post-overlay span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
    }

    /* Comments */
    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .comment-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background-color: var(--bitbucket-bg-secondary, #f5f5f5);
      border-radius: 0.5rem;
    }

    .comment-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .comment-content {
      flex: 1;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .comment-author {
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      font-size: 0.875rem;
    }

    .comment-date {
      font-size: 0.75rem;
      color: var(--bitbucket-text-secondary);
    }

    .comment-text {
      color: var(--bitbucket-text-primary);
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0 0 0.5rem 0;
    }

    .comment-actions {
      display: flex;
      gap: 1rem;
    }

    .comment-action-btn {
      background: none;
      border: none;
      color: var(--bitbucket-text-secondary);
      cursor: pointer;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: color 0.2s;
    }

    .comment-action-btn:hover {
      color: var(--primary-color);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--bitbucket-text-secondary);
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 1rem;
    }

    /* Lightbox */
    .lightbox-content {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lightbox-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: background 0.2s;
    }

    .lightbox-close:hover {
      background: rgba(0, 0, 0, 0.7);
    }

    .lightbox-image {
      max-width: 100%;
      max-height: 85vh;
      object-fit: contain;
      border-radius: 0.5rem;
    }

    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.9);
      border: none;
      color: #333;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s;
    }

    .lightbox-nav:hover {
      background: white;
      transform: translateY(-50%) scale(1.1);
    }

    .lightbox-prev {
      left: 1rem;
    }

    .lightbox-next {
      right: 1rem;
    }

    /* Post Modal (Instagram-style) */
    .post-modal {
      display: flex;
      height: 85vh;
      max-height: 650px;
      background-color: var(--bitbucket-header-bg);
    }

    /* Image side */
    .post-modal-image-side {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #111;
      min-width: 0;
    }

    .post-modal-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      user-select: none;
    }

    .post-modal-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.45);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s;
      opacity: 0.7;
    }

    .post-modal-arrow:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.65);
      transform: translateY(-50%) scale(1.08);
    }

    .post-modal-arrow-left { left: 0.75rem; }
    .post-modal-arrow-right { right: 0.75rem; }

    .post-modal-dots {
      position: absolute;
      bottom: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.375rem;
    }

    .post-modal-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: all 0.2s;
    }

    .post-modal-dot.active {
      background: white;
      width: 18px;
      border-radius: 3px;
    }

    /* Details side */
    .post-modal-details-side {
      width: 380px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background-color: var(--bitbucket-header-bg);
    }

    .post-modal-details-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .post-modal-details-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .post-modal-details-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .post-modal-details-avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .post-modal-details-username {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--bitbucket-text-primary);
    }

    .post-modal-details-caption {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--bitbucket-border);
    }

    .post-modal-details-caption-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .post-modal-details-caption-text .caption-username {
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--bitbucket-text-primary);
    }

    .post-modal-details-caption-text .caption-text {
      font-size: 0.8125rem;
      color: var(--bitbucket-text-primary);
      line-height: 1.45;
      white-space: pre-line;
    }

    .post-modal-details-comments {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      scrollbar-width: thin;
    }

    .post-modal-details-comment {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }

    .comment-avatar-sm {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .post-modal-details-comment-body {
      flex: 1;
      min-width: 0;
    }

    .post-modal-details-comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.125rem;
    }

    .comment-author-sm {
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--bitbucket-text-primary);
    }

    .comment-date-sm {
      font-size: 0.6875rem;
      color: var(--bitbucket-text-secondary);
      white-space: nowrap;
    }

    .comment-text-sm {
      font-size: 0.8125rem;
      color: var(--bitbucket-text-secondary);
      line-height: 1.4;
      margin: 0 0 0.25rem 0;
    }

    .comment-like-sm {
      background: none;
      border: none;
      color: var(--bitbucket-text-secondary);
      cursor: pointer;
      font-size: 0.6875rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0;
      transition: color 0.2s;
    }

    .comment-like-sm:hover {
      color: var(--primary-color);
    }

    .post-modal-empty-comments {
      text-align: center;
      padding: 2rem;
      color: var(--bitbucket-text-secondary);
    }

    .post-modal-empty-comments i {
      font-size: 2rem;
      margin-bottom: 0.75rem;
      opacity: 0.4;
    }

    .post-modal-empty-comments p {
      margin: 0;
      font-size: 0.875rem;
    }

    .post-modal-details-actions {
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--bitbucket-border);
    }

    .post-modal-details-stats {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .post-modal-details-likes {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--bitbucket-text-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .post-modal-details-likes i {
      color: #e74c3c;
    }

    .post-modal-details-time {
      font-size: 0.6875rem;
      color: var(--bitbucket-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Delete Confirmation */
    .delete-confirmation {
      text-align: center;
      padding: 1rem;
    }

    .delete-confirmation i {
      font-size: 3rem;
      color: #f59e0b;
      margin-bottom: 1rem;
    }

    .delete-confirmation p {
      color: var(--bitbucket-text-primary);
      font-size: 1rem;
      margin: 0;
    }

    /* Skeletons */
    .pet-skeletons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .photos-skeleton {
      border-radius: 0.75rem;
    }

    .pet-info-skeleton {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stats-skeleton-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .pet-header {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .pet-name {
        font-size: 1.5rem;
      }

      .pet-stats-section {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .posts-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .pet-skeletons {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .posts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PetProfilePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private paramSubscription?: Subscription;

  // Loading state
  loading = signal(true);

  // Pet data
  pet = signal<PetResponse | null>(null);
  petId = signal<string | null>(null);
  currentImageIndex = signal(0);

  // UI state
  activeTab = signal('info');
  lightboxVisible = false;
  showEditDialog = false;
  showDeleteDialog = false;
  showAdoptionDialog = false;
  postModalVisible = false;
  currentPostIndex = signal(0);

  // Pet data
  petPosts = signal<any[]>([]);
  petComments = signal<PetComment[]>([]);
  petStats = signal({
    likes: 0,
    posts: 0,
  });

  // Edit form data
  editPetFormData = signal<any>({});

  // Menu reference
  @ViewChild('actionMenu') actionMenu: any;

  // Action menu items for dropdown
  actionMenuItems: any[] = [];

  private buildActionMenuItems(): void {
    const pet = this.pet();
    this.actionMenuItems = [
      {
        label: 'Editar Información',
        icon: 'pi pi-pencil',
        items: [
          {
            label: 'Información Básica',
            icon: 'pi pi-tag',
            command: () => this.openEditDialog('basic')
          },
          {
            label: 'Información Médica',
            icon: 'pi pi-heart',
            command: () => this.openEditDialog('medical')
          },
          {
            label: 'Información Adicional',
            icon: 'pi pi-info-circle',
            command: () => this.openEditDialog('additional')
          },
          {
            label: 'Comportamiento',
            icon: 'pi pi-smile',
            command: () => this.openEditDialog('behavior')
          }
        ]
      },
      {
        label: 'Acciones',
        icon: 'pi pi-cog',
        items: [
          {
            label: pet?.active ? 'Poner en Adopción' : 'Activar Mascota',
            icon: pet?.active ? 'pi pi-home' : 'pi pi-check-circle',
            command: () => this.toggleAdoptionStatus()
          },
          {
            label: 'Eliminar Mascota',
            icon: 'pi pi-trash',
            command: () => this.confirmDelete()
          }
        ]
      }
    ];
  }

  // Edit form configurations for each category
  editPetFormConfig: DynamicFormConfig = {
    title: 'Editar Información Básica',
    submitLabel: 'Guardar Cambios',
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
        key: 'microchipId',
        label: 'Microchip ID',
        type: 'input',
        placeholder: 'Número de microchip',
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
        rows: 4,
        validation: { maxLength: 500 }
      }
    ]
  };

  // Medical form configuration
  medicalFormConfig: DynamicFormConfig = {
    title: 'Editar Información Médica',
    submitLabel: 'Guardar Cambios',
    showCancel: true,
    fields: [
      {
        key: 'bloodType',
        label: 'Tipo de Sangre',
        type: 'input',
        placeholder: 'Tipo de sangre',
        validation: { maxLength: 10 }
      },
      {
        key: 'allergies',
        label: 'Alergias',
        type: 'textarea',
        placeholder: 'Alergias conocidas...',
        rows: 2,
        validation: { maxLength: 500 }
      },
      {
        key: 'medicalConditions',
        label: 'Condiciones Médicas',
        type: 'textarea',
        placeholder: 'Condiciones médicas o enfermedades...',
        rows: 2,
        validation: { maxLength: 500 }
      },
      {
        key: 'vetName',
        label: 'Nombre del Veterinario',
        type: 'input',
        placeholder: 'Nombre del veterinario de confianza',
        validation: { maxLength: 100 }
      },
      {
        key: 'vetPhone',
        label: 'Teléfono del Veterinario',
        type: 'input',
        placeholder: 'Teléfono del veterinario',
        validation: { maxLength: 20 }
      },
      {
        key: 'vetAddress',
        label: 'Dirección del Veterinario',
        type: 'input',
        placeholder: 'Dirección de la clínica veterinaria',
        validation: { maxLength: 255 }
      },
      {
        key: 'lastVaccinationDate',
        label: 'Última Vacunación',
        type: 'date',
        placeholder: 'Fecha de última vacuna',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'nextVaccinationDate',
        label: 'Próxima Vacunación',
        type: 'date',
        placeholder: 'Fecha de próxima vacuna',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'lastVetVisit',
        label: 'Última Visita al Veterinario',
        type: 'date',
        placeholder: 'Fecha de última visita',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'insuranceProvider',
        label: 'Aseguradora',
        type: 'input',
        placeholder: 'Compañía de seguros',
        validation: { maxLength: 100 }
      },
      {
        key: 'insurancePolicyNumber',
        label: 'Número de Póliza',
        type: 'input',
        placeholder: 'Número de póliza de seguro',
        validation: { maxLength: 100 }
      }
    ]
  };

  // Additional form configuration
  additionalFormConfig: DynamicFormConfig = {
    title: 'Editar Información Adicional',
    submitLabel: 'Guardar Cambios',
    showCancel: true,
    fields: [
      {
        key: 'emergencyContact',
        label: 'Contacto de Emergencia',
        type: 'input',
        placeholder: 'Nombre del contacto de emergencia',
        validation: { maxLength: 100 }
      },
      {
        key: 'emergencyPhone',
        label: 'Teléfono de Emergencia',
        type: 'input',
        placeholder: 'Teléfono del contacto de emergencia',
        validation: { maxLength: 20 }
      },
      {
        key: 'adoptionDate',
        label: 'Fecha de Adopción',
        type: 'date',
        placeholder: 'Fecha de adopción',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'adoptionCenter',
        label: 'Centro de Adopción',
        type: 'input',
        placeholder: 'Nombre del centro de adopción',
        validation: { maxLength: 100 }
      },
      {
        key: 'registrationNumber',
        label: 'Número de Registro',
        type: 'input',
        placeholder: 'Número de registro',
        validation: { maxLength: 50 }
      },
      {
        key: 'licenseNumber',
        label: 'Número de Licencia',
        type: 'input',
        placeholder: 'Número de licencia',
        validation: { maxLength: 50 }
      },
      {
        key: 'licenseExpiryDate',
        label: 'Vencimiento de Licencia',
        type: 'date',
        placeholder: 'Fecha de vencimiento',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      },
      {
        key: 'spayedNeutered',
        label: 'Esterilizado/Castrado',
        type: 'checkbox'
      },
      {
        key: 'spayedNeuteredDate',
        label: 'Fecha de Esterilización',
        type: 'date',
        placeholder: 'Fecha de esterilización/castración',
        showIcon: true,
        dateFormat: 'dd/mm/yy'
      }
    ]
  };

  // Behavior form configuration
  behaviorFormConfig: DynamicFormConfig = {
    title: 'Editar Comportamiento',
    submitLabel: 'Guardar Cambios',
    showCancel: true,
    fields: [
      {
        key: 'temperament',
        label: 'Temperamento',
        type: 'select',
        placeholder: 'Seleccione el temperamento',
        options: [
          { label: 'Tranquilo', value: 'calm' },
          { label: 'Energético', value: 'energetic' },
          { label: 'Juguetón', value: 'playful' },
          { label: 'Tímido', value: 'shy' },
          { label: 'Agresivo', value: 'aggressive' },
          { label: 'Amigable', value: 'friendly' },
          { label: 'Otro', value: 'other' }
        ]
      },
      {
        key: 'energyLevel',
        label: 'Nivel de Energía',
        type: 'select',
        placeholder: 'Seleccione el nivel de energía',
        options: [
          { label: 'Bajo', value: 'low' },
          { label: 'Medio', value: 'medium' },
          { label: 'Alto', value: 'high' }
        ]
      },
      {
        key: 'trainingLevel',
        label: 'Nivel de Entrenamiento',
        type: 'select',
        placeholder: 'Seleccione el nivel',
        options: [
          { label: 'Ninguno', value: 'none' },
          { label: 'Básico', value: 'basic' },
          { label: 'Intermedio', value: 'intermediate' },
          { label: 'Avanzado', value: 'advanced' }
        ]
      },
      {
        key: 'favoriteActivities',
        label: 'Actividades Favoritas',
        type: 'textarea',
        placeholder: 'Actividades que le gustan...',
        rows: 2,
        validation: { maxLength: 255 }
      },
      {
        key: 'favoriteFood',
        label: 'Comida Favorita',
        type: 'input',
        placeholder: 'Comida favorita',
        validation: { maxLength: 100 }
      },
      {
        key: 'specialNeeds',
        label: 'Necesidades Especiales',
        type: 'textarea',
        placeholder: 'Necesidades especiales o cuidados específicos...',
        rows: 2,
        validation: { maxLength: 500 }
      }
    ]
  };

  // Current edit category
  currentEditCategory: 'basic' | 'medical' | 'additional' | 'behavior' = 'basic';

  // Computed
  petImages = computed(() => {
    const pet = this.pet();
    if (!pet) return [];

    // Build images array: avatarUrl first, then all imageUrls
    const images: string[] = [];

    // Add avatarUrl as the first image if it exists
    if (pet.avatarUrl) {
      images.push(pet.avatarUrl);
    }

    // Add all imageUrls (additional images)
    if (pet.imageUrls && pet.imageUrls.length > 0) {
      images.push(...pet.imageUrls);
    }

    // If no images, return placeholder
    if (images.length === 0) {
      return ['https://placehold.co/600x600?text=No+Image'];
    }

    return images;
  });

  // Removed: petPhotoItems no longer used (TableCardComponent was removed)

  currentImage = computed(() => {
    const images = this.petImages();
    const index = this.currentImageIndex();
    return images[Math.min(index, images.length - 1)];
  });

  isOwner = computed(() => {
    const pet = this.pet();
    const user = this.authService.user();
    return pet && user && pet.ownerId === user.id;
  });

    // Tabs configuration
  petTabs = computed((): Tab[] => {
    return [
      { id: 'info', label: 'Información', icon: 'info' },
      { id: 'photos', label: 'Fotos', icon: 'photo_library' },
      { id: 'posts', label: 'Publicaciones', icon: 'photo_library' },
      { id: 'comments', label: 'Comentarios', icon: 'comment' },
    ];
  });

  ngOnInit(): void {
    this.paramSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.petId.set(id);

      if (id) {
        this.loadPetData(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  private loadPetData(petId: string): void {
    this.loading.set(true);

    // Load pet data
    this.profileService.getPetById(petId).subscribe({
      next: (pet) => {
        this.pet.set(pet);
        this.loadPetStats(petId);
        this.loadPetPosts(petId);
        this.loadPetComments(petId);
        this.buildActionMenuItems();

        // Initialize edit form
        this.editPetFormData.set({
          name: pet.name,
          species: pet.species,
          breed: pet.breed || '',
          dateOfBirth: pet.dateOfBirth || '',
          gender: pet.gender || '',
          weight: pet.weight || '',
          weightUnit: pet.weightUnit || 'kg',
          color: pet.color || '',
          microchipId: pet.microchipId || '',
          bio: pet.bio || '',
          // Información médica
          bloodType: pet.bloodType || '',
          allergies: pet.allergies || '',
          medicalConditions: pet.medicalConditions || '',
          vetName: pet.vetName || '',
          vetPhone: pet.vetPhone || '',
          vetAddress: pet.vetAddress || '',
          lastVaccinationDate: pet.lastVaccinationDate || '',
          nextVaccinationDate: pet.nextVaccinationDate || '',
          lastVetVisit: pet.lastVetVisit || '',
          insuranceProvider: pet.insuranceProvider || '',
          insurancePolicyNumber: pet.insurancePolicyNumber || '',
          // Información adicional
          emergencyContact: pet.emergencyContact || '',
          emergencyPhone: pet.emergencyPhone || '',
          adoptionDate: pet.adoptionDate || '',
          adoptionCenter: pet.adoptionCenter || '',
          registrationNumber: pet.registrationNumber || '',
          licenseNumber: pet.licenseNumber || '',
          licenseExpiryDate: pet.licenseExpiryDate || '',
          spayedNeutered: pet.spayedNeutered || false,
          spayedNeuteredDate: pet.spayedNeuteredDate || '',
          // Comportamiento
          temperament: pet.temperament || '',
          energyLevel: pet.energyLevel || '',
          trainingLevel: pet.trainingLevel || '',
          favoriteActivities: pet.favoriteActivities || '',
          favoriteFood: pet.favoriteFood || '',
          specialNeeds: pet.specialNeeds || ''
        });

        setTimeout(() => {
          this.loading.set(false);
          this.cdr.detectChanges();
        }, 500);
      },
      error: (err) => {
        console.error('Error loading pet:', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información de la mascota'
        });
      }
    });
  }

  private loadPetStats(petId: string): void {
    // Mock data - replace with actual API call
    this.petStats.set({
      likes: Math.floor(Math.random() * 100),
      posts: Math.floor(Math.random() * 20),
    });
  }

  private loadPetPosts(petId: string): void {
    // Mock data - replace with actual API call
    this.petPosts.set([
      { id: '1', image: 'https://picsum.photos/300/300?random=10', likesCount: 24, commentsCount: 5, caption: '¡Día de parque!' },
      { id: '2', image: 'https://picsum.photos/300/300?random=11', likesCount: 18, commentsCount: 3, caption: 'Baño relajante' },
      { id: '3', image: 'https://picsum.photos/300/300?random=12', likesCount: 32, commentsCount: 8, caption: 'Nuevo juguete' },
    ]);
  }

  private loadPetComments(petId: string): void {
    // Mock data - replace with actual API call
    this.petComments.set([
      {
        id: '1',
        authorName: 'María García',
        authorAvatar: 'https://i.pravatar.cc/150?img=1',
        content: '¡Qué adorable! Me encanta cómo ha crecido 🐕',
        date: new Date('2024-01-15'),
        likes: 5
      },
      {
        id: '2',
        authorName: 'Juan Pérez',
        authorAvatar: 'https://i.pravatar.cc/150?img=2',
        content: 'Muy bonito, saludos a toda la familia',
        date: new Date('2024-01-14'),
        likes: 3
      },
    ]);
  }

  // Carousel methods
  nextImage(event: Event): void {
    event.stopPropagation();
    const total = this.petImages().length;
    const current = this.currentImageIndex();
    if (current < total - 1) {
      this.currentImageIndex.set(current + 1);
    }
  }

  prevImage(event: Event): void {
    event.stopPropagation();
    const current = this.currentImageIndex();
    if (current > 0) {
      this.currentImageIndex.set(current - 1);
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  // Computed current post
  currentPost = computed(() => {
    const posts = this.petPosts();
    const index = this.currentPostIndex();
    return posts.length > 0 ? posts[Math.min(index, posts.length - 1)] : null;
  });

  // Lightbox methods
  openLightbox(): void {
    this.lightboxVisible = true;
  }

  openLightboxAt(index: number): void {
    this.currentImageIndex.set(index);
    this.lightboxVisible = true;
  }

  closeLightbox(): void {
    this.lightboxVisible = false;
  }

  // Post Modal methods
  openPostModal(index: number): void {
    this.currentPostIndex.set(index);
    this.postModalVisible = true;
  }

  closePostModal(): void {
    this.postModalVisible = false;
  }

  nextPost(event: Event): void {
    event.stopPropagation();
    const total = this.petPosts().length;
    const current = this.currentPostIndex();
    if (current < total - 1) {
      this.currentPostIndex.set(current + 1);
    }
  }

  prevPost(event: Event): void {
    event.stopPropagation();
    const current = this.currentPostIndex();
    if (current > 0) {
      this.currentPostIndex.set(current - 1);
    }
  }

  // Tab methods
  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  // Navigation
  goBack(): void {
    window.history.back();
  }

  // Wrapper methods for template to use imported functions
  getSpeciesLabelWrapper(species: string | null | undefined): string {
    return getSpeciesLabel(species);
  }

  getGenderLabelWrapper(gender: string | null | undefined): string {
    return getGenderLabel(gender);
  }

  getTemperamentLabelWrapper(temperament: string | null | undefined): string {
    return getTemperamentLabel(temperament);
  }

  getEnergyLevelLabelWrapper(level: string | null | undefined): string {
    return getEnergyLevelLabel(level);
  }

  getTrainingLevelLabelWrapper(level: string | null | undefined): string {
    return getTrainingLevelLabel(level);
  }

  // Menu methods
  toggleActionMenu(event: Event): void {
    if (this.actionMenu) {
      this.actionMenu.toggle(event);
    }
  }

  // Edit dialog methods
  openEditDialog(category: 'basic' | 'medical' | 'additional' | 'behavior'): void {
    this.currentEditCategory = category;
    this.showEditDialog = true;
  }

  // Get the current form config based on category
  getCurrentFormConfig(): DynamicFormConfig {
    switch (this.currentEditCategory) {
      case 'basic':
        return this.editPetFormConfig;
      case 'medical':
        return this.medicalFormConfig;
      case 'additional':
        return this.additionalFormConfig;
      case 'behavior':
        return this.behaviorFormConfig;
      default:
        return this.editPetFormConfig;
    }
  }

  // Adoption status
  toggleAdoptionStatus(): void {
    const pet = this.pet();
    if (!pet) return;

    // Toggle adoption status logic
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: pet.active ? 'Mascota puesta en adopción' : 'Mascota activada'
    });
  }

  // Admin actions
  onEditPetSubmit(data: any): void {
    const pet = this.pet();
    if (!pet) return;

    // Update pet logic here
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Mascota actualizada correctamente'
    });

    this.showEditDialog = false;
  }

  confirmDelete(): void {
    this.showDeleteDialog = true;
  }

  deletePet(): void {
    const pet = this.pet();
    if (!pet) return;

    // Delete pet logic here
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Mascota eliminada correctamente'
    });

    this.showDeleteDialog = false;
    this.router.navigate(['/profile']);
  }
}
