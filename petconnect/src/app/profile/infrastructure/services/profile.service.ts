import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

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
  city: string | null;
  country: string | null;
  profilePublic: boolean;
  notificationsEnabled: boolean;
  profileType: string;
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
  weight: number | null;
  weightUnit: string | null;
  active: boolean;
  microchipId: string | null;
  color: string | null;
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
}
