import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PetCareActivity,
  PetCareActivityType,
  PetCareShare,
  PetCareRole,
  PetCareSummary,
  PetPassport,
  PetPassportSettings,
  PetPassportUpdate
} from '../../domain/pet-care.model';

@Injectable({ providedIn: 'root' })
export class PetCareService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getPassportSettings(petId: string): Observable<PetPassportSettings> {
    return this.http.get<PetPassportSettings>(`${this.apiUrl}/pets/${petId}/passport`);
  }

  getCareSummary(petId: string): Observable<PetCareSummary> {
    return this.http.get<PetCareSummary>(`${this.apiUrl}/pets/${petId}/care-summary`);
  }

  updatePassport(petId: string, update: PetPassportUpdate): Observable<PetPassportSettings> {
    return this.http.put<PetPassportSettings>(`${this.apiUrl}/pets/${petId}/passport`, update);
  }

  getPublicPassport(token: string): Observable<PetPassport> {
    return this.http.get<PetPassport>(`${this.apiUrl}/pet-passports/${encodeURIComponent(token)}`);
  }

  getShares(petId: string): Observable<PetCareShare[]> {
    return this.http.get<PetCareShare[]>(`${this.apiUrl}/pets/${petId}/care-shares`);
  }

  invite(petId: string, userId: string, role: PetCareRole): Observable<PetCareShare> {
    return this.http.post<PetCareShare>(`${this.apiUrl}/pets/${petId}/care-shares`, { userId, role });
  }

  updateRole(petId: string, shareId: string, role: PetCareRole): Observable<PetCareShare> {
    return this.http.patch<PetCareShare>(
      `${this.apiUrl}/pets/${petId}/care-shares/${shareId}/role`,
      { role }
    );
  }

  revokeShare(petId: string, shareId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pets/${petId}/care-shares/${shareId}`);
  }

  getInvitations(): Observable<PetCareShare[]> {
    return this.http.get<PetCareShare[]>(`${this.apiUrl}/pet-care/invitations`);
  }

  respondToInvitation(shareId: string, status: 'ACTIVE' | 'DECLINED'): Observable<PetCareShare> {
    return this.http.patch<PetCareShare>(`${this.apiUrl}/pet-care/invitations/${shareId}`, { status });
  }

  leaveShare(shareId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/pet-care/invitations/${shareId}`);
  }

  getActivities(petId: string): Observable<PetCareActivity[]> {
    return this.http.get<PetCareActivity[]>(`${this.apiUrl}/pets/${petId}/care-activities`);
  }

  addActivity(petId: string, type: PetCareActivityType, notes: string): Observable<PetCareActivity> {
    return this.http.post<PetCareActivity>(`${this.apiUrl}/pets/${petId}/care-activities`, {
      type,
      notes: notes.trim() || null,
      occurredAt: new Date().toISOString()
    });
  }
}
