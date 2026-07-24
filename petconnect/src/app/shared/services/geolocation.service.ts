import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressSuggestion {
  placeId: string;
  displayName: string;
  lat: number;
  lon: number;
  type?: string;
}

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private readonly USER_AGENT = 'PetConnect-App/1.0 (contact@petconnect.app)';

  // Cache para evitar requests repetidos
  private geocodeCache = new Map<string, GeocodingResult>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  constructor(private http: HttpClient) {}

  /**
   * Convierte una dirección en coordenadas (geocodificación)
   * Ejemplo: "Calle Gran Vía 45, Madrid" → { lat: 40.416775, lng: -3.703790 }
   */
  geocodeAddress(address: string): Observable<GeocodingResult> {
    if (!address || address.trim().length < 3) {
      return throwError(() => new Error('Dirección demasiado corta'));
    }

    const cacheKey = address.toLowerCase().trim();
    const cached = this.geocodeCache.get(cacheKey);

    if (cached) {
      return of(cached);
    }

    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
      'accept-language': 'es,en'
    });

    return this.http.get<any[]>(`${this.NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': this.USER_AGENT
      }
    }).pipe(
      map(results => {
        if (!results || results.length === 0) {
          throw new Error('No se encontró la dirección');
        }

        const result = results[0];
        const geocodingResult: GeocodingResult = {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          displayName: result.display_name,
          address: result.address
        };

        // Guardar en cache
        this.geocodeCache.set(cacheKey, geocodingResult);

        return geocodingResult;
      }),
      catchError(error => {
        console.error('Error en geocodificación:', error);
        return throwError(() => new Error('Error al buscar la dirección. Por favor, intenta de nuevo.'));
      })
    );
  }

  /**
   * Convierte coordenadas en dirección (geocodificación inversa)
   * Ejemplo: { lat: 40.416775, lng: -3.703790 } → "Calle Gran Vía 45, Madrid"
   */
  reverseGeocode(lat: number, lng: number): Observable<GeocodingResult> {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const cached = this.geocodeCache.get(cacheKey);

    if (cached) {
      return of(cached);
    }

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'es,en'
    });

    return this.http.get<any>(`${this.NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'User-Agent': this.USER_AGENT
      }
    }).pipe(
      map(result => {
        if (!result || result.error) {
          throw new Error('No se encontró la dirección para estas coordenadas');
        }

        const geocodingResult: GeocodingResult = {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          displayName: result.display_name,
          address: result.address
        };

        this.geocodeCache.set(cacheKey, geocodingResult);
        return geocodingResult;
      }),
      catchError(error => {
        console.error('Error en geocodificación inversa:', error);
        return throwError(() => new Error('Error al obtener la dirección de las coordenadas.'));
      })
    );
  }

  /**
   * Autocompletado de direcciones
   * Retorna sugerencias mientras el usuario escribe
   */
  autocompleteAddress(query: string, limit: number = 5): Observable<AddressSuggestion[]> {
    if (!query || query.trim().length < 3) {
      return of([]);
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: limit.toString(),
      addressdetails: '1',
      'accept-language': 'es,en'
    });

    return this.http.get<any[]>(`${this.NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': this.USER_AGENT
      }
    }).pipe(
      map(results => {
        if (!results || results.length === 0) {
          return [];
        }

        return results.map(result => ({
          placeId: result.place_id,
          displayName: result.display_name,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          type: result.type
        }));
      }),
      catchError(error => {
        console.error('Error en autocompletado:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene la ubicación actual del navegador (HTML5 Geolocation API)
   */
  getCurrentPosition(): Observable<Coordinates> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error(new Error('Geolocalización no soportada por tu navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          observer.complete();
        },
        (error) => {
          let errorMessage = 'Error al obtener la ubicación';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado. Por favor, habilita el acceso a la ubicación.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado al obtener la ubicación.';
              break;
          }

          observer.error(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos de cache
        }
      );
    });
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   * Retorna la distancia en kilómetros
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Calcula distancias desde un punto a múltiples destinos
   * Retorna un array de { id, distance } ordenado por distancia
   */
  calculateDistances(
    originLat: number,
    originLng: number,
    destinations: Array<{ id: string; lat: number; lng: number }>
  ): Array<{ id: string; distance: number }> {
    return destinations
      .map(dest => ({
        id: dest.id,
        distance: this.calculateDistance(originLat, originLng, dest.lat, dest.lng)
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Formatea la distancia para mostrar al usuario
   * Ejemplo: 0.5 km → "500 m", 2.3 km → "2.3 km"
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      const meters = Math.round(distanceKm * 1000);
      return `${meters} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }

  /**
   * Verifica si una coordenada está dentro de un radio (en km)
   */
  isWithinRadius(
    centerLat: number,
    centerLng: number,
    targetLat: number,
    targetLng: number,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(centerLat, centerLng, targetLat, targetLng);
    return distance <= radiusKm;
  }

  /**
   * Convierte grados a radianes
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Limpia la cache de geocodificación
   */
  clearCache(): void {
    this.geocodeCache.clear();
  }
}
