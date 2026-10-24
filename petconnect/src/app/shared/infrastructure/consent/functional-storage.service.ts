import { Injectable, inject } from '@angular/core';
import { ConsentService } from './consent.service';

/**
 * Acceso al almacenamiento funcional (localStorage no esencial: idioma,
 * tema, radio de búsqueda). Sin consentimiento explícito no se lee ni se
 * escribe nada: se usan solo valores en memoria/por defecto.
 */
@Injectable({ providedIn: 'root' })
export class FunctionalStorageService {
  private readonly consent = inject(ConsentService);

  get(key: string): string | null {
    if (!this.consent.functionalAccepted()) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    if (!this.consent.functionalAccepted()) return;
    try {
      localStorage.setItem(key, value);
    } catch { /* storage no disponible */ }
  }

  setJson(key: string, value: unknown): void {
    if (!this.consent.functionalAccepted()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage no disponible */ }
  }
}
