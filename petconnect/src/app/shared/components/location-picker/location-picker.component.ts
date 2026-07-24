import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, ElementRef, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeolocationService, GeocodingResult, AddressSuggestion } from '../../services/geolocation.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subscription, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    AutoCompleteModule,
    CardModule,
    TagModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  template: `
    <div class="location-picker">
        <!-- Buscador de direcciones -->
        <div class="search-section">
          <p-autoComplete
            [(ngModel)]="searchQueryValue"
            [suggestions]="suggestions()"
            (completeMethod)="onSearch($event)"
            (onSelect)="onAddressSelect($event)"
            [placeholder]="'Escribe tu dirección...'"
            [minLength]="3"
            [dropdown]="true"
            [forceSelection]="false"
            field="displayName"
            class="address-autocomplete"
          >
            <ng-template let-suggestion pTemplate="item">
              <div class="suggestion-item">
                <i class="pi pi-map-marker suggestion-icon"></i>
                <div class="suggestion-content">
                  <div class="suggestion-title">{{ suggestion.displayName }}</div>
                </div>
              </div>
            </ng-template>
          </p-autoComplete>

          <div class="search-actions">
            <button
              pButton
              icon="pi pi-crosshair"
              class="p-button-outlined p-button-sm"
              (click)="useCurrentLocation()"
              [disabled]="loading()"
              pTooltip="Usar mi ubicación actual"
            >
            </button>
          </div>
        </div>

    </div>
  `,
  styles: [`
    .location-picker {
      max-width: 800px;
      margin: 0 auto;
    }

    .picker-header {
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .picker-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .picker-title i {
      color: var(--primary-color);
    }

    .picker-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .search-section {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .search-section .p-autocomplete {
      flex: 1;
    }

    .search-actions {
      display: flex;
      align-items: center;
    }

    .map-container {
      position: relative;
      width: 100%;
      height: 400px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1rem;
      border: 1px solid var(--surface-border);
    }

    .map {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .map-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dark .map-loading {
      background: rgba(0, 0, 0, 0.8);
    }

    .location-info {
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid var(--primary-color);
    }

    .dark .location-info {
      background: var(--surface-ground-dark);
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .info-header i {
      color: var(--primary-color);
      font-size: 1.25rem;
    }

    .info-title {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9375rem;
    }

    .info-content {
      margin-bottom: 1rem;
    }

    .address-text {
      font-size: 0.875rem;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
      line-height: 1.5;
    }

    .coordinates {
      display: flex;
      gap: 1rem;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .coord-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .coord-item i {
      font-size: 0.75rem;
    }

    .info-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 1rem;
    }

    .dark .error-message {
      background: #450a0a;
      border-color: #7f1d1d;
    }

    .error-message i {
      font-size: 1.125rem;
    }

    .suggestion-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.5rem;
    }

    .suggestion-icon {
      color: var(--primary-color);
      margin-top: 0.125rem;
    }

    .suggestion-content {
      flex: 1;
    }

    .suggestion-title {
      font-size: 0.875rem;
      color: var(--text-primary);
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .map-container {
        height: 300px;
      }

      .search-section {
        flex-direction: column;
      }

      .search-actions {
        justify-content: flex-end;
      }

      .info-actions {
        flex-direction: column;
      }

      .info-actions button {
        width: 100%;
      }
    }
  `]
})
export class LocationPickerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() initialLat?: number;
  @Input() initialLng?: number;
  @Input() initialAddress?: string;
  @Input() disabled = false;

  @Output() locationConfirmed = new EventEmitter<GeocodingResult>();
  @Output() locationCancelled = new EventEmitter<void>();

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  searchQuery = signal<string>('');
  searchQueryValue: string = '';
  selectedAddress = signal<string>('');
  suggestions = signal<AddressSuggestion[]>([]);
  selectedLocation = signal<GeocodingResult | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  private map: any = null;
  private marker: any = null;
  private searchSubscription?: Subscription;
  private geolocationService!: GeolocationService;
  private messageService!: MessageService;

  constructor() {
    this.geolocationService = inject(GeolocationService);
    this.messageService = inject(MessageService);
  }

  ngOnInit(): void {
    // Inicializar con dirección inicial si se proporciona
    if (this.initialAddress) {
      this.searchQueryValue = this.initialAddress;
      this.searchQuery.set(this.initialAddress);
    }

    // Inicializar con valores iniciales si se proporcionan
    if (this.initialLat && this.initialLng) {
      this.initializeMap(this.initialLat, this.initialLng);
    } else {
      // Inicializar mapa con ubicación por defecto (España)
      this.initializeMap(40.416775, -3.703790);
    }
  }

  ngOnChanges(): void {
    // Si cambian las coordenadas iniciales, actualizar el mapa
    if (this.initialLat && this.initialLng && !this.selectedLocation()) {
      this.updateMapPosition(this.initialLat, this.initialLng);
    }
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.destroyMap();
  }

  /**
   * Inicializa el mapa de Leaflet
   */
  private initializeMap(lat: number, lng: number): void {
    // Esperar a que el contenedor del mapa esté disponible
    setTimeout(() => {
      if (!this.mapContainer) return;

      // Importar Leaflet dinámicamente
      import('leaflet').then((L) => {
        // Crear mapa
        this.map = L.map('map').setView([lat, lng], 13);

        // Añadir capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(this.map);

        // Añadir marcador
        this.marker = L.marker([lat, lng], {
          draggable: true
        }).addTo(this.map);

        // Evento: clic en el mapa
        this.map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          this.updateMapPosition(lat, lng);
          this.reverseGeocodePosition(lat, lng);
        });

        // Evento: arrastrar marcador
        this.marker.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          this.reverseGeocodePosition(lat, lng);
        });

        // Si hay dirección inicial, geocodificarla
        if (this.initialAddress) {
          this.geocodeInitialAddress(this.initialAddress);
        }
      });
    }, 100);
  }

  /**
   * Geocodifica la dirección inicial
   */
  private geocodeInitialAddress(address: string): void {
    this.loading.set(true);
    this.geolocationService.geocodeAddress(address).subscribe({
      next: (result: GeocodingResult) => {
        this.updateMapPosition(result.lat, result.lon);
        this.selectedLocation.set(result);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error geocodificando dirección inicial:', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Actualiza la posición del mapa y el marcador
   */
  private updateMapPosition(lat: number, lng: number): void {
    if (!this.map || !this.marker) return;

    this.marker.setLatLng([lat, lng]);
    this.map.setView([lat, lng], 13);
  }

  /**
   * Geocodifica la posición del marcador para obtener la dirección
   */
  private reverseGeocodePosition(lat: number, lng: number): void {
    this.loading.set(true);
    this.geolocationService.reverseGeocode(lat, lng).subscribe({
      next: (result: GeocodingResult) => {
        this.selectedLocation.set(result);
        this.searchQuery.set(result.displayName);
        this.searchQueryValue = result.displayName;
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error en geocodificación inversa:', err);
        this.error.set('No se pudo obtener la dirección de esta ubicación');
        this.loading.set(false);
        setTimeout(() => this.error.set(null), 3000);
      }
    });
  }

  /**
   * Busca direcciones (autocompletado)
   */
  onSearch(event: any): void {
    const query = event.query || event;

    if (!query || query.length < 3) {
      this.suggestions.set([]);
      return;
    }

    this.loading.set(true);
    this.geolocationService.autocompleteAddress(query, 5).subscribe({
      next: (results: AddressSuggestion[]) => {
        this.suggestions.set(results);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error en búsqueda de direcciones:', err);
        this.suggestions.set([]);
        this.loading.set(false);
      }
    });
  }

  /**
   * Maneja la selección de una dirección del autocompletado
   */
  onAddressSelect(suggestion: any): void {
    this.loading.set(true);

    // Asegurar que el input muestre el nombre de la dirección, no el objeto
    const displayName = typeof suggestion === 'string' ? suggestion : (suggestion.displayName || '');
    this.searchQuery.set(displayName);
    this.searchQueryValue = displayName;

    // Obtener detalles completos de la dirección
    this.geolocationService.geocodeAddress(displayName).subscribe({
      next: (result: GeocodingResult) => {
        this.selectedLocation.set(result);
        this.updateMapPosition(result.lat, result.lon);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error al seleccionar dirección:', err);
        this.error.set('Error al cargar la dirección seleccionada');
        this.loading.set(false);
        setTimeout(() => this.error.set(null), 3000);
      }
    });
  }

  /**
   * Usa la ubicación actual del navegador
   */
  useCurrentLocation(): void {
    this.loading.set(true);
    this.error.set(null);

    this.geolocationService.getCurrentPosition().subscribe({
      next: (coords: { lat: number; lng: number }) => {
        this.updateMapPosition(coords.lat, coords.lng);
        this.reverseGeocodePosition(coords.lat, coords.lng);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error al obtener ubicación actual:', err);
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
   * Confirma la ubicación seleccionada
   */
  confirmLocation(): void {
    if (this.selectedLocation()) {
      this.locationConfirmed.emit(this.selectedLocation()!);
    }
  }

  /**
   * Cancela la selección de ubicación
   */
  cancelSelection(): void {
    this.selectedLocation.set(null);
    this.searchQuery.set('');
    this.searchQueryValue = '';
    this.locationCancelled.emit();
  }

  /**
   * Destruye el mapa al desmontar el componente
   */
  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
