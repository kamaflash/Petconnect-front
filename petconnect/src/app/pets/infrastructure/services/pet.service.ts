import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { PetResponse, CreatePetRequest } from '../../domain/pet.model';

@Injectable({
  providedIn: 'root'
})
export class PetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Get all pets (for admin)
  getAllPets(): Observable<PetResponse[]> {
    return this.http.get<PetResponse[]>(`${this.apiUrl}/pets`);
  }

  // Get pet by ID
  getPet(petId: string): Observable<PetResponse> {
    return this.http.get<PetResponse>(`${this.apiUrl}/pets/${petId}`);
  }

  // Get pets by owner
  getPetsByOwner(ownerId: string): Observable<PetResponse[]> {
    return this.http.get<PetResponse[]>(`${this.apiUrl}/pets/by-owner/${ownerId}`);
  }

  // Create pet
  createPet(request: CreatePetRequest, imageFile?: File, imageFiles?: File[], ownerId?: string, authUserId?: string): Observable<PetResponse> {
    const formData = new FormData();
    if (ownerId) {
      formData.append('ownerId', ownerId);
    }
    if (authUserId) {
      formData.append('authUserId', authUserId);
    }
    formData.append('name', request.name);
    formData.append('species', request.species.toUpperCase());
    if (request.breed) {
      formData.append('breed', request.breed);
    }
    if (request.dateOfBirth) {
      // Convert date to ISO format (yyyy-MM-dd)
      const date = new Date(request.dateOfBirth);
      formData.append('dateOfBirth', date.toISOString().split('T')[0]);
    }
    if (request.gender) {
      formData.append('gender', request.gender);
    }
    if (request.color) {
      formData.append('color', request.color);
    }
    if (request.microchipId) {
      formData.append('microchipId', request.microchipId);
    }
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
      console.log('PetService - Appending image to FormData:', imageFile.name, imageFile.size);
    } else {
      console.log('PetService - No image file provided');
    }
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file, index) => {
        formData.append('images', file, file.name);
        console.log(`PetService - Appending images[${index}] to FormData:`, file.name, file.size);
      });
    }
    return this.http.post<PetResponse>(`${this.apiUrl}/pets`, formData);
  }

  // Update pet
  updatePet(petId: string, request: Partial<CreatePetRequest>): Observable<PetResponse> {
    return this.http.put<PetResponse>(`${this.apiUrl}/pets/${petId}`, request);
  }

  // Delete pet
  deletePet(petId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pets/${petId}`);
  }
}
