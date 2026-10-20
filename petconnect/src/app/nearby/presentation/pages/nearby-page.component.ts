import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TranslocoModule } from '@jsverse/transloco';
import { PageHeadingCardComponent } from '../../../shared/presentation/components/page-heading-card/page-heading-card.component';
import { PetFeedGridComponent, FilterConfig, ColumnConfig } from '../../../adoptions/presentation/components/pet-feed-grid/pet-feed-grid.component';
import { ProfileService, UserProfileResponse } from '../../../profile/infrastructure/services/profile.service';
import { SocialService, EventResponse } from '../../../social/infrastructure/services/social.service';

interface NearbyItem {
  id: string;
  name: string;
  itemType: 'vet' | 'shelter' | 'event';
  itemTypeLabel: string;
  location: string;
  image: string;
  detail: string;
}

@Component({
  selector: 'app-nearby-page',
  standalone: true,
  imports: [CommonModule, ToastModule, FormsModule, TranslocoModule, PetFeedGridComponent, PageHeadingCardComponent],
  providers: [MessageService],
  template: `
    <div class="nearby-page" [class.dark]="isDarkMode()">
      <div class="nearby-container">
        <app-page-heading-card
          title="Servicios cercanos"
          subtitle="Encuentra veterinarios, protectoras y eventos cerca de ti"
        />
        <app-pet-feed-grid
          [items]="items()"
          [itemLabel]="'nearby.itemLabel' | transloco"
          itemKeyField="id"
          itemLocationField="location"
          [enableDistanceFilter]="true"
          [filterConfigs]="nearbyFilterConfigs()"
          [columnConfigs]="nearbyColumnConfigs"
          [loading]="loading()"
          [initialFilters]="nearbyFilters()"
          (filtersChange)="onFiltersChange($event)"
        />
        <p-toast />
      </div>
    </div>
  `,
  styles: [`
    .nearby-page { min-height: 100vh; background: var(--surface-ground); transition: background 0.3s ease; }
    .dark .nearby-page { background: var(--surface-ground-dark); }
    .nearby-container { max-width: var(--max-page-width); margin: 0 auto; padding: 0 1rem 2rem; }
  `]
})
export class NearbyPageComponent implements OnInit, OnDestroy {
  private readonly messageService = inject(MessageService);
  private readonly profileService = inject(ProfileService);
  private readonly socialService = inject(SocialService);

  items = signal<NearbyItem[]>([]);
  nearbyFilters = signal<Record<string, any>>({});
  loading = signal(true);
  loadingMore = signal(false);
  pageNumber = signal(0);
  pageSize = signal(10);
  totalPages = signal(1);
  totalElements = signal(0);
  pageError = signal<string | null>(null);
  isDarkMode = signal<boolean>(false);

  private readonly filterChanges = new Subject<void>();
  private filterSub: any = null;
  private lastFilterKey = '';
  private requestId = 0;

  private readonly serviceTypeOptions = [
    { label: 'Veterinarios', value: 'vet' },
    { label: 'Protectoras', value: 'shelter' },
    { label: 'Eventos', value: 'event' },
  ];

  readonly nearbyColumnConfigs: ColumnConfig[] = [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'location', label: 'Ubicación', type: 'text' },
    { key: 'detail', label: 'Detalle', type: 'text' },
  ];

  nearbyFilterConfigs = computed<FilterConfig[]>(() => [
    {
      type: 'select',
      key: 'serviceType',
      label: 'Tipo de servicio',
      options: this.serviceTypeOptions,
      matchValue: (item: unknown, value: string) =>
        String((item as NearbyItem).itemType ?? '').toLowerCase() === value.toLowerCase(),
    },
  ]);

  ngOnInit(): void {
    this.detectDarkMode();
    this.filterSub = this.filterChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        const key = this.filterKey();
        if (key === this.lastFilterKey) {
          this.loading.set(false);
          return;
        }
        this.lastFilterKey = key;
        this.loadItems(0, this.pageSize());
      });
    this.lastFilterKey = this.filterKey();
    this.loadItems(0, this.pageSize());
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
    this.filterSub = null;
  }

  onFiltersChange(filters: Record<string, unknown>): void {
    this.nearbyFilters.set({ ...(filters ?? {}) });
    this.loading.set(true);
    this.filterChanges.next();
  }

  private filterKey(): string {
    const f = this.nearbyFilters();
    return `${f['serviceType'] ?? ''}`;
  }

  private loadItems(page: number, size: number): void {
    const isFirst = page === 0;
    const req = ++this.requestId;
    if (isFirst) {
      this.loading.set(true);
      this.loadingMore.set(false);
    } else {
      this.loadingMore.set(true);
    }
    this.pageError.set(null);
    const f = this.nearbyFilters();
    const st = typeof f['serviceType'] === 'string' && f['serviceType'] ? String(f['serviceType']) : '';
    if (st === 'event') {
      this.socialService.getAllEvents().subscribe({
        next: (events) => {
          if (req !== this.requestId) {
            return;
          }
          this.pageNumber.set(0);
          this.totalElements.set(events.length);
          this.totalPages.set(1);
          this.items.set(events.map((e) => this.toEventItem(e)));
          this.loading.set(false);
        },
        error: (e) => {
          if (req !== this.requestId) {
            return;
          }
          console.error('Error loading events:', e);
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los eventos',
          });
        },
      });
      return;
    }
    const pt = st === 'vet' || st === 'shelter' ? st : undefined;
    this.profileService.searchProviders(page, size, { profileType: pt }).subscribe({
      next: (response) => {
        if (req !== this.requestId) {
          return;
        }
        // Excluir perfiles tipo "usuario" cuando no hay tipo de servicio seleccionado
        const content = !pt
          ? response.content.filter((p) => p.profileType !== 'usuario')
          : response.content;
        this.pageNumber.set(response.page);
        this.pageSize.set(response.size);
        this.totalElements.set(content.length);
        this.totalPages.set(Math.max(1, response.totalPages));
        this.items.set(content.map((profile) => this.toProviderItem(profile)));
        this.loading.set(false);
      },
      error: (e) => {
        if (req !== this.requestId) {
          return;
        }
        console.error('Error loading providers:', e);
        this.pageError.set(e?.message ?? 'error');
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los proveedores',
        });
      },
    });
  }

  private toProviderItem(profile: UserProfileResponse): NearbyItem {
    const name =
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
      profile.storeName ||
      profile.firstName;
    return {
      id: profile.id,
      name,
      itemType: profile.profileType === 'vet' ? 'vet' : 'shelter',
      itemTypeLabel: this.typeLabel(profile.profileType),
      location: profile.location ?? '',
      image: profile.avatarUrl || 'https://i.pravatar.cc/300',
      detail: profile.specialty ?? '',
    };
  }

  private toEventItem(event: EventResponse): NearbyItem {
    return {
      id: event.id,
      name: event.title,
      itemType: 'event',
      itemTypeLabel: this.typeLabel('event'),
      location: event.location ?? '',
      image: event.imageUrl || 'https://picsum.photos/400/200?random=13',
      detail: event.description ?? '',
    };
  }

  private typeLabel(type: string): string {
    return this.serviceTypeOptions.find((o) => o.value === type)?.label ?? type;
  }

  private detectDarkMode(): void {
    const dark = document.documentElement.classList.contains('dark');
    this.isDarkMode.set(dark);
    const obs = new MutationObserver(() =>
      this.isDarkMode.set(document.documentElement.classList.contains('dark')),
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

}