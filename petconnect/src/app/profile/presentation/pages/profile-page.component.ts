import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
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
import { DynamicFormComponent, DynamicFormConfig } from '../../../shared/presentation/components/dynamic-form/dynamic-form.component';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { ProfileService, UserProfileResponse, PetResponse } from '../../infrastructure/services/profile.service';
import { User } from '../../../auth/domain/entities/user.entity';

type ProfileType = 'user' | 'shelter' | 'seller' | 'vet' | 'pet';

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

type AnyProfile = UserProfile | ShelterProfile | SellerProfile | VetProfile | PetProfile;

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
  ],
  template: `
    <div class="profile-page">
      <div class="profile-container">
        <!-- Header del perfil -->
        <div class="profile-header">
          <div class="profile-cover">
            <img [src]="userProfile()?.coverImage" alt="Cover" class="cover-image" />
          </div>
          <div class="profile-info">
            <div class="profile-avatar-section">
              <p-avatar [image]="userProfile()?.avatar" shape="circle" size="xlarge" class="profile-avatar"></p-avatar>
              <div class="profile-actions" *ngIf="isOwnProfile()">
                <p-button label="Editar Perfil" icon="pi pi-pencil" styleClass="p-button-outlined" />
                <p-button label="Configuración" icon="pi pi-cog" styleClass="p-button-text" />
              </div>
              <div class="profile-actions" *ngIf="!isOwnProfile()">
                <p-button
                  [label]="userProfile()?.isFollowing ? 'Siguiendo' : 'Seguir'"
                  [icon]="userProfile()?.isFollowing ? 'pi pi-check' : 'pi pi-user-plus'"
                  [styleClass]="userProfile()?.isFollowing ? 'p-button-success' : 'p-button-primary'"
                />
              </div>
            </div>
            <div class="profile-details">
              <h1 class="profile-name">{{ userProfile()?.name }}</h1>
              <div class="profile-meta">
                <span *ngIf="userProfile()?.location">
                  <i class="pi pi-map-marker"></i> {{ userProfile()?.location }}
                </span>
                <span *ngIf="userProfile()?.website">
                  <i class="pi pi-globe"></i> {{ userProfile()?.website }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="profile-stats">
          <div class="stat-item" *ngFor="let stat of profileStats()">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="profile-tabs">
          <div class="tabs-container">
            <button
              class="tab-button"
              [class.active]="activeTab() === 'posts'"
              (click)="setActiveTab('posts')"
            >
              <i class="pi pi-image"></i>
              <span>Publicaciones</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'pets'"
              (click)="setActiveTab('pets')"
              *ngIf="isUser() || isShelter()"
            >
              <i class="pi pi-paw"></i>
              <span>Família</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'reviews'"
              (click)="setActiveTab('reviews')"
              *ngIf="isVet() || isSeller() || isShelter()"
            >
              <i class="pi pi-star"></i>
              <span>Reseñas</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'products'"
              (click)="setActiveTab('products')"
              *ngIf="isSeller()"
            >
              <i class="pi pi-shopping-cart"></i>
              <span>Productos</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'likes'"
              (click)="setActiveTab('likes')"
              *ngIf="isVet()"
            >
              <i class="pi pi-heart"></i>
              <span>Likes dados</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'knowme'"
              (click)="setActiveTab('knowme')"
            >
              <i class="pi pi-user"></i>
              <span>Conóceme</span>
            </button>
            <button
              class="tab-button"
              [class.active]="activeTab() === 'knownews'"
              (click)="setActiveTab('knownews')"
              *ngIf="!isUser() && !isOwnProfile()"
            >
              <i class="pi pi-users"></i>
              <span>Conócenos</span>
            </button>
          </div>
        </div>

        <!-- Contenido de tabs -->
        <div class="profile-content">
          <!-- Publicaciones -->
          <div class="posts-grid" *ngIf="activeTab() === 'posts'">
            <div class="post-card" *ngFor="let post of userPosts()">
              <img [src]="post.image" alt="Post" class="post-image" />
              <div class="post-overlay">
                <span><i class="pi pi-heart"></i> {{ post.likes }}</span>
                <span><i class="pi pi-comment"></i> {{ post.comments }}</span>
              </div>
            </div>
          </div>

          <!-- Família -->
          <div class="pets-section" *ngIf="activeTab() === 'pets' && (isUser() || isShelter())">
            <app-table-card
              [items]="userPets()"
              [showSearch]="true"
              [filteredItems]="filteredPetItems()"
              [editable]="isOwnProfile()"
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

          <!-- Reseñas -->
          <div class="reviews-list" *ngIf="activeTab() === 'reviews' && (isVet() || isSeller() || isShelter())">
            <div class="review-card" *ngFor="let review of userReviews()">
              <p-avatar [image]="review.avatar" shape="circle"></p-avatar>
              <div class="review-content">
                <p class="review-author">{{ review.author }}</p>
                <p-rating [stars]="5" [readonly]="true" [(ngModel)]="review.rating"></p-rating>
                <p class="review-text">{{ review.text }}</p>
              </div>
            </div>
          </div>

          <!-- Productos -->
          <div class="products-grid" *ngIf="activeTab() === 'products' && isSeller()">
            <div class="product-card" *ngFor="let product of sellerProducts()">
              <img [src]="product.image" alt="Product" class="product-image" />
              <p class="product-name">{{ product.name }}</p>
              <p class="product-price">{{ product.price | currency:'EUR' }}</p>
            </div>
          </div>

          <!-- Likes dados -->
          <div class="likes-grid" *ngIf="activeTab() === 'likes' && isVet()">
            <div class="like-card" *ngFor="let like of vetLikes()">
              <i class="pi pi-heart like-icon"></i>
              <p class="like-name">{{ like.name }}</p>
            </div>
          </div>

          <!-- Conóceme (formulario de edición para el propio perfil) -->
          <div class="knowme-content" *ngIf="activeTab() === 'knowme' && isOwnProfile()">
            <app-dynamic-form
              [config]="profileFormConfig()"
              [formData]="profileFormData()"
              (onSubmitClick)="onProfileSubmit($event)"
            />
          </div>

          <!-- Conóceme (información del perfil para otros usuarios) -->
          <div class="knowme-content" *ngIf="activeTab() === 'knowme' && !isOwnProfile()">
            <div class="knowme-card">
              <h3>Conóceme</h3>
              <p class="knowme-bio">{{ userProfile()?.bio }}</p>
              <div class="knowme-info">
                <div class="knowme-item">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ userProfile()?.location }}</span>
                </div>
                <div class="knowme-item">
                  <i class="pi pi-globe"></i>
                  <span>{{ userProfile()?.website }}</span>
                </div>
                <div class="knowme-item">
                  <i class="pi pi-calendar"></i>
                  <span>Se unió en {{ userProfile()?.joinDate | date:'MMMM yyyy' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Conócenos (solo lectura para otros perfiles) -->
          <div class="knownews-content" *ngIf="activeTab() === 'knownews' && !isUser() && !isOwnProfile()">
            <div class="knownews-card">
              <h3>Sobre nosotros</h3>
              <p class="knownews-text">{{ userProfile()?.bio }}</p>
              <div class="knownews-info">
                <div class="knownews-item">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ userProfile()?.location }}</span>
                </div>
                <div class="knownews-item">
                  <i class="pi pi-globe"></i>
                  <span>{{ userProfile()?.website }}</span>
                </div>
                <div class="knownews-item">
                  <i class="pi pi-calendar"></i>
                  <span>Se unió en {{ userProfile()?.joinDate | date:'MMMM yyyy' }}</span>
                </div>
              </div>
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
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }

    .profile-header {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .profile-cover {
      height: 200px;
      overflow: hidden;
    }

    .cover-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-info {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .profile-avatar-section {
      flex-shrink: 0;
    }

    .profile-avatar {
      margin-top: -50px;
      border: 4px solid var(--bitbucket-header-bg);
    }

    .profile-actions {
      margin-top: 1rem;
      display: flex;
      gap: 0.5rem;
    }

    .profile-details {
      flex: 1;
    }

    .profile-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--bitbucket-text-primary);
      margin: 0;
    }

    .profile-meta {
      display: flex;
      gap: 1rem;
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
    }

    .profile-meta i {
      margin-right: 0.25rem;
    }

    .profile-stats {
      display: flex;
      gap: 2rem;
      padding: 1rem 1.5rem;
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      margin-top: 1rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--bitbucket-text-secondary);
    }

    .profile-tabs {
      margin-top: 1rem;
    }

    .tabs-container {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--bitbucket-border);
      padding-bottom: 0.5rem;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: none;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      color: var(--bitbucket-text-secondary);
      font-weight: 500;
      transition: all 0.2s;
    }

    .tab-button:hover {
      background-color: var(--bitbucket-bg-hover);
      color: var(--bitbucket-text-primary);
    }

    .tab-button.active {
      background-color: var(--primary-color);
      color: white;
    }

    .profile-content {
      margin-top: 1rem;
    }

    .posts-grid, .pets-grid, .products-grid, .likes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .post-card, .pet-card, .product-card, .like-card {
      position: relative;
      border-radius: 0.5rem;
      overflow: hidden;
      aspect-ratio: 1;
      background-color: var(--bitbucket-header-bg);
    }

    .post-image, .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .post-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 0.5rem;
      display: flex;
      justify-content: space-around;
      font-size: 0.875rem;
    }

    .pet-name, .product-name, .like-name {
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0.5rem 0 0 0;
      text-align: center;
    }

    .pet-breed, .product-price {
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
      text-align: center;
    }

    .like-icon {
      font-size: 2rem;
      color: var(--primary-color);
      display: block;
      text-align: center;
      margin-top: 0.5rem;
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .review-card {
      display: flex;
      gap: 1rem;
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .review-content {
      flex: 1;
    }

    .review-author {
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0 0 0.5rem 0;
    }

    .review-text {
      color: var(--bitbucket-text-secondary);
      font-size: 0.875rem;
    }

    .knowme-content, .knownews-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .knowme-card, .knownews-card {
      background-color: var(--bitbucket-header-bg);
      border-radius: 0.5rem;
      padding: 1.5rem;
    }

    .knowme-card h3, .knownews-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--bitbucket-text-primary);
      margin: 0 0 1rem 0;
    }

    .knowme-bio, .knownews-text {
      color: var(--bitbucket-text-primary);
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      line-height: 1.6;
    }

    .knowme-info, .knownews-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .knowme-item, .knownews-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--bitbucket-text-secondary);
    }

    .knowme-item i, .knownews-item i {
      color: var(--primary-color);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .profile-info {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .profile-meta {
        justify-content: center;
      }
    }
  `]
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private paramSubscription?: Subscription;

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

  // Família cargadas desde backend
  userPets = signal<Pet[]>([]);

  petSearchQuery = signal('');

  // Família formateadas para TableCardComponent
  petTableItems = computed((): TableCardItem[] => {
    return this.userPets().map(pet => ({
      id: pet.id,
      name: pet.name,
      avatar: pet.avatar,
      description: pet.breed,
    }));
  });

  // Família filtradas por búsqueda
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
  ]);

  // Reseñas del usuario
  userReviews = signal([
    { id: '1', author: 'Ana Martínez', avatar: 'https://i.pravatar.cc/150?img=10', rating: 5, text: 'Excelente profesional' },
    { id: '2', author: 'Luis Gómez', avatar: 'https://i.pravatar.cc/150?img=11', rating: 4, text: 'Muy buena atención' },
  ]);

  // Productos del vendedor
  sellerProducts = signal([
    { id: '1', name: 'Alimento Premium', price: 25.99, image: 'https://picsum.photos/150/150?random=1' },
    { id: '2', name: 'Juguete Interactivo', price: 12.50, image: 'https://picsum.photos/150/150?random=2' },
  ]);

  // Likes dados por el veterinario
  vetLikes = signal([
    { id: '1', name: 'Publicación sobre vacunas' },
    { id: '2', name: 'Consejo sobre nutrición' },
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
    });

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

      // Cargar mascotas del propio perfil
      this.loadPetsForProfile(user.id);
    }

    // Cargar perfiles de otros usuarios desde backend
    this.loadAllProfiles();
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
      },
      error: (err) => console.error('Error loading profiles:', err),
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
      },
      error: (err) => console.error('Error loading pets:', err),
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
