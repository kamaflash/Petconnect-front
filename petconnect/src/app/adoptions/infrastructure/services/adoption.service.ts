import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface AdoptionRequest {
  id: string;
  petId: string;
  petName: string;
  adopterId: string;
  adopterName: string;
  shelterId: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdoptionRequest {
  petId: string;
  message?: string;
}

// Pet detail nested inside the adoption listing response
export interface PetDetail {
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
  emergencyContact: string | null;
  emergencyPhone: string | null;
  adoptionDate: string | null;
  adoptionCenter: string | null;
  registrationNumber: string | null;
  licenseNumber: string | null;
  licenseExpiryDate: string | null;
  spayedNeutered: boolean;
  spayedNeuteredDate: string | null;
  temperament: string | null;
  energyLevel: string | null;
  trainingLevel: string | null;
  favoriteActivities: string | null;
  favoriteFood: string | null;
  specialNeeds: string | null;
  lastKnownLocation: string | null;
  lost: boolean;
  lostDate: string | null;
  availableForAdoption: boolean;
}

// Adoption listing response from /home/adoptions endpoint
export interface AvailablePetResponse {
  id: string;
  petId: string;
  name: string;
  breed: string;
  image: string;
  status: string;
  createdAt: string;
  pet: PetDetail;
}

@Injectable({
  providedIn: 'root'
})
export class AdoptionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Get all pets available for adoption
  // Uses /home/adoptions endpoint since GET /pets is not supported by the backend
  getAvailablePets(): Observable<AvailablePetResponse[]> {
    return this.http.get<AvailablePetResponse[]>(`${this.apiUrl}/home/adoptions`);
  }

  // Request adoption for a specific pet
  requestAdoption(request: CreateAdoptionRequest): Observable<AdoptionRequest> {
    return this.http.post<AdoptionRequest>(`${this.apiUrl}/adoptions`, request);
  }

  // Get adoption requests for the current user (as adopter)
  getMyAdoptionRequests(): Observable<AdoptionRequest[]> {
    return this.http.get<AdoptionRequest[]>(`${this.apiUrl}/adoptions/my-requests`);
  }

  // Get adoption requests for pets owned by the current user (as shelter/owner)
  getAdoptionRequestsForMyPets(): Observable<AdoptionRequest[]> {
    return this.http.get<AdoptionRequest[]>(`${this.apiUrl}/adoptions/my-pets-requests`);
  }

  // Update adoption request status (approve/reject)
  updateAdoptionRequestStatus(requestId: string, status: 'approved' | 'rejected'): Observable<AdoptionRequest> {
    return this.http.patch<AdoptionRequest>(
      `${this.apiUrl}/adoptions/${requestId}/status?status=${status}`,
      {}
    );
  }
}
