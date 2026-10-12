import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, BehaviorSubject, switchMap, map, of } from 'rxjs';

export interface AdoptionRequest {
  id: string;
  petId: string;
  petName: string;
  petImage: string | null;
  species: string | null;
  breed: string | null;
  adopterId: string;
  adopterName: string;
  shelterId: string;
  status: AdoptionStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  ownerName?: string;
}

export interface AdoptionRequestEvent {
  id: string;
  requestId: string;
  actorId: string;
  actorName: string | null;
  status: AdoptionStatus;
  note: string | null;
  createdAt: string;
}

// Historial de adopciÃƒÂ³n
export interface AdoptionHistoryEntry {
  requestId: string;
  petId?: string;
  status: AdoptionStatus;
  statusChangedAt: string;
  previousStatus?: AdoptionStatus;
  notes?: string;
  // Datos de los usuarios implicados
  adopterId?: string;
  adopterName?: string;
  ownerId?: string;
  ownerName?: string;
}

// Evento de cambio de propiedad
export interface OwnershipChangeEvent {
  petId: string;
  previousOwnerId: string;
  newOwnerId: string;
  changedAt: string;
  reason: 'adoption_completed' | 'returned' | 'transferred' | 'other';
  adoptionRequestId?: string;
  // Nombres de los usuarios implicados
  previousOwnerName?: string;
  newOwnerName?: string;
}

// CronologÃƒÂ­a de propiedad de una compañer@
export interface PetOwnerPeriod {
  ownerId: string;
  ownerName: string | null;
  fromDate: string; // ISO string
  toDate: string | null; // null => dueÃƒÂ±o actual
  reason?: string | null;
  adoptionRequestId?: string | null;
}

// Historial completo de adopciÃƒÂ³n para una compañer@
export interface AdoptionHistory {
  petId: string;
  adoptionRequests: AdoptionHistoryEntry[];
  ownershipChanges: OwnershipChangeEvent[];
  owners?: PetOwnerPeriod[];
}

// Respuesta del backend para el historial (matches GET /adoptions/{petId}/history)
export interface AdoptionHistoryApiResponse {
  petId: string;
  adoptionRequests: AdoptionRequest[];
  ownershipChanges: OwnershipChangeEvent[];
  owners?: PetOwnerPeriod[];
}

// Etapas del flujo de adopciÃƒÂ³n (cada avance lo realiza el propietario)
// pending -> pending_contact -> pending_delivery -> completed -> (rejected cancela)
export type AdoptionStatus =
  'pending' | 'pending_contact' | 'pending_delivery' | 'completed' | 'rejected' | 'approved'; // retrocompatibilidad con estados previos

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
  providedIn: 'root',
})
export class AdoptionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // -- Historial de adopciÃƒÂ³n en memoria --
  private readonly adoptionHistorySubject = new BehaviorSubject<AdoptionHistory>({
    petId: '',
    adoptionRequests: [],
    ownershipChanges: [],
  });
  readonly adoptionHistory$ = this.adoptionHistorySubject.asObservable();

  // Get all pets available for adoption
  // Uses /home/adoptions endpoint since GET /pets is not supported by the backend
  getAvailablePets(): Observable<AvailablePetResponse[]> {
    return this.http.get<AvailablePetResponse[]>(`${this.apiUrl}/home/adoptions`);
  }

  // Request adoption for a specific pet
  requestAdoption(request: CreateAdoptionRequest): Observable<AdoptionRequest> {
    return this.http.post<AdoptionRequest>(`${this.apiUrl}/adoptions`, request).pipe(
      switchMap((created) => {
        this.appendAdoptionEntry(created.id, created.petId, created.status, created.createdAt);
        return of(created);
      }),
    );
  }

  // Get adoption requests for the current user (as adopter)
  getMyAdoptionRequests(): Observable<AdoptionRequest[]> {
    return this.http.get<AdoptionRequest[]>(`${this.apiUrl}/adoptions/my-requests`).pipe(
      map((requests) => (requests ?? []).map((r) => this.normalizeRequest(r))),
    );
  }

  getAdoptionRequestTimeline(requestId: string): Observable<AdoptionRequestEvent[]> {
    return this.http.get<AdoptionRequestEvent[]>(
      `${this.apiUrl}/adoptions/${requestId}/timeline`,
    );
  }

  // Get adoption requests for pets owned by the current user (as shelter/owner)
  getAdoptionRequestsForMyPets(): Observable<AdoptionRequest[]> {
    return this.http.get<AdoptionRequest[]>(`${this.apiUrl}/adoptions/my-pets-requests`).pipe(
      map((requests) => (requests ?? []).map((r) => this.normalizeRequest(r))),
    );
  }

  // Update adoption request status (advance stage / approve / reject)
  updateAdoptionRequestStatus(
    requestId: string,
    status: AdoptionStatus,
  ): Observable<AdoptionRequest> {
    return this.http
      .patch<AdoptionRequest>(`${this.apiUrl}/adoptions/${requestId}/status?status=${status}`, {})
      .pipe(
        switchMap((updated) => {
          this.appendAdoptionEntry(
            updated.id,
            updated.petId,
            updated.status,
            updated.updatedAt || new Date().toISOString(),
          );
          // Si la adopciÃƒÂ³n se completÃƒÂ³, registramos el cambio de propiedad
          if (updated.status === 'completed') {
            this.appendOwnershipChange(
              updated.petId,
              updated.shelterId,
              updated.adopterId,
              updated.id,
            );
          }
          return of(updated);
        }),
      );
  }

  // -- MÃƒÂ©todos de soporte del historial --

  private appendAdoptionEntry(
    requestId: string,
    petId: string,
    status: AdoptionStatus,
    statusChangedAt: string,
  ): void {
    const current = this.adoptionHistorySubject.value;
    // Evitar duplicar la misma entrada
    const exists = current.adoptionRequests.some(
      (e) => e.requestId === requestId && e.status === status,
    );
    if (exists) return;
    const entry: AdoptionHistoryEntry = {
      requestId,
      petId,
      status,
      statusChangedAt,
    };
    this.adoptionHistorySubject.next({
      ...current,
      petId: petId || current.petId,
      adoptionRequests: [entry, ...current.adoptionRequests].slice(0, 100),
    });
  }

  private appendOwnershipChange(
    petId: string,
    previousOwnerId: string,
    newOwnerId: string,
    adoptionRequestId: string,
  ): void {
    const current = this.adoptionHistorySubject.value;
    const change: OwnershipChangeEvent = {
      petId,
      previousOwnerId,
      newOwnerId,
      changedAt: new Date().toISOString(),
      reason: 'adoption_completed',
      adoptionRequestId,
    };
    this.adoptionHistorySubject.next({
      ...current,
      petId: petId || current.petId,
      ownershipChanges: [change, ...current.ownershipChanges].slice(0, 100),
    });
  }

  // Obtener el historial completo de adopciÃƒÂ³n de una compañer@
  // Llama al backend GET /adoptions/{petId}/history y ademÃƒÂ¡s actualiza el
  // historial local (BehaviorSubject) con la respuesta.
  getAdoptionHistory(petId: string): Observable<AdoptionHistory> {
    return this.http
      .get<AdoptionHistoryApiResponse>(`${this.apiUrl}/adoptions/${petId}/history`)
      .pipe(
        map((res) => {
          const mapped: AdoptionHistory = {
            petId: res.petId,
            adoptionRequests: (res.adoptionRequests ?? []).map((r) => ({
              requestId: r.id,
              petId: r.petId,
              status: this.normalizeStatus(r.status),
              statusChangedAt: r.updatedAt || r.createdAt,
              adopterId: r.adopterId,
              adopterName: r.adopterName,
              ownerId: r.shelterId,
              ownerName: r.ownerName ?? undefined,
            })),
            ownershipChanges: (res.ownershipChanges ?? []).map((c) => ({
              petId: c.petId,
              previousOwnerId: c.previousOwnerId,
              newOwnerId: c.newOwnerId,
              changedAt: c.changedAt,
              reason: this.normalizeReason(c.reason),
              adoptionRequestId: c.adoptionRequestId ?? undefined,
              previousOwnerName: (c as any).previousOwnerName ?? undefined,
              newOwnerName: (c as any).newOwnerName ?? undefined,
            })),
            owners: (res.owners ?? []).map((o) => ({
              ownerId: o.ownerId,
              ownerName: o.ownerName ?? null,
              fromDate: o.fromDate,
              toDate: o.toDate ?? null,
              reason: o.reason ?? null,
              adoptionRequestId: o.adoptionRequestId ?? null,
            })),
          };
          // Actualizar el historial local con los datos del backend
          this.adoptionHistorySubject.next(mapped);
          return mapped;
        }),
      );
  }

  // Normaliza una solicitud devuelta por el backend: el estado llega en
  // MAYÃƒÅ¡SCULAS y hay que pasarlo a minÃƒÂºsculas para que coincida con los
  // literales del front y las traducciones.
  private normalizeRequest(request: AdoptionRequest): AdoptionRequest {
    return { ...request, status: this.normalizeStatus(request.status) };
  }

  // Normaliza el estado devuelto por el backend (MAYÃƒÅ¡SCULAS) al formato del front
  private normalizeStatus(status: string): AdoptionStatus {
    const normalized = status.toLowerCase();
    const valid: AdoptionStatus[] = [
      'pending',
      'pending_contact',
      'pending_delivery',
      'completed',
      'rejected',
      'approved',
    ];
    return (valid as string[]).includes(normalized) ? (normalized as AdoptionStatus) : 'pending';
  }

  private normalizeReason(reason: string): OwnershipChangeEvent['reason'] {
    const normalized = reason.toLowerCase();
    const valid: OwnershipChangeEvent['reason'][] = [
      'adoption_completed',
      'returned',
      'transferred',
      'other',
    ];
    return (valid as string[]).includes(normalized)
      ? (normalized as OwnershipChangeEvent['reason'])
      : 'other';
  }

  // Acceso sÃƒÂ­ncrono al historial actual (para componentes OnPush)
  getCurrentHistory(petId: string): AdoptionHistory {
    const all = this.adoptionHistorySubject.value;
    return {
      petId,
      adoptionRequests: all.adoptionRequests.filter((e) => !petId || !e.petId || e.petId === petId),
      ownershipChanges: all.ownershipChanges.filter((c) => !petId || c.petId === petId),
      owners: all.owners ?? [],
    };
  }

  // Obtener los cambios de propiedad de una compañer@
  getOwnershipChanges(petId: string): Observable<OwnershipChangeEvent[]> {
    return this.adoptionHistory$.pipe(
      map((history) => history.ownershipChanges.filter((c) => c.petId === petId)),
    );
  }
}
