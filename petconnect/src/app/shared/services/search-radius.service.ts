import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProfileService } from '../../profile/infrastructure/services/profile.service';
import { Coordinates, GeolocationService } from './geolocation.service';
import { FunctionalStorageService } from '../infrastructure/consent/functional-storage.service';

/** Procedencia de la ubicación de referencia del usuario. */
export type OriginSource = 'gps' | 'profile';

const STORAGE_KEY = 'petconnect-search-radius';
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 100;
const DEFAULT_RADIUS_KM = 10;
/**
 * Valor especial de `radiusKm`: sin límite (posición máxima del slider).
 * Con 0 no se filtra por distancia: se muestran todos los resultados.
 */
const UNLIMITED_RADIUS_KM = 0;

/**
 * Preferencia global de "Radio de búsqueda" (estilo Tinder).
 *
 * El usuario configura el radio una sola vez en Configuración y todas las
 * pantallas con filtros lo aplican automáticamente:
 *
 * - `radiusKm`: radio en km persistido en localStorage.
 * - `userOrigin`: punto de referencia del usuario (GPS del navegador con
 *   fallback a la dirección guardada en el perfil).
 * - Geocodificación reactiva de direcciones en texto (Nominatim vía
 *   `GeolocationService`, cacheada 24h) para comparar distancias cuando los
 *   datos solo traen un campo `location` de tipo texto.
 */
@Injectable({ providedIn: 'root' })
export class SearchRadiusService {
  private readonly geolocation = inject(GeolocationService);
  private readonly profileService = inject(ProfileService);
  private readonly storage = inject(FunctionalStorageService);

  readonly minRadius = MIN_RADIUS_KM;
  readonly maxRadius = MAX_RADIUS_KM;
  /** Posición mínima/máxima del slider (la máxima = "Sin límite"). */
  readonly sliderMin = MIN_RADIUS_KM;
  readonly sliderMax = MAX_RADIUS_KM + 1;

  /**
   * Radio de búsqueda global en km. `0` = sin límite (posición máxima del
   * slider): se muestran todos los resultados sin filtrar por distancia.
   */
  readonly radiusKm = signal(this.readStoredRadius());

  /** true cuando el slider está "a tope" (sin límite). */
  readonly isUnlimited = computed(() => this.radiusKm() === UNLIMITED_RADIUS_KM);

  /** Posición del slider derivada del radio (101 = sin límite). */
  readonly sliderPosition = computed(() =>
    this.radiusKm() === UNLIMITED_RADIUS_KM ? this.sliderMax : this.radiusKm(),
  );

  /** Punto de referencia del usuario (null si aún no se pudo resolver). */
  readonly userOrigin = signal<Coordinates | null>(null);
  readonly originSource = signal<OriginSource | null>(null);
  readonly originLoading = signal(false);
  readonly originError = signal<string | null>(null);

  /**
   * Resultados de geocodificación por dirección en texto (normalizada en
   * minúsculas). `null` = la dirección no es geocodificable.
   * Ausente del mapa = aún no resuelta (pendiente).
   */
  private readonly geocoded = signal<Record<string, Coordinates | null>>({});
  private readonly geocodePending = new Set<string>();
  /** Claves ya resueltas (éxito o fallo) — dedupe sin leer signals. */
  private readonly geocodeResolved = new Set<string>();

  /** Evita repetir el prompt de geolocalización en cada página. */
  private originAttempted = false;

  /** Mapa reactivo de direcciones geocodificadas (para leer en `computed`). */
  readonly geocodedLocations = computed(() => this.geocoded());

  /**
   * Actualiza el radio y lo persiste (solo con consentimiento funcional).
   * `km <= 0` se interpreta como "sin límite" (0).
   */
  setRadius(km: number): void {
    const value =
      km <= UNLIMITED_RADIUS_KM
        ? UNLIMITED_RADIUS_KM
        : Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(km)));
    this.radiusKm.set(value);
    this.storage.set(STORAGE_KEY, String(value));
  }

  /**
   * Recibe la posición del slider (1..100 = km, 101 = sin límite) y la
   * convierte al radio correspondiente.
   */
  setSliderPosition(position: number): void {
    this.setRadius(position >= this.sliderMax ? UNLIMITED_RADIUS_KM : position);
  }

  /**
   * Resuelve la ubicación de referencia del usuario una sola vez:
   * GPS del navegador → si falla, la dirección guardada en el perfil.
   *
   * @param forceGps Reintenta el GPS aunque ya exista un origen (botón
   *                 "Usar mi ubicación" de Configuración / Cercanos).
   */
  resolveOrigin(forceGps = false): Observable<Coordinates | null> {
    if (this.userOrigin() && !forceGps) {
      return of(this.userOrigin());
    }
    if (!forceGps && this.originAttempted) {
      return of(this.userOrigin());
    }

    return defer(() => {
      this.originAttempted = true;
      this.originLoading.set(true);
      this.originError.set(null);

      return this.geolocation.getCurrentPosition().pipe(
        map((coords) => {
          this.setOrigin(coords, 'gps');
          this.originLoading.set(false);
          return coords;
        }),
        catchError((gpsError: Error) =>
          this.profileService.getMyProfile().pipe(
            map((profile) => {
              this.originLoading.set(false);
              if (profile.latitude != null && profile.longitude != null) {
                const coords: Coordinates = { lat: profile.latitude, lng: profile.longitude };
                this.setOrigin(coords, 'profile');
                return coords;
              }
              this.originError.set(gpsError.message);
              return null;
            }),
            catchError(() => {
              this.originLoading.set(false);
              this.originError.set(gpsError.message);
              return of(null);
            }),
          ),
        ),
      );
    });
  }

  /**
   * Geocodifica en segundo plano las direcciones indicadas (una sola petición
   * por dirección, deduplicada). Los resultados se guardan en el mapa reactivo.
   */
  prefetchLocations(texts: Array<string | null | undefined>): void {
    for (const raw of texts) {
      if (typeof raw !== 'string') continue;
      const text = raw.trim();
      if (text.length < 3) continue;
      const key = text.toLowerCase();
      if (this.geocodeResolved.has(key) || this.geocodePending.has(key)) continue;

      this.geocodePending.add(key);
      this.geolocation.geocodeAddress(text).subscribe({
        next: (result) => {
          this.geocodePending.delete(key);
          this.geocodeResolved.add(key);
          this.geocoded.update((map) => ({ ...map, [key]: { lat: result.lat, lng: result.lon } }));
        },
        error: () => {
          this.geocodePending.delete(key);
          this.geocodeResolved.add(key);
          this.geocoded.update((map) => ({ ...map, [key]: null }));
        },
      });
    }
  }

  /**
   * Coordenadas de una dirección en texto ya geocodificada.
   * - `Coordinates` → resuelta; `null` → no geocodificable / sin ubicación;
   *   `undefined` → pendiente de resolver.
   */
  resolveCoords(location?: string | null): Coordinates | null | undefined {
    if (typeof location !== 'string' || location.trim().length < 3) {
      return null;
    }
    return this.geocoded()[location.trim().toLowerCase()] ?? undefined;
  }

  /** Distancia en km entre dos puntos (Haversine). */
  distanceKm(from: Coordinates, to: Coordinates): number {
    return this.geolocation.calculateDistance(from.lat, from.lng, to.lat, to.lng);
  }

  /** Distancia formateada ("500 m", "3.2 km"). */
  formatDistance(distanceKm: number): string {
    return this.geolocation.formatDistance(distanceKm);
  }

  /**
   * ¿Está dentro del radio? Con radio sin límite (<= 0) o ubicaciones sin
   * resolver (`null`/`undefined`) no se filtran: se muestran igualmente
   * (estas últimas con la etiqueta "Sin distancia").
   */
  withinRadius(
    origin: Coordinates,
    coords: Coordinates | null | undefined,
    radiusKm: number,
  ): boolean {
    if (radiusKm <= UNLIMITED_RADIUS_KM) return true;
    if (!coords) return true;
    return this.distanceKm(origin, coords) <= radiusKm;
  }

  private setOrigin(coords: Coordinates, source: OriginSource): void {
    this.userOrigin.set(coords);
    this.originSource.set(source);
    this.originError.set(null);
  }

  private readStoredRadius(): number {
    // Sin consentimiento funcional no se lee el radio guardado.
    const raw = this.storage.get(STORAGE_KEY);
    if (raw == null) return DEFAULT_RADIUS_KM;
    const stored = Number(raw);
    if (!Number.isFinite(stored)) return DEFAULT_RADIUS_KM;
    if (stored === UNLIMITED_RADIUS_KM) return UNLIMITED_RADIUS_KM;
    if (stored >= MIN_RADIUS_KM && stored <= MAX_RADIUS_KM) return Math.round(stored);
    return DEFAULT_RADIUS_KM;
  }
}

