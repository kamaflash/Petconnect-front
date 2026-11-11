import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ShelterDonationLink {
  donationUrl: string;
}

export type ShelterVisitStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ALTERNATIVE_PROPOSED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ShelterVisitRequest {
  id: string;
  shelterUserId: string;
  visitorUserId: string;
  visitorName: string;
  visitAt: string;
  proposedVisitAt: string | null;
  partySize: number;
  message: string | null;
  status: ShelterVisitStatus;
  responseNote: string | null;
  createdAt: string;
}

export interface CreateShelterVisitRequest {
  shelterUserId: string;
  visitAt: string;
  partySize: number;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ShelterManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly managementUrl = `${this.apiUrl}/shelter-management`;

  getPublicDonationLink(shelterUserId: string): Observable<ShelterDonationLink> {
    return this.http.get<ShelterDonationLink>(
      `${this.apiUrl}/shelters/${shelterUserId}/donation-link`
    );
  }

  getMyDonationLink(): Observable<ShelterDonationLink> {
    return this.http.get<ShelterDonationLink>(`${this.managementUrl}/donation-link`);
  }

  updateMyDonationLink(donationUrl: string): Observable<ShelterDonationLink> {
    return this.http.put<ShelterDonationLink>(`${this.managementUrl}/donation-link`, { donationUrl });
  }

  requestVisit(request: CreateShelterVisitRequest): Observable<ShelterVisitRequest> {
    return this.http.post<ShelterVisitRequest>(`${this.apiUrl}/shelter-visits`, request);
  }

  getMyVisitRequests(): Observable<ShelterVisitRequest[]> {
    return this.http.get<ShelterVisitRequest[]>(`${this.managementUrl}/visits`);
  }

  getMyVisitorRequests(shelterUserId: string): Observable<ShelterVisitRequest[]> {
    return this.http.get<ShelterVisitRequest[]>(
      `${this.apiUrl}/shelters/${shelterUserId}/my-visit-requests`
    );
  }

  respondToVisit(id: string, status: 'CONFIRMED' | 'CANCELLED'): Observable<ShelterVisitRequest> {
    return this.http.patch<ShelterVisitRequest>(`${this.apiUrl}/shelter-visits/${id}/response`, { status });
  }

  updateVisitStatus(
    id: string,
    status: ShelterVisitStatus,
    responseNote?: string,
    proposedVisitAt?: string
  ): Observable<ShelterVisitRequest> {
    return this.http.patch<ShelterVisitRequest>(`${this.managementUrl}/visits/${id}`, {
      status,
      responseNote,
      proposedVisitAt,
    });
  }
}
