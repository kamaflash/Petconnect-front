import { Provider } from '@angular/core';

export function provideIconLibrary(): Provider[] {
  return [
    {
      provide: 'PRIME_NG_CONFIG',
      useValue: {
        zIndex: {
          modal: 1000,
          overlay: 1000,
          menu: 999,
          tooltip: 999,
          toast: 1001
        }
      }
    }
  ];
}
