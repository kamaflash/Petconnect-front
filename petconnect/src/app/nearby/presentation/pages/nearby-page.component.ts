import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GeolocationService, Coordinates, GeocodingResult } from '../../../shared/services/geolocation.service';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

interface NearbyService {
  id: string;
  name: string;
  type: 'vet' | 'shelter' | 'event';
  category: string;
  location: string;
  distance: number;
  rating?: number;
  image?: string;
  description?: string;
  phone?: string;
  website?: string;
}

@Component({
  selector: 'app-nearby-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    SelectModule,
    ProgressSpinnerModule,
    FormsModule,
    RouterLink
  ],
  providers: [MessageService],
  template: `
    <div class="nearby-page" [class.dark]="isDarkMode()">
      <div class="nearby-container">
        <!-- Header -->
        <div class="nearby-header">
          <h1 class="nearby-title">
            <i class="pi pi-map-marker"></i>
            Servicios Cercanos
          </h1>
          <p class="nearby-subtitle">
            Encuentra veterinarios, protectoras y eventos cerca de ti
          </p>
        </div>

        <!-- Filtros -->
        <div class="nearby-filters">
          <div class="filter-group">
            <label class="filter-label">Radio de búsqueda</label>
            <p-select
              [(ngModel)]="searchRadius"
              [options]="radiusOptions"
              optionLabel="label"
              optionValue="value"
              class="filter-select"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Tipo de servicio</label>
            <p-select
              [(ngModel)]="serviceType"
              [options]="serviceTypeOptions"
              optionLabel="label"
              optionValue="value"
              [showClear]="true"
              class="filter-select"
            />
          </div>

          <button
            pButton
            icon="pi pi-crosshair"
            label="Mi ubicación"
            class="p-button-outlined"
            (click)="useCurrentLocation()"
            [disabled]="loading()"
          ></button>
        </div>

        <!-- Estado de carga -->
        <div class="nearby-loading" *ngIf="loading()">
          <p-progressSpinner [style]="{'width': '60px', 'height': '60px'}"></p-progressSpinner>
          <p>Buscando servicios cercanos...</p>
        </div>

        <!-- Error -->
        <div class="nearby-error" *ngIf="error()">
          <i class="pi pi-exclamation-triangle"></i>
          <div class="error-content">
            <h3>Error</h3>
            <p>{{ error() }}</p>
            <button pButton label="Reintentar" (click)="useCurrentLocation()"></button>
          </div>
        </div>

        <!-- Sin ubicación -->
        <div class="nearby-no-location" *ngIf="!loading() && !error() && !userLocation()">
          <i class="pi pi-map-marker"></i>
          <h3>Sin ubicación</h3>
          <p>Activa tu ubicación para encontrar servicios cercanos</p>
          <button pButton label="Activar ubicación" icon="pi pi-crosshair" (click)="useCurrentLocation()"></button>
        </div>

        <!-- Resultados -->
        <div class="nearby-results" *ngIf="!loading() && !error() && userLocation()">
          <div class="results-header">
            <h3 class="results-title">
              {{ filteredServices().length }} {{ filteredServices().length === 1 ? 'resultado' : 'resultados' }}
              encontrados
            </h3>
            <span class="results-location">
              <i class="pi pi-map-marker"></i>
              {{ currentAddress() }}
            </span>
          </div>

          <!-- Lista de servicios -->
          <div class="services-grid">
            <div class="service-card" *ngFor="let service of filteredServices()">
              <div class="service-image" *ngIf="service.image">
                <img [src]="service.image" [alt]="service.name" />
              </div>

              <div class="service-content">
                <div class="service-header">
                  <h3 class="service-name">{{ service.name }}</h3>
                  <span class="service-type" [ngClass]="'type-' + service.type">
                    {{ getServiceTypeLabel(service.type) }}
                  </span>
                </div>

                <p class="service-category">{{ service.category }}</p>

                <p class="service-description" *ngIf="service.description">
                  {{ service.description }}
                </p>

                <div class="service-info">
                  <div class="info-item">
                    <i class="pi pi-map-marker"></i>
                    <span>{{ service.location }}</span>
                  </div>

                  <div class="info-item">
                    <i class="pi pi-road"></i>
                    <span class="distance">{{ service.distance | number:'1.1' }} km</span>
                  </div>

                  <div class="info-item" *ngIf="service.rating">
                    <i class="pi pi-star-fill"></i>
                    <span>{{ service.rating }} / 5.0</span>
                  </div>

                  <div class="info-item" *ngIf="service.phone">
                    <i class="pi pi-phone"></i>
                    <span>{{ service.phone }}</span>
                  </div>
                </div>

                <div class="service-actions">
                  <a
                    *ngIf="service.website"
                    [href]="'https://' + service.website"
                    target="_blank"
                    class="p-button p-button-sm p-button-outlined"
                  >
                    <i class="pi pi-globe"></i>
                    Web
                  </a>
                  <button pButton label="Ver detalles" class="p-button-sm"></button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sin resultados -->
          <div class="no-results" *ngIf="filteredServices().length === 0">
            <i class="pi pi-info-circle"></i>
            <h3>No se encontraron resultados</h3>
            <p>Intenta ampliar el radio de búsqueda o cambiar los filtros</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nearby-page {
      min-height: 100vh;
      background: var(--surface-ground);
      transition: background 0.3s ease;
    }

    .dark .nearby-page {
      background: var(--surface-ground-dark);
    }

    .nearby-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    /* Header */
    .nearby-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .nearby-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .nearby-title i {
      color: var(--primary-color);
    }

    .nearby-subtitle {
      font-size: 1rem;
      color: var(--text-secondary);
      margin: 0;
    }

    /* Filters */
    .nearby-filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--surface-card);
      border-radius: 12px;
      flex-wrap: wrap;
      align-items: flex-end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      min-width: 200px;
    }

    .filter-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .filter-select {
      width: 100%;
    }

    .nearby-filters .p-button {
      height: 42px;
    }

    /* Loading */
    .nearby-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1.5rem;
    }

    .nearby-loading p {
      color: var(--text-secondary);
      font-size: 1rem;
    }

    /* Error */
    .nearby-error {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .dark .nearby-error {
      background: #450a0a;
      border-color: #7f1d1d;
    }

    .nearby-error i {
      font-size: 3rem;
      color: #dc2626;
    }

    .error-content h3 {
      margin: 0 0 0.5rem 0;
      color: #dc2626;
      font-size: 1.125rem;
    }

    .error-content p {
      margin: 0 0 1rem 0;
      color: var(--text-secondary);
    }

    /* No Location */
    .nearby-no-location {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      gap: 1rem;
    }

    .nearby-no-location i {
      font-size: 4rem;
      color: var(--text-secondary);
      opacity: 0.5;
    }

    .nearby-no-location h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.5rem;
    }

    .nearby-no-location p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 400px;
    }

    /* Results Header */
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .results-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .results-location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .results-location i {
      color: var(--primary-color);
    }

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .service-card {
      background: var(--surface-card);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
      border: 1px solid var(--surface-border);
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .service-image {
      width: 100%;
      height: 200px;
      overflow: hidden;
      background: var(--surface-hover);
    }

    .service-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .service-content {
      padding: 1.5rem;
    }

    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
      gap: 1rem;
    }

    .service-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      flex: 1;
    }

    .service-type {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .type-vet {
      background: #dc2626;
      color: white;
    }

    .type-shelter {
      background: #2563eb;
      color: white;
    }

    .type-event {
      background: #16a34a;
      color: white;
    }

    .service-category {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0 0 0.75rem 0;
    }

    .service-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-line-orient: vertical;
      overflow: hidden;
    }

    .service-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .info-item i {
      font-size: 0.875rem;
      color: var(--primary-color);
      width: 16px;
    }

    .info-item .distance {
      font-weight: 600;
      color: var(--primary-color);
    }

    .service-actions {
      display: flex;
      gap: 0.75rem;
    }

    .service-actions a,
    .service-actions button {
      flex: 1;
    }

    /* No Results */
    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      gap: 1rem;
    }

    .no-results i {
      font-size: 4rem;
      color: var(--text-secondary);
      opacity: 0.5;
    }

    .no-results h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.25rem;
    }

    .no-results p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 400px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nearby-container {
        padding: 1rem;
      }

      .nearby-title {
        font-size: 1.5rem;
      }

      .nearby-filters {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
      }

      .services-grid {
        grid-template-columns: 1fr;
      }

      .results-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class NearbyPageComponent implements OnInit, OnDestroy {
  private readonly geolocationService = inject(GeolocationService);
  private readonly messageService = inject(MessageService);

  // Estado
  loading = signal(false);
  error = signal<string | null>(null);
  userLocation = signal<Coordinates | null>(null);
  currentAddress = signal<string>('');

  // Filtros
  searchRadius = signal(10); // km
  serviceType = signal<string | null>(null);

  // Opciones
  radiusOptions = [
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '25 km', value: 25 },
    { label: '50 km', value: 50 },
    { label: '100 km', value: 100 }
  ];

  serviceTypeOptions = [
    { label: 'Veterinarios', value: 'vet' },
    { label: 'Protectoras', value: 'shelter' },
    { label: 'Eventos', value: 'event' }
  ];

  // Servicios (datos de ejemplo)
  services = signal<NearbyService[]>([
    {
      id: '1',
      name: 'Clínica Veterinaria Central',
      type: 'vet',
      category: 'Veterinaria General',
      location: 'Calle Gran Vía 45, Madrid',
      distance: 2.3,
      rating: 4.5,
      image: 'https://picsum.photos/400/200?random=10',
      description: 'Clínica veterinaria con servicios completos para mascotas',
      phone: '+34 912 345 678',
      website: 'www.vetcentral.es'
    },
    {
      id: '2',
      name: 'Protectora de Animales Madrid',
      type: 'shelter',
      category: 'Protectora de animales',
      location: 'Av. de la Paz 23, Madrid',
      distance: 3.1,
      rating: 4.8,
      image: 'https://picsum.photos/400/200?random=11',
      description: 'Protectora dedicada al rescate y adopción de animales',
      phone: '+34 913 456 789',
      website: 'www.protectoramadrid.org'
    },
    {
      id: '3',
      name: 'Hospital Veterinario 24h',
      type: 'vet',
      category: 'Urgencias Veterinarias',
      location: 'Calle Alcalá 156, Madrid',
      distance: 4.5,
      rating: 4.2,
      image: 'https://picsum.photos/400/200?random=12',
      description: 'Atención veterinaria de urgencia las 24 horas',
      phone: '+34 914 567 890',
      website: 'www.vet24h.es'
    },
    {
      id: '4',
      name: 'Evento: Paseo Canino',
      type: 'event',
      category: 'Evento social',
      location: 'Parque del Retiro, Madrid',
      distance: 1.8,
      rating: 4.9,
      image: 'https://picsum.photos/400/200?random=13',
      description: 'Paseo canino comunitario para perros de todas las razas',
      phone: '',
      website: ''
    },
    {
      id: '5',
      name: 'Protectora Huellas',
      type: 'shelter',
      category: 'Protectora de animales',
      location: 'Calle Móstoles 45, Madrid',
      distance: 5.2,
      rating: 4.6,
      image: 'https://picsum.photos/400/200?random=14',
      description: 'Protectora especializada en perros y gatos',
      phone: '+34 915 678 901',
      website: 'www.huellas.es'
    }
  ]);

  // Servicios filtrados
  filteredServices = computed(() => {
    let services = this.services();

    // Filtrar por radio de distancia
    services = services.filter(s => s.distance <= this.searchRadius());

    // Filtrar por tipo
    if (this.serviceType()) {
      services = services.filter(s => s.type === this.serviceType());
    }

    // Ordenar por distancia
    return services.sort((a, b) => a.distance - b.distance);
  });

  // Dark mode
  isDarkMode = signal(false);

  ngOnInit(): void {
    this.detectDarkMode();
    this.useCurrentLocation();
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

  /**
   * Detecta el modo oscuro
   */
  private detectDarkMode(): void {
    const darkMode = document.documentElement.classList.contains('dark');
    this.isDarkMode.set(darkMode);

    const observer = new MutationObserver(() => {
      this.isDarkMode.set(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  /**
   * Usa la ubicación actual del navegador
   */
  useCurrentLocation(): void {
    this.loading.set(true);
    this.error.set(null);

    this.geolocationService.getCurrentPosition().subscribe({
      next: (coords) => {
        this.userLocation.set(coords);

        // Obtener dirección inversa
        this.geolocationService.reverseGeocode(coords.lat, coords.lng).subscribe({
          next: (result) => {
            this.currentAddress.set(result.displayName);
            this.loading.set(false);
          },
          error: () => {
            this.currentAddress.set('Ubicación actual');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener ubicación:', err);
        this.error.set(err.message);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de ubicación',
          detail: err.message
        });
      }
    });
  }

  /**
   * Obtiene la etiqueta del tipo de servicio
   */
  getServiceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      vet: 'Veterinario',
      shelter: 'Protectora',
      event: 'Evento'
    };
    return labels[type] || type;
  }
}
