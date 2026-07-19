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
import { Subscription } from 'rxjs';
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
  ],
  providers: [MessageService],
  template: `
    <div class="profile-page">
      <div class="profile-container">
        <!-- Header del perfil estilo Instagram -->
        <div class="profile-header-instagram">
          <div class="profile-cover-instagram">
            @if (loading()) {
              <p-skeleton height="200px" class="cover-skeleton"></p-skeleton>
            } @else {
              <img [src]="userProfile()?.coverImage" alt="Cover" class="cover-image-instagram" />
            }
          </div>
          <div class="profile-info-instagram">
            <div class="profile-avatar-section-instagram">
              @if (loading()) {
                <p-skeleton shape="circle" size="8rem" class="avatar-skeleton-instagram"></p-skeleton>
              } @else {
                <div class="avatar-ring">
                  <p-avatar [image]="userProfile()?.avatar" shape="circle" size="xlarge" class="profile-avatar-instagram"></p-avatar>
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
                <p class="profile-bio-instagram">{{ userProfile()?.bio }}</p>
              } @else {
                <p-skeleton width="8rem" height="1.125rem" class="mb-2 mt-2"></p-skeleton>
                <p-skeleton width="100%" height="0.75rem" class="mb-1"></p-skeleton>
                <p-skeleton width="100%" height="0.75rem" class="mb-1"></p-skeleton>
                <p-skeleton width="60%" height="0.75rem"></p-skeleton>
              }
            </div>
            <div class="profile-actions-instagram">
              <div *ngIf="isOwnProfile() && !loading()">
                <p-button label="Editar Perfil" icon="pi pi-pencil" styleClass="p-button-outlined" (onClick)="setActiveTab('knowme')" />
              </div>
              <div *ngIf="!isOwnProfile() && !loading()">
                <p-button
                  [label]="userProfile()?.isFollowing ? 'Siguiendo' : 'Seguir'"
                  [icon]="userProfile()?.isFollowing ? 'pi pi-check' : 'pi pi-user-plus'"
                  [styleClass]="userProfile()?.isFollowing ? 'p-button-success' : 'p-button-primary'"
                />
              </div>
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

          <!-- Conóceme (información del perfil para otros usuarios) -->
          <div class="knowme-content-instagram" *ngIf="activeTab() === 'knowme' && !isOwnProfile() && !loading()">
            <div class="knowme-card-instagram">
              <h3>Conóceme</h3>
              <p class="knowme-bio-instagram">{{ userProfile()?.bio }}</p>
              <div class="knowme-info-instagram">
                <div class="knowme-item-instagram">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ userProfile()?.location }}</span>
                </div>
                <div class="knowme-item-instagram">
                  <i class="pi pi-globe"></i>
                  <span>{{ userProfile()?.website }}</span>
                </div>
                <div class="knowme-item-instagram">
                  <i class="pi pi-calendar"></i>
                  <span>Se unió en {{ userProfile()?.joinDate | date:'MMMM yyyy' }}</span>
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

    .avatar-skeleton-instagram {
      margin-top: -60px;
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

    .profile-actions-instagram {
      flex-shrink: 0;
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
  ownProfile: UserProfile = {
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
        this.ownProfile = {
          id: user.id,
          type: 'user',
          name: user.firstName + ' ' + user.lastName,
          username: user.firstName.toLowerCase() + user.lastName.toLowerCase(),
          avatar: user.avatarUrl || '',
          coverImage: user.coverImageUrl || '',
          bio: user.bio || '',
          location: user.city || '',
          website: '',
          joinDate: user.createdAt,
          isFollowing: false,
          stats: {
            pets: 0,
            followers: 0,
            following: 0,
            posts: 0,
          },
        };
      }

      // Cargar datos del perfil
      this.loadProfileData();
    });
  }

  private loadProfileData(): void {
    this.loading.set(true);

    // Cargar perfiles de otros usuarios desde backend
    this.loadAllProfiles();

    // Cargar mascotas del propio perfil
    const user = this.authService.user();
    if (user && this.isOwnProfile()) {
      this.loadPetsForProfile(user.id);
    }

    // Ensure loading is visible for at least 1 second
    setTimeout(() => {
      this.loading.set(false);
      this.cdr.detectChanges();
    }, 1000);
  }

  private loadAllProfiles(): void {
    this.profileService.getAllProfiles().subscribe({
      next: (profiles) => {
        const profileMap: Record<string, AnyProfile> = {};
        for (const p of profiles) {
          // Saltar el perfil del usuario logueado
          const currentUser = this.authService.user();
          if (currentUser && p.id === currentUser.id) continue;

          const baseProfile: BaseProfile = {
            id: p.id,
            name: p.firstName + ' ' + p.lastName,
            avatar: p.avatarUrl || '',
            coverImage: p.coverImageUrl || '',
            bio: p.bio || '',
            location: p.city ? p.city + (p.country ? ', ' + p.country : '') : '',
            website: '',
            joinDate: new Date(),
            isFollowing: false,
            type: p.profileType as ProfileType,
          };

          switch (p.profileType) {
            case 'shelter':
              profileMap[p.id] = {
                ...baseProfile,
                type: 'shelter',
                stats: { pets: 0, followers: 0, adoptions: 0, reviews: 0 },
              } as ShelterProfile;
              break;
            case 'vet':
              profileMap[p.id] = {
                ...baseProfile,
                type: 'vet',
                specialty: 'Veterinaria General',
                rating: 4.5,
                reviews: 0,
                stats: { patients: 0, followers: 0, posts: 0, likes: 0 },
              } as VetProfile;
              break;
            case 'seller':
              profileMap[p.id] = {
                ...baseProfile,
                type: 'seller',
                stats: { products: 0, followers: 0, sales: 0, reviews: 0 },
              } as SellerProfile;
              break;
            default:
              profileMap[p.id] = {
                ...baseProfile,
                type: 'user',
                username: (p.firstName + p.lastName).toLowerCase(),
                stats: { pets: 0, followers: 0, following: 0, posts: 0 },
              } as UserProfile;
          }
        }
        this.loadedProfiles.set(profileMap);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading profiles:', err);
        this.cdr.detectChanges();
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
        })));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading pets:', err);
        this.cdr.detectChanges();
      },
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
    return this.authService.user()?.phone || '—';
  });

  userEmail = computed(() => {
    return this.authService.user()?.email || '—';
  });

  userCountry = computed(() => {
    return this.authService.user()?.country || '—';
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
    return {
      title: 'Editar información personal',
      submitLabel: 'Guardar cambios',
      fields: [
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
        {
          key: 'avatar',
          label: 'Avatar',
          type: 'file' as const,
          accept: 'image/*',
          maxFileSize: 5000000
        },
        {
          key: 'coverImage',
          label: 'Imagen de fondo',
          type: 'file' as const,
          accept: 'image/*',
          maxFileSize: 5000000
        }
      ]
    } as DynamicFormConfig;
  });

  // Datos del formulario de perfil
  profileFormData = computed(() => {
    const user = this.authService.user();
    return {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      city: user?.city || '',
      country: user?.country || '',
      website: ''
    };
  });

  // Estadísticas según tipo de perfil
  profileStats = computed(() => {
    const profile = this.userProfile();
    if (!profile) return [];

    switch (profile.type) {
      case 'user':
        return [
          { value: profile.stats.pets, label: 'Família' },
          { value: profile.stats.followers, label: 'Seguidores' },
          { value: profile.stats.following, label: 'Siguiendo' },
          { value: profile.stats.posts, label: 'Publicaciones' },
        ];
      case 'shelter':
        return [
          { value: profile.stats.pets, label: 'Família' },
          { value: profile.stats.followers, label: 'Seguidores' },
          { value: profile.stats.adoptions, label: 'Adopciones' },
          { value: profile.stats.reviews, label: 'Reseñas' },
        ];
      case 'vet':
        return [
          { value: profile.stats.patients, label: 'Pacientes' },
          { value: profile.stats.followers, label: 'Seguidores' },
          { value: profile.stats.posts, label: 'Publicaciones' },
          { value: profile.stats.likes, label: 'Likes dados' },
        ];
      case 'seller':
        return [
          { value: profile.stats.products, label: 'Productos' },
          { value: profile.stats.followers, label: 'Seguidores' },
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

  // Manejar envío del formulario de perfil
  async onProfileSubmit(data: any): Promise<void> {
    console.log('Profile form submitted:', data);

    const formData = new FormData();

    // Agregar datos del formulario
    formData.append('data', new Blob([JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      bio: data.bio,
      city: data.city,
      country: data.country,
      website: data.website
    })], { type: 'application/json' }));

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
        // Actualizar el perfil local con la respuesta
        this.ownProfile = {
          ...this.ownProfile,
          name: response.firstName + ' ' + response.lastName,
          avatar: response.avatarUrl || this.ownProfile.avatar,
          coverImage: response.coverImageUrl || this.ownProfile.coverImage,
          bio: response.bio || this.ownProfile.bio,
          location: response.city || this.ownProfile.location,
        };
        // Actualizar el usuario en el AuthService
        this.updateAuthUser(response);
      },
      error: (error: any) => {
        console.error('Error updating profile:', error);
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

  onTabChange(tabId: string) {
    this.setActiveTab(tabId);
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
}
