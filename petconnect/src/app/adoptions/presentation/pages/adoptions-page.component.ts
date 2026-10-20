import { Component, signal, computed, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AdoptionService } from '../../infrastructure/services/adoption.service';
import { AvailablePetResponse } from '../../infrastructure/services/adoption.service';
import { PetFeedGridComponent, FilterConfig, ColumnConfig } from '../components/pet-feed-grid/pet-feed-grid.component';
import { MyAdoptionRequestsComponent } from '../components/my-adoption-requests/my-adoption-requests.component';
import { TabsComponent, Tab } from '../../../shared/presentation/components/tabs/tabs.component';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';
import { PageResponse } from '../../../shared/infrastructure/http/page-response';
import { SearchRadiusService } from '../../../shared/services/search-radius.service';

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
    MyAdoptionRequestsComponent,
    TabsComponent,
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

      <app-tabs
        [tabs]="adoptionTabs()"
        [activeTab]="activeTab()"
        (tabChange)="onTabChange($event)"
      />

      @if (activeTab() === 'pets') {
        <app-pet-feed-grid
          [items]="pets()"
          [itemLabel]="'adoptions.itemLabel' | transloco"
          itemKeyField="id"
          [filterConfigs]="petFilterConfigs"
          [enableDistanceFilter]="true"
          [columnConfigs]="petColumnConfigs"
          [loading]="loading()"
          [initialFilters]="petFilters()"
          (filtersChange)="onFiltersChange($event)"
          (itemClick)="onPetClick($event)"
        />

      } @else {
        <app-my-adoption-requests />
      }
    </div>
  `,
  styles: [`
    .adoptions-page { min-height: 100vh; max-width: var(--max-page-width); margin: 0 auto; padding: 0 1rem; box-sizing: border-box; background: var(--surface-bg); }
  `]
})
export class AdoptionsPageComponent implements OnInit {
  private adoptionService = inject(AdoptionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly transloco = inject(TranslocoService);
  readonly searchRadius = inject(SearchRadiusService);


  // Pets data (loaded from backend)
  pets = signal<Pet[]>([]);
  loading = signal(true);
  // Paginación del listado de mascotas
  availablePage = signal<PageResponse<AvailablePetResponse> | null>(null);
  availablePageNumber = signal(0);
  availablePageSize = signal(10);
  availableTotalPages = signal(1);
  availableTotalElements = signal(0);
  loadingMore = signal(false);

  // Tabs: listado de animales primero, mis solicitudes después
  activeTab = signal('pets');

  adoptionTabs = computed((): Tab[] => [
    {
      id: 'pets',
      label: this.transloco.translate('adoptions.petsTab'),
      icon: 'pi-heart',
      iconType: 'prime' as const,
    },
    {
      id: 'requests',
      label: this.transloco.translate('adoptions.myRequests'),
      icon: 'pi-list',
      iconType: 'prime' as const,
    },
  ]);

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
    // Soporta enlace profundo ?tab=requests (p. ej. desde la ruta alias my-requests)
    const initialTab = this.route.snapshot.queryParamMap.get('tab');
    if (initialTab === 'requests' || initialTab === 'pets') {
      this.activeTab.set(initialTab);
    }
    // Ubicación de referencia para el filtro global de distancia
    this.searchRadius.resolveOrigin().subscribe();
    this.loadAvailablePets();
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
    // Refleja el tab en la URL sin recargar, para que sea compartible
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: tabId === 'pets' ? {} : { tab: tabId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onFiltersChange(filters: Record<string, any>): void {
    this.petFilters.set(filters);
  }

  onPetClick(pet: Pet): void {
    this.router.navigate(['/profile/pet', pet.petId]);
  }

  // Load available pets from the backend
  loadAvailablePets(page = 0, size = 10): void {
    const isFirstPage = page === 0;
    if (isFirstPage) {
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    this.adoptionService.getAvailablePets(page, size).subscribe({
      next: (page) => {
        this.availablePage.set(page);
        this.availablePageNumber.set(page.page);
        this.availablePageSize.set(page.size);
        this.availableTotalPages.set(page.totalPages);
        this.availableTotalElements.set(page.totalElements);

        const mapped = page.content.filter(p => p.pet.availableForAdoption).map(p => this.mapPetResponseToPet(p));
        if (isFirstPage) {
          this.pets.set(mapped);
          this.loading.set(false);
        } else {
          this.pets.update(existing => [...existing, ...mapped]);
          this.loadingMore.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading available pets:', err);
        if (isFirstPage) {
          this.loading.set(false);
        } else {
          this.loadingMore.set(false);
        }
      }
    });
  }

  prevAvailablePage(): void {
    this.loadAvailablePets(Math.max(0, this.availablePageNumber() - 1), this.availablePageSize());
  }

  nextAvailablePage(): void {
    const next = this.availablePageNumber() + 1;
    if (next < this.availableTotalPages()) {
      this.loadAvailablePets(next, this.availablePageSize());
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.loading() || this.loadingMore()) return;
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 200;
    const hasMorePages = this.availablePageNumber() < this.availableTotalPages() - 1;
    if (scrollPosition >= threshold && hasMorePages) {
      this.loadAvailablePets(this.availablePageNumber() + 1, this.availablePageSize());
    }
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
