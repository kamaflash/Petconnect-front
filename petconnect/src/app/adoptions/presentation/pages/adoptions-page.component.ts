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
import { Router } from '@angular/router';
import { ModalComponent } from '../../../shared/presentation/components/modal/modal';
import { AdoptionService } from '../../infrastructure/services/adoption.service';
import { AvailablePetResponse } from '../../infrastructure/services/adoption.service';
import { AuthService } from '../../../auth/infrastructure/services/auth.service';
import { PetFeedGridComponent, FilterConfig, ColumnConfig } from '../components/pet-feed-grid/pet-feed-grid.component';

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
  description: string;
  personality: string[];
  image: string;
  status: 'available' | 'pending' | 'adopted';
  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;
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
    ModalComponent,
    PetFeedGridComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="adoptions-page">
      <app-pet-feed-grid
        [items]="pets()"
        itemLabel="animales"
        itemKeyField="id"
        [filterConfigs]="petFilterConfigs"
        [columnConfigs]="petColumnConfigs"
        [initialFilters]="petFilters()"
        (filtersChange)="onFiltersChange($event)"
        (itemClick)="onPetClick($event)"
      />

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

    /* Pet Detail Modal */
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

    /* Mobile */
    @media (max-width: 768px) {
      .pet-detail { grid-template-columns: 1fr; }
      .pet-detail-image { min-height: 250px; }
    }
  `]
})
export class AdoptionsPageComponent implements OnInit {
  private messageService = inject(MessageService);
  private adoptionService = inject(AdoptionService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Pet Detail
  petDetailVisible = signal(false);
  selectedPet = signal<Pet | null>(null);

  // Pets data (loaded from backend)
  pets = signal<Pet[]>([]);

  // Computed
  totalPets = computed(() => this.pets().length);
  availablePets = computed(() => this.pets().filter(p => p.status === 'available'));

  // Filters
  petFilters = signal<Record<string, any>>({});

  // Generic component configs
  petFilterConfigs: FilterConfig[] = [
    {
      type: 'text',
      key: 'searchQuery',
      label: 'Búsqueda',
      placeholder: 'Buscar por nombre o raza...'
    },
    {
      type: 'checkbox',
      key: 'selectedSpecies',
      label: 'Especie',
      options: [
        { label: 'Perro', value: 'Perro' },
        { label: 'Gato', value: 'Gato' },
        { label: 'Ave', value: 'Ave' },
        { label: 'Conejo', value: 'Conejo' },
        { label: 'Otro', value: 'Otro' }
      ]
    },
    {
      type: 'checkbox',
      key: 'selectedGenders',
      label: 'Género',
      options: [
        { label: 'Macho', value: 'male' },
        { label: 'Hembra', value: 'female' }
      ]
    },
    {
      type: 'checkbox',
      key: 'vaccinated',
      label: 'Características',
      options: [
        { label: 'Vacunado', value: 'true' },
        { label: 'Esterilizado', value: 'sterilized' },
        { label: 'Microchip', value: 'microchipped' }
      ]
    }
  ];

  petColumnConfigs: ColumnConfig[] = [
    {
      key: 'image',
      label: 'Imagen',
      type: 'image'
    },
    {
      key: 'name',
      label: 'Nombre',
      type: 'text'
    },
    {
      key: 'breed',
      label: 'Raza',
      type: 'text'
    },
    {
      key: 'age',
      label: 'Edad',
      type: 'text'
    },
    {
      key: 'location',
      label: 'Ubicación',
      type: 'text',
      icon: 'pi-map-marker'
    }
  ];

  ngOnInit(): void {
    this.loadAvailablePets();
  }

  onFiltersChange(filters: Record<string, any>): void {
    this.petFilters.set(filters);
  }

  onPetClick(pet: Pet): void {
    this.petDetailVisible.set(true);
    this.selectedPet.set(pet);
  }

  // Load available pets from the backend
  loadAvailablePets(): void {
    this.adoptionService.getAvailablePets().subscribe({
      next: (petResponses: AvailablePetResponse[]) => {
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
      description: petDetail.bio || 'Sin descripción disponible',
      personality,
      image: p.image || petDetail.avatarUrl || 'https://i.pravatar.cc/300',
      status: p.status === 'AVAILABLE' ? 'available' : p.status === 'PENDING' ? 'pending' : 'adopted',
      vaccinated: !!petDetail.lastVaccinationDate,
      sterilized: petDetail.spayedNeutered,
      microchipped: !!petDetail.microchipId,
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

  clearFilters() {
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se han restablecido todos los filtros'
    });
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
