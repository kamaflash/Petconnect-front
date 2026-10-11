import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AdoptionService } from '../../infrastructure/services/adoption.service';
import { AvailablePetResponse } from '../../infrastructure/services/adoption.service';
import { PetFeedGridComponent, FilterConfig, ColumnConfig } from '../components/pet-feed-grid/pet-feed-grid.component';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';

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
    PageHeadingCardComponent,
    TranslocoModule,
    RouterModule,
  ],
  template: `
    <div class="adoptions-page">
      <app-page-heading-card
        [title]="'adoptions.title' | transloco"
        [subtitle]="'adoptions.subtitle' | transloco"
      />

      <a class="my-requests-link" routerLink="/adoptions/my-requests">
        <i class="pi pi-list" aria-hidden="true"></i>
        {{ 'adoptions.myRequests' | transloco }}
      </a>

      <app-pet-feed-grid
        [items]="pets()"
        [itemLabel]="'adoptions.itemLabel' | transloco"
        itemKeyField="id"
        [filterConfigs]="petFilterConfigs"
        [columnConfigs]="petColumnConfigs"
        [loading]="loading()"
        [initialFilters]="petFilters()"
        (filtersChange)="onFiltersChange($event)"
        (itemClick)="onPetClick($event)"
      />
    </div>
  `,
  styles: [`
    .adoptions-page { min-height: 100vh; max-width: var(--max-page-width); margin: 0 auto; padding: 0 1rem; box-sizing: border-box; background: var(--surface-bg); }
    .my-requests-link { display: inline-flex; align-items: center; gap: .5rem; margin: .75rem 0 1rem; padding: .65rem .9rem; border: 1px solid var(--surface-border, #d9e2e8); border-radius: .75rem; color: var(--text-color, #263238); text-decoration: none; background: var(--surface-card, #fff); }
    .my-requests-link:hover { border-color: var(--primary-color, #4d7c70); }
  `]
})
export class AdoptionsPageComponent implements OnInit {
  private adoptionService = inject(AdoptionService);
  private router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  // Pets data (loaded from backend)
  pets = signal<Pet[]>([]);
  loading = signal(true);

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
      placeholder: this.transloco.translate('adoptions.searchPlaceholder'),
      searchFields: ['name', 'species', 'breed', 'location']
    },
    {
      type: 'select',
      key: 'species',
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
      type: 'select',
      key: 'gender',
      label: this.transloco.translate('adoptions.gender'),
      options: [
        { label: this.transloco.translate('adoptions.male'), value: 'male' },
        { label: this.transloco.translate('adoptions.female'), value: 'female' }
      ]
    },
    {
      type: 'select',
      key: 'vaccinated',
      label: this.transloco.translate('adoptions.characteristics'),
      options: [{ label: this.transloco.translate('adoptions.vaccinated'), value: 'true' }],
      matchValue: (item, value) => String((item as Pet).vaccinated) === value
    },
    {
      type: 'select',
      key: 'sterilized',
      label: this.transloco.translate('adoptions.sterilized'),
      options: [{ label: this.transloco.translate('adoptions.sterilized'), value: 'true' }],
      matchValue: (item, value) => String((item as Pet).sterilized) === value
    },
    {
      type: 'select',
      key: 'microchipped',
      label: this.transloco.translate('adoptions.microchip'),
      options: [{ label: this.transloco.translate('adoptions.microchip'), value: 'true' }],
      matchValue: (item, value) => String((item as Pet).microchipped) === value
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
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading available pets:', err);
        this.loading.set(false);
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
