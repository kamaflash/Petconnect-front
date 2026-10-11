import { Injectable, signal } from '@angular/core';
import { OwnershipChangeEvent } from '../../adoptions/infrastructure/services/adoption.service';

export type OwnershipChangeReason =
  | 'adoption_completed'
  | 'returned'
  | 'transferred'
  | 'other';

/**
 * Servicio global (singleton) para notificar que la propiedad de una
 * compañer@ cambió (p. ej. al finalizar una adopción). Cualquier componente
 * que muestre al Familia de una compañer@ (como el perfil de animal) se suscribe
 * mediante una `effect` y refresca la información del propietario.
 */
@Injectable({ providedIn: 'root' })
export class PetOwnershipEventService {
  private readonly _changedPetId = signal<string | null>(null);
  readonly changedPetId = this._changedPetId.asReadonly();

  // Historial local de cambios de propiedad
  private readonly _ownershipChanges = signal<OwnershipChangeEvent[]>([]);
  readonly ownershipChanges = this._ownershipChanges.asReadonly();

  /** Notifica que la compañer@ con `petId` cambió de propietario. */
  notify(petId: string, reason: OwnershipChangeReason = 'other', adoptionRequestId?: string): void {
    this._changedPetId.set(petId);
    const change: OwnershipChangeEvent = {
      petId,
      previousOwnerId: '',
      newOwnerId: '',
      changedAt: new Date().toISOString(),
      reason,
      adoptionRequestId,
    };
    this._ownershipChanges.update((changes) => [change, ...changes].slice(0, 100));
  }

  /** Registra un cambio de propiedad detallado (con ids de propietarios). */
  recordOwnershipChange(change: OwnershipChangeEvent): void {
    this._ownershipChanges.update((changes) => [change, ...changes].slice(0, 100));
  }

  /** Devuelve el historial de cambios de propiedad de una compañer@. */
  getOwnershipChangesForPet(petId: string): OwnershipChangeEvent[] {
    return this._ownershipChanges().filter((c) => c.petId === petId);
  }

  /** Limpia el evento después de procesarlo. */
  clear(): void {
    this._changedPetId.set(null);
  }
}
