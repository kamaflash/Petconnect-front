import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
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
    TranslocoModule,
  ],
  template: `
    <div class="adoptions-page">
      <header class="page-heading-card">
        <div class="page-heading-copy">
          <h1>{{ 'breadcrumb.adoptions' | transloco }}</h1>
        </div>
      </header>

      <app-pet-feed-grid
        [items]="pets()"
        [itemLabel]="'adoptions.itemLabel' | transloco"
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
  private readonly transloco = inject(TranslocoService);

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
      label: this.transloco.translate('adoptions.search'),
      placeholder: this.transloco.translate('adoptions.searchPlaceholder')
    },
    {
      type: 'checkbox',
      key: 'selectedSpecies',
      label: this.transloco.translate('adoptions.species'),
      options: [
        { label: this.transloco.translate('adoptions.dog'), value: 'Perro' },
        { label: this.transloco.translate('adoptions.cat'), value: 'Gato' },
        { label: this.transloco.translate('adoptions.bird'), value: 'Ave' },
        { label: this.transloco.translate('adoptions.rabbit'), value: 'Conejo' },
        { label: this.transloco.translate('adoptions.other'), value: 'Otro' }
      ]
    },
    {
      type: 'checkbox',
      key: 'selectedGenders',
      label: this.transloco.translate('adoptions.gender'),
      options: [
        { label: this.transloco.translate('adoptions.male'), value: 'male' },
        { label: this.transloco.translate('adoptions.female'), value: 'female' }
      ]
    },
    {
      type: 'checkbox',
      key: 'vaccinated',
      label: this.transloco.translate('adoptions.characteristics'),
      options: [
        { label: this.transloco.translate('adoptions.vaccinated'), value: 'true' },
        { label: this.transloco.translate('adoptions.sterilized'), value: 'sterilized' },
        { label: this.transloco.translate('adoptions.microchip'), value: 'microchipped' }
      ]
    }
  ];

  petColumnConfigs: ColumnConfig[] = [
    {
      key: 'image',
      label: this.transloco.translate('adoptions.image'),
      type: 'image'
    },
    {
      key: 'name',
      label: this.transloco.translate('adoptions.name'),
      type: 'text'
    },
    {
      key: 'breed',
      label: this.transloco.translate('adoptions.breed'),
      type: 'text'
    },
    {
      key: 'age',
      label: this.transloco.translate('adoptions.age'),
      type: 'text'
    },
    {
      key: 'location',
      label: this.transloco.translate('adoptions.location'),
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
      ? `${new Date().getFullYear() - new Date(petDetail.dateOfBirth).getFullYear()} ${this.transloco.translate('adoptions.years')}`
      : this.transloco.translate('adoptions.unknownAge');

    const personality = petDetail.temperament
      ? petDetail.temperament.split(',').map(t => t.trim())
      : [];

    return {
      id: p.id,
      petId: petDetail.id,
      name: p.name,
      species: this.translateSpecies(petDetail.species),
      breed: p.breed || this.transloco.translate('adoptions.noBreed'),
      age,
      gender: (petDetail.gender as 'male' | 'female') || 'male',
      location: petDetail.lastKnownLocation || this.transloco.translate('adoptions.unknownLocation'),
      shelter: petDetail.adoptionCenter || this.transloco.translate('adoptions.noShelter'),
      description: petDetail.bio || this.transloco.translate('adoptions.noDescription'),
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
      'dog': this.transloco.translate('adoptions.dog'),
      'cat': this.transloco.translate('adoptions.cat'),
      'bird': this.transloco.translate('adoptions.bird'),
      'rabbit': this.transloco.translate('adoptions.rabbit'),
      'hamster': this.transloco.translate('adoptions.hamster'),
      'other': this.transloco.translate('adoptions.other')
    };
    return speciesMap[species.toLowerCase()] || species;
  }
}
