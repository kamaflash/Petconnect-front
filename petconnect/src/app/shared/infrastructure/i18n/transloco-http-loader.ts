import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslocoLoader, Translation } from '@jsverse/transloco';

/**
 * Carga los ficheros de traducción (es.json / en.json) desde la raíz de
 * assets del proyecto (public/i18n) usando HttpClient. Al ser un loader HTTP,
 * Transloco decide en runtime qué JSON cargar según el idioma activo.
 */
@Injectable()
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): ReturnType<TranslocoLoader['getTranslation']> {
    return this.http.get<Translation>(`./i18n/${lang}.json`);
  }
}