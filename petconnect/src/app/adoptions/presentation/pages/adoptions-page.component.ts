import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';
import { AdoptionService } from '../../infrastructure/services/adoption.service';
import { AvailablePetResponse } from '../../infrastructure/services/adoption.service';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';

interface Pet {
  id: string;
  petId: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: 'male' | 'female';
  location: string;
  shelter: string;
  shelterImage: string;
  description: string;
  personality: string[];
  image: string;
  images: string[];
  status: 'available' | 'pending' | 'adopted';
  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;
  arrivalDate: Date;
}

@Component({
  selector: 'app-adoptions-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    SelectModule,
    CheckboxModule,
    ToastModule,
    RouterLink,
    ModalComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="adoptions-page">
      <!-- Header -->
      <div class="adoptions-header">
        <div class="header-content">
          <div class="header-left">
            <h3>Adopta una Mascota</h3>
            <p>Encuentra a tu nuevo mejor amigo</p>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-value">{{ availablePets().length }}</span>
              <span class="stat-label">Disponibles</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ totalPets() }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>
      </div>

      <div class="adoptions-container">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar">
          <div class="filter-section">
            <h3>Búsqueda</h3>
            <div class="search-filter">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                placeholder="Buscar por nombre..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilters()"
              />
            </div>
          </div>

          <div class="filter-section">
            <h3>Especie</h3>
            <div class="filter-options">
              @for (species of speciesOptions; track species) {
                <div class="filter-option">
                  <p-checkbox
                    [inputId]="species"
                    [value]="species"
                    [(ngModel)]="selectedSpecies"
                    (onChange)="applyFilters()"
                  />
                  <label [for]="species">{{ species }}</label>
                </div>
              }
            </div>
          </div>

          <div class="filter-section">
            <h3>Género</h3>
            <div class="filter-options">
              <div class="filter-option">
                <p-checkbox
                  inputId="male"
                  [value]="'male'"
                  [(ngModel)]="selectedGenders"
                  (onChange)="applyFilters()"
                />
                <label for="male">Macho</label>
              </div>
              <div class="filter-option">
                <p-checkbox
                  inputId="female"
                  [value]="'female'"
                  [(ngModel)]="selectedGenders"
                  (onChange)="applyFilters()"
                />
                <label for="female">Hembra</label>
              </div>
            </div>
          </div>

          <div class="filter-section">
            <h3>Características</h3>
            <div class="filter-options">
              <div class="filter-option">
                <p-checkbox
                  inputId="vaccinated"
                  [(ngModel)]="filters.vaccinated"
                  (onChange)="applyFilters()"
                />
                <label for="vaccinated">Vacunado</label>
              </div>
              <div class="filter-option">
                <p-checkbox
                  inputId="sterilized"
                  [(ngModel)]="filters.sterilized"
                  (onChange)="applyFilters()"
                />
                <label for="sterilized">Esterilizado</label>
              </div>
              <div class="filter-option">
                <p-checkbox
                  inputId="microchipped"
                  [(ngModel)]="filters.microchipped"
                  (onChange)="applyFilters()"
                />
                <label for="microchipped">Microchip</label>
              </div>
            </div>
          </div>

          <button class="clear-filters-btn" (click)="clearFilters()">
            <i class="pi pi-times"></i>
            Limpiar filtros
          </button>
        </aside>

        <!-- Main Content -->
        <main class="pets-main">
          <!-- Results count -->
          <div class="results-header">
            <div class="results-count">
              {{ filteredPets().length }} animal{{ filteredPets().length !== 1 ? 'es' : '' }} encontrado{{ filteredPets().length !== 1 ? 's' : '' }}
            </div>
          </div>

          <!-- Pets Grid -->
          <div class="pets-grid">
            @for (pet of filteredPets(); track pet.id) {
              <div class="pet-card" (click)="goToPetProfile(pet)">
                <div class="pet-image-container">
                  <img [src]="pet.image" [alt]="pet.name" />
                  @if (pet.status !== 'available') {
                    <div class="pet-status-overlay">
                      <span class="status-badge" [class]="'status-' + pet.status">
                        {{ getStatusLabel(pet.status) }}
                      </span>
                    </div>
                  }
                </div>
                <div class="pet-info">
                  <div class="pet-header">
                    <h3>{{ pet.name }}</h3>
                    <span class="pet-gender">
                      <i class="pi" [class.pi-mars]="pet.gender === 'male'" [class.pi-venus]="pet.gender === 'female'"></i>
                    </span>
                  </div>
                  <p class="pet-breed">{{ pet.breed }}</p>
                  <p class="pet-age">{{ pet.age }}</p>
                  <div class="pet-tags">
                    @if (pet.vaccinated) {
                      <span class="pet-tag">Vacunado</span>
                    }
                    @if (pet.sterilized) {
                      <span class="pet-tag">Esterilizado</span>
                    }
                    @if (pet.microchipped) {
                      <span class="pet-tag">Microchip</span>
                    }
                  </div>
                  <div class="pet-location">
                    <i class="pi pi-map-marker"></i>
                    <span>{{ pet.location }}</span>
                  </div>
                </div>
              </div>
            }
          </div>

          @if (filteredPets().length === 0) {
            <div class="no-pets">
              <i class="pi pi-pets"></i>
              <p>No se encontraron animales con estos criterios</p>
              <button class="clear-filters-btn" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </div>
          }
        </main>
      </div>

      <!-- Pet Detail Modal -->
      <app-modal
        [visible]="petDetailVisible()"
        [showCancel]="false"
        (onHide)="petDetailVisible.set(false)"
      >
        @if (selectedPet(); as pet) {
          <div class="pet-detail">
            <div class="pet-detail-image">
              <img [src]="pet.image" [alt]="pet.name" />
            </div>
            <div class="pet-detail-info">
              <div class="pet-detail-header">
                <div>
                  <h2>{{ pet.name }}</h2>
                  <p class="pet-breed-detail">{{ pet.breed }}</p>
                </div>
                <span class="pet-gender-icon">
                  <i class="pi" [class.pi-mars]="pet.gender === 'male'" [class.pi-venus]="pet.gender === 'female'"></i>
                </span>
              </div>

              <div class="pet-meta">
                <div class="meta-item">
                  <i class="pi pi-calendar"></i>
                  <span>{{ pet.age }}</span>
                </div>
                <div class="meta-item">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ pet.location }}</span>
                </div>
                <div class="meta-item">
                  <i class="pi pi-building"></i>
                  <span>{{ pet.shelter }}</span>
                </div>
              </div>

              <div class="pet-characteristics">
                <h3>Características</h3>
                <div class="characteristics-list">
                  <span class="characteristic-item" [class.active]="pet.vaccinated">
                    <i class="pi pi-check-circle"></i>
                    Vacunado
                  </span>
                  <span class="characteristic-item" [class.active]="pet.sterilized">
                    <i class="pi pi-check-circle"></i>
                    Esterilizado
                  </span>
                  <span class="characteristic-item" [class.active]="pet.microchipped">
                    <i class="pi pi-check-circle"></i>
                    Microchip
                  </span>
                </div>
              </div>

              <div class="pet-description">
                <h3>Sobre {{ pet.name }}</h3>
                <p>{{ pet.description }}</p>
              </div>

              <div class="pet-personality">
                <h3>Personalidad</h3>
                <div class="personality-tags">
                  @for (trait of pet.personality; track trait) {
                    <span class="personality-tag">{{ trait }}</span>
                  }
                </div>
              </div>

              <div class="pet-actions">
                @if (pet.status === 'available') {
                  <button class="adopt-btn" (click)="requestAdoption(pet)">
                    <i class="pi pi-heart"></i>
                    Solicitar Adopción
                  </button>
                } @else if (pet.status === 'pending') {
                  <button class="pending-btn" disabled>
                    <i class="pi pi-clock"></i>
                    Solicitud Pendiente
                  </button>
                } @else {
                  <button class="adopted-btn" disabled>
                    <i class="pi pi-check"></i>
                    Adoptado
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </app-modal>
    </div>
  `,
  styles: [`
    .adoptions-page { min-height: 100vh; background: var(--surface-bg); }
    .adoptions-header { padding: 2rem 0; margin-bottom: 2rem; }
    .header-content { max-width: 1400px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .header-left h1 { margin: 0; font-size: 2rem; font-weight: 700; color: white; }
    .header-left p { margin: 0.25rem 0 0; color: rgba(255,255,255,0.9); font-size: 1rem; }
    .header-stats { display: flex; align-items: center; gap: 2rem; background: rgba(255,255,255,0.15); padding: 1rem 2rem; border-radius: var(--radius-md); backdrop-filter: blur(10px); }
    .stat-item { text-align: center; }
    .stat-value { display: block; font-size: 1.5rem; font-weight: 400; color: white; }
    .stat-label { font-size: 0.875rem; color: rgba(255,255,255,0.9); }
    .stat-divider { width: 1px; height: 3rem; background: rgba(255,255,255,0.3); }
    .adoptions-container { max-width: 1400px; margin: 0 auto; padding: 0 2rem 2rem; display: grid; grid-template-columns: 280px 1fr; gap: 2rem; }
    .filters-sidebar { background: var(--surface-card); border-radius: var(--radius-md); padding: 1.5rem; height: fit-content; position: sticky; top: 1rem; }
    .filter-section { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--surface-border); }
    .filter-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .filter-section h3 { margin: 0 0 1rem; font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
    .search-filter { position: relative; }
    .search-filter i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); }
    .search-filter input { width: 100%; padding: 0.625rem 1rem 0.625rem 2.5rem; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); background: var(--surface-hover); color: var(--text-primary); }
    .filter-options { display: flex; flex-direction: column; gap: 0.75rem; }
    .filter-option { display: flex; align-items: center; gap: 0.5rem; }
    .filter-option label { font-size: 0.875rem; color: var(--text-secondary); cursor: pointer; }
    .clear-filters-btn { width: 100%; padding: 0.75rem; background: none; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .clear-filters-btn:hover { background: var(--surface-hover); color: var(--text-primary); }
    .pets-main { min-height: 600px; }
    .results-header { margin-bottom: 1.5rem; }
    .results-count { font-size: 0.875rem; color: var(--text-secondary); }
    .pets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .pet-card { background: var(--surface-card); border-radius: var(--radius-md); overflow: hidden; transition: all var(--transition-fast); cursor: pointer; }
    .pet-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .pet-image-container { position: relative; width: 100%; height: 250px; overflow: hidden; background: var(--surface-hover); }
    .pet-image-container img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-normal); }
    .pet-card:hover .pet-image-container img { transform: scale(1.05); }
    .pet-status-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
    .status-badge { padding: 0.5rem 1.5rem; border-radius: var(--radius-full); font-weight: 600; font-size: 0.875rem; }
    .status-pending { background: #fbbf24; color: white; }
    .status-adopted { background: #10b981; color: white; }
    .pet-info { padding: 1.25rem; }
    .pet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .pet-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text-primary); }
    .pet-gender { font-size: 1.25rem; color: var(--primary-color); }
    .pet-breed { margin: 0 0 0.5rem; font-size: 0.875rem; color: var(--text-secondary); }
    .pet-age { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--text-secondary); }
    .pet-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .pet-tag { padding: 0.25rem 0.5rem; background: var(--primary-color-light); color: var(--primary-color); border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 500; }
    .pet-location { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-tertiary); }
    .pet-location i { color: var(--primary-color); }
    .no-pets { text-align: center; padding: 4rem 2rem; background: var(--surface-card); border-radius: var(--radius-md); }
    .no-pets i { font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem; }
    .no-pets p { font-size: 1.125rem; color: var(--text-secondary); margin: 0 0 1rem; }
    .pet-detail { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .pet-detail-image { border-radius: var(--radius-md); overflow: hidden; height: 100%; min-height: 400px; }
    .pet-detail-image img { width: 100%; height: 100%; object-fit: cover; }
    .pet-detail-info { display: flex; flex-direction: column; gap: 1.5rem; }
    .pet-detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .pet-detail-header h2 { margin: 0; font-size: 1.75rem; }
    .pet-breed-detail { margin: 0.5rem 0 0; font-size: 1rem; color: var(--text-secondary); }
    .pet-gender-icon { font-size: 2rem; color: var(--primary-color); }
    .pet-meta { display: flex; flex-direction: column; gap: 0.75rem; }
    .meta-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: var(--text-secondary); }
    .meta-item i { color: var(--primary-color); width: 1.25rem; }
    .pet-characteristics h3, .pet-description h3, .pet-personality h3 { margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600; }
    .characteristics-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .characteristic-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-tertiary); }
    .characteristic-item.active { color: #10b981; }
    .characteristic-item i { font-size: 1rem; }
    .pet-description p { margin: 0; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; }
    .personality-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .personality-tag { padding: 0.5rem 1rem; background: var(--primary-color-light); color: var(--primary-color); border-radius: var(--radius-full); font-size: 0.875rem; font-weight: 500; }
    .pet-actions { margin-top: auto; }
    .adopt-btn, .pending-btn, .adopted-btn { width: 100%; padding: 1rem; border: none; border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; font-size: 1rem; transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .adopt-btn { background: var(--primary-color); color: white; }
    .adopt-btn:hover { background: var(--primary-color-dark); transform: translateY(-2px); }
    .pending-btn { background: #fbbf24; color: white; cursor: not-allowed; opacity: 0.7; }
    .adopted-btn { background: #10b981; color: white; cursor: not-allowed; opacity: 0.7; }
    @media (max-width: 1024px) { .adoptions-container { grid-template-columns: 1fr; } .filters-sidebar { display: none; } }
    @media (max-width: 768px) { .header-content { flex-direction: column; align-items: stretch; } .header-stats { width: 100%; justify-content: center; } .pets-grid { grid-template-columns: 1fr; } .pet-detail { grid-template-columns: 1fr; } .pet-detail-image { min-height: 250px; } }
  `]
})
export class AdoptionsPageComponent implements OnInit {
  private messageService = inject(MessageService);
  private adoptionService = inject(AdoptionService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Filters
  searchQuery = '';
  speciesOptions = ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro'];
  selectedSpecies: string[] = [];
  selectedGenders: string[] = [];
  filters = {
    vaccinated: false,
    sterilized: false,
    microchipped: false
  };

  // Pet Detail
  petDetailVisible = signal(false);
  selectedPet = signal<Pet | null>(null);

  // Pets data (loaded from backend)
  pets = signal<Pet[]>([]);

  // Computed
  totalPets = computed(() => this.pets().length);
  availablePets = computed(() => this.pets().filter(p => p.status === 'available'));

  filteredPets = computed(() => {
    let result = [...this.pets()];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.breed.toLowerCase().includes(query)
      );
    }

    if (this.selectedSpecies.length > 0) {
      result = result.filter(p => this.selectedSpecies.includes(p.species));
    }

    if (this.selectedGenders.length > 0) {
      result = result.filter(p => this.selectedGenders.includes(p.gender));
    }

    if (this.filters.vaccinated) {
      result = result.filter(p => p.vaccinated);
    }
    if (this.filters.sterilized) {
      result = result.filter(p => p.sterilized);
    }
    if (this.filters.microchipped) {
      result = result.filter(p => p.microchipped);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadAvailablePets();
  }

  // Load available pets from the backend
  loadAvailablePets(): void {
    this.adoptionService.getAvailablePets().subscribe({
      next: (petResponses: AvailablePetResponse[]) => {
        // Filter only pets available for adoption and map to Pet interface
        const mappedPets: Pet[] = petResponses
          .filter(p => p.pet.availableForAdoption)
          .map(p => this.mapPetResponseToPet(p));
        this.pets.set(mappedPets);
      },
      error: (err) => {
        console.error('Error loading available pets:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las mascotas disponibles'
        });
      }
    });
  }

  // Map PetResponse from backend to the Pet interface used in the UI
  mapPetResponseToPet(p: AvailablePetResponse): Pet {
    const petDetail = p.pet;
    const age = petDetail.dateOfBirth
      ? `${new Date().getFullYear() - new Date(petDetail.dateOfBirth).getFullYear()} años`
      : 'Edad desconocida';

    const personality = petDetail.temperament
      ? petDetail.temperament.split(',').map(t => t.trim())
      : [];

    return {
      id: p.id,
      petId: petDetail.id,
      name: p.name,
      species: this.translateSpecies(petDetail.species),
      breed: p.breed || 'Sin raza',
      age,
      gender: (petDetail.gender as 'male' | 'female') || 'male',
      location: petDetail.lastKnownLocation || 'Ubicación desconocida',
      shelter: petDetail.adoptionCenter || 'Sin refugio',
      shelterImage: '',
      description: petDetail.bio || 'Sin descripción disponible',
      personality,
      image: p.image || petDetail.avatarUrl || 'https://i.pravatar.cc/300',
      images: petDetail.imageUrls || [],
      status: p.status === 'AVAILABLE' ? 'available' : p.status === 'PENDING' ? 'pending' : 'adopted',
      vaccinated: !!petDetail.lastVaccinationDate,
      sterilized: petDetail.spayedNeutered,
      microchipped: !!petDetail.microchipId,
      arrivalDate: petDetail.adoptionDate ? new Date(petDetail.adoptionDate) : new Date()
    };
  }

  translateSpecies(species: string): string {
    const speciesMap: Record<string, string> = {
      'dog': 'Perro',
      'cat': 'Gato',
      'bird': 'Ave',
      'rabbit': 'Conejo',
      'hamster': 'Hámster',
      'other': 'Otro'
    };
    return speciesMap[species.toLowerCase()] || species;
  }

  // Methods
  applyFilters() {
    // Filters are applied automatically via computed property
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedSpecies = [];
    this.selectedGenders = [];
    this.filters = {
      vaccinated: false,
      sterilized: false,
      microchipped: false
    };
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se han restablecido todos los filtros'
    });
  }

  goToPetProfile(pet: Pet) {
    this.router.navigate(['/profile/pet', pet.petId]);
  }

  requestAdoption(pet: Pet) {
    const user = this.authService.user();
    if (!user) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Inicia sesión',
        detail: 'Debes iniciar sesión para solicitar una adopción'
      });
      return;
    }

    this.adoptionService.requestAdoption({ petId: pet.id }).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Solicitud enviada',
          detail: `Tu solicitud de adopción para ${pet.name} ha sido enviada al refugio`
        });
        this.petDetailVisible.set(false);
        // Update the pet status to pending
        this.pets.update(pets =>
          pets.map(p => p.id === pet.id ? { ...p, status: 'pending' } : p)
        );
      },
      error: (err) => {
        console.error('Error requesting adoption:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar la solicitud de adopción. Inténtalo de nuevo.'
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'pending':
        return 'Pendiente';
      case 'adopted':
        return 'Adoptado';
      default:
        return status;
    }
  }
}
