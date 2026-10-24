import { Injectable, signal, computed } from '@angular/core';

export type ConsentChoice = 'all' | 'necessary' | 'custom';
export interface ConsentState {
  choice: ConsentChoice;
  necessary: true;
  functional: boolean;
  date: string;
  version: number;
}

const STORAGE_KEY = 'petconnect-consent';
export const CONSENT_VERSION = 1;
/** Evento para reabrir las preferencias desde el pie de página. */
export const REOPEN_CONSENT_EVENT = 'petconnect:open-consent';

/**
 * Consentimiento de cookies (solo almacenamiento local, sin dependencias).
 *
 * Categorías reales de la app:
 * - Necesarias (siempre activas, no dependen del consentimiento): cookies
 *   HttpOnly de sesión PC_AT/PC_RT + cookie CSRF XSRF-TOKEN.
 * - Funcionales (opcionales, off por defecto): idioma, tema y preferencias
 *   de búsqueda guardados en localStorage. No se lee/escribe ninguno hasta
 *   que el usuario las acepta explícitamente.
 * La app no usa analítica, publicidad ni seguimiento: no se inventan.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly _consent = signal<ConsentState | null>(null);

  readonly consent = this._consent.asReadonly();
  /** True cuando el usuario ya eligió (no mostrar el banner). */
  readonly decided = computed(() => this._consent() !== null);
  /** Funcionales aceptadas (idioma/tema/radio de búsqueda). */
  readonly functionalAccepted = computed(() => this._consent()?.functional === true);

  constructor() {
    this._consent.set(readStoredConsent());
  }

  acceptAll(): void {
    this.save({ choice: 'all', necessary: true, functional: true });
  }

  acceptNecessary(): void {
    this.save({ choice: 'necessary', necessary: true, functional: false });
  }

  saveCustom(functional: boolean): void {
    this.save({ choice: 'custom', necessary: true, functional });
  }

  /** Reabre las preferencias (desde el footer). */
  reopen(): void {
    window.dispatchEvent(new CustomEvent(REOPEN_CONSENT_EVENT));
  }

  private save(partial: Omit<ConsentState, 'date' | 'version'>): void {
    const state: ConsentState = {
      ...partial,
      date: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage no disponible */ }
    this._consent.set(state);
  }
}

function readStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed?.version !== CONSENT_VERSION || !parsed?.choice) return null;
    return {
      choice: parsed.choice as ConsentChoice,
      necessary: true,
      functional: parsed.functional === true,
      date: typeof parsed.date === 'string' ? parsed.date : new Date(0).toISOString(),
      version: CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}
