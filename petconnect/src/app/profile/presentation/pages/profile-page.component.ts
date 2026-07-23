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
  ],
  providers: [MessageService],
  template: `
    <div class="profile-page">
      <div class="profile-container">
        <!-- Header del perfil estilo Instagram -->
        <div class="profile-header-instagram">
          <div class="profile-cover-instagram">
            @if (loading()) {
              <p-skeleton height="280px" class="cover-skeleton"></p-skeleton>
            } @else {
              <img [src]="userCoverAvatar()" alt="Cover" class="cover-image-instagram" />
              @if (isOwnProfile()) {
                <button class="cover-change-btn" (click)="triggerCoverUpload()">
                  <i class="pi pi-camera"></i>
                </button>
              }
            }
          </div>
          <div class="profile-info-instagram">
            <div class="profile-avatar-section-instagram">
              @if (loading()) {
                <p-skeleton shape="circle" size="12rem" class="avatar-skeleton-instagram"></p-skeleton>
              } @else {
                <div class="avatar-ring">
                  <div class="avatar-wrapper">
                    <p-avatar [image]="userAvatar()" shape="circle" size="xlarge" class="profile-avatar-instagram avatar-large"></p-avatar>
                    @if (isOwnProfile()) {
                      <button class="avatar-change-btn" (click)="triggerAvatarUpload()">
                        <i class="pi pi-camera"></i>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="profile-details-instagram">
              @if (loading()) {
                <p-skeleton width="10rem" height="1.5rem" class="mb-2"></p-skeleton>
              } @else {
                <h2 class="profile-username">{{ userUsername() }}</h2>
              }
              <div class="profile-stats-instagram">
                @if (loading()) {
                  <div class="stat-item-instagram" *ngFor="let i of [1, 2, 3, 4]">
                    <p-skeleton width="2.5rem" height="1rem" class="mb-1"></p-skeleton>
                    <p-skeleton width="4rem" height="0.75rem"></p-skeleton>
                  </div>
                } @else {
                  <div class="stat-item-instagram" *ngFor="let stat of profileStats()">
                    <span class="stat-value-instagram">{{ stat.value }}</span>
                    <span class="stat-label-instagram">{{ stat.label }}</span>
                  </div>
                }
              </div>
              @if (!loading()) {
                <h1 class="profile-name-instagram">{{ userProfile()?.name }}</h1>
                <div class="profile-type-badge">
                  <span class="type-badge" [ngClass]="'type-' + userProfile()?.type">
                    {{ getProfileTypeLabel(userProfile()?.type) }}
                  </span>
                </div>
                <p class="profile-bio-instagram">{{ userProfile()?.bio }}</p>
              } @else {
                <p-skeleton width="8rem" height="1.125rem" class="mb-2 mt-2"></p-skeleton>
                <p-skeleton width="100%" height="0.75rem" class="mb-1"></p-skeleton>
                <p-skeleton width="100%" height="0.75rem" class="mb-1"></p-skeleton>
                <p-skeleton width="60%" height="0.75rem"></p-skeleton>
              }
            </div>
            <div class="profile-actions-instagram">
              @if (isOwnProfile() && !loading()) {
                <p-menu #profileMenu [model]="profileMenuItems" [popup]="true" appendTo="body"></p-menu>
                <button pButton type="button" icon="pi pi-ellipsis-v" class="p-button-outlined p-button-sm" (click)="profileMenu.toggle($event)"></button>
              }
              @if (!isOwnProfile() && !loading()) {
                <button
                  class="follow-btn"
                  [class.following]="userProfile()?.isFollowing"
                  (click)="toggleFollow()"
                >
                  <i [class]="userProfile()?.isFollowing ? 'pi pi-check' : 'pi pi-user-plus'"></i>
                  {{ userProfile()?.isFollowing ? 'Siguiendo' : 'Seguir' }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Loading Progress Bar -->
        @if (loading()) {
          <div class="loading-overlay">
            <p-progressBar mode="indeterminate" [style]="{'height': '4px'}" />
          </div>
        }

        <!-- Tabs estilo Instagram -->
        <app-tabs
          [tabs]="profileTabs()"
          [activeTab]="activeTab()"
          (tabChange)="onTabChange($event)"
        />

        <!-- Contenido de tabs -->
        <div class="profile-content">
          <!-- Publicaciones - Grid 3 columnas estilo Instagram -->
          <div class="posts-grid-instagram" *ngIf="activeTab() === 'posts' && !loading()">
            <div class="post-card-instagram" *ngFor="let post of userPosts()">
              <img [src]="post.image" alt="Post" class="post-image-instagram" />
              <div class="post-overlay-instagram">
                <span><i class="pi pi-heart"></i> {{ post.likes }}</span>
                <span><i class="pi pi-comment"></i> {{ post.comments }}</span>
              </div>
            </div>
          </div>
          <div class="posts-grid-instagram" *ngIf="activeTab() === 'posts' && loading()">
            <!-- Posts Loading Skeletons -->
            <div class="post-card-instagram skeleton-post-instagram" *ngFor="let i of [1, 2, 3, 4, 5, 6]">
              <p-skeleton height="150px" borderRadius="0"></p-skeleton>
            </div>
          </div>

          <!-- Mascotas -->
          <div class="pets-section-instagram" *ngIf="activeTab() === 'pets' && (isUser() || isShelter())">
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

          <!-- Conóceme (formulario de edición para el propio perfil) -->
          <div class="knowme-content-instagram" *ngIf="activeTab() === 'knowme' && isOwnProfile() && !loading()">
            <app-dynamic-form
              [config]="profileFormConfig()"
              [formData]="profileFormData()"
              (onSubmitClick)="onProfileSubmit($event)"
            />
          </div>
          <div class="knowme-content-instagram" *ngIf="activeTab() === 'knowme' && isOwnProfile() && loading()">
            <div class="knowme-card-instagram skeleton-card">
              <p-skeleton width="12rem" height="1.25rem" class="mb-3"></p-skeleton>
              <p-skeleton width="100%" height="2.5rem" class="mb-2"></p-skeleton>
              <p-skeleton width="100%" height="2.5rem" class="mb-2"></p-skeleton>
              <p-skeleton width="100%" height="4rem" class="mb-2"></p-skeleton>
              <p-skeleton width="100%" height="2.5rem" class="mb-2"></p-skeleton>
              <p-skeleton width="100%" height="2.5rem" class="mb-2"></p-skeleton>
            </div>
          </div>

          <!-- Conóceme (información del perfil para otros usuarios) - MUESTRA TODOS LOS DATOS -->
          <div class="knowme-content-instagram" *ngIf="activeTab() === 'knowme' && !isOwnProfile() && !loading()">
            <div class="knowme-card-instagram">
              <h3>Conóceme</h3>
              <p class="knowme-bio-instagram">{{ userProfile()?.bio || 'Sin descripción disponible' }}</p>
              <div class="knowme-info-instagram">
                <div class="knowme-item-instagram">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ userProfile()?.location || '—' }}</span>
                </div>
                <div class="knowme-item-instagram">
                  <i class="pi pi-phone"></i>
                  <span>{{ userPhone() }}</span>
                </div>
                <div class="knowme-item-instagram">
                  <i class="pi pi-clock"></i>
                  <span>Se unió en {{ userProfile()?.joinDate  }}</span>
                </div>
                <div class="knowme-item-instagram">
                  <i class="pi pi-envelope"></i>
                  <span>{{ userEmail() }}</span>
                </div>
                <!-- Campos específicos según tipo de perfil en vista de otros usuarios -->
                <div class="knowme-item-instagram" *ngIf="userProfile()?.type === 'vet' || userProfile()?.type === 'trainer'">
                  <i class="pi pi-briefcase"></i>
                  <span>{{ userProfile()?.type === 'vet' ? 'Especialidad: ' : 'Especialización: ' }}{{ getProfileSpecialty() }}</span>
                </div>
                <div class="knowme-item-instagram" *ngIf="userProfile()?.type === 'vet'">
                  <i class="pi pi-id-card"></i>
                  <span>Nº colegiado: {{ getProfileLicenseNumber() }}</span>
                </div>
                <div class="knowme-item-instagram" *ngIf="userProfile()?.type === 'seller'">
                  <i class="pi pi-shop"></i>
                  <span>Tienda: {{ getProfileStoreName() }}</span>
                </div>
                <div class="knowme-item-instagram" *ngIf="userProfile()?.type === 'shelter'">
                  <i class="pi pi-heart"></i>
                  <span>Registro: {{ getProfileCharityNumber() }}</span>
                </div>
                <div class="knowme-item-instagram">
                  <i class="pi pi-globe"></i>
                  <span *ngIf="userProfile()?.website; else noWebsite">
                    <a [href]="'https://' + userProfile()?.website" target="_blank" class="knowme-link">{{ userProfile()?.website }}</a>
                  </span>
                  <ng-template #noWebsite>
                    <span>—</span>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
          <div class="knowme-content-instagram" *ngIf="activeTab() === 'knowme' && !isOwnProfile() && loading()">
            <div class="knowme-card-instagram skeleton-card">
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
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: 100vh;
      background-color: var(--bitbucket-header-bg);
      transition: background-color 0.3s ease;
    }

    .dark .profile-page {
      background-color: #111827;
    }

    .profile-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 1rem;
    }

    /* Header estilo Instagram */
    .profile-header-instagram {
      display: flex;
      flex-direction: column;
    }

    .profile-cover-instagram {
      position: relative;
      height: 200px;
      overflow: hidden;
      border-radius: 0.5rem 0.5rem 0 0;
    }

    .cover-skeleton, .cover-image-instagram {
      width: 100%;
      height: 100%;
      display: block;
    }

    .cover-image-instagram {
      object-fit: cover;
    }

    .profile-info-instagram {
      display: flex;
      gap: 2rem;
      padding: 1.5rem;
      background-color: var(--bitbucket-header-bg);
      border-radius: 0 0 0.5rem 0.5rem;
      align-items: flex-start;
    }

    .profile-avatar-section-instagram {
      flex-shrink: 0;
    }

    .avatar-ring {
      margin-top: -60px;
      padding: 3px;
      border-radius: 50%;
      background: var(--instagram-gradient);
    }

    .profile-avatar-instagram {
      border: 3px solid var(--bitbucket-header-bg);
    }

    .avatar-large {
      width: 180px !important;
      height: 180px !important;
      min-width: 180px;
      min-height: 180px;
    }

    .avatar-large :host ::ng-deep .p-avatar {
      width: 180px !important;
      height: 180px !important;
    }

    .avatar-skeleton-instagram {
      margin-top: -60px;
    }

    .avatar-wrapper {
      position: relative;
      display: inline-block;
    }

    .avatar-change-btn {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      border: 2px solid var(--bitbucket-header-bg);
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

    .cover-change-btn {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      border: 2px solid var(--bitbucket-header-bg);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 10;
    }

    .cover-change-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .cover-change-btn i {
      font-size: 1rem;
    }

    .profile-details-instagram {
      flex: 1;
    }

    .profile-username {
      font-size: 1.5rem;
      font-weight: 300;
      color: var(--bitbucket-text-primary);
      margin: 0;
    }

    .profile-stats-instagram {
      display: flex;
      gap: 2rem;
      margin: 0.5rem 0;
    }

    .stat-item-instagram {
      text-align: center;
    }

    .stat-value-instagram {
      display: block;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      font-size: 1rem;
    }

    .stat-label-instagram {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    .profile-name-instagram {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0.5rem 0 0.25rem 0;
    }

    .profile-bio-instagram {
      color: var(--bitbucket-text-primary);
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.5;
    }

    .profile-type-badge {
      margin: 0.25rem 0;
    }

    .type-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .type-user {
      background: var(--primary-color);
      color: white;
    }

    .type-vet {
      background: #dc2626;
      color: white;
    }

    .type-shelter {
      background: #2563eb;
      color: white;
    }

    .type-seller {
      background: #7c3aed;
      color: white;
    }

    .type-trainer {
      background: #ea580c;
      color: white;
    }

    .type-pet {
      background: #16a34a;
      color: white;
    }

    .profile-actions-instagram {
      flex-shrink: 0;
    }

    /* Follow button - modern minimal style */
    .follow-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid var(--surface-border);
      background: transparent;
      color: var(--text-primary);
    }

    .follow-btn:hover {
      background: var(--surface-hover);
      border-color: var(--text-secondary);
    }

    .follow-btn.following {
      background: var(--surface-card);
      border-color: var(--surface-border);
      color: var(--text-secondary);
    }

    .follow-btn.following:hover {
      border-color: #ef4444;
      color: #ef4444;
    }

    .follow-btn.following:hover i {
      color: #ef4444;
    }

    .follow-btn i {
      font-size: 0.875rem;
    }

    /* Posts Grid estilo Instagram - 3 columnas */
    .posts-grid-instagram {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.25rem;
      margin-top: 1rem;
    }

    .post-card-instagram {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      cursor: pointer;
    }

    .post-image-instagram {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .post-card-instagram:hover .post-image-instagram {
      transform: scale(1.05);
    }

    .post-overlay-instagram {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .post-card-instagram:hover .post-overlay-instagram {
      opacity: 1;
    }

    .skeleton-post-instagram {
      aspect-ratio: 1;
    }

    /* Pets Section */
    .pets-section-instagram {
      margin-top: 1rem;
    }

    /* Knowme Section */
    .knowme-content-instagram {
      margin-top: 1rem;
    }

    .knowme-card-instagram {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1.5rem;
    }

    .knowme-card-instagram h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0 0 1rem 0;
    }

    .knowme-bio-instagram {
      color: var(--bitbucket-text-primary);
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      line-height: 1.6;
    }

    .knowme-info-instagram {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .knowme-item-instagram {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
    }

    .knowme-item-instagram i {
      color: var(--primary-color);
    }

    .knowme-link {
      color: var(--primary-color);
      text-decoration: none;
    }

    .knowme-link:hover {
      text-decoration: underline;
    }

    .skeleton-card {
      pointer-events: none;
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

    /* Utility classes */
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mt-2 { margin-top: 0.5rem; }

    /* Responsive */
    @media (max-width: 768px) {
      .profile-info-instagram {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .profile-stats-instagram {
        justify-content: center;
      }

      .posts-grid-instagram {
        grid-template-columns: repeat(2, 1fr);
      }

      .tabs-button-text {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .posts-grid-instagram {
        grid-template-columns: 1fr;
      }
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

  // Perfil del usuario logueado (se obtiene del AuthService)
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
  userPosts = signal([
    { id: '1', image: 'https://picsum.photos/300/300?random=1', likes: 24, comments: 5 },
    { id: '2', image: 'https://picsum.photos/300/300?random=2', likes: 18, comments: 3 },
    { id: '3', image: 'https://picsum.photos/300/300?random=3', likes: 32, comments: 8 },
    { id: '4', image: 'https://picsum.photos/300/300?random=4', likes: 15, comments: 2 },
    { id: '5', image: 'https://picsum.photos/300/300?random=5', likes: 42, comments: 7 },
    { id: '6', image: 'https://picsum.photos/300/300?random=6', likes: 28, comments: 4 },
  ]);

  // Inicializar perfil con datos del usuario autenticado
  ngOnInit(): void {
    // Suscribirse a cambios en los parámetros de ruta
    this.paramSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const type = params.get('type') as ProfileType | null;

      // Detectar si la ruta es /pet/:id para forzar tipo 'pet'
      const urlSegments = this.router.url.split('/');
      const isPetRoute = urlSegments.includes('pet');

      this.profileId.set(id);
      this.profileType.set(isPetRoute ? 'pet' : (type || 'user'));

      // Leer query parameter 'tab' para establecer la pestaña activa
      this.route.queryParams.subscribe(queryParams => {
        const tab = queryParams['tab'];
        if (tab && this.isOwnProfile()) {
          this.activeTab.set(tab);
        }
      });

      // Inicializar perfil con datos del usuario autenticado
      const user = this.authService.user();
      if (user) {
        // Crear el perfil con el tipo correcto del usuario
        // Normalizar a minúsculas para manejar tanto 'VET' como 'vet'
        const userType = (user.profileType?.toLowerCase() as ProfileType) || 'user';
        const baseProfile: BaseProfile = {
          id: user.id,
          name: user.firstName + ' ' + user.lastName,
          avatar: user.avatarUrl || '',
          coverImage: user.coverImageUrl || '',
          bio: user.bio || '',
          location: user.city || '',
          website: '',
          joinDate: user.createdAt,
          isFollowing: false,
          type: userType,
        };

        // Crear el perfil según el tipo
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

      // Cargar datos del perfil
      this.loadProfileData();

      // Inicializar menú de perfil
      this.initializeProfileMenu();
    });
  }

  private loadProfileData(): void {
    this.loading.set(true);

    const user = this.authService.user();

    if (this.isOwnProfile()) {
      // Cargar el propio perfil usando getProfileByAuthUserId
      // user.id is the authUserId
      if (user?.id) {
        this.loadOwnProfile(user.id);
        // Cargar estadísticas de seguidores y seguidos
        this.loadFollowersCount(user.id);
        this.loadFollowingCount(user.id);
      }
    } else {
      // Cargar perfil específico por ID
      const id = this.profileId();
      if (id) {
        this.loadProfileById(id);
        // Cargar estadísticas de seguidores y seguidos
        this.loadFollowersCount(id);
        this.loadFollowingCount(id);
      }
    }

    // Cargar mascotas del perfil
    // user.id is the authUserId
    if (this.isOwnProfile() && user) {
      this.loadPetsForProfile(user.id);
    } else if (!this.isOwnProfile() && this.profileId()) {
      this.loadPetsForProfile(this.profileId()!);
    }

    // Ensure loading is visible for at least 1 second
    setTimeout(() => {
      this.loading.set(false);
      this.cdr.detectChanges();
    }, 1000);
  }

  private loadOwnProfile(authUserId: string): void {
    this.profileService.getProfileByAuthUserId(authUserId).subscribe({
      next: (profile) => {
        // Normalizar profileType a minúsculas para manejar tanto 'VET' como 'vet'
        const normalizedProfileType = profile.profileType?.toLowerCase() as ProfileType || 'user';

        // Check if we recently updated (within last 2 seconds) - if so, preserve cache-busted URLs
        const currentAvatar = this.ownProfile.avatar;
        const currentCover = this.ownProfile.coverImage;
        const avatarTimestamp = currentAvatar.includes('?t=') ? parseInt(currentAvatar.split('?t=')[1]) : 0;
        const coverTimestamp = currentCover.includes('?t=') ? parseInt(currentCover.split('?t=')[1]) : 0;
        const now = Date.now();
        const recentlyUpdated = (now - avatarTimestamp < 2000) || (now - coverTimestamp < 2000);

        // Use cache-busted URLs if recently updated, otherwise use backend URLs
        const avatarUrl = recentlyUpdated && avatarTimestamp ? currentAvatar : (profile.avatarUrl || '');
        const coverImageUrl = recentlyUpdated && coverTimestamp ? currentCover : (profile.coverImageUrl || '');

        const baseProfile: BaseProfile = {
          id: profile.id,
          name: profile.firstName + ' ' + profile.lastName,
          avatar: avatarUrl,
          coverImage: coverImageUrl,
          bio: profile.bio || '',
          location: profile.city ? profile.city + (profile.country ? ', ' + profile.country : '') : '',
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
    // Use getProfileByAuthUserId since the route param :id is the authUserId
    // (navigation links use authUserId, e.g. [routerLink]="'/profile/' + vet.userId")
    this.profileService.getProfileByAuthUserId(authUserId).subscribe({
      next: (profile) => {
        // Normalizar profileType a minúsculas para manejar tanto 'VET' como 'vet'
        const normalizedProfileType = profile.profileType?.toLowerCase() as ProfileType || 'user';
        const baseProfile: BaseProfile = {
          id: profile.id,
          name: profile.firstName + ' ' + profile.lastName,
          avatar: profile.avatarUrl || '',
          coverImage: profile.coverImageUrl || '',
          bio: profile.bio || '',
          location: profile.city ? profile.city + (profile.country ? ', ' + profile.country : '') : '',
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
        // Load follow status from backend
        this.loadFollowStatus(authUserId);
      },
      error: (err) => {
        console.error('Error loading profile by authUserId:', err);
        // Fallback: try to load by profile ID instead
        this.profileService.getProfileById(authUserId).subscribe({
          next: (profile) => {
            const normalizedProfileType = profile.profileType?.toLowerCase() as ProfileType || 'user';
            const baseProfile: BaseProfile = {
              id: profile.id,
              name: profile.firstName + ' ' + profile.lastName,
              avatar: profile.avatarUrl || '',
              coverImage: profile.coverImageUrl || '',
              bio: profile.bio || '',
              location: profile.city ? profile.city + (profile.country ? ', ' + profile.country : '') : '',
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

  // Determinar si es el propio perfil
  isOwnProfile = computed(() => !this.profileId());

  // Obtener el perfil del usuario
  userProfile = computed(() => {
    const id = this.profileId();
    if (!id) {
      return this.ownProfile;
    }
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
      return this.authService.user()?.coverImageUrl || 'https://i.pravatar.cc/150?img=1';
    }
    return profile?.coverImage || 'https://i.pravatar.cc/150?img=1';
  });
  // Determinar tipo de perfil
  isUser = computed(() => this.userProfile()?.type === 'user');
  isShelter = computed(() => this.userProfile()?.type === 'shelter');
  isSeller = computed(() => this.userProfile()?.type === 'seller');
  isVet = computed(() => this.userProfile()?.type === 'vet');
  isPet = computed(() => this.userProfile()?.type === 'pet');
  isTrainer = computed(() => this.userProfile()?.type === 'trainer');

  // Getters para propiedades específicas de cada tipo
  userUsername = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'user' ? '@' + profile.username : '';
  });

  userPhone = computed(() => {
    const profile = this.userProfile();
    if (this.isOwnProfile()) {
      return this.authService.user()?.phone || '—';
    }
    // Para otros perfiles, obtener teléfono del perfil cargado
    return profile?.phone || '—';
  });

  userEmail = computed(() => {
    return this.authService.user()?.email || '—';
  });

  userCountry = computed(() => {
    const profile = this.userProfile();
    if (this.isOwnProfile()) {
      return this.authService.user()?.country || '—';
    }
    return profile?.location?.split(', ')[1] || '—';
  });

  userProfileType = computed(() => {
    return this.authService.user()?.profileType || '—';
  });

  vetRating = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? profile.rating : 0;
  });

  vetReviews = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'vet' ? profile.reviews : 0;
  });

  petSpecies = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'pet' ? profile.species : '';
  });

  petBreed = computed(() => {
    const profile = this.userProfile();
    return profile?.type === 'pet' ? profile.breed : '';
  });

  // Configuración del formulario de perfil
  profileFormConfig = computed(() => {
    const profileType = this.userProfile()?.type || 'user';
    const isOwn = this.isOwnProfile();

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
        key: 'city',
        label: 'Ciudad',
        type: 'input' as const,
        placeholder: 'Madrid',
        validation: { maxLength: 100 }
      },
      {
        key: 'country',
        label: 'País',
        type: 'input' as const,
        placeholder: 'España',
        validation: { maxLength: 100 }
      },
      {
        key: 'website',
        label: 'Sitio web',
        type: 'input' as const,
        placeholder: 'https://mi-sitio.com',
        validation: { maxLength: 255 }
      },
    ];

    // Campos específicos según el tipo de perfil
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

  // Datos del formulario de perfil
  profileFormData = computed(() => {
    const user = this.authService.user();
    const profile = this.userProfile();
    const profileType = profile?.type || 'user';

    const baseData: any = {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      city: user?.city || '',
      country: user?.country || '',
      website: profile?.type !== 'user' ? (profile as any).website || '' : ''
    };

    // Datos específicos según el tipo de perfil
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

  // Estadísticas según tipo de perfil
  profileStats = computed(() => {
    const profile = this.userProfile();
    if (!profile) return [];

    switch (profile.type) {
      case 'user':
        return [
          { value: profile.stats.pets, label: 'Família' },
          { value: this.followersCount(), label: 'Seguidores' },
          { value: this.followingCount(), label: 'Siguiendo' },
          { value: profile.stats.posts, label: 'Publicaciones' },
        ];
      case 'shelter':
        return [
          { value: profile.stats.pets, label: 'Família' },
          { value: this.followersCount(), label: 'Seguidores' },
          { value: profile.stats.adoptions, label: 'Adopciones' },
          { value: profile.stats.reviews, label: 'Reseñas' },
        ];
      case 'vet':
        return [
          { value: profile.stats.patients, label: 'Pacientes' },
          { value: this.followersCount(), label: 'Seguidores' },
          { value: profile.stats.posts, label: 'Publicaciones' },
          { value: profile.stats.likes, label: 'Likes dados' },
        ];
      case 'seller':
        return [
          { value: profile.stats.products, label: 'Productos' },
          { value: this.followersCount(), label: 'Seguidores' },
          { value: profile.stats.sales, label: 'Ventas' },
          { value: profile.stats.reviews, label: 'Reseñas' },
        ];
      case 'pet':
        return [
          { value: profile.stats.likes, label: 'Likes' },
          { value: profile.stats.posts, label: 'Publicaciones' },
        ];
      default:
        return [];
    }
  });

  // Contadores de seguidores y seguidos
  followersCount = signal(0);
  followingCount = signal(0);

  // Manejar envío del formulario de perfil
  async onProfileSubmit(data: any): Promise<void> {
    console.log('Profile form submitted:', data);

    this.loading.set(true);

    const formData = new FormData();

    // Agregar datos del formulario con campos específicos por tipo
    const profileType = this.userProfile()?.type || 'user';
    const payload: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      bio: data.bio,
      city: data.city,
      country: data.country,
      website: data.website
    };

    // Añadir campos específicos según el tipo de perfil
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

    // Agregar imágenes si están seleccionadas
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

      // Llamada al backend usando ProfileService
      this.profileService.updateProfile(formData).subscribe({
        next: (response: any) => {
          console.log('Profile updated successfully:', response);
          // Reload profile from backend to get the latest data
          this.updateOwnProfileFromResponse(response);
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

  // Método para actualizar el usuario en el AuthService
  private updateAuthUser(response: any): void {
    const currentUser = this.authService.user();
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        firstName: response.firstName || currentUser.firstName,
        lastName: response.lastName || currentUser.lastName,
        phone: response.phone || currentUser.phone,
        bio: response.bio || currentUser.bio,
        avatarUrl: response.avatarUrl || currentUser.avatarUrl,
        coverImageUrl: response.coverImageUrl || currentUser.coverImageUrl,
        city: response.city || currentUser.city,
        country: response.country || currentUser.country,
      };
      this.authService.updateUser(updatedUser);
    }
  }

  // Tabs configuration
  profileTabs = computed((): Tab[] => {
    return [
      { id: 'posts', label: 'Publicaciones', icon: 'photo_library' },
      { id: 'pets', label: 'Mascotas', icon: 'pet_supplies', visible: () => this.isUser() || this.isShelter() },
      { id: 'knowme', label: 'Conóceme', icon: 'person' },
    ];
  });

  // Menu items for profile actions
  profileMenuItems: MenuItem[] = [];

  onTabChange(tabId: string) {
    this.setActiveTab(tabId);
  }

  onEditProfile() {
    this.setActiveTab('knowme');
  }

  onAdmin() {
    this.router.navigate(['/admin']);
  }

  initializeProfileMenu(): void {
    this.profileMenuItems = [
      {
        label: 'Editar Perfil',
        icon: 'pi pi-pencil',
        command: () => this.onEditProfile()
      },
      {
        label: 'Administrar',
        icon: 'pi pi-cog',
        command: () => this.onAdmin()
      }
    ];
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  onPetSearch(query: string) {
    this.petSearchQuery.set(query);
  }

  showAddPetDialog() {
    this.router.navigate(['/pets/create']);
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  // Hidden file inputs for avatar and cover uploads
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

      // Add data blob with current profile info (required by backend)
      const user = this.authService.user();
      formData.append('data', new Blob([JSON.stringify({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        city: user?.city || '',
        country: user?.country || '',
        website: ''
      })], { type: 'application/json' }));

      // Add avatar file
      formData.append('avatar', file);

      this.profileService.updateProfile(formData).subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Foto actualizada',
            detail: 'Tu foto de perfil ha sido actualizada'
          });
          // Update local profile and auth user
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
    // Reset the input so the same file can be selected again
    if (this.avatarInput) this.avatarInput.value = '';
  }

  onCoverChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      this.loading.set(true);
      const formData = new FormData();

      // Add data blob with current profile info (required by backend)
      const user = this.authService.user();
      formData.append('data', new Blob([JSON.stringify({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        city: user?.city || '',
        country: user?.country || '',
        website: ''
      })], { type: 'application/json' }));

      // Add cover image file
      formData.append('coverImage', file);

      this.profileService.updateProfile(formData).subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Portada actualizada',
            detail: 'Tu imagen de portada ha sido actualizada'
          });
          // Update local profile and auth user
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
    // Reset the input so the same file can be selected again
    if (this.coverInput) this.coverInput.value = '';
  }

  private updateOwnProfileFromResponse(response: any): void {
    // Generate a timestamp for cache-busting
    const timestamp = new Date().getTime();

    // Update auth user with cache-busted URLs
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
        city: response.city || currentUser.city,
        country: response.country || currentUser.country,
      };
      this.authService.updateUser(updatedUser);
    }

    // Update ownProfile with cache-busted URLs
    const currentProfile = this.ownProfile;
    this.ownProfile = {
      ...currentProfile,
      name: response.firstName + ' ' + response.lastName,
      avatar: response.avatarUrl ? `${response.avatarUrl}?t=${timestamp}` : currentProfile.avatar,
      coverImage: response.coverImageUrl ? `${response.coverImageUrl}?t=${timestamp}` : currentProfile.coverImage,
      bio: response.bio || currentProfile.bio,
      location: response.city ? response.city + (response.country ? ', ' + response.country : '') : currentProfile.location,
    } as AnyProfile;

    this.cdr.detectChanges();

    // Hide loading after a short delay
    setTimeout(() => {
      this.loading.set(false);
      this.cdr.detectChanges();
    }, 500);
  }

  private reloadOwnProfile(): void {
    const user = this.authService.user();
    if (user?.id) {
      this.loadOwnProfile(user.id);
      // Ensure loading is visible for at least 1 second
      setTimeout(() => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }, 1000);
    }
  }

  // Cargar el estado de follow desde el backend
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
      error: () => {
        // If the endpoint fails, just leave isFollowing as false
      }
    });
  }

  // Toggle follow/unfollow for the viewed profile
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
          // Revert on error
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
          // Revert on error
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

  // Método para obtener la etiqueta del tipo de perfil
  getProfileTypeLabel(type: ProfileType | string | undefined): string {
    const labels: Record<string, string> = {
      user: 'Usuario',
      vet: 'Veterinario',
      shelter: 'Protectora',
      seller: 'Vendedor',
      trainer: 'Adiestrador',
      pet: 'Mascota'
    };
    // Normalizar a minúsculas para manejar tanto 'VET' como 'vet'
    const normalizedType = type?.toLowerCase() || '';
    return labels[normalizedType] || 'Usuario';
  }

  // Método para obtener la especialidad según el tipo de perfil (vista de otros usuarios)
  getProfileSpecialty(): string {
    const profile = this.userProfile();
    if (profile?.type === 'vet') {
      return (profile as VetProfile).specialty || 'No especificada';
    }
    if (profile?.type === 'trainer') {
      return (profile as TrainerProfile).specialty || 'No especificada';
    }
    return 'No especificada';
  }

  // Método para obtener el número de colegiado (vista de otros usuarios - vet)
  getProfileLicenseNumber(): string {
    return (this.userProfile() as any)?.licenseNumber || '—';
  }

  // Método para obtener el nombre de tienda (vista de otros usuarios - seller)
  getProfileStoreName(): string {
    return (this.userProfile() as any)?.storeName || '—';
  }

  // Método para obtener el número de registro (vista de otros usuarios - shelter)
  getProfileCharityNumber(): string {
    return (this.userProfile() as any)?.charityNumber || '—';
  }

  // Toggle adoption status for a pet
  toggleAdoptionStatus(petId: string, adoptionStatus: string | undefined): void {
    const newStatus = adoptionStatus !== 'available';

    this.profileService.toggleAdoptionStatus(petId, newStatus).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: newStatus ? 'En adopción' : 'Adopción cancelada',
          detail: newStatus ? 'La mascota ya está disponible para adopción' : 'La mascota ya no está en adopción'
        });
        // Reload pets to reflect the change
        this.loadPetsForProfile(this.isOwnProfile() ? this.authService.user()?.id || '' : this.profileId() || '');
      },
      error: (err) => {
        console.error('Error toggling adoption status:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado de adopción'
        });
      }
    });
  }
}
