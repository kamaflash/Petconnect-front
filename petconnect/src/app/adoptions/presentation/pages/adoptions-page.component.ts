import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { AdoptionService } from '../../infrastructure/services/adoption.service';
import { AvailablePetResponse } from '../../infrastructure/services/adoption.service';
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
    InputTextModule,
    FormsModule,
    CheckboxModule,
    PetFeedGridComponent,
  ],
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
    </div>
  `,
  styles: [`
    .adoptions-page { min-height: 100vh; background: var(--surface-bg); }
  `]
})
export class AdoptionsPageComponent implements OnInit {
  private adoptionService = inject(AdoptionService);
  private router = inject(Router);

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
    this.router.navigate(['/profile/pet', pet.petId]);
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
}
