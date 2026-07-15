import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { SpinnerService } from '../services/spinner.service';

export const spinnerInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const spinnerService = inject(SpinnerService);

  // Mostrar spinner
  spinnerService.show('Cargando...');

  return next(request).pipe(
    finalize(() => {
      // Ocultar spinner
      spinnerService.hide();
    })
  );
};
