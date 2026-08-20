import { Component, signal, computed, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';
import { TableCardComponent, TableCardItem } from '../../../shared/presentation/components/table-card/table-card.component';
import { TabsComponent, Tab } from '../../../shared/presentation/components/tabs/tabs.component';
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { ProfileService, UserProfileResponse, PetResponse } from '../../infrastructure/services/profile.service';
import { User } from '../../../auth/domain/entities/user.entity';
import { SocialService, EventResponse } from '../../../social/infrastructure/services/social.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { LocationPickerComponent } from '../../../shared/components/location-picker/location-picker.component';
import { GeocodingResult } from '../../../shared/services/geolocation.service';
import { DialogModule } from 'primeng/dialog';
import { PostFeedComponent, PostItem } from '../../../shared/presentation/components/post-feed/post-feed.component';

type ProfileType = 'user' | 'shelter' | 'seller' | 'vet' | 'pet' | 'trainer';

interface BaseProfile {
  id: string;
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  website: string;
  joinDate: Date;
  isFollowing: boolean;
  type: ProfileType;
  phone?: string;
  dateOfBirth?: Date | string;
}

interface UserProfile extends BaseProfile {
  type: 'user';
  username: string;
  stats: {
    pets: number;
    followers: number;
    following: number;
    posts: number;
  };
}

interface ShelterProfile extends BaseProfile {
  type: 'shelter';
  stats: {
    pets: number;
    followers: number;
    adoptions: number;
    reviews: number;
  };
}

interface SellerProfile extends BaseProfile {
  type: 'seller';
  stats: {
    products: number;
    followers: number;
    sales: number;
    reviews: number;
  };
}

interface VetProfile extends BaseProfile {
  type: 'vet';
  specialty: string;
  rating: number;
  reviews: number;
  stats: {
    patients: number;
    followers: number;
    posts: number;
    likes: number;
  };
}

interface PetProfile extends BaseProfile {
  type: 'pet';
  species: string;
  breed: string;
  age: string;
  owner: {
    name: string;
    userId: string;
  };
  stats: {
    likes: number;
    posts: number;
  };
}

interface TrainerProfile extends BaseProfile {
  type: 'trainer';
  specialty: string;
  rating: number;
  reviews: number;
  stats: {
    clients: number;
    followers: number;
    posts: number;
    likes: number;
  };
}

type AnyProfile = UserProfile | ShelterProfile | SellerProfile | VetProfile | PetProfile | TrainerProfile;

interface Pet {
  id: string;
  name: string;
  breed: string;
  avatar: string;
  adoptionStatus?: 'available' | 'not-available';
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    AvatarModule,
    AvatarGroupModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    TagModule,
    RatingModule,
    FormsModule,
    RouterLink,
    TableCardComponent,
    DynamicFormComponent,
    ToastModule,
    ProgressBarModule,
    SkeletonModule,
    TabsComponent,
    MenuModule,
    LocationPickerComponent,
    DialogModule,
    PostFeedComponent
  ],
  providers: [MessageService],
  template: `
    <div class="profile-page" [class.dark]="isDarkMode()">
      <div class="profile-container">
        <!-- Loading Progress Bar -->
        <div class="loading-overlay" *ngIf="loading()">
          <p-progressBar mode="indeterminate" [style]="{'height': '3px'}"></p-progressBar>
        </div>

        <!-- Header del perfil estilo Instagram -->
        <div class="profile-header-instagram">
          <!-- Cover Image -->
          <div class="profile-cover-instagram">
            <ng-container *ngIf="loading(); else coverLoaded">
              <p-skeleton height="280px" class="cover-skeleton"></p-skeleton>
            </ng-container>
            <ng-template #coverLoaded>
              <img [src]="userCoverAvatar()" alt="Cover" class="cover-image-instagram" />
              <button *ngIf="isOwnProfile()" class="cover-change-btn" (click)="triggerCoverUpload()">
                <i class="pi pi-camera"></i>
              </button>
            </ng-template>
          </div>

          <!-- Profile Info -->
          <div class="profile-info-instagram">
            <!-- Avatar -->
            <div class="profile-avatar-section-instagram">
              <ng-container *ngIf="loading(); else avatarLoaded">
                <p-skeleton shape="circle" size="120px" class="avatar-skeleton-instagram"></p-skeleton>
              </ng-container>
              <ng-template #avatarLoaded>
                <div class="avatar-ring">
                  <div class="avatar-wrapper">
                    <img [src]="userAvatar()" alt="Avatar" class="profile-avatar-instagram" />
                    <button *ngIf="isOwnProfile()" class="avatar-change-btn" (click)="triggerAvatarUpload()">
                      <i class="pi pi-camera"></i>
                    </button>
                  </div>
                </div>
              </ng-template>
            </div>

            <!-- User Details -->
            <div class="profile-details-instagram">
              <ng-container *ngIf="loading(); else detailsLoaded">
                <p-skeleton width="10rem" height="1.5rem" class="mb-2"></p-skeleton>
                <div class="profile-stats-instagram">
                  <div class="stat-item-instagram" *ngFor="let i of [1, 2, 3, 4]">
                    <p-skeleton width="2.5rem" height="1rem" class="mb-1"></p-skeleton>
                    <p-skeleton width="4rem" height="0.75rem"></p-skeleton>
                  </div>
                </div>
              </ng-container>
              <ng-template #detailsLoaded>
                <h2 class="profile-username">{{ userUsername() }}</h2>

                <div class="profile-stats-instagram">
                  <div class="stat-item-instagram" *ngFor="let stat of profileStats()">
                    <span class="stat-value-instagram">{{ stat.value }}</span>
                    <span class="stat-label-instagram">{{ stat.label }}</span>
                  </div>
                </div>

                <h1 class="profile-name-instagram">{{ userProfile()?.name }}</h1>

                <div class="profile-type-badge">
                  <span class="type-badge" [ngClass]="'type-' + userProfile()?.type">
                    {{ getProfileTypeLabel(userProfile()?.type) }}
                  </span>
                </div>

                <p class="profile-bio-instagram">{{ userProfile()?.bio || 'Sin descripción' }}</p>

                <!-- Información de ubicación y contacto -->
                <div class="profile-contact-info">
                  <span *ngIf="userProfile()?.location" class="contact-item">
                    <i class="pi pi-map-marker"></i> {{ userProfile()?.location }}
                  </span>
                  <span *ngIf="userPhone() !== '—'" class="contact-item">
                    <i class="pi pi-phone"></i> {{ userPhone() }}
                  </span>
                  <span *ngIf="userProfile()?.website" class="contact-item">
                    <i class="pi pi-globe"></i>
                    <a [href]="'https://' + userProfile()?.website" target="_blank">{{ userProfile()?.website }}</a>
                  </span>
                </div>
              </ng-template>
            </div>

            <!-- Action Buttons -->
            <div class="profile-actions-instagram">
              <ng-container *ngIf="!loading()">
                <button *ngIf="isOwnProfile()" class="btn-action btn-edit" (click)="setActiveTab('knowme')">
                  <i class="pi pi-pencil"></i>
                  <span>Editar</span>
                </button>

                <button *ngIf="!isOwnProfile()" class="btn-action" [class.btn-following]="userProfile()?.isFollowing" (click)="toggleFollow()">
                  <i [class]="userProfile()?.isFollowing ? 'pi pi-check' : 'pi pi-user-plus'"></i>
                  <span>{{ userProfile()?.isFollowing ? 'Siguiendo' : 'Seguir' }}</span>
                </button>

                <button *ngIf="!isOwnProfile()" class="btn-action btn-message" (click)="openChat()">
                  <i class="pi pi-send"></i>
                  <span>Mensaje</span>
                </button>

                <button *ngIf="isOwnProfile()" class="btn-action btn-more" (click)="profileMenu.toggle($event)">
                  <i class="pi pi-ellipsis-h"></i>
                </button>
              </ng-container>
            </div>
          </div>
        </div>

        <!-- Tabs estilo Instagram -->
        <app-tabs
          [tabs]="profileTabs()"
          [activeTab]="activeTab()"
          (tabChange)="onTabChange($event)"
        />

        <!-- Contenido de tabs -->
        <div class="profile-content">
          <!-- Publicaciones - Grid 3 columnas estilo Instagram -->
          <div class="tab-panel" *ngIf="activeTab() === 'posts'">
            <div class="posts-grid-instagram" *ngIf="!loading()">
              <div class="post-card-instagram" *ngFor="let post of userPostItems()" (click)="openPost(post)">
                <img [src]="post.image" alt="Post" class="post-image-instagram" />
                <div class="post-overlay-instagram">
                  <span><i class="pi pi-heart-fill"></i> {{ post.likes }}</span>
                  <span><i class="pi pi-comment"></i> {{ post.comments }}</span>
                </div>
              </div>
              <div class="post-card-instagram empty" *ngIf="userPosts().length === 0">
                <i class="pi pi-camera"></i>
                <p>No hay publicaciones</p>
                <span class="empty-subtitle">Comparte tus momentos</span>
              </div>
            </div>
            <div class="posts-grid-instagram" *ngIf="loading()">
              <div class="post-card-instagram skeleton-post" *ngFor="let i of [1, 2, 3, 4, 5, 6]">
                <p-skeleton height="100%" borderRadius="0"></p-skeleton>
              </div>
            </div>
          </div>

          <!-- Mascotas -->
          <div class="tab-panel" *ngIf="activeTab() === 'pets' && (isUser() || isShelter())">
            <app-table-card
              [type]="'pet'"
              [items]="userPets()"
              [showSearch]="true"
              [filteredItems]="filteredPetItems()"
              [editable]="isOwnProfile()"
              [loading]="loading()"
              (onAdd)="showAddPetDialog()"
              (searchChange)="onPetSearch($event)"
            >
              <ng-template card-actions let-item>
                <a [routerLink]="'/profile/pet/' + item.id" class="p-button p-button-sm p-button-outlined">
                  <i class="pi pi-eye"></i> Ver perfil
                </a>
                <button
                  *ngIf="isOwnProfile()"
                  class="p-button p-button-sm"
                  [ngClass]="item.adoptionStatus === 'available' ? 'p-button-warning' : 'p-button-success'"
                  (click)="$event.stopPropagation(); toggleAdoptionStatus(item.id, item.adoptionStatus)"
                >
                  <i [class]="item.adoptionStatus === 'available' ? 'pi pi-heart' : 'pi pi-heart-fill'"></i>
                  {{ item.adoptionStatus === 'available' ? 'En adopción' : 'Poner en adopción' }}
                </button>
              </ng-template>
            </app-table-card>
          </div>

          <!-- Conóceme - Edición (propio perfil) -->
          <div class="tab-panel" *ngIf="activeTab() === 'knowme' && isOwnProfile() && !loading()">
            <app-dynamic-form
              [config]="profileFormConfig()"
              [formData]="profileFormData()"
              (onSubmitClick)="onProfileSubmit($event)"
            />

            <!-- Location Picker Section -->
            <div class="location-picker-section">
              <h3 class="section-title">
                <i class="pi pi-map-marker"></i>
                Ubicación
              </h3>
              <p class="section-subtitle">
                Selecciona tu ubicación para que otros usuarios puedan encontrarte
              </p>

              <app-location-picker
                [initialAddress]="userProfile()?.location"
                (locationConfirmed)="onLocationConfirmed($event)"
                (locationCancelled)="onLocationCancelled()"
              />
            </div>
          </div>

          <!-- Conóceme - Información (otros perfiles) - TODOS LOS DATOS -->
          <div class="tab-panel knowme-view" *ngIf="activeTab() === 'knowme' && !isOwnProfile() && !loading()">
            <div class="knowme-card">
              <div class="knowme-bio" *ngIf="userProfile()?.bio">
                <p>{{ userProfile()?.bio }}</p>
              </div>

              <div class="knowme-grid">
                <!-- Información básica -->
                <div class="knowme-section">
                  <h4 class="knowme-section-title">
                    <i class="pi pi-info-circle"></i>
                    Información Personal
                  </h4>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-user"></i></span>
                    <span class="knowme-label">Nombre</span>
                    <span class="knowme-value">{{ userProfile()?.name }}</span>
                  </div>
                  <div class="knowme-item" *ngIf="userProfile()?.type === 'user'">
                    <span class="knowme-icon"><i class="pi pi-at"></i></span>
                    <span class="knowme-label">Usuario</span>
                    <span class="knowme-value">{{ userUsername() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-calendar"></i></span>
                    <span class="knowme-label">Se unió</span>
                    <span class="knowme-value">{{ userProfile()?.joinDate | date:'MMMM yyyy' }}</span>
                  </div>
                  <div class="knowme-item" *ngIf="userProfile()?.location">
                    <span class="knowme-icon"><i class="pi pi-map-marker"></i></span>
                    <span class="knowme-label">Ubicación</span>
                    <span class="knowme-value">{{ userProfile()?.location }}</span>
                  </div>
                  <div class="knowme-item" *ngIf="userPhone() !== '—'">
                    <span class="knowme-icon"><i class="pi pi-phone"></i></span>
                    <span class="knowme-label">Teléfono</span>
                    <span class="knowme-value">{{ userPhone() }}</span>
                  </div>
                  <div class="knowme-item" *ngIf="userEmail() !== '—'">
                    <span class="knowme-icon"><i class="pi pi-envelope"></i></span>
                    <span class="knowme-label">Email</span>
                    <span class="knowme-value">{{ userEmail() }}</span>
                  </div>
                  <div class="knowme-item" *ngIf="userProfile()?.website">
                    <span class="knowme-icon"><i class="pi pi-globe"></i></span>
                    <span class="knowme-label">Sitio web</span>
                    <span class="knowme-value">
                      <a [href]="'https://' + userProfile()?.website" target="_blank" class="knowme-link">
                        {{ userProfile()?.website }}
                      </a>
                    </span>
                  </div>
                </div>

                <!-- Información específica según tipo -->
                <div class="knowme-section" *ngIf="userProfile()?.type === 'vet'">
                  <h4 class="knowme-section-title">
                    <i class="pi pi-heart"></i>
                    Información Veterinaria
                  </h4>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-briefcase"></i></span>
                    <span class="knowme-label">Especialidad</span>
                    <span class="knowme-value">{{ vetSpecialty() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-id-card"></i></span>
                    <span class="knowme-label">Nº Colegiado</span>
                    <span class="knowme-value">{{ vetLicenseNumber() }}</span>
                  </div>
                  <div class="knowme-item" *ngIf="vetRating() > 0">
                    <span class="knowme-icon"><i class="pi pi-star-fill"></i></span>
                    <span class="knowme-label">Valoración</span>
                    <span class="knowme-value">{{ vetRating() }} ★ ({{ vetReviews() }} reseñas)</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-users"></i></span>
                    <span class="knowme-label">Pacientes</span>
                    <span class="knowme-value">{{ vetPatients() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-heart"></i></span>
                    <span class="knowme-label">Seguidores</span>
                    <span class="knowme-value">{{ vetFollowers() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-image"></i></span>
                    <span class="knowme-label">Publicaciones</span>
                    <span class="knowme-value">{{ vetPosts() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-heart-fill"></i></span>
                    <span class="knowme-label">Likes</span>
                    <span class="knowme-value">{{ vetLikes() }}</span>
                  </div>
                </div>

                <div class="knowme-section" *ngIf="userProfile()?.type === 'trainer'">
                  <h4 class="knowme-section-title">
                    <i class="pi pi-graduation-cap"></i>
                    Información de Entrenamiento
                  </h4>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-briefcase"></i></span>
                    <span class="knowme-label">Especialización</span>
                    <span class="knowme-value">{{ trainerSpecialty() }}</span>
                  </div>
                  <div class="knowme-item" *ngIf="trainerRating() > 0">
                    <span class="knowme-icon"><i class="pi pi-star-fill"></i></span>
                    <span class="knowme-label">Valoración</span>
                    <span class="knowme-value">{{ trainerRating() }} ★ ({{ trainerReviews() }} reseñas)</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-users"></i></span>
                    <span class="knowme-label">Clientes</span>
                    <span class="knowme-value">{{ trainerClients() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-heart"></i></span>
                    <span class="knowme-label">Seguidores</span>
                    <span class="knowme-value">{{ trainerFollowers() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-image"></i></span>
                    <span class="knowme-label">Publicaciones</span>
                    <span class="knowme-value">{{ trainerPosts() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-heart-fill"></i></span>
                    <span class="knowme-label">Likes</span>
                    <span class="knowme-value">{{ trainerLikes() }}</span>
                  </div>
                </div>

                <div class="knowme-section" *ngIf="userProfile()?.type === 'shelter'">
                  <h4 class="knowme-section-title">
                    <i class="pi pi-home"></i>
                    Información de la Protectora
                  </h4>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-heart"></i></span>
                    <span class="knowme-label">Registro</span>
                    <span class="knowme-value">{{ shelterCharityNumber() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-paw"></i></span>
                    <span class="knowme-label">Mascotas en adopción</span>
                    <span class="knowme-value">{{ shelterPets() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-check-circle"></i></span>
                    <span class="knowme-label">Adopciones realizadas</span>
                    <span class="knowme-value">{{ shelterAdoptions() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-star-fill"></i></span>
                    <span class="knowme-label">Reseñas</span>
                    <span class="knowme-value">{{ shelterReviews() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-heart"></i></span>
                    <span class="knowme-label">Seguidores</span>
                    <span class="knowme-value">{{ shelterFollowers() }}</span>
                  </div>
                </div>

                <div class="knowme-section" *ngIf="userProfile()?.type === 'seller'">
                  <h4 class="knowme-section-title">
                    <i class="pi pi-shopping-bag"></i>
                    Información de la Tienda
                  </h4>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-shop"></i></span>
                    <span class="knowme-label">Tienda</span>
                    <span class="knowme-value">{{ sellerStoreName() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-box"></i></span>
                    <span class="knowme-label">Productos</span>
                    <span class="knowme-value">{{ sellerProducts() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-shopping-cart"></i></span>
                    <span class="knowme-label">Ventas</span>
                    <span class="knowme-value">{{ sellerSales() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-star-fill"></i></span>
                    <span class="knowme-label">Reseñas</span>
                    <span class="knowme-value">{{ sellerReviews() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-heart"></i></span>
                    <span class="knowme-label">Seguidores</span>
                    <span class="knowme-value">{{ sellerFollowers() }}</span>
                  </div>
                </div>

                <div class="knowme-section" *ngIf="userProfile()?.type === 'pet'">
                  <h4 class="knowme-section-title">
                    <i class="pi pi-paw"></i>
                    Información de la Mascota
                  </h4>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-tag"></i></span>
                    <span class="knowme-label">Especie</span>
                    <span class="knowme-value">{{ petSpecies() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-user"></i></span>
                    <span class="knowme-label">Raza</span>
                    <span class="knowme-value">{{ petBreed() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-calendar"></i></span>
                    <span class="knowme-label">Edad</span>
                    <span class="knowme-value">{{ petAge() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-user"></i></span>
                    <span class="knowme-label">Dueño</span>
                    <span class="knowme-value">{{ petOwnerName() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-heart-fill"></i></span>
                    <span class="knowme-label">Likes</span>
                    <span class="knowme-value">{{ petLikes() }}</span>
                  </div>
                  <div class="knowme-item">
                    <span class="knowme-icon"><i class="pi pi-image"></i></span>
                    <span class="knowme-label">Publicaciones</span>
                    <span class="knowme-value">{{ petPostsCount() }}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Loading para Conóceme -->
          <div class="tab-panel" *ngIf="activeTab() === 'knowme' && loading()">
            <div class="knowme-card skeleton-card">
              <p-skeleton width="8rem" height="1.25rem" class="mb-3"></p-skeleton>
              <p-skeleton width="100%" height="0.875rem" class="mb-2"></p-skeleton>
              <p-skeleton width="100%" height="0.875rem" class="mb-2"></p-skeleton>
              <p-skeleton width="60%" height="0.875rem" class="mb-3"></p-skeleton>
              <p-skeleton width="100%" height="0.75rem" class="mb-1"></p-skeleton>
              <p-skeleton width="100%" height="0.75rem" class="mb-1"></p-skeleton>
              <p-skeleton width="80%" height="0.75rem" class="mb-1"></p-skeleton>
            </div>
          </div>
        </div>
      </div>

      <!-- Menu -->
      <p-menu #profileMenu [model]="profileMenuItems" [popup]="true" appendTo="body" />

      <!-- Modal de Publicación -->
      <p-dialog
        [visible]="postModalVisible()"
        [modal]="true"
        [style]="{ width: '90vw', maxWidth: '620px' }"
        [closable]="true"
        (onHide)="closePostModal()"
        [dismissableMask]="true"
        styleClass="profile-post-modal"
        [showHeader]="false"
      >
        <ng-container *ngIf="selectedPost()">
          <app-post-feed
            [posts]="selectedPostsArray()"
            [loading]="false"
            [currentUserId]="selectedPost()?.user?.userId || ''"
          >
          </app-post-feed>
        </ng-container>
      </p-dialog>
    </div>
  `,
  styles: [`
    /* ============================================
       BASE
    ============================================ */
    .profile-page {
      min-height: 100vh;
      background: var(--surface-ground);
      transition: background 0.3s ease;
    }

    .profile-page.dark {
      background: var(--surface-ground-dark);
    }

    .profile-container {
      max-width: 935px;
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
       PROFILE HEADER - INSTAGRAM STYLE
    ============================================ */
    .profile-header-instagram {
      background: var(--surface-card);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .profile-cover-instagram {
      position: relative;
      height: 200px;
      overflow: hidden;
      background: var(--surface-hover);
    }

    .cover-image-instagram {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-skeleton {
      display: block;
      width: 100%;
      height: 100%;
    }

    .cover-change-btn {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 10;
    }

    .cover-change-btn:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: scale(1.05);
    }

    .cover-change-btn i {
      font-size: 1rem;
    }

    /* Profile Info */
    .profile-info-instagram {
      display: flex;
      gap: 2rem;
      padding: 0 24px 24px;
      position: relative;
      z-index: 2;
      flex-wrap: wrap;
    }

    .profile-avatar-section-instagram {
      flex-shrink: 0;
      margin-top: -50px;

    }

    .avatar-ring {
      padding: 3px;
      border-radius: 50%;
      background: var(--primary-color);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    }

    .avatar-wrapper {
      position: relative;
      display: inline-block;
    }

    .profile-avatar-instagram {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--surface-card);
      display: block;
      background: var(--surface-card);
    }

    .avatar-skeleton-instagram {
      display: block;
    }

    .avatar-change-btn {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      border: 2px solid var(--surface-card);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 10;
    }

    .avatar-change-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .avatar-change-btn i {
      font-size: 0.875rem;
    }

    /* Profile Details */
    .profile-details-instagram {
      flex: 1;
      min-width: 200px;
      padding-top: 10px;
    }

    .profile-username {
      font-size: 1.5rem;
      font-weight: 300;
      color: var(--text-primary);
      margin: 0 0 8px 0;
    }

    .profile-stats-instagram {
      display: flex;
      gap: 2rem;
      margin-bottom: 12px;
    }

    .stat-item-instagram {
      text-align: center;
    }

    .stat-value-instagram {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 1rem;
    }

    .stat-label-instagram {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .profile-name-instagram {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 4px 0;
    }

    .profile-bio-instagram {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 4px 0 8px 0;
      line-height: 1.5;
    }

    .profile-type-badge {
      margin: 4px 0 8px;
    }

    .type-badge {
      display: inline-block;
      padding: 2px 12px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--surface-hover);
      color: var(--text-secondary);
    }

    .type-user { background: var(--primary-color); color: white; }
    .type-vet { background: #dc2626; color: white; }
    .type-shelter { background: #2563eb; color: white; }
    .type-seller { background: #7c3aed; color: white; }
    .type-trainer { background: #ea580c; color: white; }
    .type-pet { background: #16a34a; color: white; }

    .profile-contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      margin-top: 8px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .contact-item i {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .contact-item a {
      color: var(--text-secondary);
      text-decoration: none;
    }

    .contact-item a:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    /* Action Buttons */
    .profile-actions-instagram {
      display: flex;
      gap: 8px;
      padding-top: 10px;
      flex-shrink: 0;
      align-items: flex-start;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 20px;
      border: 1px solid var(--surface-border);
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      background: transparent;
      color: var(--text-primary);
    }

    .btn-action:hover {
      background: var(--surface-hover);
      border-color: var(--text-secondary);
    }

    .btn-edit {
      background: var(--surface-card);
    }

    .btn-edit:hover {
      background: var(--surface-hover);
    }

    .btn-following {
      background: var(--surface-card);
      border-color: var(--surface-border);
      color: var(--text-secondary);
    }

    .btn-following:hover {
      border-color: #ef4444;
      color: #ef4444;
    }

    .btn-message {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: #fff;
    }

    .btn-message:hover {
      background: var(--primary-color-dark);
      border-color: var(--primary-color-dark);
      color: #fff;
    }

    .btn-following:hover i {
      color: #ef4444;
    }

    .btn-more {
      padding: 8px 12px;
    }

    .btn-more i {
      font-size: 1.125rem;
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
    .tab-panel {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 24px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ============================================
       POSTS GRID - INSTAGRAM STYLE
    ============================================ */
    .posts-grid-instagram {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }

    .post-card-instagram {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      cursor: pointer;
      border-radius: 4px;
      background: var(--surface-hover);
    }

    .post-image-instagram {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .post-card-instagram:hover .post-image-instagram {
      transform: scale(1.03);
    }

    .post-overlay-instagram {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .post-card-instagram:hover .post-overlay-instagram {
      opacity: 1;
    }

    .post-overlay-instagram span {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .post-overlay-instagram i {
      font-size: 1rem;
    }

    .post-card-instagram.empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      aspect-ratio: 1;
      cursor: default;
      background: var(--surface-hover);
      grid-column: 1 / -1;
      padding: 40px;
      border-radius: 8px;
    }

    .post-card-instagram.empty i {
      font-size: 3rem;
      opacity: 0.4;
      margin-bottom: 12px;
    }

    .post-card-instagram.empty p {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }

    .post-card-instagram.empty .empty-subtitle {
      font-size: 0.875rem;
      opacity: 0.6;
    }

    .skeleton-post {
      background: var(--surface-hover);
    }

    /* ============================================
       KNOWME - VIEW MODE (OTROS PERFILES)
    ============================================ */
    .knowme-card {
      padding: 0;
    }

    .knowme-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--surface-border);
    }

    .knowme-title i {
      color: var(--primary-color);
    }

    .knowme-bio {
      background: var(--surface-ground);
      padding: 16px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
    }

    .dark .knowme-bio {
      background: var(--surface-ground-dark);
    }

    .knowme-bio p {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--text-primary);
      line-height: 1.6;
    }

    .knowme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .knowme-section {
      background: var(--surface-ground);
      border-radius: 10px;
      padding: 16px 20px;
    }

    .dark .knowme-section {
      background: var(--surface-ground-dark);
    }

    .knowme-section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--surface-border);
    }

    .knowme-section-title i {
      color: var(--primary-color);
    }

    .knowme-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .knowme-item:last-child {
      border-bottom: none;
    }

    .knowme-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .knowme-label {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      min-width: 80px;
      flex-shrink: 0;
    }

    .knowme-value {
      font-size: 0.875rem;
      color: var(--text-primary);
      font-weight: 500;
      word-break: break-word;
    }

    .knowme-link {
      color: var(--primary-color);
      text-decoration: none;
    }

    .knowme-link:hover {
      text-decoration: underline;
    }

    /* Stats Mini Grid */
    .stats-mini-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 12px;
      margin-top: 8px;
    }

    .stats-mini-item {
      text-align: center;
      padding: 8px;
      background: var(--surface-card);
      border-radius: 8px;
      border: 1px solid var(--surface-border);
    }

    .stats-mini-number {
      display: block;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stats-mini-label {
      font-size: 0.6875rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* ============================================
       LOCATION PICKER SECTION
    ============================================ */
    .location-picker-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--surface-border);
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-title i {
      color: var(--primary-color);
    }

    .section-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0 0 1.5rem 0;
    }

    /* Skeleton Card */
    .skeleton-card {
      pointer-events: none;
    }

    .skeleton-card p-skeleton {
      display: block;
      margin-bottom: 8px;
    }

    /* ============================================
       DARK MODE OVERRIDES
    ============================================ */
    .dark .profile-header-instagram,
    .dark .tab-panel {
      border-color: var(--surface-border-dark);
      background: var(--surface-card-dark);
    }

    .dark .knowme-section {
      background: var(--surface-ground-dark);
    }

    .dark .profile-avatar-instagram {
      border-color: var(--surface-card-dark);
    }

    .dark .avatar-change-btn {
      border-color: var(--surface-card-dark);
    }

    /* ============================================
       RESPONSIVE
    ============================================ */
    @media (max-width: 768px) {
      .profile-container {
        padding: 0 12px 24px;
      }

      .profile-info-instagram {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 0 16px 16px;
        margin-top: -40px;
      }

      .profile-avatar-instagram {
        width: 100px;
        height: 100px;
      }

      .profile-details-instagram {
        padding-top: 4px;
        text-align: center;
      }

      .profile-stats-instagram {
        justify-content: center;
        gap: 1rem;
      }

      .profile-contact-info {
        justify-content: center;
      }

      .profile-actions-instagram {
        justify-content: center;
        width: 100%;
        padding-top: 4px;
      }

      .profile-cover-instagram {
        height: 140px;
      }

      .posts-grid-instagram {
        grid-template-columns: repeat(3, 1fr);
        gap: 2px;
      }

      .knowme-grid {
        grid-template-columns: 1fr;
      }

      .tab-panel {
        padding: 16px;
      }

      .stats-mini-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .profile-cover-instagram {
        height: 100px;
      }

      .profile-avatar-instagram {
        width: 80px;
        height: 80px;
      }

      .avatar-change-btn {
        width: 28px;
        height: 28px;
      }

      .avatar-change-btn i {
        font-size: 0.75rem;
      }

      .cover-change-btn {
        width: 32px;
        height: 32px;
      }

      .cover-change-btn i {
        font-size: 0.75rem;
      }

      .profile-username {
        font-size: 1.125rem;
      }

      .profile-name-instagram {
        font-size: 1rem;
      }

      .profile-stats-instagram {
        gap: 0.75rem;
      }

      .stat-value-instagram {
        font-size: 0.875rem;
      }

      .stat-label-instagram {
        font-size: 0.625rem;
      }

      .posts-grid-instagram {
        grid-template-columns: repeat(3, 1fr);
        gap: 2px;
      }

      .btn-action {
        padding: 6px 14px;
        font-size: 0.75rem;
      }

      .knowme-item {
        flex-wrap: wrap;
        gap: 4px;
      }

      .knowme-label {
        min-width: 60px;
        font-size: 0.75rem;
      }

      .knowme-value {
        font-size: 0.8125rem;
      }
    }

    /* ============================================
       UTILITY
    ============================================ */
    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mt-2 { margin-top: 8px; }

    /* Modal de publicación */
    :host ::ng-deep .profile-post-modal .p-dialog-content {
      padding: 0;
    }
    :host ::ng-deep .profile-post-modal .p-dialog {
      max-height: 95vh;
    }
  `]
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly socialService = inject(SocialService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private paramSubscription?: Subscription;

  // Loading state
  loading = signal(true);

  activeTab = signal('posts');
  profileId = signal<string | null>(null);
  profileType = signal<ProfileType>('user');

  // Dark mode detection
  isDarkMode = signal(false);

  // ============================================
  //  LOCATION SIGNALS
  // ============================================

  userLatitude = signal<number | null>(null);
  userLongitude = signal<number | null>(null);
  locationConfirmed = signal(false);

  // Perfil del usuario logueado
  ownProfile: AnyProfile = {
    id: '',
    type: 'user',
    name: '',
    username: '',
    avatar: '',
    coverImage: '',
    bio: '',
    location: '',
    website: '',
    joinDate: new Date(),
    isFollowing: false,
    stats: {
      pets: 0,
      followers: 0,
      following: 0,
      posts: 0,
    },
  };

  // Perfiles cargados desde backend
  loadedProfiles = signal<Record<string, AnyProfile>>({});

  // Mascotas cargadas desde backend
  userPets = signal<Pet[]>([]);

  petSearchQuery = signal('');

  // Mascotas formateadas para TableCardComponent
  petTableItems = computed((): TableCardItem[] => {
    return this.userPets().map(pet => ({
      id: pet.id,
      name: pet.name,
      avatar: pet.avatar,
      description: pet.breed,
    }));
  });

  // Mascotas filtradas por búsqueda
  filteredPetItems = computed(() => {
    const query = this.petSearchQuery().toLowerCase();
    if (!query) return this.petTableItems();
    return this.petTableItems().filter(pet =>
      pet.name.toLowerCase().includes(query) ||
      pet.description?.toLowerCase().includes(query)
    );
  });

  // Publicaciones del usuario
  userPosts = signal<{
    id: string;
    image: string;
    caption: string;
    likes: number;
    comments: number;
    liked: boolean;
    saved: boolean;
    timestamp: Date;
  }[]>([]);

  // Post seleccionado para el modal
  postModalVisible = signal(false);
  selectedPost = signal<PostItem | null>(null);

  // Publicaciones construidas como PostItem para el feed
  userPostItems = computed((): PostItem[] => {
    const isOwn = !this.profileId();
    const profileId = isOwn
      ? (this.authService.user()?.id || '')
      : (this.profileId() || '');

    const authorProfile = isOwn
      ? this.ownProfile
      : this.loadedProfiles()[this.profileId() || ''];

    const authorName = authorProfile?.name || 'Usuario';
    const authorAvatar = isOwn
      ? (this.authService.user()?.avatarUrl || authorProfile?.avatar || 'https://i.pravatar.cc/150?img=1')
      : (authorProfile?.avatar || 'https://i.pravatar.cc/150?img=1');
    const authorUsername = isOwn
      ? (this.authService.user()?.firstName && this.authService.user()?.lastName
          ? '@' + (this.authService.user()!.firstName + '.' + this.authService.user()!.lastName).toLowerCase()
          : '@usuario')
      : (authorProfile?.type === 'user'
          ? '@' + ((authorProfile as UserProfile).username || 'usuario')
          : '@usuario');

    return this.userPosts().map(post => ({
      id: post.id,
      user: {
        name: authorName,
        avatar: authorAvatar,
        username: authorUsername,
        userId: profileId,
      },
      image: post.image,
      caption: post.caption,
      likes: post.likes,
      comments: post.comments,
      liked: post.liked,
      saved: post.saved,
      timestamp: post.timestamp,
      likeAvatars: [],
    }));
  });

  // Contadores de seguidores y seguidos
  followersCount = signal(0);
  followingCount = signal(0);

  // Menu items for profile actions
  profileMenuItems: MenuItem[] = [];

  ngOnInit(): void {
    this.detectDarkMode();

    this.paramSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const type = params.get('type') as ProfileType | null;

      const urlSegments = this.router.url.split('/');
      const isPetRoute = urlSegments.includes('pet');

      this.profileId.set(id);
      this.profileType.set(isPetRoute ? 'pet' : (type || 'user'));

      this.route.queryParams.subscribe(queryParams => {
        const tab = queryParams['tab'];
        if (tab && this.isOwnProfile()) {
          this.activeTab.set(tab);
        }
      });

      const user = this.authService.user();
      if (user) {
        const userType = (user.profileType?.toLowerCase() as ProfileType) || 'user';
        const baseProfile: BaseProfile = {
          id: user.id,
          name: user.firstName + ' ' + user.lastName,
          avatar: user.avatarUrl || '',
          coverImage: user.coverImageUrl || '',
          bio: user.bio || '',
          location: user.location || '',
          website: '',
          joinDate: user.createdAt || new Date(),
          isFollowing: false,
          type: userType,
        };

        switch (userType) {
          case 'shelter':
            this.ownProfile = {
              ...baseProfile,
              type: 'shelter',
              stats: { pets: 0, followers: 0, adoptions: 0, reviews: 0 },
            } as ShelterProfile;
            break;
          case 'vet':
            this.ownProfile = {
              ...baseProfile,
              type: 'vet',
              specialty: 'Veterinaria General',
              rating: 4.5,
              reviews: 0,
              stats: { patients: 0, followers: 0, posts: 0, likes: 0 },
            } as VetProfile;
            break;
          case 'seller':
            this.ownProfile = {
              ...baseProfile,
              type: 'seller',
              stats: { products: 0, followers: 0, sales: 0, reviews: 0 },
            } as SellerProfile;
            break;
          default:
            this.ownProfile = {
              ...baseProfile,
              type: 'user',
              username: user.firstName.toLowerCase() + '.' + user.lastName.toLowerCase(),
              stats: { pets: 0, followers: 0, following: 0, posts: 0 },
            } as UserProfile;
        }
      }

      this.loadProfileData();
      this.initializeProfileMenu();
    });
  }

  private detectDarkMode(): void {
    const darkMode = document.documentElement.classList.contains('dark');
    this.isDarkMode.set(darkMode);

    const observer = new MutationObserver(() => {
      this.isDarkMode.set(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  private loadProfileData(): void {
    this.loading.set(true);

    const user = this.authService.user();

    if (this.isOwnProfile()) {
      if (user?.id) {
        this.loadOwnProfile(user.id);
        this.loadFollowersCount(user.id);
        this.loadFollowingCount(user.id);
      }
    } else {
      const id = this.profileId();
      if (id) {
        this.loadProfileById(id);
        this.loadFollowersCount(id);
        this.loadFollowingCount(id);
      }
    }

    if (this.isOwnProfile() && user) {
      this.loadPetsForProfile(user.id);
    } else if (!this.isOwnProfile() && this.profileId()) {
      this.loadPetsForProfile(this.profileId()!);
    }

    this.loadUserPosts();

    setTimeout(() => {
      this.loading.set(false);
      this.cdr.detectChanges();
    }, 1000);
  }

  private loadUserPosts(): void {
    const authorId = this.isOwnProfile()
      ? this.authService.user()?.id
      : this.profileId();

    if (!authorId) {
      this.userPosts.set([]);
      return;
    }

    this.socialService.getPostsByAuthor(authorId).subscribe({
      next: (posts) => {
        this.userPosts.set(
          (posts || []).map(post => ({
            id: post.id,
            image: post.imageUrl,
            caption: post.caption || '',
            likes: post.likesCount || 0,
            comments: post.commentsCount || 0,
            liked: false,
            saved: false,
            timestamp: post.createdAt ? new Date(post.createdAt) : new Date(),
          }))
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading user posts:', err);
        this.userPosts.set([]);
        this.cdr.detectChanges();
      },
    });
  }

  openPost(post: PostItem): void {
    this.selectedPost.set(post);
    this.postModalVisible.set(true);
    this.cdr.detectChanges();
  }

  closePostModal(): void {
    this.postModalVisible.set(false);
    this.selectedPost.set(null);
    this.cdr.detectChanges();
  }

  selectedPostsArray(): PostItem[] {
    const post = this.selectedPost();
    return post ? [post] : [];
  }

  private loadOwnProfile(authUserId: string): void {
    this.profileService.getProfileByAuthUserId(authUserId).subscribe({
      next: (profile) => {
        const normalizedProfileType = profile.profileType?.toLowerCase() as ProfileType || 'user';
        const baseProfile: BaseProfile = {
          id: profile.id,
          name: profile.firstName + ' ' + profile.lastName,
          avatar: profile.avatarUrl || '',
          coverImage: profile.coverImageUrl || '',
          bio: profile.bio || '',
          location: profile.location || '',
          website: '',
          joinDate: new Date(),
          isFollowing: false,
          type: normalizedProfileType,
        };

        let loadedProfile: AnyProfile;
        switch (normalizedProfileType) {
          case 'shelter':
            loadedProfile = {
              ...baseProfile,
              type: 'shelter',
              stats: { pets: 0, followers: 0, adoptions: 0, reviews: 0 },
            } as ShelterProfile;
            break;
          case 'vet':
            loadedProfile = {
              ...baseProfile,
              type: 'vet',
              specialty: 'Veterinaria General',
              rating: 4.5,
              reviews: 0,
              stats: { patients: 0, followers: 0, posts: 0, likes: 0 },
            } as VetProfile;
            break;
          case 'seller':
            loadedProfile = {
              ...baseProfile,
              type: 'seller',
              stats: { products: 0, followers: 0, sales: 0, reviews: 0 },
            } as SellerProfile;
            break;
          default:
            loadedProfile = {
              ...baseProfile,
              type: 'user',
              username: profile.firstName.toLowerCase() + '.' + profile.lastName.toLowerCase(),
              stats: { pets: 0, followers: 0, following: 0, posts: 0 },
            } as UserProfile;
        }

        this.ownProfile = loadedProfile;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading own profile:', err);
        this.cdr.detectChanges();
      },
    });
  }

  private loadProfileById(authUserId: string): void {
    this.profileService.getProfileByAuthUserId(authUserId).subscribe({
      next: (profile) => {
        const normalizedProfileType = profile.profileType?.toLowerCase() as ProfileType || 'user';
        const baseProfile: BaseProfile = {
          id: profile.id,
          name: profile.firstName + ' ' + profile.lastName,
          avatar: profile.avatarUrl || '',
          coverImage: profile.coverImageUrl || '',
          bio: profile.bio || '',
          location: profile.location || '',
          website: '',
          joinDate: new Date(),
          isFollowing: false,
          type: normalizedProfileType,
        };

        let loadedProfile: AnyProfile;
        switch (normalizedProfileType) {
          case 'shelter':
            loadedProfile = {
              ...baseProfile,
              type: 'shelter',
              stats: { pets: 0, followers: 0, adoptions: 0, reviews: 0 },
            } as ShelterProfile;
            break;
          case 'vet':
            loadedProfile = {
              ...baseProfile,
              type: 'vet',
              specialty: 'Veterinaria General',
              rating: 4.5,
              reviews: 0,
              stats: { patients: 0, followers: 0, posts: 0, likes: 0 },
            } as VetProfile;
            break;
          case 'seller':
            loadedProfile = {
              ...baseProfile,
              type: 'seller',
              stats: { products: 0, followers: 0, sales: 0, reviews: 0 },
            } as SellerProfile;
            break;
          default:
            loadedProfile = {
              ...baseProfile,
              type: 'user',
              username: (profile.firstName + profile.lastName).toLowerCase(),
              stats: { pets: 0, followers: 0, following: 0, posts: 0 },
            } as UserProfile;
        }

        this.loadedProfiles.set({ [authUserId]: loadedProfile });
        this.cdr.detectChanges();
        this.loadFollowStatus(authUserId);
      },
      error: (err) => {
        console.error('Error loading profile by authUserId:', err);
        this.profileService.getProfileById(authUserId).subscribe({
          next: (profile) => {
            const normalizedProfileType = profile.profileType?.toLowerCase() as ProfileType || 'user';
            const baseProfile: BaseProfile = {
              id: profile.id,
              name: profile.firstName + ' ' + profile.lastName,
              avatar: profile.avatarUrl || '',
              coverImage: profile.coverImageUrl || '',
              bio: profile.bio || '',
          location: profile.location || '',
              website: '',
              joinDate: new Date(),
              isFollowing: false,
              type: normalizedProfileType,
            };

            let loadedProfile: AnyProfile;
            switch (normalizedProfileType) {
              case 'shelter':
                loadedProfile = {
                  ...baseProfile,
                  type: 'shelter',
                  stats: { pets: 0, followers: 0, adoptions: 0, reviews: 0 },
                } as ShelterProfile;
                break;
              case 'vet':
                loadedProfile = {
                  ...baseProfile,
                  type: 'vet',
                  specialty: 'Veterinaria General',
                  rating: 4.5,
                  reviews: 0,
                  stats: { patients: 0, followers: 0, posts: 0, likes: 0 },
                } as VetProfile;
                break;
              case 'seller':
                loadedProfile = {
                  ...baseProfile,
                  type: 'seller',
                  stats: { products: 0, followers: 0, sales: 0, reviews: 0 },
                } as SellerProfile;
                break;
              default:
                loadedProfile = {
                  ...baseProfile,
                  type: 'user',
                  username: (profile.firstName + profile.lastName).toLowerCase(),
                  stats: { pets: 0, followers: 0, following: 0, posts: 0 },
                } as UserProfile;
            }

            this.loadedProfiles.set({ [authUserId]: loadedProfile });
            this.cdr.detectChanges();
          },
          error: (fallbackErr) => {
            console.error('Error loading profile by id (fallback):', fallbackErr);
            this.cdr.detectChanges();
          }
        });
      },
    });
  }

  private loadPetsForProfile(profileId: string): void {
    this.profileService.getPetsByOwner(profileId).subscribe({
      next: (pets) => {
        this.userPets.set(pets.map(p => ({
          id: p.id,
          name: p.name,
          breed: p.breed || '',
          avatar: p.avatarUrl || '',
          adoptionStatus: p.availableForAdoption ? 'available' : 'not-available',
        })));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading pets:', err);
        this.cdr.detectChanges();
      }
    });
  }

  private loadFollowersCount(userId: string): void {
    this.socialService.getFollowers(userId).subscribe({
      next: (followers) => {
        this.followersCount.set(followers.length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading followers count:', err);
        this.cdr.detectChanges();
      }
    });
  }

  private loadFollowingCount(userId: string): void {
    this.socialService.getFollowing(userId).subscribe({
      next: (following) => {
        this.followingCount.set(following.length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading following count:', err);
        this.cdr.detectChanges();
      }
    });
  }

  private loadFollowStatus(authUserId: string): void {
    const currentUserId = this.authService.user()?.id;
    if (!currentUserId) return;

    this.socialService.getFollowing(currentUserId).subscribe({
      next: (following) => {
        const isFollowing = following.some(f => f.followingId === authUserId);
        const currentProfiles = this.loadedProfiles();
        const profile = currentProfiles[authUserId];
        if (profile) {
          profile.isFollowing = isFollowing;
          this.loadedProfiles.set({ ...currentProfiles });
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  // ============================================
  //  COMPUTED PROPERTIES
  // ============================================

  isOwnProfile = computed(() => !this.profileId());

  userProfile = computed(() => {
    const id = this.profileId();
    if (!id) return this.ownProfile;
    return this.loadedProfiles()[id] || this.ownProfile;
  });

  userAvatar = computed(() => {
    const profile = this.userProfile();
    if (this.isOwnProfile()) {
      return this.authService.user()?.avatarUrl || 'https://i.pravatar.cc/150?img=1';
    }
    return profile?.avatar || 'https://i.pravatar.cc/150?img=1';
  });

  userCoverAvatar = computed(() => {
    const profile = this.userProfile();
    if (this.isOwnProfile()) {
      return this.authService.user()?.coverImageUrl || 'https://picsum.photos/800/300?random=1';
    }
    return profile?.coverImage || 'https://picsum.photos/800/300?random=1';
  });

  isUser = computed(() => this.userProfile()?.type === 'user');
  isShelter = computed(() => this.userProfile()?.type === 'shelter');
  isSeller = computed(() => this.userProfile()?.type === 'seller');
  isVet = computed(() => this.userProfile()?.type === 'vet');
  isPet = computed(() => this.userProfile()?.type === 'pet');
  isTrainer = computed(() => this.userProfile()?.type === 'trainer');

  userUsername = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'user' ? '@' + (profile as UserProfile).username : '';
  });

  userPhone = computed(() => {
    const profile = this.userProfile();
    if (this.isOwnProfile()) {
      return this.authService.user()?.phone || '—';
    }
    return profile?.phone || '—';
  });

  userEmail = computed(() => {
    return this.authService.user()?.email || '—';
  });

  // ============================================
  //  VET COMPUTED PROPERTIES
  // ============================================

  vetSpecialty = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? (profile as VetProfile).specialty : 'No especificada';
  });

  vetLicenseNumber = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? (profile as any).licenseNumber || '—' : '—';
  });

  vetRating = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? (profile as VetProfile).rating : 0;
  });

  vetReviews = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? (profile as VetProfile).reviews : 0;
  });

  vetPatients = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? (profile as VetProfile).stats.patients : 0;
  });

  vetFollowers = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? (profile as VetProfile).stats.followers : 0;
  });

  vetPosts = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? (profile as VetProfile).stats.posts : 0;
  });

  vetLikes = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? (profile as VetProfile).stats.likes : 0;
  });

  // ============================================
  //  TRAINER COMPUTED PROPERTIES
  // ============================================

  trainerSpecialty = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'trainer' ? (profile as TrainerProfile).specialty : 'No especificada';
  });

  trainerRating = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'trainer' ? (profile as TrainerProfile).rating : 0;
  });

  trainerReviews = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'trainer' ? (profile as TrainerProfile).reviews : 0;
  });

  trainerClients = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'trainer' ? (profile as TrainerProfile).stats.clients : 0;
  });

  trainerFollowers = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'trainer' ? (profile as TrainerProfile).stats.followers : 0;
  });

  trainerPosts = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'trainer' ? (profile as TrainerProfile).stats.posts : 0;
  });

  trainerLikes = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'trainer' ? (profile as TrainerProfile).stats.likes : 0;
  });

  // ============================================
  //  SHELTER COMPUTED PROPERTIES
  // ============================================

  shelterCharityNumber = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'shelter' ? (profile as any).charityNumber || '—' : '—';
  });

  shelterPets = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'shelter' ? (profile as ShelterProfile).stats.pets : 0;
  });

  shelterAdoptions = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'shelter' ? (profile as ShelterProfile).stats.adoptions : 0;
  });

  shelterReviews = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'shelter' ? (profile as ShelterProfile).stats.reviews : 0;
  });

  shelterFollowers = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'shelter' ? (profile as ShelterProfile).stats.followers : 0;
  });

  // ============================================
  //  SELLER COMPUTED PROPERTIES
  // ============================================

  sellerStoreName = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'seller' ? (profile as any).storeName || '—' : '—';
  });

  sellerProducts = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'seller' ? (profile as SellerProfile).stats.products : 0;
  });

  sellerSales = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'seller' ? (profile as SellerProfile).stats.sales : 0;
  });

  sellerReviews = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'seller' ? (profile as SellerProfile).stats.reviews : 0;
  });

  sellerFollowers = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'seller' ? (profile as SellerProfile).stats.followers : 0;
  });

  // ============================================
  //  PET COMPUTED PROPERTIES
  // ============================================

  petSpecies = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'pet' ? (profile as PetProfile).species : '';
  });

  petBreed = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'pet' ? (profile as PetProfile).breed : '';
  });

  petAge = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'pet' ? (profile as PetProfile).age : '—';
  });

  petOwnerName = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'pet' ? (profile as PetProfile).owner.name : '—';
  });

  petLikes = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'pet' ? (profile as PetProfile).stats.likes : 0;
  });

  petPostsCount = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'pet' ? (profile as PetProfile).stats.posts : 0;
  });

  // ============================================
  //  USER COMPUTED PROPERTIES
  // ============================================

  userPetsCount = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'user' ? (profile as UserProfile).stats.pets : 0;
  });

  userPostsCount = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'user' ? (profile as UserProfile).stats.posts : 0;
  });

  // ============================================
  //  PROFILE STATS
  // ============================================

  profileStats = computed(() => {
    const profile = this.userProfile();
    if (!profile) return [];

    switch (profile.type) {
      case 'user':
        return [
          { value: (profile as UserProfile).stats.pets, label: 'Família' },
          { value: this.followersCount(), label: 'Seguidores' },
          { value: this.followingCount(), label: 'Siguiendo' },
          { value: (profile as UserProfile).stats.posts, label: 'Publicaciones' },
        ];
      case 'shelter':
        return [
          { value: (profile as ShelterProfile).stats.pets, label: 'Família' },
          { value: this.followersCount(), label: 'Seguidores' },
          { value: (profile as ShelterProfile).stats.adoptions, label: 'Adopciones' },
          { value: (profile as ShelterProfile).stats.reviews, label: 'Reseñas' },
        ];
      case 'vet':
        return [
          { value: (profile as VetProfile).stats.patients, label: 'Pacientes' },
          { value: this.followersCount(), label: 'Seguidores' },
          { value: (profile as VetProfile).stats.posts, label: 'Publicaciones' },
          { value: (profile as VetProfile).stats.likes, label: 'Likes' },
        ];
      case 'seller':
        return [
          { value: (profile as SellerProfile).stats.products, label: 'Productos' },
          { value: this.followersCount(), label: 'Seguidores' },
          { value: (profile as SellerProfile).stats.sales, label: 'Ventas' },
          { value: (profile as SellerProfile).stats.reviews, label: 'Reseñas' },
        ];
      case 'pet':
        return [
          { value: (profile as PetProfile).stats.likes, label: 'Likes' },
          { value: (profile as PetProfile).stats.posts, label: 'Publicaciones' },
        ];
      default:
        return [];
    }
  });

  // ============================================
  //  FORM CONFIGURATION
  // ============================================

  profileFormConfig = computed(() => {
    const profileType = this.userProfile()?.type || 'user';

    const baseFields = [
      {
        key: 'firstName',
        label: 'Nombre',
        type: 'input' as const,
        placeholder: 'Nombre',
        validation: { required: true, maxLength: 50 }
      },
      {
        key: 'lastName',
        label: 'Apellidos',
        type: 'input' as const,
        placeholder: 'Apellidos',
        validation: { required: true, maxLength: 50 }
      },
      {
        key: 'phone',
        label: 'Teléfono',
        type: 'input' as const,
        placeholder: '+34 600 000 000',
        validation: { maxLength: 20 }
      },
      {
        key: 'bio',
        label: 'Biografía',
        type: 'textarea' as const,
        placeholder: 'Cuéntanos sobre ti...',
        rows: 4,
        validation: { maxLength: 500 }
      },
      {
        key: 'location',
        label: 'Ubicación',
        type: 'location' as const,
        placeholder: 'Busca tu dirección'
      },
      {
        key: 'website',
        label: 'Sitio web',
        type: 'input' as const,
        placeholder: 'https://mi-sitio.com',
        validation: { maxLength: 255 }
      },
    ];

    const typeSpecificFields: any[] = [];

    if (profileType === 'vet' || profileType === 'trainer') {
      typeSpecificFields.push({
        key: 'specialty',
        label: profileType === 'vet' ? 'Especialidad' : 'Especialización',
        type: 'input' as const,
        placeholder: profileType === 'vet' ? 'Veterinaria General' : 'Adiestramiento canino',
        validation: { maxLength: 100 }
      });
    }

    if (profileType === 'vet') {
      typeSpecificFields.push({
        key: 'licenseNumber',
        label: 'Número de colegiado',
        type: 'input' as const,
        placeholder: 'Nº colegiado',
        validation: { maxLength: 50 }
      });
    }

    if (profileType === 'shelter') {
      typeSpecificFields.push({
        key: 'charityNumber',
        label: 'Número de registro',
        type: 'input' as const,
        placeholder: 'Nº registro protectora',
        validation: { maxLength: 100 }
      });
    }

    if (profileType === 'seller') {
      typeSpecificFields.push({
        key: 'storeName',
        label: 'Nombre de tienda',
        type: 'input' as const,
        placeholder: 'Nombre de tu tienda',
        validation: { maxLength: 100 }
      });
    }

    return {
      title: 'Editar información personal',
      submitLabel: 'Guardar cambios',
      fields: [...baseFields, ...typeSpecificFields]
    } as DynamicFormConfig;
  });

  profileFormData = computed(() => {
    const user = this.authService.user();
    const profile = this.userProfile();
    const profileType = profile?.type || 'user';

    const baseData: any = {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      website: (profile as any)?.website || ''
    };

    if (profileType === 'vet' || profileType === 'trainer') {
      baseData.specialty = (profile as any).specialty || '';
    }
    if (profileType === 'vet') {
      baseData.licenseNumber = (profile as any).licenseNumber || '';
    }
    if (profileType === 'shelter') {
      baseData.charityNumber = (profile as any).charityNumber || '';
    }
    if (profileType === 'seller') {
      baseData.storeName = (profile as any).storeName || '';
    }

    return baseData;
  });

  // ============================================
  //  PROFILE TABS
  // ============================================

  profileTabs = computed((): Tab[] => {
    const tabs: Tab[] = [
      { id: 'posts', label: 'Publicaciones', icon: 'photo_library' }
    ];

    if (this.isUser() || this.isShelter()) {
      tabs.push({ id: 'pets', label: 'Mascotas', icon: 'pets' });
    }

    tabs.push({ id: 'knowme', label: 'Conóceme', icon: 'person' });

    return tabs;
  });

  // ============================================
  //  LOCATION HANDLERS
  // ============================================

  onLocationConfirmed(location: GeocodingResult): void {
    this.userLatitude.set(location.lat);
    this.userLongitude.set(location.lon);
    this.locationConfirmed.set(true);

    this.messageService.add({
      severity: 'success',
      summary: 'Ubicación confirmada',
      detail: 'Tu ubicación ha sido guardada. Recuerda guardar los cambios del perfil.'
    });
  }

  onLocationCancelled(): void {
    this.locationConfirmed.set(false);
  }

  // ============================================
  //  ACTIONS
  // ============================================

  onTabChange(tabId: string) {
    this.activeTab.set(tabId);
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  initializeProfileMenu(): void {
    this.profileMenuItems = [
      {
        label: 'Editar Perfil',
        icon: 'pi pi-pencil',
        command: () => this.setActiveTab('knowme')
      },
      {
        label: 'Administrar',
        icon: 'pi pi-cog',
        command: () => this.router.navigate(['/admin'])
      }
    ];
  }

  onPetSearch(query: string) {
    this.petSearchQuery.set(query);
  }

  showAddPetDialog() {
    this.router.navigate(['/pets/create']);
  }

  toggleFollow(): void {
    const currentUserId = this.authService.user()?.id;
    const targetUserId = this.profileId();
    if (!currentUserId || !targetUserId) return;

    const currentProfiles = this.loadedProfiles();
    const profile = currentProfiles[targetUserId];
    if (!profile) return;

    const wasFollowing = profile.isFollowing;
    profile.isFollowing = !profile.isFollowing;
    this.loadedProfiles.set({ ...currentProfiles });

    if (profile.isFollowing) {
      this.socialService.followUser(currentUserId, targetUserId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Siguiendo',
            detail: `Ahora sigues a ${profile.name}`
          });
        },
        error: () => {
          profile.isFollowing = wasFollowing;
          this.loadedProfiles.set({ ...currentProfiles });
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo seguir al usuario'
          });
        }
      });
    } else {
      this.socialService.unfollowUser(currentUserId, targetUserId).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'info',
            summary: 'Dejaste de seguir',
            detail: `Ya no sigues a ${profile.name}`
          });
        },
        error: () => {
          profile.isFollowing = wasFollowing;
          this.loadedProfiles.set({ ...currentProfiles });
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo dejar de seguir al usuario'
          });
        }
      });
    }
  }

  /**
   * Abre el chat (o lo crea) con el usuario cuyo perfil se está viendo.
   */
  openChat(): void {
    const targetUserId = this.profileId();
    if (!targetUserId) return;

    this.router.navigate(['/messages'], {
      queryParams: {
        userId: targetUserId,
        name: this.userProfile()?.name || ''
      }
    });
  }

  toggleAdoptionStatus(petId: string, adoptionStatus: string | undefined): void {
    const newStatus = adoptionStatus !== 'available';

    this.profileService.toggleAdoptionStatus(petId, newStatus).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: newStatus ? 'En adopción' : 'Adopción cancelada',
          detail: newStatus ? 'La mascota ya está disponible para adopción' : 'La mascota ya no está en adopción'
        });
        this.loadPetsForProfile(this.isOwnProfile() ? this.authService.user()?.id || '' : this.profileId() || '');
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

  // ============================================
  //  PROFILE UPDATE
  // ============================================

  async onProfileSubmit(data: any): Promise<void> {
    console.log('Profile form submitted:', data);

    this.loading.set(true);

    const formData = new FormData();
    const profileType = this.userProfile()?.type || 'user';
    const payload: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      bio: data.bio,
      location: this.locationConfirmed() ? (this.userProfile()?.location || data.location) : data.location,
      latitude: this.userLatitude(),
      longitude: this.userLongitude(),
      website: data.website
    };

    if (profileType === 'vet' || profileType === 'trainer') {
      payload.specialty = data.specialty || '';
    }
    if (profileType === 'vet') {
      payload.licenseNumber = data.licenseNumber || '';
    }
    if (profileType === 'shelter') {
      payload.charityNumber = data.charityNumber || '';
    }
    if (profileType === 'seller') {
      payload.storeName = data.storeName || '';
    }

    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    const files = data.files || {};
    if (files.avatar && files.avatar.length > 0) {
      const avatarFile = files.avatar[0];
      if (avatarFile.originalFile) {
        formData.append('avatar', avatarFile.originalFile);
      }
    }

    if (files.coverImage && files.coverImage.length > 0) {
      const coverImageFile = files.coverImage[0];
      if (coverImageFile.originalFile) {
        formData.append('coverImage', coverImageFile.originalFile);
      }
    }

    this.profileService.updateProfile(formData).subscribe({
      next: (response: any) => {
        console.log('Profile updated successfully:', response);
        this.updateOwnProfileFromResponse(response);
        this.messageService.add({
          severity: 'success',
          summary: 'Perfil actualizado',
          detail: 'Tu perfil ha sido actualizado correctamente'
        });
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error updating profile:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el perfil'
        });
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private updateOwnProfileFromResponse(response: any): void {
    const timestamp = new Date().getTime();

    const currentUser = this.authService.user();
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        firstName: response.firstName || currentUser.firstName,
        lastName: response.lastName || currentUser.lastName,
        phone: response.phone || currentUser.phone,
        bio: response.bio || currentUser.bio,
        avatarUrl: response.avatarUrl ? `${response.avatarUrl}?t=${timestamp}` : currentUser.avatarUrl,
        coverImageUrl: response.coverImageUrl ? `${response.coverImageUrl}?t=${timestamp}` : currentUser.coverImageUrl,
        location: response.location || currentUser.location,
      };
      this.authService.updateUser(updatedUser);
    }

    const currentProfile = this.ownProfile;
    this.ownProfile = {
      ...currentProfile,
      name: response.firstName + ' ' + response.lastName,
      avatar: response.avatarUrl ? `${response.avatarUrl}?t=${timestamp}` : currentProfile.avatar,
      coverImage: response.coverImageUrl ? `${response.coverImageUrl}?t=${timestamp}` : currentProfile.coverImage,
      bio: response.bio || currentProfile.bio,
      location: response.location || currentProfile.location,
    } as AnyProfile;

    // Resetear estado de ubicación
    this.locationConfirmed.set(false);
    this.userLatitude.set(response.latitude || null);
    this.userLongitude.set(response.longitude || null);

    this.cdr.detectChanges();

    setTimeout(() => {
      this.loading.set(false);
      this.cdr.detectChanges();
    }, 500);
  }

  // ============================================
  //  FILE UPLOADS
  // ============================================

  private avatarInput: HTMLInputElement | null = null;
  private coverInput: HTMLInputElement | null = null;

  triggerAvatarUpload(): void {
    if (!this.avatarInput) {
      this.avatarInput = document.createElement('input');
      this.avatarInput.type = 'file';
      this.avatarInput.accept = 'image/*';
      this.avatarInput.hidden = true;
      this.avatarInput.addEventListener('change', (e) => this.onAvatarChange(e));
      document.body.appendChild(this.avatarInput);
    }
    this.avatarInput.click();
  }

  triggerCoverUpload(): void {
    if (!this.coverInput) {
      this.coverInput = document.createElement('input');
      this.coverInput.type = 'file';
      this.coverInput.accept = 'image/*';
      this.coverInput.hidden = true;
      this.coverInput.addEventListener('change', (e) => this.onCoverChange(e));
      document.body.appendChild(this.coverInput);
    }
    this.coverInput.click();
  }

  onAvatarChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      this.loading.set(true);
      const formData = new FormData();

      const user = this.authService.user();
      formData.append('data', new Blob([JSON.stringify({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        location: user?.location || '',
        website: ''
      })], { type: 'application/json' }));

      formData.append('avatar', file);

      this.profileService.updateProfile(formData).subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Foto actualizada',
            detail: 'Tu foto de perfil ha sido actualizada'
          });
          this.updateOwnProfileFromResponse(response);
        },
        error: (error) => {
          console.error('Error updating avatar:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la foto de perfil'
          });
          this.loading.set(false);
          this.cdr.detectChanges();
        }
      });
    }
    if (this.avatarInput) this.avatarInput.value = '';
  }

  onCoverChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      this.loading.set(true);
      const formData = new FormData();

      const user = this.authService.user();
      formData.append('data', new Blob([JSON.stringify({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        location: user?.location || '',
        website: ''
      })], { type: 'application/json' }));

      formData.append('coverImage', file);

      this.profileService.updateProfile(formData).subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Portada actualizada',
            detail: 'Tu imagen de portada ha sido actualizada'
          });
          this.updateOwnProfileFromResponse(response);
        },
        error: (error) => {
          console.error('Error updating cover:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la imagen de portada'
          });
          this.loading.set(false);
          this.cdr.detectChanges();
        }
      });
    }
    if (this.coverInput) this.coverInput.value = '';
  }

  // ============================================
  //  HELPERS
  // ============================================

  getProfileTypeLabel(type: ProfileType | string | undefined): string {
    const labels: Record<string, string> = {
      user: 'Usuario',
      vet: 'Veterinario',
      shelter: 'Protectora',
      seller: 'Vendedor',
      trainer: 'Adiestrador',
      pet: 'Mascota'
    };
    const normalizedType = type?.toLowerCase() || '';
    return labels[normalizedType] || 'Usuario';
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }
}
