import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';
import { TranslocoHttpLoader } from './transloco-http-loader';

registerLocaleData(localeEs);
registerLocaleData(localeEn);

/** Idiomas disponibles en la aplicación. */
export const LANGUAGES = ['es', 'en'] as const;
export type SupportedLang = (typeof LANGUAGES)[number];

export const DEFAULT_LANG: SupportedLang = 'es';

const STORAGE_KEY = 'petconnect-language';

/**
 * Aplica el idioma guardado en localStorage (o el del navegador) justo después
 * de que Transloco quede registrado y antes de que la app renderice. Así el
 * idioma elegido en Ajustes sobrevive a recargas en cualquier página, sin
 * depender de que LanguageService se haya instanciado antes.
 */
function restoreSavedLang(): void {
  const transloco = inject(TranslocoService);
  let lang: string | null = null;
  try {
    lang = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage no disponible: usar el idioma por defecto.
  }
  if (!lang || !LANGUAGES.includes(lang as SupportedLang)) {
    lang = typeof navigator !== 'undefined' ? navigator.language?.split('-')[0] ?? '' : '';
    if (!LANGUAGES.includes(lang as SupportedLang)) {
      lang = DEFAULT_LANG;
    }
  }
  if (lang !== transloco.getActiveLang()) {
    transloco.setActiveLang(lang);
  }
}

/**
 * Proveedores de internacionalización:
 * - Registra el locale-data de fechas/números de Angular (es/en).
 * - Configura Transloco para cargar los JSON en runtime y permitir el cambio
 *   de idioma desde Ajustes sin recargar la aplicación.
 * - Restaura el idioma guardado al arrancar la aplicación.
 */
export const LANGUAGE_PROVIDER: EnvironmentProviders[] = [
  ...provideTransloco({
    config: {
      availableLangs: [...LANGUAGES],
      defaultLang: DEFAULT_LANG,
      fallbackLang: DEFAULT_LANG,
      reRenderOnLangChange: true,
      prodMode: false,
    },
    loader: TranslocoHttpLoader,
  }),
  provideAppInitializer(restoreSavedLang),
];
