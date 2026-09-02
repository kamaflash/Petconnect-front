import { Injectable, computed, signal, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { DEFAULT_LANG, LANGUAGES, SupportedLang } from './language.provider';

const STORAGE_KEY = 'petconnect-language';

/**
 * Encapsula Transloco exponiendo una API basada en signals, coherente con el
 * resto de la app (zoneless). Persiste la elección del usuario en localStorage
 * y permite que la pantalla de Ajustes cambie de idioma al instante.
 */
@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly transloco = inject(TranslocoService);

  /** Idioma activo, refleja Transloco.activeLang(). */
  readonly activeLang = this.transloco.activeLang;

  /** Lista de idiomas disponibles. */
  readonly availableLangs = LANGUAGES as unknown as string[];

  /** Etiqueta legible del idioma activo (para el selector). */
  readonly currentLabel = computed(() => this.labels[this.activeLang()] ?? this.labels[DEFAULT_LANG]);

  private readonly labels: Record<string, string> = {
    es: 'Español',
    en: 'English',
  };

  constructor() {
    // Inicializar con la preferencia guardada o la del navegador.
    const initial = this.resolveInitialLang();
    if (initial !== this.transloco.getActiveLang()) {
      // Carga el idioma antes de que la app muestre contenido.
      this.transloco.setActiveLang(initial);
    }
  }

  /** Cambia de idioma, persiste y refresca la UI. */
  setLang(lang: SupportedLang): void {
    if (!this.availableLangs.includes(lang)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, lang);
    this.transloco.setActiveLang(lang);
  }

  private resolveInitialLang(): SupportedLang {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && this.availableLangs.includes(saved)) {
      return saved as SupportedLang;
    }
    if (typeof navigator !== 'undefined') {
      const browser = navigator.language?.split('-')[0];
      if (browser && this.availableLangs.includes(browser)) {
        return browser as SupportedLang;
      }
    }
    return DEFAULT_LANG;
  }
}