import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { CreatePetRequest } from '../../../pets/domain/pet.model';

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
  specialty: string | null;
  licenseNumber: string | null;
  charityNumber: string | null;
  storeName: string | null;
  website: string | null;
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

  updateProfile(formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/profile`, formData);
  }

  getMyProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/profile`);
  }

  getProfileById(profileId: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/profile/${profileId}`);
  }

  getProfileByAuthUserId(authUserId: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/users/by-auth/${authUserId}`);
  }

  getAllProfiles(): Observable<UserProfileResponse[]> {
    return this.http.get<UserProfileResponse[]>(`${this.apiUrl}/users/profiles`);
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

  updatePet(petId: string, request: Partial<CreatePetRequest>): Observable<PetResponse> {
    return this.http.put<PetResponse>(`${this.apiUrl}/pets/${petId}`, request);
  }
}
