import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/** Estados del ciclo de vida de un aviso (coinciden con el backend). */
export type LostPetStatus = 'LOST' | 'FOUND' | 'REUNITED' | 'CLOSED';

export interface LostPetReport {
  id: string;
  reporterId: string;
  reporterName: string;
  petId: string | null;
  petName: string;
  species: string;
  breed: string | null;
  color: string | null;
  description: string | null;
  photoUrl: string | null;
  lostDate: string;
  lastSeenArea: string;
  latitude: number | null;
  longitude: number | null;
  rewardAmount: number | null;
  status: LostPetStatus;
  sightingsCount: number;
  closedAt: string | null;
  owner: boolean;
  distanceKm: number | null;
  createdAt: string;
}

export interface LostPetSighting {
  id: string;
  reportId: string;
  reporterId: string;
  reporterName: string;
  sightedAt: string;
  description: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
}

export interface CreateLostPetReport {
  petId?: string | null;
  petName: string;
  species: string;
  breed?: string | null;
  color?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  lostDate: string;
  lastSeenArea: string;
  latitude?: number | null;
  longitude?: number | null;
  rewardAmount?: number | null;
}

export interface CreateLostPetSighting {
  sightedAt?: string | null;
  description: string;
  area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
}

/** Filtros de búsqueda: especie, estado, rango de fechas y proximidad. */
export interface LostPetFilters {
  species?: string;
  status?: LostPetStatus;
  from?: string;
  to?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

@Injectable({ providedIn: 'root' })
export class LostPetsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  search(filters: LostPetFilters = {}): Observable<LostPetReport[]> {
    let params = new HttpParams();
    if (filters.species) params = params.set('species', filters.species);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.latitude != null) params = params.set('latitude', String(filters.latitude));
    if (filters.longitude != null) params = params.set('longitude', String(filters.longitude));
    if (filters.radiusKm != null) params = params.set('radiusKm', String(filters.radiusKm));
    return this.http.get<LostPetReport[]>(`${this.apiUrl}/lost-pets`, { params });
  }

  getById(id: string): Observable<LostPetReport> {
    return this.http.get<LostPetReport>(`${this.apiUrl}/lost-pets/${id}`);
  }

  getMyReports(): Observable<LostPetReport[]> {
    return this.http.get<LostPetReport[]>(`${this.apiUrl}/lost-pets/mine`);
  }

  create(request: CreateLostPetReport): Observable<LostPetReport> {
    return this.http.post<LostPetReport>(`${this.apiUrl}/lost-pets`, request);
  }

  update(id: string, request: CreateLostPetReport): Observable<LostPetReport> {
    return this.http.put<LostPetReport>(`${this.apiUrl}/lost-pets/${id}`, request);
  }

  updateStatus(id: string, status: LostPetStatus): Observable<LostPetReport> {
    return this.http.patch<LostPetReport>(`${this.apiUrl}/lost-pets/${id}/status`, { status });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lost-pets/${id}`);
  }

  getSightings(id: string): Observable<LostPetSighting[]> {
    return this.http.get<LostPetSighting[]>(`${this.apiUrl}/lost-pets/${id}/sightings`);
  }

  addSighting(id: string, request: CreateLostPetSighting): Observable<LostPetSighting> {
    return this.http.post<LostPetSighting>(
      `${this.apiUrl}/lost-pets/${id}/sightings`,
      request,
    );
  }
}
