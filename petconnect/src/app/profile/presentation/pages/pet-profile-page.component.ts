import { Component, signal, computed, inject, effect, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
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
import { DynamicFormComponent, DynamicFormConfig, DynamicFormField } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { InfoItemComponent } from '../../../shared/presentation/components/info-item/info-item.component';
import { StatCardComponent } from '../../../shared/presentation/components/stat-card/stat-card.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { ProfileService, PetResponse } from '../../infrastructure/services/profile.service';
import { SPECIES_BREEDS } from '../../../pets/domain/species-breeds.model';
import { PET_COLOR_OPTIONS } from '../../../pets/domain/pet-colors.model';
import { AdoptionService } from '../../../adoptions/infrastructure/services/adoption.service';
import { CreateAdoptionRequest } from '../../../adoptions/infrastructure/services/adoption.service';
import { MessageService } from 'primeng/api';
import { PetOwnershipEventService } from '../../../shared/services/pet-ownership-event.service';
import { AdoptionHistoryComponent } from '../../../shared/presentation/components/adoption-history/adoption-history.component';
import {
  getSpeciesLabel,
  getGenderLabel,
  getTemperamentLabel,
  getEnergyLevelLabel,
  getTrainingLevelLabel,
  getColorLabel
} from '../../../shared/utils/pet-label.utils';
import { CloudinaryService } from '../../../shared/infrastructure/services/cloudinary.service';

interface PetComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  date: Date;
  likes: number;
  liked?: boolean;
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
    AdoptionHistoryComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="pet-profile-page" [class.dark]="isDarkMode()">
      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="loading()">
        <p-progressBar mode="indeterminate" [style]="{'height': '3px'}"></p-progressBar>
      </div>

      <div class="pet-profile-container">
        <!-- Back Button -->
        <div class="back-button-container">
          <button class="back-btn" (click)="goBack()">
            <i class="pi pi-arrow-left"></i>
            <span>Volver</span>
          </button>
        </div>

        <!-- Profile Header -->
        <div class="profile-header" *ngIf="!loading() && pet()">
          <!-- Cover Image -->
          <div class="cover-image-container">
            <img [src]="pet()?.avatarUrl || 'https://picsum.photos/1200/300?random=1'" alt="Cover" class="cover-image" />
            <div class="cover-overlay"></div>
          </div>

          <!-- Profile Info Section -->
          <div class="profile-info-section">
            <!-- Avatar -->
            <div class="avatar-wrapper">
              <div class="avatar-container" (click)="openLightboxAt(0)">
                <img [src]="pet()?.avatarUrl || 'https://placehold.co/200x200?text=🐾'" [alt]="pet()?.name" class="profile-avatar" />
                <div class="avatar-overlay">
                  <i class="pi pi-camera"></i>
                </div>
              </div>
            </div>

            <!-- User Info -->
            <div class="user-info">
              <div class="user-name-section">
                <div class="name-group">
                  <h1 class="user-name">{{ pet()?.name }}</h1>
                  <div class="pet-owner-name" *ngIf="petOwnerName()">
                    <i class="pi pi-user"></i>
                    <span>{{ petOwnerName() }}</span>
                  </div>
                </div>
                <div class="user-badges">
                  <!-- Solo se muestra cuando la mascota está en adopción.
                       No se muestra el estado "Adoptado" cuando no lo está. -->
                  <span class="badge badge-success" *ngIf="pet()?.availableForAdoption">🐾 En adopción</span>
                  <span class="badge badge-info" *ngIf="isOwner()">Familia</span>
                </div>
              </div>

              <div class="user-bio" *ngIf="pet()?.bio">
                <p>{{ pet()?.bio }}</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button
                *ngIf="canRequestAdoption()"
                class="btn-primary btn-adopt"
                (click)="openAdoptionDialog()"
              >
                <i class="pi pi-heart-fill"></i>
                Solicitar Adopción
              </button>

              <div class="already-requested" *ngIf="hasPendingRequest() && !isOwner()">
                <i class="pi pi-check-circle"></i>
                <span>Solicitud de adopción enviada</span>
              </div>

              <button
                *ngIf="isOwner()"
                class="btn-icon"
                (click)="toggleActionMenu($event)"
              >
                <i class="pi pi-ellipsis-h"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading Skeletons -->
        <div class="profile-skeletons" *ngIf="loading()">
          <p-skeleton height="200px" class="cover-skeleton"></p-skeleton>
          <div class="profile-info-skeleton">
            <div class="avatar-skeleton-wrapper">
              <p-skeleton shape="circle" size="120px" class="avatar-skeleton"></p-skeleton>
            </div>
            <div class="user-info-skeleton">
              <p-skeleton width="200px" height="32px"></p-skeleton>
              <p-skeleton width="300px" height="16px"></p-skeleton>
              <div class="action-skeleton">
                <p-skeleton width="150px" height="40px" borderRadius="20px"></p-skeleton>
                <p-skeleton width="40px" height="40px" borderRadius="50%"></p-skeleton>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Bar -->
        <div class="stats-bar" *ngIf="!loading() && pet()">
          <div class="stat-item" (click)="activeTab.set('posts')">
            <span class="stat-number">{{ petStats().posts }}</span>
            <span class="stat-label">Publicaciones</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item" (click)="activeTab.set('info')">
            <span class="stat-number">{{ formatAge(pet()?.dateOfBirth) }}</span>
            <span class="stat-label">Edad</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">{{ petStats().likes }}</span>
            <span class="stat-label">Me gusta</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item" (click)="activeTab.set('comments')">
            <span class="stat-number">{{ petComments().length }}</span>
            <span class="stat-label">Comentarios</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-container" *ngIf="!loading() && pet()">
          <app-tabs
            [tabs]="petTabs()"
            [activeTab]="activeTab()"
            (tabChange)="onTabChange($event)"
          />
        </div>

        <!-- Tab Content -->
        <div class="tab-content" *ngIf="!loading() && pet()">
                    <!-- Info Tab - TODOS LOS DATOS -->
          <div class="tab-panel" *ngIf="activeTab() === 'info'">
            <!-- Modo edición (se activa desde el botón Editar del header): formulario dinámico en línea -->
            <div *ngIf="isEditing()" class="edit-form-wrapper">
              <app-dynamic-form
                [config]="currentEditFormConfig()"
                [formData]="editPetFormData()"
                (onSubmitClick)="onEditPetSubmit($event)"
                (onCancel)="cancelEditing()"
              />
            </div>

            <!-- Modo visualización: información estática -->
            <div class="info-sections" *ngIf="!isEditing()">
              <!-- Información Básica -->
              <div class="info-section">
                <h3 class="section-title">
                  <i class="pi pi-info-circle"></i>
                  Información Básica
                </h3>
                <div class="info-grid">
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-tag"></i></span>
                    <span class="info-label">Especie</span>
                    <span class="info-value">{{ getSpeciesLabelWrapper(pet()?.species) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-user"></i></span>
                    <span class="info-label">Raza</span>
                    <span class="info-value">{{ pet()?.breed || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-calendar"></i></span>
                    <span class="info-label">Fecha de Nacimiento</span>
                    <span class="info-value">{{ pet()?.dateOfBirth ? (pet()!.dateOfBirth | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-venus-mars"></i></span>
                    <span class="info-label">Género</span>
                    <span class="info-value">{{ getGenderLabelWrapper(pet()?.gender) }}</span>
                  </div>
                  <div class="info-row">
                                        <span class="info-icon"><i class="pi pi-palette"></i></span>
                    <span class="info-label">Color</span>
                    <span class="info-value">{{ getColorLabelWrapper(pet()?.color) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-qrcode"></i></span>
                    <span class="info-label">Microchip</span>
                    <span class="info-value">{{ pet()?.microchipId || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-weight"></i></span>
                    <span class="info-label">Peso</span>
                    <span class="info-value">{{ pet()?.weight ? pet()!.weight + ' ' + (pet()?.weightUnit || 'kg') : '—' }}</span>
                  </div>
                  <div class="info-row full-width">
                    <span class="info-icon"><i class="pi pi-map-marker"></i></span>
                    <span class="info-label">Dirección</span>
                    <span class="info-value">{{ pet()?.lastKnownLocation || '—' }}</span>
                  </div>
                </div>
              </div>

              <!-- Información Médica y de Salud -->
              <div class="info-section">
                <h3 class="section-title">
                  <i class="pi pi-heart"></i>
                  Información Médica y de Salud
                </h3>
                <div class="info-grid">
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-droplet"></i></span>
                    <span class="info-label">Tipo de Sangre</span>
                    <span class="info-value">{{ pet()?.bloodType || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-exclamation-triangle"></i></span>
                    <span class="info-label">Alergias</span>
                    <span class="info-value">{{ pet()?.allergies || '—' }}</span>
                  </div>
                  <div class="info-row full-width">
                    <span class="info-icon"><i class="pi pi-ambulance"></i></span>
                    <span class="info-label">Condiciones Médicas</span>
                    <span class="info-value">{{ pet()?.medicalConditions || '—' }}</span>
                  </div>
                </div>

                <h4 class="subsection-title">Veterinario</h4>
                <div class="info-grid">
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-user-md"></i></span>
                    <span class="info-label">Nombre</span>
                    <span class="info-value">{{ pet()?.vetName || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-phone"></i></span>
                    <span class="info-label">Teléfono</span>
                    <span class="info-value">{{ pet()?.vetPhone || '—' }}</span>
                  </div>
                  <div class="info-row full-width">
                    <span class="info-icon"><i class="pi pi-map-marker"></i></span>
                    <span class="info-label">Dirección</span>
                    <span class="info-value">{{ pet()?.vetAddress || '—' }}</span>
                  </div>
                </div>

                <h4 class="subsection-title">Vacunación</h4>
                <div class="info-grid">
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-syringe"></i></span>
                    <span class="info-label">Última Vacunación</span>
                    <span class="info-value">{{ pet()?.lastVaccinationDate ? (pet()!.lastVaccinationDate | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-calendar-plus"></i></span>
                    <span class="info-label">Próxima Vacunación</span>
                    <span class="info-value">{{ pet()?.nextVaccinationDate ? (pet()!.nextVaccinationDate | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-calendar-check"></i></span>
                    <span class="info-label">Última Visita</span>
                    <span class="info-value">{{ pet()?.lastVetVisit ? (pet()!.lastVetVisit | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                </div>

                <h4 class="subsection-title">Seguro Médico</h4>
                <div class="info-grid">
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-building"></i></span>
                    <span class="info-label">Aseguradora</span>
                    <span class="info-value">{{ pet()?.insuranceProvider || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-file"></i></span>
                    <span class="info-label">Póliza</span>
                    <span class="info-value">{{ pet()?.insurancePolicyNumber || '—' }}</span>
                  </div>
                </div>
              </div>

              <!-- Información Adicional -->
              <div class="info-section">
                <h3 class="section-title">
                  <i class="pi pi-info"></i>
                  Información Adicional
                </h3>
                <div class="info-grid">
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-phone"></i></span>
                    <span class="info-label">Contacto de Emergencia</span>
                    <span class="info-value">{{ pet()?.emergencyContact || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-mobile"></i></span>
                    <span class="info-label">Teléfono de Emergencia</span>
                    <span class="info-value">{{ pet()?.emergencyPhone || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-building"></i></span>
                    <span class="info-label">Centro de Adopción</span>
                    <span class="info-value">{{ pet()?.adoptionCenter || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-calendar-check"></i></span>
                    <span class="info-label">Fecha de Adopción</span>
                    <span class="info-value">{{ pet()?.adoptionDate ? (pet()!.adoptionDate | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-hashtag"></i></span>
                    <span class="info-label">Número de Registro</span>
                    <span class="info-value">{{ pet()?.registrationNumber || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-id-card"></i></span>
                    <span class="info-label">Número de Licencia</span>
                    <span class="info-value">{{ pet()?.licenseNumber || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-calendar-times"></i></span>
                    <span class="info-label">Vencimiento de Licencia</span>
                    <span class="info-value">{{ pet()?.licenseExpiryDate ? (pet()!.licenseExpiryDate | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-check-circle"></i></span>
                    <span class="info-label">Esterilizado/Castrado</span>
                    <span class="info-value">{{ pet()?.spayedNeutered ? 'Sí' : 'No' }}</span>
                  </div>
                  <div class="info-row" *ngIf="pet()?.spayedNeuteredDate">
                    <span class="info-icon"><i class="pi pi-calendar"></i></span>
                    <span class="info-label">Fecha de Esterilización</span>
                    <span class="info-value">{{ pet()!.spayedNeuteredDate | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
              </div>

              <!-- Comportamiento y Características -->
              <div class="info-section">
                <h3 class="section-title">
                  <i class="pi pi-smile"></i>
                  Comportamiento y Características
                </h3>
                <div class="info-grid">
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-heart"></i></span>
                    <span class="info-label">Temperamento</span>
                    <span class="info-value">{{ getTemperamentLabelWrapper(pet()?.temperament) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-bolt"></i></span>
                    <span class="info-label">Nivel de Energía</span>
                    <span class="info-value">{{ getEnergyLevelLabelWrapper(pet()?.energyLevel) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-graduation-cap"></i></span>
                    <span class="info-label">Nivel de Entrenamiento</span>
                    <span class="info-value">{{ getTrainingLevelLabelWrapper(pet()?.trainingLevel) }}</span>
                  </div>
                  <div class="info-row full-width">
                    <span class="info-icon"><i class="pi pi-gamepad"></i></span>
                    <span class="info-label">Actividades Favoritas</span>
                    <span class="info-value">{{ pet()?.favoriteActivities || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon"><i class="pi pi-apple"></i></span>
                    <span class="info-label">Comida Favorita</span>
                    <span class="info-value">{{ pet()?.favoriteFood || '—' }}</span>
                  </div>
                  <div class="info-row full-width">
                    <span class="info-icon"><i class="pi pi-heart"></i></span>
                    <span class="info-label">Necesidades Especiales</span>
                    <span class="info-value">{{ pet()?.specialNeeds || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Photos Tab -->
          <div class="tab-panel" *ngIf="activeTab() === 'photos'">
            <!-- Solo el propietario puede añadir nuevas fotos -->
            <div class="gallery-header" *ngIf="isOwner()">
              <p class="gallery-hint">Añade una nueva foto a la galería de {{ pet()?.name }}</p>
            </div>
            <div class="gallery-grid">
              <!-- Tile para añadir nueva foto (solo propietario) -->
              <div class="gallery-item add-photo-item" *ngIf="isOwner()" (click)="!uploadingPhoto() && photoInput.click()">
                <i class="pi" [class.pi-plus]="!uploadingPhoto()" [class.pi-spin]="uploadingPhoto()" [class.pi-spinner]="uploadingPhoto()"></i>
                <span>{{ uploadingPhoto() ? 'Subiendo...' : 'Añadir foto' }}</span>
              </div>
              <input
                #photoInput
                type="file"
                accept="image/*"
                class="photo-input-hidden"
                (change)="onNewPhotoSelected($event)"
              />
              <div
                class="gallery-item"
                *ngFor="let image of petImages(); let i = index"
                (click)="openLightboxAt(i)"
              >
                <img [src]="image" [alt]="'Foto ' + (i+1)" />
                <div class="gallery-overlay">
                  <i class="pi pi-search-plus"></i>
                </div>
              </div>
              <div class="gallery-item empty" *ngIf="petImages().length === 0">
                <i class="pi pi-image"></i>
                <p>No hay fotos disponibles</p>
              </div>
            </div>
          </div>

          <!-- Posts Tab -->
          <div class="tab-panel" *ngIf="activeTab() === 'posts'">
            <div class="posts-grid">
              <div
                class="post-card"
                *ngFor="let post of petPosts(); let i = index"
                (click)="openPostModal(i)"
              >
                <img [src]="post.image" [alt]="post.caption" />
                <div class="post-overlay">
                  <div class="post-stats">
                    <span><i class="pi pi-heart-fill"></i> {{ post.likesCount }}</span>
                    <span><i class="pi pi-comment"></i> {{ post.commentsCount }}</span>
                  </div>
                </div>
              </div>
              <div class="post-card empty" *ngIf="petPosts().length === 0">
                <i class="pi pi-camera"></i>
                <p>No hay publicaciones aún</p>
              </div>
            </div>
          </div>

          <!-- Comments Tab -->
          <div class="tab-panel" *ngIf="activeTab() === 'comments'">
            <div class="comments-feed">
              <div class="comment-item" *ngFor="let comment of petComments()">
                <img [src]="comment.authorAvatar" [alt]="comment.authorName" class="comment-avatar" />
                <div class="comment-body">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.authorName }}</span>
                    <span class="comment-date">{{ comment.date | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                  <div class="comment-actions">
                    <button class="comment-like-btn" (click)="toggleCommentLike(comment)">
                      <i class="pi" [class.pi-heart-fill]="comment.liked" [class.pi-heart]="!comment.liked"></i>
                      <span>{{ comment.likes }}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div class="empty-state" *ngIf="petComments().length === 0">
                <i class="pi pi-comment"></i>
                <p>No hay comentarios aún</p>
                <span class="empty-subtitle">Sé el primero en comentar</span>
              </div>
            </div>
          </div>

          <!-- Historial Tab -->
          <div class="tab-panel" *ngIf="activeTab() === 'history'">
            <app-adoption-history [petId]="pet()?.id || ''" />
          </div>
        </div>
      </div>

      <!-- Lightbox Modal -->
      <p-dialog
        [visible]="lightboxVisible"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '900px' }"
        [closable]="true"
        (onHide)="closeLightbox()"
        [dismissableMask]="true"
        styleClass="lightbox-dialog"
        [showHeader]="false"
      >
        <div class="lightbox-content">
          <button class="lightbox-close" (click)="closeLightbox()">
            <i class="pi pi-times"></i>
          </button>
          <button
            class="lightbox-nav lightbox-prev"
            *ngIf="petImages().length > 1"
            (click)="prevImage($event)"
          >
            <i class="pi pi-chevron-left"></i>
          </button>
          <img [src]="currentImage()" alt="Imagen" class="lightbox-image" />
          <button
            class="lightbox-nav lightbox-next"
            *ngIf="petImages().length > 1"
            (click)="nextImage($event)"
          >
            <i class="pi pi-chevron-right"></i>
          </button>
          <div class="lightbox-dots" *ngIf="petImages().length > 1">
            <span
              class="dot"
              *ngFor="let img of petImages(); let i = index"
              [class.active]="i === currentImageIndex()"
              (click)="selectImage(i)"
            ></span>
          </div>
        </div>
      </p-dialog>

      <!-- Post Modal -->
      <p-dialog
        [visible]="postModalVisible"
        [modal]="true"
        [style]="{ width: '95vw', maxWidth: '1200px' }"
        [closable]="true"
        (onHide)="closePostModal()"
        [dismissableMask]="true"
        styleClass="post-modal-dialog"
        [showHeader]="false"
      >
        <div class="post-modal" *ngIf="currentPost()">
          <div class="post-modal-image">
            <button
              class="modal-arrow modal-arrow-left"
              *ngIf="petPosts().length > 1"
              (click)="prevPost($event)"
            >
              <i class="pi pi-chevron-left"></i>
            </button>
            <img [src]="currentPost().image" [alt]="currentPost().caption" />
            <button
              class="modal-arrow modal-arrow-right"
              *ngIf="petPosts().length > 1"
              (click)="nextPost($event)"
            >
              <i class="pi pi-chevron-right"></i>
            </button>
          </div>
          <div class="post-modal-details">
            <div class="post-modal-header">
              <div class="post-modal-user">
                <img [src]="pet()?.avatarUrl || 'https://placehold.co/40x40'" class="post-modal-avatar" />
                <span class="post-modal-username">{{ pet()?.name }}</span>
              </div>
              <button *ngIf="isOwner()" class="post-modal-more" (click)="toggleActionMenu($event)">
                <i class="pi pi-ellipsis-h"></i>
              </button>
            </div>

            <div class="post-modal-caption" *ngIf="currentPost().caption">
              <span class="caption-username">{{ pet()?.name }}</span>
              <span class="caption-text">{{ currentPost().caption }}</span>
            </div>

            <div class="post-modal-comments">
              <div class="comment-item" *ngFor="let comment of petComments()">
                <img [src]="comment.authorAvatar" class="comment-avatar-small" />
                <div class="comment-body-small">
                  <span class="comment-author-small">{{ comment.authorName }}</span>
                  <span class="comment-text-small">{{ comment.content }}</span>
                </div>
              </div>
              <div class="empty-comments" *ngIf="petComments().length === 0">
                <i class="pi pi-comment"></i>
                <p>No hay comentarios</p>
              </div>
            </div>

            <div class="post-modal-actions">
              <div class="post-modal-stats">
                <span><i class="pi pi-heart-fill"></i> {{ currentPost().likesCount }} likes</span>
                <span>{{ currentPost().date || 'Recientemente' }}</span>
              </div>
            </div>
          </div>
        </div>
            </p-dialog>

      <!-- Adoption Request Dialog -->
      <p-dialog
        [visible]="showAdoptionDialog"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '560px' }"
        [closable]="true"
        (onHide)="showAdoptionDialog = false"
        [dismissableMask]="true"
        styleClass="adoption-dialog"
        [header]="'Solicitar adopción de ' + (pet()?.name || '')"
      >
        <app-dynamic-form
          [config]="adoptionFormConfig"
          [formData]="adoptionRequestFormData()"
          (onSubmitClick)="submitAdoptionRequest($event)"
          (onCancel)="showAdoptionDialog = false"
        />
      </p-dialog>

      <!-- Delete Confirmation -->
      <p-dialog
        [visible]="showDeleteDialog"
        [modal]="true"
        [style]="{ width: '420px' }"
        [closable]="true"
        (onHide)="showDeleteDialog = false"
        header="Confirmar Eliminación"
      >
        <div class="delete-confirmation">
          <div class="delete-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <h3>¿Eliminar a {{ pet()?.name }}?</h3>
          <p>Esta acción no se puede deshacer. Todos los datos de la mascota serán eliminados permanentemente.</p>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn-secondary" (click)="showDeleteDialog = false">Cancelar</button>
          <button class="btn-danger" (click)="deletePet()">Eliminar</button>
        </ng-template>
      </p-dialog>

      <!-- Menu -->
      <p-menu #actionMenu [model]="actionMenuItems" [popup]="true" />
    </div>
  `,
  styles: [`
    /* ============================================
       BASE & CONTAINER
    ============================================ */
    .pet-profile-page {
      min-height: 100vh;
      background: var(--surface-ground);
      transition: background 0.3s ease;
    }

    .pet-profile-page.dark {
      background: var(--surface-ground-dark);
    }

    .pet-profile-container {
      max-width: var(--max-page-width);
      margin: 0 auto;
      padding: 0 20px 40px;
    }

    /* ============================================
       LOADING
    ============================================ */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    :host ::ng-deep .loading-overlay .p-progressbar {
      height: 3px;
    }

    :host ::ng-deep .loading-overlay .p-progressbar-value {
      background: var(--primary-color);
    }

    /* ============================================
       BACK BUTTON
    ============================================ */
    .back-button-container {
      padding: 16px 0 8px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .back-btn i {
      font-size: 16px;
    }

    /* ============================================
       PROFILE HEADER
    ============================================ */
    .profile-header {
      position: relative;
      background: var(--surface-card);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .cover-image-container {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .cover-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60%;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.15));
    }

    .profile-info-section {
      position: relative;
      padding: 0 24px 24px;
      margin-top: -40px;
      display: flex;
      align-items: flex-end;
      gap: 24px;
      flex-wrap: wrap;
    }

    .avatar-wrapper {
      flex-shrink: 0;
    }

    .avatar-container {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 4px solid var(--surface-card);
      overflow: hidden;
      cursor: pointer;
      background: var(--surface-card);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .profile-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 50%;
    }

    .avatar-container:hover .avatar-overlay {
      opacity: 1;
    }

    .avatar-overlay i {
      font-size: 24px;
      color: white;
    }

    .user-info {
      flex: 1;
      min-width: 200px;
      padding-top: 40px;
    }

    .user-name-section {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }

    .name-group {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .user-name {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.2;
    }

    .pet-owner-name {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
      line-height: 1.2;
    }

    .pet-owner-name i {
      font-size: 13px;
    }

    .user-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: var(--surface-hover);
      color: var(--text-secondary);
    }

    .badge-success {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge-secondary {
      background: var(--surface-hover);
      color: var(--text-secondary);
    }

    .badge-info {
      background: #e3f2fd;
      color: #1565c0;
    }

    .dark .badge-success {
      background: #1b5e20;
      color: #a5d6a7;
    }

    .dark .badge-info {
      background: #0d47a1;
      color: #90caf9;
    }

    .user-bio {
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.5;
      margin: 4px 0 8px;
    }

    .user-bio p {
      margin: 0;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      padding-top: 40px;
      flex-shrink: 0;
      align-items: center;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 24px;
      border: none;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(148, 199, 72, 0.4);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    .already-requested {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      background: var(--surface-hover);
      color: var(--text-secondary);
      border: 1px solid var(--text-tertiary);
    }

    .already-requested i {
      color: var(--primary-color);
    }

    .btn-adopt {
      background: linear-gradient(135deg, #f43f5e, #e11d48);
    }

    .btn-adopt:hover {
      box-shadow: 0 4px 12px rgba(228, 29, 72, 0.4);
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      border: 1px solid var(--surface-border);
      border-radius: 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      background: transparent;
      color: var(--text-primary);
    }

    .btn-secondary:hover {
      background: var(--surface-hover);
      border-color: var(--text-secondary);
    }

    .btn-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--surface-border);
      border-radius: 50%;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
      background: transparent;
      color: var(--text-secondary);
    }

    .btn-icon:hover {
      background: var(--surface-hover);
      border-color: var(--text-secondary);
    }

    .btn-danger {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    /* ============================================
       STATS BAR
    ============================================ */
    .stats-bar {
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: var(--surface-card);
      border-radius: 12px;
      padding: 16px 24px;
      margin-bottom: 24px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .stat-item:hover {
      background: var(--surface-hover);
    }

    .stat-number {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-divider {
      width: 1px;
      height: 30px;
      background: var(--surface-border);
    }

    /* ============================================
       TABS
    ============================================ */
    .tabs-container {
      margin-bottom: 24px;
    }

    :host ::ng-deep .tabs-container app-tabs .tabs {
      border-bottom: 1px solid var(--surface-border);
    }

    :host ::ng-deep .tabs-container app-tabs .tab {
      padding: 12px 20px;
      font-weight: 500;
    }

    /* ============================================
       TAB CONTENT
    ============================================ */
    .tab-content {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tab-panel {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 24px;
    }

    /* ============================================
       INFO SECTIONS
    ============================================ */
    .info-sections {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .info-section {
      background: var(--surface-ground);
      border-radius: 12px;
      padding: 20px;
    }

    .dark .info-section {
      background: var(--surface-ground-dark);
    }

    .edit-form-wrapper {
      background-color: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 1rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 16px 0;
    }

    .section-title i {
      color: var(--primary-color);
      font-size: 18px;
    }

    .subsection-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 16px 0 12px 0;
      padding-top: 12px;
      border-top: 1px solid var(--surface-border);
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 24px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-row.full-width {
      grid-column: 1 / -1;
    }

    .info-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .info-label {
      font-size: 13px;
      color: var(--text-secondary);
      min-width: 120px;
      flex-shrink: 0;
    }

    .info-value {
      font-size: 14px;
      color: var(--text-primary);
      font-weight: 500;
      word-break: break-word;
    }

    /* ============================================
       GALLERY / POSTS GRID
    ============================================ */
    .gallery-grid,
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }

    .gallery-item,
    .post-card {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      cursor: pointer;
      border-radius: 4px;
    }

    .gallery-item img,
    .post-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .gallery-item:hover img,
    .post-card:hover img {
      transform: scale(1.03);
    }

    .gallery-overlay,
    .post-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .gallery-item:hover .gallery-overlay,
    .post-card:hover .post-overlay {
      opacity: 1;
    }

    .gallery-overlay i {
      font-size: 32px;
      color: white;
    }

    .post-stats {
      display: flex;
      gap: 20px;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    .post-stats span {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .post-stats i {
      font-size: 16px;
    }

    .gallery-item.empty,
    .post-card.empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--surface-hover);
      color: var(--text-secondary);
      aspect-ratio: 1;
      border-radius: 4px;
      cursor: default;
    }

    .gallery-item.empty i,
    .post-card.empty i {
      font-size: 40px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    .gallery-item.empty p,
    .post-card.empty p {
      margin: 0;
      font-size: 14px;
    }

    /* Header y tile para añadir nuevas fotos (solo propietario) */
    .gallery-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .gallery-hint {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .add-photo-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: var(--surface-hover);
      border: 2px dashed var(--primary-color);
      color: var(--primary-color);
      aspect-ratio: 1;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      font-weight: 500;
      text-align: center;
      padding: 0.5rem;
    }

    .add-photo-item i {
      font-size: 32px;
    }

    .add-photo-item:hover {
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      transform: translateY(-2px);
    }

    .photo-input-hidden {
      display: none;
    }

    /* ============================================
       COMMENTS FEED
    ============================================ */
    .comments-feed {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .comment-item:last-child {
      border-bottom: none;
    }

    .comment-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .comment-body {
      flex: 1;
      min-width: 0;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }

    .comment-author {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }

    .comment-date {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .comment-text {
      font-size: 14px;
      color: var(--text-primary);
      line-height: 1.5;
      margin: 0 0 8px 0;
    }

    .comment-actions {
      display: flex;
      gap: 16px;
    }

    .comment-like-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 13px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .comment-like-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    .comment-like-btn .pi-heart-fill {
      color: #dc2626;
    }

    .comment-avatar-small {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .comment-body-small {
      flex: 1;
      min-width: 0;
    }

    .comment-author-small {
      font-weight: 600;
      font-size: 13px;
      color: var(--text-primary);
      margin-right: 8px;
    }

    .comment-text-small {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
    }

    .empty-state i {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.4;
    }

    .empty-state p {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .empty-state .empty-subtitle {
      font-size: 14px;
      opacity: 0.7;
    }

    .empty-comments {
      text-align: center;
      padding: 30px 20px;
      color: var(--text-secondary);
    }

    .empty-comments i {
      font-size: 32px;
      opacity: 0.4;
      margin-bottom: 8px;
    }

    .empty-comments p {
      margin: 0;
      font-size: 14px;
    }

    /* ============================================
       LIGHTBOX
    ============================================ */
    :host ::ng-deep .lightbox-dialog .p-dialog-content {
      padding: 0;
      background: rgba(0, 0, 0, 0.9);
    }

    :host ::ng-deep .lightbox-dialog .p-dialog {
      background: transparent;
    }

    .lightbox-content {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      padding: 20px;
    }

    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.6);
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
      transition: all 0.2s;
    }

    .lightbox-close:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
    }

    .lightbox-close i {
      font-size: 20px;
    }

    .lightbox-image {
      max-width: 100%;
      max-height: 85vh;
      object-fit: contain;
      border-radius: 4px;
    }

    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      border: none;
      color: white;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s;
    }

    .lightbox-nav:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-50%) scale(1.05);
    }

    .lightbox-prev {
      left: 16px;
    }

    .lightbox-next {
      right: 16px;
    }

    .lightbox-dots {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 10;
    }

    .lightbox-dots .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: all 0.2s;
    }

    .lightbox-dots .dot.active {
      background: white;
      width: 24px;
      border-radius: 4px;
    }

    .lightbox-dots .dot:hover {
      background: rgba(255, 255, 255, 0.8);
    }

    /* ============================================
       POST MODAL
    ============================================ */
    :host ::ng-deep .post-modal-dialog .p-dialog-content {
      padding: 0;
    }

    :host ::ng-deep .post-modal-dialog .p-dialog {
      max-height: 95vh;
    }

    .post-modal {
      display: flex;
      height: 80vh;
      max-height: 700px;
      background: var(--surface-card);
    }

    .post-modal-image {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      min-width: 0;
    }

    .post-modal-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .modal-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s;
    }

    .modal-arrow:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .modal-arrow-left {
      left: 12px;
    }

    .modal-arrow-right {
      right: 12px;
    }

    .post-modal-details {
      width: 380px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      background: var(--surface-card);
      border-left: 1px solid var(--surface-border);
    }

    .post-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--surface-border);
    }

    .post-modal-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .post-modal-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }

    .post-modal-username {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }

    .post-modal-more {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .post-modal-more:hover {
      background: var(--surface-hover);
    }

    .post-modal-caption {
      display: flex;
      gap: 8px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--surface-border);
    }

    .caption-username {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
      flex-shrink: 0;
    }

    .caption-text {
      font-size: 14px;
      color: var(--text-primary);
      line-height: 1.4;
      word-break: break-word;
    }

    .post-modal-comments {
      flex: 1;
      overflow-y: auto;
      padding: 8px 20px;
    }

    .post-modal-comments .comment-item {
      padding: 8px 0;
      border-bottom: none;
      gap: 10px;
    }

    .post-modal-comments .comment-item:last-child {
      border-bottom: none;
    }

    .post-modal-actions {
      padding: 12px 20px;
      border-top: 1px solid var(--surface-border);
    }

    .post-modal-stats {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .post-modal-stats span {
      font-size: 14px;
      color: var(--text-primary);
    }

    .post-modal-stats span:first-child {
      font-weight: 600;
    }

    .post-modal-stats span:first-child i {
      color: #dc2626;
      margin-right: 6px;
    }

    .post-modal-stats span:last-child {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    /* ============================================
       EDIT DIALOG
    ============================================ */
    :host ::ng-deep .edit-dialog .p-dialog-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--surface-border);
    }

    :host ::ng-deep .edit-dialog .p-dialog-content {
      padding: 24px;
    }

    /* ============================================
       DELETE CONFIRMATION
    ============================================ */
    .delete-confirmation {
      text-align: center;
      padding: 20px;
    }

    .delete-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      background: #fef3c7;
      border-radius: 50%;
    }

    .delete-icon i {
      font-size: 32px;
      color: #f59e0b;
    }

    .dark .delete-icon {
      background: #78350f;
    }

    .delete-confirmation h3 {
      color: var(--text-primary);
      margin: 0 0 8px 0;
    }

    .delete-confirmation p {
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    :host ::ng-deep .p-dialog .p-dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--surface-border);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* ============================================
       SKELETONS
    ============================================ */
    .profile-skeletons {
      background: var(--surface-card);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .cover-skeleton {
      display: block;
      width: 100%;
    }

    .profile-info-skeleton {
      padding: 0 24px 24px;
      margin-top: -40px;
      display: flex;
      align-items: flex-end;
      gap: 24px;
      flex-wrap: wrap;
    }

    .avatar-skeleton-wrapper {
      flex-shrink: 0;
    }

    .avatar-skeleton {
      border: 4px solid var(--surface-card);
    }

    .user-info-skeleton {
      flex: 1;
      min-width: 200px;
      padding-top: 40px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-skeleton {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    /* ============================================
       RESPONSIVE
    ============================================ */
    @media (max-width: 992px) {
      .post-modal {
        flex-direction: column;
        height: 90vh;
        max-height: none;
      }

      .post-modal-image {
        height: 50vh;
        max-height: 400px;
      }

      .post-modal-details {
        width: 100%;
        border-left: none;
        border-top: 1px solid var(--surface-border);
        height: 40vh;
      }
    }

    @media (max-width: 768px) {
      .pet-profile-container {
        padding: 0 12px 24px;
      }

      .profile-info-section {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 0 16px 16px;
        margin-top: -50px;
      }

      .avatar-container {
        width: 100px;
        height: 100px;
      }

      .user-info {
        padding-top: 8px;
        text-align: center;
      }

      .user-name-section {
        justify-content: center;
      }

      .user-name {
        font-size: 22px;
      }

      .action-buttons {
        padding-top: 8px;
        justify-content: center;
        width: 100%;
        flex-wrap: wrap;
      }

      .cover-image-container {
        height: 140px;
      }

      .stats-bar {
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px 16px;
      }

      .stat-divider {
        display: none;
      }

      .stat-item {
        flex: 1;
        min-width: 60px;
        padding: 4px 8px;
      }

      .stat-number {
        font-size: 16px;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .info-row {
        padding: 6px 0;
      }

      .info-label {
        min-width: 90px;
        font-size: 12px;
      }

      .gallery-grid,
      .posts-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 2px;
      }

      .tab-panel {
        padding: 16px;
      }

      .post-modal {
        height: 95vh;
      }

      .post-modal-image {
        height: 40vh;
        max-height: 300px;
      }

      .post-modal-details {
        height: 55vh;
      }
    }

    @media (max-width: 480px) {
      .cover-image-container {
        height: 100px;
      }

      .avatar-container {
        width: 80px;
        height: 80px;
      }

      .user-name {
        font-size: 18px;
      }

      .gallery-grid,
      .posts-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .btn-primary,
      .btn-secondary {
        padding: 6px 16px;
        font-size: 12px;
      }

      .btn-icon {
        width: 36px;
        height: 36px;
        font-size: 14px;
      }

      .action-buttons {
        gap: 6px;
      }

      .lightbox-nav {
        width: 36px;
        height: 36px;
      }

      .lightbox-nav i {
        font-size: 14px;
      }
    }

    /* ============================================
       DARK MODE OVERRIDES
    ============================================ */
    .dark .profile-header,
    .dark .stats-bar,
    .dark .tab-panel {
      border-color: var(--surface-border-dark);
    }

    .dark .info-section {
      background: var(--surface-ground-dark);
    }

    .dark .post-modal {
      background: var(--surface-card-dark);
    }

    .dark .post-modal-details {
      background: var(--surface-card-dark);
      border-left-color: var(--surface-border-dark);
    }

    .dark .post-modal-header,
    .dark .post-modal-caption,
    .dark .post-modal-actions {
      border-color: var(--surface-border-dark);
    }

    /* ============================================
       UTILITY
    ============================================ */
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
  `]
})
export class PetProfilePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly messageService = inject(MessageService);
  private readonly adoptionService = inject(AdoptionService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly petOwnershipEvent = inject(PetOwnershipEventService);
  private readonly cloudinaryService = inject(CloudinaryService);
  private paramSubscription?: Subscription;

  // Controla si hay una foto subiéndose en este momento
  uploadingPhoto = signal(false);

  // Loading state
  loading = signal(true);

  // Pet data
  // Pet data
  pet = signal<PetResponse | null>(null);
  petId = signal<string | null>(null);
  petOwnerName = signal<string | null>(null);
  hasPendingRequest = signal(false);
  currentImageIndex = signal(0);

    // UI state
  activeTab = signal('info');
  lightboxVisible = false;
  showEditDialog = false;
  showDeleteDialog = false;
  showAdoptionDialog = false;
  postModalVisible = false;
  currentPostIndex = signal(0);
  isEditing = signal(false);

  // Pet data
  petPosts = signal<any[]>([]);
  petComments = signal<PetComment[]>([]);
  petStats = signal({
    likes: 0,
    posts: 0,
  });

  // Edit form data
  editPetFormData = signal<any>({});

  // Adoption request form config
  adoptionFormConfig: DynamicFormConfig = {
    title: 'Solicitar adopción',
    submitLabel: 'Enviar solicitud',
    showCancel: true,
    fields: [
      {
        key: 'message',
        label: 'Cuéntanos por qué quieres adoptar a esta mascota',
        type: 'textarea',
        placeholder: 'Comparte tu experiencia con mascotas, tu hogar y motivos...',
        rows: 4,
        validation: { required: true, minLength: 10, maxLength: 1000 }
      }
    ]
  };
  adoptionRequestFormData = signal<any>({});

  // Menu reference
  @ViewChild('actionMenu') actionMenu: any;

  // Dark mode detection
  isDarkMode = signal(false);

  // Action menu items
  actionMenuItems: any[] = [];

  // Computed
  petImages = computed(() => {
    const pet = this.pet();
    if (!pet) return ['https://placehold.co/600x600?text=🐾'];

    const images: string[] = [];
    if (pet.avatarUrl) images.push(pet.avatarUrl);
    if (pet.imageUrls?.length) images.push(...pet.imageUrls);
    return images.length > 0 ? images : ['https://placehold.co/600x600?text=🐾'];
  });

  currentImage = computed(() => {
    const images = this.petImages();
    const index = this.currentImageIndex();
    return images[Math.min(index, images.length - 1)];
  });

  currentPost = computed(() => {
    const posts = this.petPosts();
    const index = this.currentPostIndex();
    return posts.length > 0 ? posts[Math.min(index, posts.length - 1)] : null;
  });

  isOwner = computed(() => {
    const pet = this.pet();
    const user = this.authService.user();
    return pet && user && pet.ownerId === user.id;
  });

  canRequestAdoption = computed(() => {
    const pet = this.pet();
    const user = this.authService.user();
    return pet && user && pet.availableForAdoption && pet.ownerId !== user.id && !this.hasPendingRequest();
  });

  petTabs = computed((): Tab[] => {
    return [
      { id: 'info', label: 'Información', icon: 'info' },
      { id: 'photos', label: 'Fotos', icon: 'photo_library' },
      { id: 'posts', label: 'Publicaciones', icon: 'photo_library' },
      { id: 'comments', label: 'Comentarios', icon: 'comment' },
      { id: 'history', label: 'Historial', icon: 'history' },
    ];
  });

  ngOnInit(): void {
    this.detectDarkMode();
    this.paramSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.petId.set(id);
      if (id) this.loadPetData(id);
    });

    // Refrescar el nombre/avatar del Familia cuando la mascota cambia de propietario
    // (p. ej. al finalizar una adopción desde la administración).
    effect(() => {
      const changedId = this.petOwnershipEvent.changedPetId();
      const currentPet = this.pet();
      if (changedId && currentPet?.id === changedId) {
        this.petOwnershipEvent.clear();
        this.loadPetData(currentPet.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  private detectDarkMode(): void {
    const darkMode = document.documentElement.classList.contains('dark');
    this.isDarkMode.set(darkMode);

    const observer = new MutationObserver(() => {
      this.isDarkMode.set(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  private loadPetData(petId: string): void {
    this.loading.set(true);

    this.profileService.getPetById(petId).subscribe({
      next: (pet) => {
  this.pet.set(pet);
        this.loadPetOwner(pet.ownerId);
        this.checkExistingRequest(pet.id);
        this.loadPetStats(petId);
        this.loadPetPosts(petId);
        this.loadPetComments(petId);
        this.buildActionMenuItems();
        this.initEditFormData(pet);

        setTimeout(() => {
          this.loading.set(false);
          this.cdr.detectChanges();
        }, 300);
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

  private loadPetOwner(ownerId: string): void {
    this.profileService.getProfileByAuthUserId(ownerId).subscribe({
      next: (profile) => {
        this.petOwnerName.set(`${profile.firstName} ${profile.lastName}`.trim() || 'Usuario');
      },
            error: (err) => {
        console.error('Error loading pet owner:', err);
        this.petOwnerName.set(null);
      }
    });
  }

  private checkExistingRequest(petId: string): void {
    const user = this.authService.user();
    if (!user) {
      this.hasPendingRequest.set(false);
      return;
    }
    this.adoptionService.getMyAdoptionRequests().subscribe({
      next: (requests) => {
                const active = requests.some(r =>
          r.petId === petId &&
          (r.status || '').toLowerCase() !== 'rejected' &&
          (r.status || '').toLowerCase() !== 'completed'
        );
        this.hasPendingRequest.set(active);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error checking existing adoption requests:', err);
        this.hasPendingRequest.set(false);
      }
    });
  }

  private initEditFormData(pet: PetResponse): void {
    this.editPetFormData.set({
      name: pet.name,
      // La API guarda la especie en MAYÚSCULAS (p. ej. "DOG"), pero las opciones
      // del select y las claves de SPECIES_BREEDS están en minúsculas. Se normaliza
      // para que el select muestre el valor actual y las razas se resuelvan bien.
      species: (pet.species || '').toLowerCase(),
      breed: pet.breed || '',
      dateOfBirth: this.toDate(pet.dateOfBirth),
      gender: pet.gender || '',
      weight: pet.weight ?? null,
      weightUnit: pet.weightUnit || 'kg',
      color: pet.color || '',
      microchipId: pet.microchipId || '',
      bio: pet.bio || '',
      bloodType: pet.bloodType || '',
      allergies: pet.allergies || '',
      medicalConditions: pet.medicalConditions || '',
      vetName: pet.vetName || '',
      vetPhone: pet.vetPhone || '',
      vetAddress: pet.vetAddress || '',
      lastVaccinationDate: this.toDate(pet.lastVaccinationDate),
      nextVaccinationDate: this.toDate(pet.nextVaccinationDate),
      lastVetVisit: this.toDate(pet.lastVetVisit),
      insuranceProvider: pet.insuranceProvider || '',
      insurancePolicyNumber: pet.insurancePolicyNumber || '',
      emergencyContact: pet.emergencyContact || '',
      emergencyPhone: pet.emergencyPhone || '',
      adoptionDate: this.toDate(pet.adoptionDate),
      adoptionCenter: pet.adoptionCenter || '',
      registrationNumber: pet.registrationNumber || '',
      licenseNumber: pet.licenseNumber || '',
      licenseExpiryDate: this.toDate(pet.licenseExpiryDate),
      spayedNeutered: !!pet.spayedNeutered,
      spayedNeuteredDate: this.toDate(pet.spayedNeuteredDate),
      temperament: pet.temperament || '',
      energyLevel: pet.energyLevel || '',
      trainingLevel: pet.trainingLevel || '',
      favoriteActivities: pet.favoriteActivities || '',
      favoriteFood: pet.favoriteFood || '',
      specialNeeds: pet.specialNeeds || ''
    });
  }

  /**
   * Convierte una fecha en formato string (p. ej. "2020-01-15") en un objeto Date
   * para que los campos de tipo 'date' del formulario puedan mostrarla.
   */
  private toDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Convierte un valor de fecha del formulario en formato ISO (yyyy-MM-dd) para el backend.
   */
  private toIsoDate(value: any): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }

  private loadPetStats(petId: string): void {
    this.petStats.set({
      likes: Math.floor(Math.random() * 100),
      posts: Math.floor(Math.random() * 20),
    });
  }

  private loadPetPosts(petId: string): void {
    this.petPosts.set([
      {
        id: '1',
        image: 'https://picsum.photos/400/400?random=10',
        likesCount: 24,
        commentsCount: 5,
        caption: '¡Día de parque! 🐾',
        date: 'Hace 2 días'
      },
      {
        id: '2',
        image: 'https://picsum.photos/400/400?random=11',
        likesCount: 18,
        commentsCount: 3,
        caption: 'Baño relajante 🛁',
        date: 'Hace 5 días'
      },
      {
        id: '3',
        image: 'https://picsum.photos/400/400?random=12',
        likesCount: 32,
        commentsCount: 8,
        caption: 'Nuevo juguete favorito 🧸',
        date: 'Hace 1 semana'
      },
    ]);
  }

  private loadPetComments(petId: string): void {
    this.petComments.set([
      {
        id: '1',
        authorName: 'María García',
        authorAvatar: 'https://i.pravatar.cc/150?img=1',
        content: '¡Qué adorable! Me encanta cómo ha crecido 🐕',
        date: new Date('2024-01-15'),
        likes: 5,
        liked: false
      },
      {
        id: '2',
        authorName: 'Juan Pérez',
        authorAvatar: 'https://i.pravatar.cc/150?img=2',
        content: 'Muy bonito, saludos a toda la familia 🐾',
        date: new Date('2024-01-14'),
        likes: 3,
        liked: false
      },
    ]);
  }

  private buildActionMenuItems(): void {
    const pet = this.pet();
    this.actionMenuItems = [
      {
        label: 'Editar Perfil',
        icon: 'pi pi-pencil',
        command: () => this.startEditing()
      },
      {
        label: pet?.availableForAdoption ? 'Quitar de adopción' : 'Poner en adopción',
        icon: pet?.availableForAdoption ? 'pi pi-heart' : 'pi pi-home',
        command: () => this.toggleAdoptionStatus()
      },
      {
        label: 'Eliminar Mascota',
        icon: 'pi pi-trash',
        command: () => this.confirmDelete()
      }
    ];
  }

  // Form configurations
  editPetFormConfig: DynamicFormConfig = {
    title: 'Editar Información',
    submitLabel: 'Guardar Cambios',
    showCancel: true,
    resolveOptions: (_field, sourceValue) => SPECIES_BREEDS[sourceValue] ?? [],
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
        type: 'select',
        dependsOn: 'species',
        placeholder: 'Seleccione una raza',
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
        type: 'select',
        placeholder: 'Seleccionar color',
        showClear: true,
        options: PET_COLOR_OPTIONS
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

  currentEditCategory: 'basic' | 'medical' | 'additional' | 'behavior' = 'basic';

  /**
   * Config combinada con TODOS los campos editables del animal
   * (todos los que se muestran en la vista excepto la ubicación).
   *
   * Se expone como un `computed` para que mantenga una referencia estable entre
   * renders. Si se generara un objeto nuevo en cada detección de cambios, el
   * DynamicFormComponent reconstruiría el formulario continuamente y "borraría"
   * la edición del usuario (campos que parecen no editables).
   */
  currentEditFormConfig = computed<DynamicFormConfig>(() => ({
    title: 'Editar Información',
    submitLabel: 'Guardar Cambios',
    showCancel: true,
    resolveOptions: (_field: DynamicFormField, sourceValue: any) => SPECIES_BREEDS[sourceValue] ?? [],
    fields: [
      ...this.editPetFormConfig.fields,
      ...this.medicalFormConfig.fields,
      ...this.additionalFormConfig.fields,
      ...this.behaviorFormConfig.fields
    ]
  }));

  // ============================================
  //  ACTIONS
  // ============================================

  goBack(): void {
    window.history.back();
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  toggleActionMenu(event: Event): void {
    event.stopPropagation();
    if (this.actionMenu) {
      this.actionMenu.toggle(event);
    }
  }

    openEditDialog(category: 'basic' | 'medical' | 'additional' | 'behavior'): void {
    this.currentEditCategory = category;
    this.showEditDialog = true;
  }

  startEditing(): void {
    const pet = this.pet();
    if (!pet) return;
    this.currentEditCategory = 'basic';
    this.isEditing.set(true);
    // Cargar los datos del animal en el formulario de edición
    this.initEditFormData(pet as PetResponse);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

    onEditPetSubmit(data: any): void {
    const pet = this.pet();
    if (!pet) return;

    // Construcción del payload para el backend. Se excluyen deliberadamente los
    // campos de ubicación (lastKnownLocation/lost) porque la ubicación no se edita.
    const request: any = {
      name: data?.name || '',
      species: (data?.species || ''),
      breed: data?.breed || null,
      dateOfBirth: this.toIsoDate(data?.dateOfBirth),
      gender: data?.gender || null,
      color: data?.color || null,
      microchipId: data?.microchipId || null,
      weight: data?.weight != null && data?.weight !== '' ? Number(data.weight) : null,
      weightUnit: data?.weightUnit || 'kg',
      bio: data?.bio || null
    };

    // Información médica y de salud
    request.bloodType = data?.bloodType || null;
    request.allergies = data?.allergies || null;
    request.medicalConditions = data?.medicalConditions || null;
    request.vetName = data?.vetName || null;
    request.vetPhone = data?.vetPhone || null;
    request.vetAddress = data?.vetAddress || null;
    request.lastVaccinationDate = this.toIsoDate(data?.lastVaccinationDate);
    request.nextVaccinationDate = this.toIsoDate(data?.nextVaccinationDate);
    request.lastVetVisit = this.toIsoDate(data?.lastVetVisit);
    request.insuranceProvider = data?.insuranceProvider || null;
    request.insurancePolicyNumber = data?.insurancePolicyNumber || null;

    // Información adicional
    request.emergencyContact = data?.emergencyContact || null;
    request.emergencyPhone = data?.emergencyPhone || null;
    request.adoptionDate = this.toIsoDate(data?.adoptionDate);
    request.adoptionCenter = data?.adoptionCenter || null;
    request.registrationNumber = data?.registrationNumber || null;
    request.licenseNumber = data?.licenseNumber || null;
    request.licenseExpiryDate = this.toIsoDate(data?.licenseExpiryDate);
    request.spayedNeutered = !!data?.spayedNeutered;
    request.spayedNeuteredDate = this.toIsoDate(data?.spayedNeuteredDate);

    // Comportamiento y características
    request.temperament = data?.temperament || null;
    request.energyLevel = data?.energyLevel || null;
    request.trainingLevel = data?.trainingLevel || null;
    request.favoriteActivities = data?.favoriteActivities || null;
    request.favoriteFood = data?.favoriteFood || null;
    request.specialNeeds = data?.specialNeeds || null;

    this.profileService.updatePet(pet.id, request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Mascota actualizada correctamente'
        });
        this.isEditing.set(false);
        // Recargar la mascota para reflejar los cambios
        this.loadPetData(pet.id);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la mascota'
        });
      }
    });
  }

  confirmDelete(): void {
    this.showDeleteDialog = true;
  }

  deletePet(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Mascota eliminada correctamente'
    });
    this.showDeleteDialog = false;
    this.router.navigate(['/profile']);
  }

  toggleAdoptionStatus(): void {
    const pet = this.pet();
    if (!pet) return;

    const newStatus = !pet.availableForAdoption;
    this.profileService.toggleAdoptionStatus(pet.id, newStatus).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: newStatus ? 'En adopción' : 'Adopción cancelada',
          detail: newStatus ? 'La mascota está disponible para adopción' : 'La mascota ya no está en adopción'
        });
        this.loadPetData(pet.id);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de adopción'
        });
      }
    });
  }

  openAdoptionDialog(): void {
    if (!this.canRequestAdoption()) return;
    this.adoptionRequestFormData.set({});
    this.showAdoptionDialog = true;
  }

  // ============================================
  //  FOTOS: AÑADIR NUEVA FOTO (solo propietario)
  // ============================================

  onNewPhotoSelected(event: any): void {
    const file = event?.target?.files?.[0];
    if (!file) return;
    // Reiniciar el input para permitir seleccionar el mismo archivo de nuevo
    if (event.target) event.target.value = '';

    this.uploadingPhoto.set(true);
    this.cdr.detectChanges();

    // 1) Subir a Cloudinary y obtener la URL pública
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (response) => {
        const imageUrl = response?.secure_url || response?.url;
        if (!imageUrl) {
          this.uploadingPhoto.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo obtener la URL de la foto'
          });
          return;
        }
        this.persistNewPetPhoto(imageUrl);
      },
      error: () => {
        this.uploadingPhoto.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo subir la foto'
        });
      }
    });
  }

  private persistNewPetPhoto(imageUrl: string): void {
    const pet = this.pet();
    if (!pet) {
      this.uploadingPhoto.set(false);
      return;
    }

    // Enviar únicamente la URL nueva. El backend la añade a imageUrls (con dedupe)
    // y preserva el resto de campos de la mascota (update parcial).
    this.profileService.updatePet(pet.id, { imageUrls: [imageUrl] }).subscribe({
      next: (updated) => {
        this.uploadingPhoto.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Foto añadida',
          detail: 'La nueva foto se ha añadido a la galería'
        });
        // Refrescar la mascota para mostrar la nueva foto
        this.loadPetData(pet.id);
      },
      error: () => {
        this.uploadingPhoto.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo añadir la foto a la mascota'
        });
      }
    });
    this.cdr.detectChanges();
  }

  submitAdoptionRequest(data: any): void {
    const pet = this.pet();
    if (!pet) return;

    const request: CreateAdoptionRequest = {
      petId: pet.id,
      message: data?.message
    };

    this.adoptionService.requestAdoption(request).subscribe({
      next: () => {
        this.showAdoptionDialog = false;
        this.hasPendingRequest.set(true);
        this.messageService.add({
          severity: 'success',
          summary: 'Solicitud enviada',
          detail: `Tu solicitud de adopción para ${pet.name} ha sido enviada`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar la solicitud de adopción'
        });
      }
    });
  }

  toggleCommentLike(comment: PetComment): void {
    comment.liked = !comment.liked;
    comment.likes += comment.liked ? 1 : -1;
    this.cdr.detectChanges();
  }

  // ============================================
  //  LIGHTBOX & POST MODAL
  // ============================================

  openLightboxAt(index: number): void {
    this.currentImageIndex.set(index);
    this.lightboxVisible = true;
  }

  closeLightbox(): void {
    this.lightboxVisible = false;
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    const total = this.petImages().length;
    const current = this.currentImageIndex();
    if (current < total - 1) this.currentImageIndex.set(current + 1);
  }

  prevImage(event: Event): void {
    event.stopPropagation();
    const current = this.currentImageIndex();
    if (current > 0) this.currentImageIndex.set(current - 1);
  }

  selectImage(index: number): void {
    this.currentImageIndex.set(index);
  }

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
    if (current < total - 1) this.currentPostIndex.set(current + 1);
  }

  prevPost(event: Event): void {
    event.stopPropagation();
    const current = this.currentPostIndex();
    if (current > 0) this.currentPostIndex.set(current - 1);
  }

  // ============================================
  //  HELPERS
  // ============================================

  formatAge(dateOfBirth: string | null | undefined): string {
    if (!dateOfBirth) return '—';
    const birth = new Date(dateOfBirth);
    const age = new Date().getFullYear() - birth.getFullYear();
    return age > 0 ? age + ' años' : '< 1 año';
  }

  // Wrappers para labels
  getSpeciesLabelWrapper = getSpeciesLabel;
  getGenderLabelWrapper = getGenderLabel;
  getTemperamentLabelWrapper = getTemperamentLabel;
  getColorLabelWrapper = getColorLabel;
  getEnergyLevelLabelWrapper = getEnergyLevelLabel;
  getTrainingLevelLabelWrapper = getTrainingLevelLabel;
}
