import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { CreatePetRequest } from '../../../pets/domain/pet.model';

/** Filtros de "Servicios cercanos" que el backend aplica en BD (`GET /users/providers`). */
export interface ProviderSearchFilters {
  /** Tipo de perfil proveedor (`vet`, `shelter`, `seller`, `trainer`). Vacío = todos. */
  profileType?: string;
  /** Códigos del catálogo de servicios vet (multi-selección, AND en backend). */
  services?: string[];
}

/** Página de proveedores devuelta por `GET /users/providers`. */
export interface ProviderSearchResponse {
  content: UserProfileResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type DirectMessagePolicy = 'EVERYONE' | 'FOLLOWING' | 'NOBODY';
export type FeedDefault = 'ALL' | 'FOLLOWING';

export interface UserPreferencesResponse {
  profilePublic: boolean;
  notificationsEnabled: boolean;
  directMessagePolicy: DirectMessagePolicy;
  showOnlineStatus: boolean;
  notifyMessages: boolean;
  feedDefault: FeedDefault;
}

export interface BlockedUserResponse {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface UserProfileResponse {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  dateOfBirth: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  profilePublic: boolean;
  notificationsEnabled: boolean;
  profileType: string;
  pendingProfileType: string | null;
  specialty: string | null;
  /** Códigos de servicios (vet) separados por comas; null si no tiene. */
  services: string | null;
  licenseNumber: string | null;
  charityNumber: string | null;
  storeName: string | null;
  website: string | null;
  /** True si el perfil tiene los datos obligatorios de su tipo. */
  profileComplete: boolean;
}

/** Datos del onboarding post-registro: tipo de cuenta y datos del perfil. */
export interface OnboardingProfileRequest {
  profileType: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  specialty?: string | null;
  services?: string | null;
  licenseNumber?: string | null;
  charityNumber?: string | null;
  storeName?: string | null;
  website?: string | null;
}

export interface PetResponse {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bio: string | null;
  avatarUrl: string | null;
  imageUrls: string[] | null;
  weight: number | null;
  weightUnit: string | null;
  active: boolean;
  microchipId: string | null;
  color: string | null;

  // Información médica y de salud
  bloodType: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  vetName: string | null;
  vetPhone: string | null;
  vetAddress: string | null;
  lastVaccinationDate: string | null;
  nextVaccinationDate: string | null;
  lastVetVisit: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;

  // Información adicional
  emergencyContact: string | null;
  emergencyPhone: string | null;
  adoptionDate: string | null;
  adoptionCenter: string | null;
  registrationNumber: string | null;
  licenseNumber: string | null;
  licenseExpiryDate: string | null;
  spayedNeutered: boolean;
  spayedNeuteredDate: string | null;

  // Comportamiento
  temperament: string | null;
  energyLevel: string | null;
  trainingLevel: string | null;
  favoriteActivities: string | null;
  favoriteFood: string | null;
  specialNeeds: string | null;

  // Seguridad y ubicación
  lastKnownLocation: string | null;
  lost: boolean;
  lostDate: string | null;
  availableForAdoption: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  updateProfile(formData: FormData): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/users/profile`, formData);
  }

  getMyProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/profile`);
  }

  getPreferences(): Observable<UserPreferencesResponse> {
    return this.http.get<UserPreferencesResponse>(`${this.apiUrl}/users/profile/preferences`);
  }

  updatePreferences(preferences: UserPreferencesResponse): Observable<UserPreferencesResponse> {
    return this.http.patch<UserPreferencesResponse>(`${this.apiUrl}/users/profile/preferences`, preferences);
  }

  getBlockedUsers(): Observable<BlockedUserResponse[]> {
    return this.http.get<BlockedUserResponse[]>(`${this.apiUrl}/users/blocked`);
  }

  blockUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/blocked/${userId}`, {});
  }

  unblockUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/blocked/${userId}`);
  }

  /**
   * Completa el onboarding: elige el tipo de cuenta y confirma los datos
   * obligatorios. El backend activa la marca de onboarding del perfil.
   */
  completeOnboarding(request: OnboardingProfileRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/users/onboarding`, request);
  }

  getProfileById(profileId: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/profile/${profileId}`);
  }

  getProfileByAuthUserId(authUserId: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/by-auth/${authUserId}`);
  }

  // ===== Solicitudes de cambio de tipo de perfil (vet/shelter) =====

  getPendingTypeRequests(): Observable<UserProfileResponse[]> {
    return this.http.get<UserProfileResponse[]>(`${this.apiUrl}/users/profile-type-requests`);
  }

  approveTypeRequest(profileId: string): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/users/profile-type-requests/${profileId}/approve`, {});
  }

  rejectTypeRequest(profileId: string): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/users/profile-type-requests/${profileId}/reject`, {});
  }

  cancelPendingTypeRequest(): Observable<UserProfileResponse> {
    return this.http.delete<UserProfileResponse>(`${this.apiUrl}/users/profile/pending-type`);
  }

  getAllProfiles(): Observable<UserProfileResponse[]> {
    return this.http.get<UserProfileResponse[]>(`${this.apiUrl}/users/profiles`);
  }

  searchProviders(
    page = 0,
    size = 10,
    filters: ProviderSearchFilters = {},
  ): Observable<ProviderSearchResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    if (filters.profileType) params = params.set('profileType', filters.profileType);
    for (const code of filters.services ?? []) {
      params = params.append('services', code);
    }
    return this.http.get<ProviderSearchResponse>(`${this.apiUrl}/users/providers`, { params });
  }

  getPetsByOwner(ownerProfileId: string): Observable<PetResponse[]> {
    return this.http.get<PetResponse[]>(`${this.apiUrl}/pets/by-owner/${ownerProfileId}`);
  }

  getPetById(petId: string): Observable<PetResponse> {
    return this.http.get<PetResponse>(`${this.apiUrl}/pets/${petId}`);
  }

  toggleAdoptionStatus(petId: string, availableForAdoption: boolean): Observable<PetResponse> {
    return this.http.patch<PetResponse>(`${this.apiUrl}/pets/${petId}/adoption-status?availableForAdoption=${availableForAdoption}`, {});
  }

  updatePet(petId: string, request: Partial<CreatePetRequest> & { avatarUrl?: string | null; imageUrls?: string[] }): Observable<PetResponse> {
    return this.http.put<PetResponse>(`${this.apiUrl}/pets/${petId}`, request);
  }
}
