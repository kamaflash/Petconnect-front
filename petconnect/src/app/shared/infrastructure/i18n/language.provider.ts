import { Provider } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';

registerLocaleData(localeEs);
registerLocaleData(localeEn);

export const LANGUAGE_PROVIDER: Provider = {
  provide: 'APP_LANGUAGE',
  useFactory: () => {
    const browserLang = navigator.language || 'es';
    return browserLang.split('-')[0] || 'es';
  }
};
