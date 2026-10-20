import { Component, signal, computed, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { PetFeedGridComponent, FilterConfig, ColumnConfig } from '../../../adoptions/presentation/components/pet-feed-grid/pet-feed-grid.component';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';
import { ProfileService, UserProfileResponse } from '../../../profile/infrastructure/services/profile.service';
import { VET_SERVICES, parseVetServiceCodes } from '../../../profile/domain/vet-services';

interface Provider {
  id: string;
  name: string;
  providerType: string;
  providerTypeLabel: string;
  location: string;
  image: string;
  services: string[];
  serviceLabels: string;
}
@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    PetFeedGridComponent,
    PageHeadingCardComponent,
    TranslocoModule,
  ],
  providers: [MessageService],
  template: `
    <div class="services-page">
      <app-page-heading-card
        [title]="'services.title' | transloco"
        [subtitle]="'services.subtitle' | transloco"
      />

      <app-pet-feed-grid
        [items]="providers()"
        [itemLabel]="'services.itemLabel' | transloco"
        itemKeyField="id"
        itemLocationField="location"
        [enableDistanceFilter]="false"
        [filterConfigs]="providerFilterConfigs()"
        [columnConfigs]="providerColumnConfigs"
        [loading]="providersLoading()"
        [initialFilters]="providerFilters()"
        (filtersChange)="onFiltersChange($event)"
      />

      <p-toast />
    </div>
  `,
  styles: [`
    .services-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `],
})
export class ServicesPageComponent implements OnInit, OnDestroy {
  private readonly transloco = inject(TranslocoService);
  private readonly messageService = inject(MessageService);
  private readonly profileService = inject(ProfileService);

  providers = signal<Provider[]>([]);
  providerFilters = signal<Record<string, any>>({});

  providersLoading = signal(true);
  loadingMore = signal(false);
  providersPageNumber = signal(0);
  providersPageSize = signal(10);
  providersTotalPages = signal(1);
  providersTotalElements = signal(0);
  providersPageError = signal<string | null>(null);

  private readonly filterChanges = new Subject<void>();
  private filterSub: Subscription | null = null;
  private lastFilterKey = '';
  private providersRequestId = 0;
  private previousProviderType = '';

  /** Filtro de tipo (alineado con los `profileType` del backend). */
  private readonly providerTypeOptions = [
    { label: this.transloco.translate('services.veterinary'), value: 'vet' },
    { label: this.transloco.translate('profile.form.shelter'), value: 'shelter' },
    { label: this.transloco.translate('profile.form.seller'), value: 'seller' },
    { label: this.transloco.translate('profile.form.trainer'), value: 'trainer' },
  ];

  /** El 2º filtro (catálogo vet, multi) solo existe si el tipo es veterinario. */
  providerFilterConfigs = computed<FilterConfig[]>(() => {
    const configs: FilterConfig[] = [{
      type: 'select',
      key: 'providerType',
      label: this.transloco.translate('services.type'),
      options: this.providerTypeOptions,
      matchValue: (item, value) =>
        String((item as Provider).providerType ?? '').toLowerCase() === String(value).toLowerCase(),
    }];
    if (this.providerFilters()['providerType'] === 'vet') {
      configs.push({
        type: 'checkbox',
        key: 'services',
        label: this.transloco.translate('profile.form.services'),
        options: VET_SERVICES.map(option => ({
          label: this.transloco.translate(option.labelKey),
          value: option.code,
        })),
        // El backend ya filtra en BD; esto solo refleja el filtro en la página
        // cargada (los marcados deben estar todos — AND — en el proveedor).
        matchValue: (item, value) => (item as Provider).services.includes(value),
      });
    }
    return configs;
  });

  providerColumnConfigs: ColumnConfig[] = [
    { key: 'image', label: '', type: 'image' },
    { key: 'name', label: this.transloco.translate('services.provider'), type: 'text' },
    { key: 'providerTypeLabel', label: this.transloco.translate('services.type'), type: 'badge' },
    { key: 'serviceLabels', label: this.transloco.translate('profile.fields.services'), type: 'text', icon: 'pi-briefcase' },
    { key: 'location', label: this.transloco.translate('profile.fields.location'), type: 'text', icon: 'pi-map-marker' },
  ];

  ngOnInit(): void {
    this.lastFilterKey = this.filterKey();
    this.filterSub = this.filterChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.loadProviders(0, this.providersPageSize()));
    this.loadProviders(0, this.providersPageSize());
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
    this.filterSub = null;
  }

  onFiltersChange(filters: Record<string, unknown>): void {
    const next = { ...(filters ?? {}) };
    const providerType = typeof next['providerType'] === 'string' ? String(next['providerType']) : '';
    // Al cambiar de tipo, la selección de servicios anterior queda obsoleta.
    if (providerType !== this.previousProviderType) {
      this.previousProviderType = providerType;
      if ('services' in next) delete next['services'];
    }
    if (next['providerType'] !== 'vet' && 'services' in next) delete next['services'];
    this.providerFilters.set(next);
    this.providersLoading.set(true);
    if (this.filterKey() !== this.lastFilterKey) {
      this.lastFilterKey = this.filterKey();
      this.filterChanges.next();
    }
  }

  private filterKey(): string {
    const filters = this.providerFilters();
    const services = Array.isArray(filters['services'])
      ? [...filters['services']].sort().join(',')
      : '';
    return `${filters['providerType'] ?? ''}|${services}`;
  }

  private loadProviders(page: number, size: number): void {
    const isFirstPage = page === 0;
    const requestId = ++this.providersRequestId;
    if (isFirstPage) {
      this.providersLoading.set(true);
      this.loadingMore.set(false);
    } else {
      this.loadingMore.set(true);
    }
    this.providersPageError.set(null);

    const filters = this.providerFilters();
    const selected = Array.isArray(filters['services'])
      ? (filters['services'] as unknown[]).map(code => String(code)).filter(Boolean)
      : [];
    const providerType = typeof filters['providerType'] === 'string' && filters['providerType']
      ? String(filters['providerType'])
      : undefined;

    this.profileService.searchProviders(page, size, {
      profileType: providerType,
      services: providerType === 'vet' ? selected : undefined,
    }).subscribe({
      next: (response) => {
        if (requestId !== this.providersRequestId) return;
        this.providersPageNumber.set(response.page);
        this.providersPageSize.set(response.size);
        this.providersTotalElements.set(response.totalElements);
        this.providersTotalPages.set(Math.max(1, response.totalPages));
        const mapped = response.content.map(profile => this.toProvider(profile));
        if (isFirstPage) {
          this.providers.set(mapped);
          this.providersLoading.set(false);
        } else {
          this.providers.update(existing => [...existing, ...mapped]);
          this.loadingMore.set(false);
        }
      },
      error: (error) => {
        if (requestId !== this.providersRequestId) return;
        console.error('Error loading providers:', error);
        this.providersPageError.set(error?.message ?? 'error');
        if (isFirstPage) this.providersLoading.set(false);
        else this.loadingMore.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate('services.error'),
          detail: this.transloco.translate('services.loadError'),
        });
      },
    });
  }

  private toProvider(profile: UserProfileResponse): Provider {
    const codes = parseVetServiceCodes(profile.services);
    const labels = codes.map(code =>
      this.transloco.translate(VET_SERVICES.find(option => option.code === code)?.labelKey ?? code));
    const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
      || profile.storeName || profile.firstName;
    return {
      id: profile.id,
      name: displayName,
      providerType: profile.profileType,
      providerTypeLabel: this.typeLabel(profile.profileType),
      location: profile.location ?? '',
      image: profile.avatarUrl || 'https://i.pravatar.cc/300',
      services: codes,
      serviceLabels: labels.join(', '),
    };
  }

  private typeLabel(type: string): string {
    return this.providerTypeOptions.find(option => option.value === type)?.label ?? type;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.providersLoading() || this.loadingMore()) return;
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 200;
    const hasMorePages = this.providersPageNumber() < this.providersTotalPages() - 1;
    if (scrollPosition >= threshold && hasMorePages) {
      this.loadProviders(this.providersPageNumber() + 1, this.providersPageSize());
    }
  }
}
